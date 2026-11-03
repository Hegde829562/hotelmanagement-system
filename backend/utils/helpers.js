// =====================================================================
// INTELLISTAY: Helper Functions & Utility Methods
// =====================================================================

// Generate unique booking reference BK-YYYY-XXXXX
function generateBookingReference() {
  const year = new Date().getFullYear();
  const randomPart = Math.floor(10000 + Math.random() * 90000);
  return `BK-${year}-${randomPart}`;
}

// Generate payment transaction reference TXN-XXXXXX
function generateTransactionReference(prefix = 'TXN') {
  const timestamp = Date.now().toString().slice(-6);
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${timestamp}-${randomPart}`;
}

// Calculate days between two dates
function calculateNights(checkIn, checkOut) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

// Format Indian Rupee currency: Rs. 4,500
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

// Format readable date e.g. "20 Nov 2026"
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// Validate date sequence (checkIn < checkOut)
function isValidDateRange(checkIn, checkOut) {
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  return !isNaN(inDate.getTime()) && !isNaN(outDate.getTime()) && outDate > inDate;
}

module.exports = {
  generateBookingReference,
  generateTransactionReference,
  calculateNights,
  formatCurrency,
  formatDate,
  isValidDateRange
};

