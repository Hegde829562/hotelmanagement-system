// =====================================================================
// INTELLISTAY: Comprehensive Master Seed Data
// Contains 52 authentic hotels across 20 Indian destinations,
// 10 user roles, curated high-res hospitality images, room types,
// physical rooms, amenities, reviews, staff assignments, and tasks.
// =====================================================================

const bcrypt = require('bcryptjs');

const defaultUserPasswordHash = '$2b$10$2sR9c0r4Vt3l3IJPk71MzecMAVRM7v2Xctp7WEZYX6qzNILRfS28C'; // password123
const adminPasswordHash = '$2b$10$uMasZxMi4O0n9DiyiWch/OdZwv8TF49DPFd5KGT5LT545TG9dKoQy'; // admin123

const amenities = [
  { name: 'High-Speed Wi-Fi', code: 'wifi', icon: 'bi-wifi', category: 'Connectivity' },
  { name: 'Swimming Pool', code: 'pool', icon: 'bi-water', category: 'Wellness' },
  { name: 'Spa & Wellness Sanctuary', code: 'spa', icon: 'bi-flower1', category: 'Wellness' },
  { name: 'Complimentary Gourmet Breakfast', code: 'breakfast', icon: 'bi-cup-hot', category: 'Dining' },
  { name: 'Fine Dining Restaurant', code: 'restaurant', icon: 'bi-egg-fried', category: 'Dining' },
  { name: 'Artisan Bar & Lounge', code: 'bar', icon: 'bi-cup-straw', category: 'Dining' },
  { name: '24/7 Room Service', code: 'room_service', icon: 'bi-bell', category: 'Services' },
  { name: 'Modern Fitness Center', code: 'gym', icon: 'bi-heart-pulse', category: 'Wellness' },
  { name: 'Air Conditioning', code: 'ac', icon: 'bi-snow', category: 'Comfort' },
  { name: 'Complimentary Valet Parking', code: 'parking', icon: 'bi-p-circle', category: 'Services' },
  { name: 'Ocean / Lake View', code: 'view_water', icon: 'bi-tsunami', category: 'Outdoor' },
  { name: 'Panoramic Mountain View', code: 'view_mountain', icon: 'bi-image-alt', category: 'Outdoor' },
  { name: 'Private Balcony / Verandah', code: 'balcony', icon: 'bi-door-open', category: 'Comfort' },
  { name: 'Pet Friendly Accommodations', code: 'pet_friendly', icon: 'bi-emoji-smile', category: 'Comfort' },
  { name: 'Airport Luxury Transfer', code: 'airport_shuttle', icon: 'bi-car-front', category: 'Services' },
  { name: 'EV Charging Station', code: 'ev_charging', icon: 'bi-lightning-charge', category: 'Services' },
  { name: 'Bonfire & Stargazing Lawn', code: 'bonfire', icon: 'bi-fire', category: 'Outdoor' },
  { name: 'Yoga & Meditation Pavilion', code: 'yoga', icon: 'bi-peace', category: 'Wellness' }
];

const users = [
  {
    id: 1,
    full_name: 'Ananya Deshmukh',
    email: 'admin@intellistay.com',
    phone: '+91 98765 00001',
    password_hash: adminPasswordHash,
    role: 'admin',
    loyalty_points: 0,
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 2,
    full_name: 'Kabir Oberoi',
    email: 'owner@intellistay.com',
    phone: '+91 98765 00002',
    password_hash: defaultUserPasswordHash,
    role: 'owner',
    loyalty_points: 0,
    avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 3,
    full_name: 'Priya Sharma',
    email: 'priya.sharma@stays.in',
    phone: '+91 98765 00003',
    password_hash: defaultUserPasswordHash,
    role: 'owner',
    loyalty_points: 0,
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 4,
    full_name: 'Vikram Mehta',
    email: 'vikram.mehta@royalstays.in',
    phone: '+91 98765 00004',
    password_hash: defaultUserPasswordHash,
    role: 'owner',
    loyalty_points: 0,
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 5,
    full_name: 'Rohan Verma',
    email: 'customer@intellistay.com',
    phone: '+91 98765 00005',
    password_hash: defaultUserPasswordHash,
    role: 'customer',
    loyalty_points: 450,
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 6,
    full_name: 'Sunita Rao',
    email: 'manager@intellistay.com',
    phone: '+91 98765 00006',
    password_hash: defaultUserPasswordHash,
    role: 'manager',
    loyalty_points: 0,
    avatar_url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 7,
    full_name: 'Arjun Nair',
    email: 'receptionist@intellistay.com',
    phone: '+91 98765 00007',
    password_hash: defaultUserPasswordHash,
    role: 'receptionist',
    loyalty_points: 0,
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 8,
    full_name: 'Deepa Kumari',
    email: 'housekeeping@intellistay.com',
    phone: '+91 98765 00008',
    password_hash: defaultUserPasswordHash,
    role: 'housekeeping',
    loyalty_points: 0,
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 9,
    full_name: 'Mahesh Patil',
    email: 'maintenance@intellistay.com',
    phone: '+91 98765 00009',
    password_hash: defaultUserPasswordHash,
    role: 'maintenance',
    loyalty_points: 0,
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 10,
    full_name: 'Karan Singh',
    email: 'roomservice@intellistay.com',
    phone: '+91 98765 00010',
    password_hash: defaultUserPasswordHash,
    role: 'room_service',
    loyalty_points: 0,
    avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 11,
    full_name: 'Chef Rajesh Khanna',
    email: 'kitchen@intellistay.com',
    phone: '+91 98765 00011',
    password_hash: defaultUserPasswordHash,
    role: 'kitchen',
    loyalty_points: 0,
    avatar_url: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 12,
    full_name: 'Balwant Gurung',
    email: 'security@intellistay.com',
    phone: '+91 98765 00012',
    password_hash: defaultUserPasswordHash,
    role: 'security',
    loyalty_points: 0,
    avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&q=80'
  }
];

