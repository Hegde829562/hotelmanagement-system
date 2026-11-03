// =====================================================================
// INTELLISTAY: Dual-Mode Database Abstraction Layer
// Primary: MySQL 8.0+ via mysql2/promise
// Fallback: WebAssembly SQLite (sql.js) for instant zero-config resilience
// =====================================================================

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

let pool = null;
let useFallback = false;
let fallbackDb = null;
let isInTransaction = false;
const fallbackDbPath = path.join(__dirname, 'intellistay.sqlite');

// Initialize database connection
async function initDb() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'intellistay_db',
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0,
    multipleStatements: true,
    dateStrings: true
  };

  try {
    // Attempt standard MySQL connection
    const testPool = mysql.createPool(dbConfig);
    const conn = await testPool.getConnection();
    await conn.ping();
    conn.release();
    pool = testPool;
    useFallback = false;
    console.log('✅ Connected to MySQL 8.0+ Database successfully (' + dbConfig.database + ')');
    return true;
  } catch (err) {
    console.warn('⚠️  MySQL connection failed (' + err.message + ').');
    console.warn('🔄 Initializing embedded relational SQLite fallback (sql.js) to ensure 100% uptime...');
    await initFallbackDb();
    useFallback = true;
    return false;
  }
}

async function initFallbackDb() {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();

  if (fs.existsSync(fallbackDbPath)) {
    const filebuffer = fs.readFileSync(fallbackDbPath);
    fallbackDb = new SQL.Database(filebuffer);
    console.log('✅ Loaded existing SQLite fallback database: ' + fallbackDbPath);
  } else {
    fallbackDb = new SQL.Database();
    console.log('✅ Created fresh SQLite fallback database instance');
  }
}

function saveFallbackDb() {
  if (fallbackDb) {
    const data = fallbackDb.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(fallbackDbPath, buffer);
  }
}

// Convert MySQL SQL dialect to SQLite dialect for fallback execution
function translateSqlForFallback(sql) {
  let translated = sql
    .replace(/INT AUTO_INCREMENT PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
    .replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT')
    .replace(/ENGINE\s*=\s*InnoDB/gi, '')
    .replace(/ON UPDATE CURRENT_TIMESTAMP/gi, '')
    .replace(/ENUM\([^)]+\)/gi, 'TEXT')
    .replace(/JSON/gi, 'TEXT')
    .replace(/TINYINT\(1\)/gi, 'INTEGER')
    .replace(/DECIMAL\(\d+,\s*\d+\)/gi, 'NUMERIC')
    .replace(/COLLATE\s+[a-zA-Z0-9_]+/gi, '')
    .replace(/CHARACTER SET\s+[a-zA-Z0-9_]+/gi, '')
    .replace(/FOR UPDATE/gi, '')
    .replace(/CURDATE\(\)/gi, "date('now')")
    .replace(/NOW\(\)/gi, "datetime('now')");

  return translated;
}

// Unified query function returning [rows, fields] (mysql2 format)
async function query(sql, params = []) {
  if (!pool && !useFallback) {
    await initDb();
  }

  if (!useFallback && pool) {
    try {
      const [rows, fields] = await pool.query(sql, params);
      return [rows, fields];
    } catch (err) {
      // If error occurs because table doesn't exist, allow caller to handle
      throw err;
    }
  }

  // Fallback SQLite execution
  if (!fallbackDb) {
    await initFallbackDb();
  }

  const translatedSql = translateSqlForFallback(sql);

  // Normalize parameters
  const normalizedParams = (params || []).map(p => {
    if (typeof p === 'boolean') return p ? 1 : 0;
    if (p === undefined) return null;
    return p;
  });

  const trimmed = translatedSql.trim();
  const isSelect = /^(SELECT|WITH|SHOW|DESCRIBE|PRAGMA)/i.test(trimmed);

  if (isSelect) {
    try {
      const stmt = fallbackDb.prepare(translatedSql);
      stmt.bind(normalizedParams);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return [rows, []];
    } catch (e) {
      throw new Error(`Fallback DB Error: ${e.message} in SQL: ${translatedSql}`);
    }
  } else {
    // DDL or DML (INSERT, UPDATE, DELETE)
    try {
      fallbackDb.run(translatedSql, normalizedParams);
      if (!isInTransaction) {
        saveFallbackDb();
      }

      // Emulate mysql2 OkPacket
      let insertId = 0;
      let affectedRows = 0;
      try {
        const idRes = fallbackDb.exec("SELECT last_insert_rowid() AS id, changes() AS ch");
        if (idRes.length && idRes[0].values.length) {
          insertId = idRes[0].values[0][0];
          affectedRows = idRes[0].values[0][1];
        }
      } catch (ignored) {}

      return [{ insertId, affectedRows, changedRows: affectedRows }, []];
    } catch (e) {
      throw new Error(`Fallback DB Run Error: ${e.message} in SQL: ${translatedSql}`);
    }
  }
}

// Transaction Connection Wrapper
async function getConnection() {
  if (!pool && !useFallback) {
    await initDb();
  }

  if (!useFallback && pool) {
    return await pool.getConnection();
  }

  // Fallback Connection Wrapper with identical transaction API
  return {
    query: async (sql, params) => {
      return await query(sql, params);
    },
    beginTransaction: async () => {
      if (fallbackDb) {
        isInTransaction = true;
        fallbackDb.run("BEGIN TRANSACTION");
      }
    },
    commit: async () => {
      if (fallbackDb) {
        fallbackDb.run("COMMIT");
        isInTransaction = false;
        saveFallbackDb();
      }
    },
    rollback: async () => {
      if (fallbackDb) {
        fallbackDb.run("ROLLBACK");
        isInTransaction = false;
      }
    },
    release: () => {
      isInTransaction = false;
    }
  };
}

module.exports = {
  initDb,
  query,
  getConnection,
  isFallback: () => useFallback,
  saveFallbackDb
};