// Curated high quality hotel image collection
const hospitalityImages = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
];

// Room images
const roomImages = [
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80'
];

// 52 realistic hotels across 20 Indian destinations
const hotelsData = [
  // BENGALURU
  {
    name: 'The Glasshouse Garden Manor',
    category: 'Boutique',
    city: 'Bengaluru',
    state: 'Karnataka',
    address: '42 Lavelle Road, Shanthala Nagar',
    pincode: '560001',
    star_rating: 4.8,
    base_price: 6800,
    description: 'An oasis of calm nestled beneath century-old rain trees on Lavelle Road. Featuring bespoke colonial botanical aesthetics, private verandahs, and artisanal dining.',
    amenities: ['wifi', 'breakfast', 'restaurant', 'bar', 'gym', 'parking', 'ac'],
    owner_id: 2,
    is_featured: 1
  },
  {
    name: 'Silicon Horizon Tech Suites',
    category: 'Business',
    city: 'Bengaluru',
    state: 'Karnataka',
    address: '88 Outer Ring Road, Bellandur',
    pincode: '560103',
    star_rating: 4.5,
    base_price: 4900,
    description: 'Purpose-built for executive travelers. Ergonomic smart workspaces, high-speed fiber connectivity, infinity rooftop pool, and 24/7 express boardrooms.',
    amenities: ['wifi', 'gym', 'pool', 'restaurant', 'room_service', 'ev_charging', 'ac'],
    owner_id: 2,
    is_featured: 0
  },
  {
    name: 'Cubbon Heritage Bungalow',
    category: 'Homestay',
    city: 'Bengaluru',
    state: 'Karnataka',
    address: '15 Richmond Road, Victoria Layout',
    pincode: '560025',
    star_rating: 4.7,
    base_price: 3800,
    description: 'A restored 1920s Art Deco villa offering tranquil courtyard breakfasts, warm local hospitality, and handcrafted heritage furniture.',
    amenities: ['wifi', 'breakfast', 'parking', 'pet_friendly', 'balcony'],
    owner_id: 3,
    is_featured: 1
  },

  // MYSURU
  {
    name: 'The Royal Chamundi Palace Retreat',
    category: 'Luxury',
    city: 'Mysuru',
    state: 'Karnataka',
    address: '1 Palace Vista Boulevard, Nazarbad',
    pincode: '570010',
    star_rating: 4.9,
    base_price: 9500,
    description: 'Immerse yourself in regal sandalwood heritage. Featuring handcrafted teak pillars, private sit-outs with palace illumination vistas, and royal thali dining.',
    amenities: ['wifi', 'pool', 'spa', 'breakfast', 'restaurant', 'bar', 'airport_shuttle'],
    owner_id: 4,
    is_featured: 1
  },
  {
    name: 'Sandalwood Courtyard Homestay',
    category: 'Homestay',
    city: 'Mysuru',
    state: 'Karnataka',
    address: '27 Yadavagiri Heritage Lane',
    pincode: '570020',
    star_rating: 4.6,
    base_price: 2600,
    description: 'Warm South Indian hospitality in a quiet tree-lined enclave. Enjoy homemade Mysore filter coffee and traditional garden sit-outs.',
    amenities: ['wifi', 'breakfast', 'parking', 'yoga'],
    owner_id: 3,
    is_featured: 0
  },

  // COORG
  {
    name: 'Aroma Woods Coffee Estate Resort',
    category: 'Resort',
    city: 'Coorg',
    state: 'Karnataka',
    address: 'Madikeri Virajpet Road, Suntikoppa',
    pincode: '571237',
    star_rating: 4.9,
    base_price: 8200,
    description: 'Sprawled across 80 acres of organic Arabica coffee and black pepper plantations. Private wooden cottages, stream walks, and twilight bonfires.',
    amenities: ['wifi', 'pool', 'spa', 'breakfast', 'restaurant', 'bonfire', 'view_mountain', 'balcony'],
    owner_id: 2,
    is_featured: 1
  },
  {
    name: 'Misty Brahmagiri Cottage Stays',
    category: 'Hill Station',
    city: 'Coorg',
    state: 'Karnataka',
    address: 'Bhagamandala Foothills, Talacauvery Range',
    pincode: '571247',
    star_rating: 4.7,
    base_price: 4500,
    description: 'Awaken above the cloudline. Traditional Kodava hospitality, authentic pork pandi curry dinners, and birdwatching trails right outside your door.',
    amenities: ['wifi', 'breakfast', 'bonfire', 'balcony', 'view_mountain', 'parking'],
    owner_id: 3,
    is_featured: 0
  },
  {
    name: 'Whispering Streams Eco Lodge',
    category: 'Budget',
    city: 'Coorg',
    state: 'Karnataka',
    address: 'Kakkabe Forest Track, Near Thadiyandamol',
    pincode: '571212',
    star_rating: 4.3,
    base_price: 2100,
    description: 'Serene riverside eco cottages designed for backpackers and nature enthusiasts seeking an unhurried mountain hideaway on a sensible budget.',
    amenities: ['wifi', 'bonfire', 'parking', 'pet_friendly'],
    owner_id: 4,
    is_featured: 0
  },

  // GOA
  {
    name: 'Casa Mar Bella Seaside Villa',
    category: 'Beach Stay',
    city: 'Goa',
    state: 'Goa',
    address: 'Morjim Ashwem Beach Road',
    pincode: '403512',
    star_rating: 4.9,
    base_price: 11500,
    description: 'Barefoot luxury just twenty paces from the Arabian Sea. Thatched cabanas, fresh seafood shacks, yoga at sunrise, and curated sunset cocktails.',
    amenities: ['wifi', 'pool', 'spa', 'restaurant', 'bar', 'view_water', 'balcony', 'yoga'],
    owner_id: 2,
    is_featured: 1
  },
  {
    name: 'Fontainhas Latin Quarter Boutique Hotel',
    category: 'Boutique',
    city: 'Goa',
    state: 'Goa',
    address: 'Rue 31 de Janeiro, Fontainhas, Panaji',
    pincode: '403001',
    star_rating: 4.7,
    base_price: 5400,
    description: 'A vibrant Portuguese heritage home with cobalt blue shutters, terracotta roofs, bespoke ceramic tiles, and morning jazz breakfasts.',
    amenities: ['wifi', 'breakfast', 'restaurant', 'bar', 'ac', 'room_service'],
    owner_id: 3,
    is_featured: 1
  },
  {
    name: 'Sunset Palms Beach Resort & Spa',
    category: 'Resort',
    city: 'Goa',
    state: 'Goa',
    address: 'Candolim Sinquerim Coastal Road',
    pincode: '403515',
    star_rating: 4.8,
    base_price: 8900,
    description: 'Tropical garden landscapes framing a lagoon swimming pool. Direct beach access, beach volleyball, and Ayurvedic therapeutic massages.',
    amenities: ['wifi', 'pool', 'spa', 'restaurant', 'bar', 'gym', 'view_water'],
    owner_id: 2,
    is_featured: 0
  },
  {
    name: 'Palolem Backwater Eco Huts',
    category: 'Budget',
    city: 'Goa',
    state: 'Goa',
    address: 'South Palolem Estuary, Canacona',
    pincode: '403702',
    star_rating: 4.4,
    base_price: 2400,
    description: 'Sustainable bamboo huts tucked between coconut palms and tranquil kayaking waterways, walking distance from the crescent bay.',
    amenities: ['wifi', 'restaurant', 'parking', 'view_water', 'pet_friendly'],
    owner_id: 4,
    is_featured: 0
  },

  // OOTY
  {
    name: 'Fernhill Scottish Highlands Manor',
    category: 'Luxury',
    city: 'Ooty',
    state: 'Tamil Nadu',
    address: 'Fern Hill Palace Road',
    pincode: '643004',
    star_rating: 4.9,
    base_price: 8700,
    description: 'British colonial charm overlooking undulating tea slopes. Cozy wood-burning fireplaces in every bedroom, high tea on the lawn, and equestrian rides.',
    amenities: ['wifi', 'restaurant', 'bar', 'breakfast', 'bonfire', 'view_mountain', 'parking'],
    owner_id: 4,
    is_featured: 1
  },
  {
    name: 'Blue Mountain Pines Heritage Villa',
    category: 'Couple-friendly',
    city: 'Ooty',
    state: 'Tamil Nadu',
    address: 'Dodabetta Peak Access Road',
    pincode: '643002',
    star_rating: 4.7,
    base_price: 5200,
    description: 'Secluded romantic suites surrounded by eucalyptus groves. Floor-to-ceiling glass fronts, candlelit terrace dinners, and mist-wrapped gardens.',
    amenities: ['wifi', 'breakfast', 'bonfire', 'balcony', 'view_mountain', 'room_service'],
    owner_id: 2,
    is_featured: 0
  },
  {
    name: 'Lakeview Cedar Homestay',
    category: 'Budget',
    city: 'Ooty',
    state: 'Tamil Nadu',
    address: 'West Lake Road, Near Ooty Boathouse',
    pincode: '643001',
    star_rating: 4.3,
    base_price: 2200,
    description: 'Clean, comfortable family rooms facing the historic lake. Home-cooked vegetarian meals and proximity to the Nilgiri Mountain Railway.',
    amenities: ['wifi', 'breakfast', 'parking'],
    owner_id: 3,
    is_featured: 0
  },

  // MUNNAR
  {
    name: 'Emerald Ridge Tea Estate Resort',
    category: 'Resort',
    city: 'Munnar',
    state: 'Kerala',
    address: 'Pallivasal Estate, Chithirapuram',
    pincode: '685565',
    star_rating: 4.9,
    base_price: 7800,
    description: 'Perched in the heart of verdant rolling tea gardens. Infinity cantilever pool looking out into valley mists, tea plucking workshops, and herbal spas.',
    amenities: ['wifi', 'pool', 'spa', 'restaurant', 'view_mountain', 'balcony', 'breakfast'],
    owner_id: 2,
    is_featured: 1
  },
  {
    name: 'Cloud Nine Misty Mountain Chalet',
    category: 'Hill Station',
    city: 'Munnar',
    state: 'Kerala',
    address: 'Pothamedu Viewpoint Ridge',
    pincode: '685612',
    star_rating: 4.7,
    base_price: 4900,
    description: 'Charming stone cottages with panoramic views of cascading spice valleys. Watch the sun dip into clouds over cardamom-infused warm chai.',
    amenities: ['wifi', 'breakfast', 'bonfire', 'view_mountain', 'balcony', 'restaurant'],
    owner_id: 3,
    is_featured: 0
  },
  {
    name: 'Anamudi Valley Backpackers Inn',
    category: 'Budget',
    city: 'Munnar',
    state: 'Kerala',
    address: 'Old Munnar Bazaar Road',
    pincode: '685612',
    star_rating: 4.2,
    base_price: 1800,
    description: 'Affordable, sparkling clean rooms tailored for trekkers and solo explorers wanting quick access to Eravikulam National Park.',
    amenities: ['wifi', 'parking', 'room_service'],
    owner_id: 4,
    is_featured: 0
  },

  // KOCHI
  {
    name: 'Fort Malabar Heritage Grand',
    category: 'Boutique',
    city: 'Kochi',
    state: 'Kerala',
    address: 'Burgher Street, Fort Kochi',
    pincode: '682001',
    star_rating: 4.8,
    base_price: 6400,
    description: 'A 300-year-old Dutch merchant residence lovingly revived. Rain-tree shaded courtyards, traditional kathakali performances, and Malabar seafood curries.',
    amenities: ['wifi', 'pool', 'restaurant', 'bar', 'breakfast', 'ac', 'spa'],
    owner_id: 3,
    is_featured: 1
  },
  {
    name: 'Vembanad Waters Backwater Sanctuary',
    category: 'Resort',
    city: 'Kochi',
    state: 'Kerala',
    address: 'Kumbalanghi Tourism Island',
    pincode: '682007',
    star_rating: 4.8,
    base_price: 7200,
    description: 'Eco-conscious overwater villas along the backwater canals. Solar powered canoe safaris, live crab fishing, and Ayurvedic body oil therapies.',
    amenities: ['wifi', 'pool', 'spa', 'restaurant', 'view_water', 'balcony', 'yoga'],
    owner_id: 2,
    is_featured: 0
  },
  {
    name: 'Marine Drive Business Executive Suites',
    category: 'Business',
    city: 'Kochi',
    state: 'Kerala',
    address: 'Shanmugham Road, Marine Drive',
    pincode: '682031',
    star_rating: 4.5,
    base_price: 4100,
    description: 'Waterfront corporate hotel adjacent to Ernakulam commercial hubs. Harbour view rooms, conference halls, and express dry cleaning.',
    amenities: ['wifi', 'gym', 'restaurant', 'view_water', 'ac', 'parking'],
    owner_id: 4,
    is_featured: 0
  },

  // CHENNAI
  {
    name: 'The Coromandel Marina Grand',
    category: 'Luxury',
    city: 'Chennai',
    state: 'Tamil Nadu',
    address: '108 Rajaji Salai, George Town',
    pincode: '600001',
    star_rating: 4.8,
    base_price: 7600,
    description: 'Grand Dravidian architecture meets contemporary coastal elegance. Ocean facing bay windows, filter coffee lounge, and Chettinad royal culinary feasts.',
    amenities: ['wifi', 'pool', 'spa', 'gym', 'restaurant', 'bar', 'view_water', 'airport_shuttle'],
    owner_id: 4,
    is_featured: 1
  },
  {
    name: 'East Coast Casuarina Beach House',
    category: 'Beach Stay',
    city: 'Chennai',
    state: 'Tamil Nadu',
    address: 'ECR Golden Beach Highway, Injambakkam',
    pincode: '600115',
    star_rating: 4.6,
    base_price: 5800,
    description: 'A breezy seaside escape under whispering casuarina groves. Private plunge pools, barbecue grills, and private boardwalk to the shore.',
    amenities: ['wifi', 'pool', 'restaurant', 'view_water', 'balcony', 'parking'],
    owner_id: 2,
    is_featured: 0
  },
  {
    name: 'Guindy Tech Park Corporate Inn',
    category: 'Business',
    city: 'Chennai',
    state: 'Tamil Nadu',
    address: 'Mount Poonamallee Road, Guindy',
    pincode: '600032',
    star_rating: 4.4,
    base_price: 3600,
    description: 'Convenient transit hub minutes from Chennai International Airport and IT corridors. Soundproof glazing, power showers, and round-the-clock buffet.',
    amenities: ['wifi', 'gym', 'restaurant', 'airport_shuttle', 'ac'],
    owner_id: 3,
    is_featured: 0
  },

  // HYDERABAD
  {
    name: 'The Nizam Kohinoor Palace',
    category: 'Luxury',
    city: 'Hyderabad',
    state: 'Telangana',
    address: 'Banjara Hills Road No. 1',
    pincode: '500034',
    star_rating: 4.9,
    base_price: 10200,
    description: 'Opulent marble arcades, Belgian crystal chandeliers, and manicured Mughal gardens. Savor authentic Dum Biryani cooked over wood charcoal.',
    amenities: ['wifi', 'pool', 'spa', 'restaurant', 'bar', 'gym', 'valet', 'airport_shuttle'],
    owner_id: 2,
    is_featured: 1
  },
  {
    name: 'HITEC Cyber Suites',
    category: 'Business',
    city: 'Hyderabad',
    state: 'Telangana',
    address: 'Mindspace Junction, Madhapur',
    pincode: '500081',
    star_rating: 4.6,
    base_price: 4800,
    description: 'Modern glass-and-steel architecture in the heart of Cyberabad. Dual monitor work stations, high-speed connectivity, and rooftop cocktail lounge.',
    amenities: ['wifi', 'pool', 'gym', 'restaurant', 'bar', 'ev_charging', 'ac'],
    owner_id: 4,
    is_featured: 0
  },
  {
    name: 'Charminar Heritage Haveli',
    category: 'Boutique',
    city: 'Hyderabad',
    state: 'Telangana',
    address: 'Laad Bazaar Historic Quarter',
    pincode: '500002',
    star_rating: 4.5,
    base_price: 3300,
    description: 'Stay in the historical center amidst pearl merchants and attar shops. Arched stone courtyards, Irani chai breakfasts, and Osmania cookies.',
    amenities: ['wifi', 'breakfast', 'restaurant', 'ac'],
    owner_id: 3,
    is_featured: 0
  },

  // MUMBAI
  {
    name: 'The Gateway Regency & Marine Suites',
    category: 'Luxury',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: 'Apollo Bunder, Colaba',
    pincode: '400001',
    star_rating: 4.9,
    base_price: 13500,
    description: 'Peerless heritage landmark gazing across the Gateway of India and the Mumbai Harbour. White-glove butler service, fine dining restaurants, and jazz lounge.',
    amenities: ['wifi', 'pool', 'spa', 'gym', 'restaurant', 'bar', 'view_water', 'airport_shuttle'],
    owner_id: 2,
    is_featured: 1
  },
  {
    name: 'Bandra Bohemian Seaside Loft',
    category: 'Boutique',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: 'Carter Road Promenade, Bandra West',
    pincode: '400050',
    star_rating: 4.8,
    base_price: 7200,
    description: 'Chic sea-facing boutique hotel favored by artists and filmmakers. Rooftop organic cafe, vinyl listening booth, and sun-drenched balconies.',
    amenities: ['wifi', 'restaurant', 'bar', 'breakfast', 'view_water', 'balcony', 'ac'],
    owner_id: 3,
    is_featured: 1
  },
  {
    name: 'Juhu Palms Coastal Retreat',
    category: 'Family',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: 'Juhu Tara Road, Juhu Beach',
    pincode: '400049',
    star_rating: 4.6,
    base_price: 6100,
    description: 'Spacious interconnecting family suites with direct beach access. Childrens play terrace, poolside cabanas, and weekend live grill buffets.',
    amenities: ['wifi', 'pool', 'restaurant', 'view_water', 'parking', 'room_service'],
    owner_id: 4,
    is_featured: 0
  },

  // PUNE
  {
    name: 'Koregaon Park Banyan Tree Suites',
    category: 'Boutique',
    city: 'Pune',
    state: 'Maharashtra',
    address: 'Lane 6, Koregaon Park',
    pincode: '411001',
    star_rating: 4.7,
    base_price: 4900,
    description: 'Shaded beneath sprawling ancient banyans. Zen rock gardens, artisanal bakery, yoga studio, and calm light-filled rooms with Scandinavian touches.',
    amenities: ['wifi', 'spa', 'breakfast', 'restaurant', 'yoga', 'balcony', 'parking'],
    owner_id: 2,
    is_featured: 1
  },
  {
    name: 'Hinjawadi Infotech Business Hotel',
    category: 'Business',
    city: 'Pune',
    state: 'Maharashtra',
    address: 'Phase 1, Hinjawadi Rajiv Gandhi Infotech Park',
    pincode: '411057',
    star_rating: 4.4,
    base_price: 3400,
    description: 'Designed for corporate stays. Fast check-in, 24-hour gym, meeting pods, and direct shuttle connectivity to IT campuses.',
    amenities: ['wifi', 'gym', 'restaurant', 'room_service', 'ac', 'parking'],
    owner_id: 3,
    is_featured: 0
  },

  // DELHI
  {
    name: 'The Lutyens Imperial Haveli',
    category: 'Luxury',
    city: 'Delhi',
    state: 'Delhi',
    address: '15 Barakhamba Road, Connaught Place',
    pincode: '110001',
    star_rating: 4.9,
    base_price: 9800,
    description: 'Colonial opulence in the center of the capital. High colonnades, marble verandas, afternoon tea service, and gourmet North Indian dining.',
    amenities: ['wifi', 'pool', 'spa', 'gym', 'restaurant', 'bar', 'valet', 'airport_shuttle'],
    owner_id: 4,
    is_featured: 1
  },
  {
    name: 'Hauz Khas Village Bohemian Manor',
    category: 'Boutique',
    city: 'Delhi',
    state: 'Delhi',
    address: 'Hauz Khas Tank View Terrace',
    pincode: '110016',
    star_rating: 4.6,
    base_price: 4800,
    description: 'Overlooking medieval lake monuments and lush deer park forests. Antique furniture, rooftop jazz sessions, and quirky local indie design.',
    amenities: ['wifi', 'restaurant', 'bar', 'breakfast', 'balcony', 'ac'],
    owner_id: 2,
    is_featured: 0
  },
  {
    name: 'Aerocity Express Transit Hotel',
    category: 'Business',
    city: 'Delhi',
    state: 'Delhi',
    address: 'Asset 5B, Hospitality District, Aerocity',
    pincode: '110037',
    star_rating: 4.5,
    base_price: 5200,
    description: 'Three minutes from Indira Gandhi International Terminal. Triple glazed sound insulation, flight monitor screens, spa, and all-night dining.',
    amenities: ['wifi', 'gym', 'spa', 'restaurant', 'bar', 'airport_shuttle', 'ac'],
    owner_id: 3,
    is_featured: 0
  },

  // JAIPUR
  {
    name: 'The Amber Royal Fortress Palace',
    category: 'Luxury',
    city: 'Jaipur',
    state: 'Rajasthan',
    address: 'Amer Fort Foothills Highway',
    pincode: '302028',
    star_rating: 4.9,
    base_price: 11200,
    description: 'Live like royalty in a restored Rajput fort. Jharokha carved balconies, peacock gardens, royal horse stables, and traditional folk music under starry desert skies.',
    amenities: ['wifi', 'pool', 'spa', 'restaurant', 'bar', 'breakfast', 'bonfire', 'view_mountain'],
    owner_id: 4,
    is_featured: 1
  },
  {
    name: 'Pink City Heritage Haveli & Spa',
    category: 'Boutique',
    city: 'Jaipur',
    state: 'Rajasthan',
    address: 'Subhash Chowk, Johari Bazaar',
    pincode: '302002',
    star_rating: 4.7,
    base_price: 5100,
    description: 'Traditional frescoed ceilings, courtyard fountains, and candlelit dinners overlooking the Hawa Mahal. Centrally located for gemstone shopping.',
    amenities: ['wifi', 'spa', 'restaurant', 'breakfast', 'ac', 'room_service'],
    owner_id: 2,
    is_featured: 1
  },
  {
    name: 'Kukas Desert Dune Tented Resort',
    category: 'Resort',
    city: 'Jaipur',
    state: 'Rajasthan',
    address: 'Delhi-Jaipur Expressway, Kukas',
    pincode: '302028',
    star_rating: 4.6,
    base_price: 6800,
    description: 'Air-conditioned luxury tents with marble bathrooms on the Aravalli border. Camel rides, desert stargazing, and vibrant puppet theatre.',
    amenities: ['wifi', 'pool', 'restaurant', 'bonfire', 'parking', 'breakfast'],
    owner_id: 3,
    is_featured: 0
  },

  // UDAIPUR
  {
    name: 'Lake Pichola Floating Palace View',
    category: 'Luxury',
    city: 'Udaipur',
    state: 'Rajasthan',
    address: 'Chandpole Ghat, Old City',
    pincode: '313001',
    star_rating: 4.9,
    base_price: 12800,
    description: 'Direct sweeping views across Lake Pichola and the Jag Mandir. Private boat transfers, Mewari royal thali dining, and terrace sunset sit-outs.',
    amenities: ['wifi', 'pool', 'spa', 'restaurant', 'bar', 'view_water', 'balcony', 'airport_shuttle'],
    owner_id: 4,
    is_featured: 1
  },
  {
    name: 'Fateh Sagar Royal Lakeside Retreat',
    category: 'Couple-friendly',
    city: 'Udaipur',
    state: 'Rajasthan',
    address: 'Rani Road, Fatehsagar Lakefront',
    pincode: '313001',
    star_rating: 4.8,
    base_price: 7900,
    description: 'Romantic lakeside sanctuaries featuring sunken terrazzo tubs, private balconies facing the water, and romantic evening boat cruises.',
    amenities: ['wifi', 'pool', 'restaurant', 'bar', 'view_water', 'balcony', 'breakfast'],
    owner_id: 2,
    is_featured: 0
  },
  {
    name: 'Aravalli Valley Nature Stays',
    category: 'Homestay',
    city: 'Udaipur',
    state: 'Rajasthan',
    address: 'Badi Lake Road, Aravalli foothills',
    pincode: '313011',
    star_rating: 4.5,
    base_price: 3200,
    description: 'A tranquil organic farm stay away from tourist crowds. Fresh milk, farm-to-table vegetarian meals, bird sanctuary walks, and mountain vistas.',
    amenities: ['wifi', 'breakfast', 'parking', 'bonfire', 'view_mountain', 'pet_friendly'],
    owner_id: 3,
    is_featured: 0
  },

  // MANALI
  {
    name: 'Himalayan Cedar River Sanctuary',
    category: 'Resort',
    city: 'Manali',
    state: 'Himachal Pradesh',
    address: 'Old Manali Apple Orchards Road',
    pincode: '175131',
    star_rating: 4.9,
    base_price: 7900,
    description: 'Perched alongside the rushing Beas river among apple blossoms. Solid pine log cabins, cedar hot tubs, fireplace lounges, and snow peaks.',
    amenities: ['wifi', 'spa', 'restaurant', 'bonfire', 'view_mountain', 'balcony', 'breakfast'],
    owner_id: 2,
    is_featured: 1
  },
  {
    name: 'Solang Valley Snowline Chalet',
    category: 'Hill Station',
    city: 'Manali',
    state: 'Himachal Pradesh',
    address: 'Solang Village, Rohtang Pass Route',
    pincode: '175103',
    star_rating: 4.7,
    base_price: 5400,
    description: 'Step right out onto ski and paragliding slopes. Heated rooms, glass sunrooms with hot cocoa, and panoramic vistas of snow-capped glaciers.',
    amenities: ['wifi', 'restaurant', 'bonfire', 'view_mountain', 'balcony', 'parking'],
    owner_id: 3,
    is_featured: 0
  },
  {
    name: 'Old Manali Hippie Trail Lodge',
    category: 'Budget',
    city: 'Manali',
    state: 'Himachal Pradesh',
    address: 'Manu Temple Trail, Old Manali',
    pincode: '175131',
    star_rating: 4.4,
    base_price: 1900,
    description: 'Wood-paneled cozy backpacker haven with wood-fired pizza ovens, guitar jam evenings, and fast fiber broadband for remote workers.',
    amenities: ['wifi', 'restaurant', 'bonfire', 'pet_friendly'],
    owner_id: 4,
    is_featured: 0
  },

  // SHIMLA
  {
    name: 'The Wildflower Ridge Victorian Manor',
    category: 'Luxury',
    city: 'Shimla',
    state: 'Himachal Pradesh',
    address: 'Chharabra Ridge, Mashobra Highway',
    pincode: '171012',
    star_rating: 4.9,
    base_price: 10500,
    description: 'Lord Kitcheners former colonial mountain lodge at 8,250 feet elevation. Heated indoor swimming pool, cedar forest walks, and fine dining.',
    amenities: ['wifi', 'pool', 'spa', 'gym', 'restaurant', 'bar', 'view_mountain', 'balcony'],
    owner_id: 2,
    is_featured: 1
  },
  {
    name: 'Mall Road Colonial Heritage Lodge',
    category: 'Boutique',
    city: 'Shimla',
    state: 'Himachal Pradesh',
    address: 'Near Gaiety Theatre, Mall Road',
    pincode: '171001',
    star_rating: 4.6,
    base_price: 4900,
    description: 'Historic wooden floorboards and bay windows looking onto Shimla Ridge. Walk right into colonial promenades, bakeries, and bookshops.',
    amenities: ['wifi', 'breakfast', 'restaurant', 'view_mountain', 'room_service'],
    owner_id: 3,
    is_featured: 0
  },

  // RISHIKESH
  {
    name: 'Ganga Serenity Wellness & Yoga Retreat',
    category: 'Resort',
    city: 'Rishikesh',
    state: 'Uttarakhand',
    address: 'Tapovan Beach, Laxman Jhula Road',
    pincode: '249192',
    star_rating: 4.9,
    base_price: 8400,
    description: 'Perched directly above the sacred emerald waters of the Ganga. Open-air yoga pavilions, sound healing therapy, organic satvik dining, and morning aarti.',
    amenities: ['wifi', 'spa', 'yoga', 'restaurant', 'view_water', 'view_mountain', 'breakfast', 'balcony'],
    owner_id: 2,
    is_featured: 1
  },
  {
    name: 'Ananda Foothills Ayurvedic Haven',
    category: 'Luxury',
    city: 'Rishikesh',
    state: 'Uttarakhand',
    address: 'Palace Estate, Narendra Nagar',
    pincode: '249175',
    star_rating: 4.9,
    base_price: 13900,
    description: 'World-renowned wellness sanctuary surrounded by Sal forests. Personalized Ayurvedic physician consultations, hydrotherapy, and pristine Himalayan silence.',
    amenities: ['wifi', 'pool', 'spa', 'gym', 'restaurant', 'yoga', 'view_mountain', 'airport_shuttle'],
    owner_id: 4,
    is_featured: 1
  },
  {
    name: 'Shivpuri Rapids River Camp',
    category: 'Budget',
    city: 'Rishikesh',
    state: 'Uttarakhand',
    address: 'Shivpuri River Bank, Badrinath Highway',
    pincode: '249192',
    star_rating: 4.3,
    base_price: 2200,
    description: 'Adventure beach camps with white-water rafting, beach volleyball, evening bonfires by the river, and starry sky camping.',
    amenities: ['bonfire', 'restaurant', 'view_water', 'parking'],
    owner_id: 3,
    is_featured: 0
  },

  // VARKALA
  {
    name: 'Red Cliffside Ocean View Villas',
    category: 'Beach Stay',
    city: 'Varkala',
    state: 'Kerala',
    address: 'North Cliff Walkway, Kurakkanni',
    pincode: '695141',
    star_rating: 4.8,
    base_price: 5200,
    description: 'Perched on Varkalas dramatic red laterite cliffs above the Arabian Sea. Unmatched ocean sunsets, hammock terraces, and fresh seafood catches.',
    amenities: ['wifi', 'restaurant', 'breakfast', 'view_water', 'balcony', 'yoga'],
    owner_id: 2,
    is_featured: 1
  },
  {
    name: 'Varkala Soul Surf & Yoga Haven',
    category: 'Homestay',
    city: 'Varkala',
    state: 'Kerala',
    address: 'South Cliff Temple Junction',
    pincode: '695141',
    star_rating: 4.5,
    base_price: 2900,
    description: 'Laidback palm grove sanctuary for surfers and yogis. Surfboard rentals, healthy smoothie bowls, and coconut garden loungers.',
    amenities: ['wifi', 'breakfast', 'yoga', 'pet_friendly', 'parking'],
    owner_id: 3,
    is_featured: 0
  },

  // GOKARNA
  {
    name: 'Om Beach Kudle Sunset Sanctuary',
    category: 'Resort',
    city: 'Gokarna',
    state: 'Karnataka',
    address: 'Kudle Beach Hilltop Road',
    pincode: '581326',
    star_rating: 4.8,
    base_price: 6300,
    description: 'Panoramic views over the twin crescent bays of Om Beach and Kudle. Infinity pool, Ayurvedic oil massages, and wooden clifftop gazebos.',
    amenities: ['wifi', 'pool', 'spa', 'restaurant', 'bar', 'view_water', 'balcony'],
    owner_id: 2,
    is_featured: 1
  },
  {
    name: 'Paradise Bay Eco Bamboo Stays',
    category: 'Budget',
    city: 'Gokarna',
    state: 'Karnataka',
    address: 'Half Moon Beach Cliff Trail',
    pincode: '581326',
    star_rating: 4.4,
    base_price: 2100,
    description: 'Rustic thatched huts nestled in cashew plantations. Direct trail down to secluded pristine beaches, away from all motor sounds.',
    amenities: ['wifi', 'restaurant', 'view_water', 'bonfire'],
    owner_id: 4,
    is_featured: 0
  },

  // WAYANAD
  {
    name: 'Vythiri Rainforest Treehouse Resort',
    category: 'Resort',
    city: 'Wayanad',
    state: 'Kerala',
    address: 'Lakkidi Rain Pass, Vythiri',
    pincode: '673576',
    star_rating: 4.9,
    base_price: 8900,
    description: 'Live 80 feet above the ground in luxury treehouses built around giant canopy trees. Natural mountain spring pool, hanging bridges, and tropical birds.',
    amenities: ['wifi', 'pool', 'spa', 'restaurant', 'view_mountain', 'balcony', 'breakfast'],
    owner_id: 2,
    is_featured: 1
  },
  {
    name: 'Chembra Peak Plantation Homestay',
    category: 'Homestay',
    city: 'Wayanad',
    state: 'Kerala',
    address: 'Meppadi Estate Route, Near Heart Lake',
    pincode: '673577',
    star_rating: 4.7,
    base_price: 3600,
    description: 'Nestled on the slopes of Wayanads highest peak. Homemade Malabar appams, spice garden tours, and views of mist rolling over tea carpets.',
    amenities: ['wifi', 'breakfast', 'bonfire', 'view_mountain', 'parking'],
    owner_id: 3,
    is_featured: 0
  },
  {
    name: 'Banasura Earth & Stone Eco Lodge',
    category: 'Boutique',
    city: 'Wayanad',
    state: 'Kerala',
    address: 'Padinjarathara Dam Reservoir Road',
    pincode: '673575',
    star_rating: 4.8,
    base_price: 6100,
    description: 'Constructed from natural rammed earth and local river stone overlooking Banasura Sagar dam. Naturally cool interiors, archery lawns, and herb gardens.',
    amenities: ['wifi', 'pool', 'restaurant', 'view_water', 'view_mountain', 'balcony'],
    owner_id: 4,
    is_featured: 0
  }
];

module.exports = {
  amenities,
  users,
  hospitalityImages,
  roomImages,
  hotelsData
};

