
/**
 * AZURA HAVEN — Full Mock Data Seed
 * Seeds: rooms, meals, reviews, bookings, orders, staff, housekeeping,
 *        packages, pricing rules, survey responses, transfers
 *
 * Run: node scripts/seed-all.js
 * Force re-seed: node scripts/seed-all.js --force
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert({
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
  }),
});

const db = admin.firestore();
const FORCE = process.argv.includes('--force');

// ── Helpers ───────────────────────────────────────────────────────────────────
const today = new Date();
const d = (offsetDays) => {
  const dt = new Date(today);
  dt.setDate(dt.getDate() + offsetDays);
  return dt.toISOString().split('T')[0];
};
const ts = (offsetDays = 0) => {
  const dt = new Date(today);
  dt.setDate(dt.getDate() + offsetDays);
  return dt.toISOString();
};

async function seedCollection(name, docs, useId = false) {
  const snap = await db.collection(name).limit(1).get();
  if (!snap.empty && !FORCE) {
    console.log(`  ⏭️  ${name} already has data — skipping (use --force to overwrite)`);
    return 0;
  }
  let count = 0;
  for (const doc of docs) {
    if (useId) {
      const { id, ...data } = doc;
      await db.collection(name).doc(id).set(data, { merge: true });
    } else {
      await db.collection(name).add(doc);
    }
    count++;
  }
  console.log(`  ✅ ${name}: ${count} documents`);
  return count;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════════════════════

const rooms = [
  {
    id: 'room-1', name: 'Presidential Ocean Suite',
    description: 'Floor-to-ceiling windows with panoramic ocean views, private terrace, separate living area, marble bathroom with soaking tub, and 24/7 butler service. The epitome of refined elegance.',
    price: 45000, capacity: 4,
    amenities: ['Ocean View','King Bed','Private Terrace','Butler Service','Jacuzzi','Mini Bar','Smart TV','AC','Room Service','Walk-in Closet'],
    photos: [
      { thumb: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&h=300&fit=crop', full: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200' },
      { thumb: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&h=300&fit=crop', full: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200' },
      { thumb: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400&h=300&fit=crop', full: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1200' }
    ], available: true, avgRating: 4.9, reviewCount: 128, createdAt: ts(-60)
  },
  {
    id: 'room-2', name: 'Deluxe Garden View',
    description: 'Wake up to lush tropical gardens from your private balcony. Spacious room with handcrafted furniture, premium linens, and a spa-inspired bathroom. Perfect for couples.',
    price: 25000, capacity: 2,
    amenities: ['Garden View','Queen Bed','Balcony','Rain Shower','Mini Bar','Smart TV','AC','Room Service','Work Desk'],
    photos: [
      { thumb: 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=400&h=300&fit=crop', full: 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=1200' },
      { thumb: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop', full: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200' }
    ], available: true, avgRating: 4.7, reviewCount: 94, createdAt: ts(-55)
  },
  {
    id: 'room-3', name: 'Safari Family Suite',
    description: 'Two bedrooms, a play area, and stunning savannah views. African-inspired decor meets modern comfort. Kids welcome package included.',
    price: 35000, capacity: 6,
    amenities: ['Savannah View','2 Bedrooms','Kids Area','Full Kitchen','Laundry','Smart TV','AC','Room Service','Board Games'],
    photos: [
      { thumb: 'https://images.unsplash.com/photo-1598928506311-c55ed91a1066?w=400&h=300&fit=crop', full: 'https://images.unsplash.com/photo-1598928506311-c55ed91a1066?w=1200' },
      { thumb: 'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=400&h=300&fit=crop', full: 'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=1200' }
    ], available: true, avgRating: 4.8, reviewCount: 67, createdAt: ts(-50)
  },
  {
    id: 'room-4', name: 'Executive Business Room',
    description: 'Ergonomic workspace, high-speed WiFi, soundproofed windows, and premium coffee station. Productive days, restful nights.',
    price: 18000, capacity: 2,
    amenities: ['City View','King Bed','Work Desk','High-Speed WiFi','Coffee Station','Smart TV','AC','Soundproof'],
    photos: [
      { thumb: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=400&h=300&fit=crop', full: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=1200' },
      { thumb: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop', full: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200' }
    ], available: true, avgRating: 4.6, reviewCount: 52, createdAt: ts(-45)
  },
  {
    id: 'room-5', name: 'Poolside Bungalow',
    description: 'Step directly from your room into our infinity pool. Private pool access, hammock garden, indoor-outdoor living at its finest.',
    price: 32000, capacity: 3,
    amenities: ['Pool Access','King Bed','Hammock Garden','Outdoor Shower','Mini Bar','Smart TV','AC','Room Service'],
    photos: [
      { thumb: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&h=300&fit=crop', full: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200' },
      { thumb: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop', full: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200' }
    ], available: true, avgRating: 4.9, reviewCount: 83, createdAt: ts(-40)
  },
  {
    id: 'room-6', name: 'Honeymoon Retreat',
    description: 'Canopy bed, champagne on arrival, couples spa access, and private dining alcove. Celebrate love in absolute privacy.',
    price: 55000, capacity: 2,
    amenities: ['Ocean View','Canopy Bed','Champagne Service','Couples Spa','Private Dining','Jacuzzi','Smart TV','AC'],
    photos: [
      { thumb: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop', full: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200' },
      { thumb: 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=400&h=300&fit=crop', full: 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=1200' }
    ], available: true, avgRating: 5.0, reviewCount: 43, createdAt: ts(-35)
  }
];

const meals = [
  { id:'meal-1', name:'Grilled Nyama Choma', description:"Kenya's signature dish — premium goat meat, slow-grilled over open flame with secret spice blend. Served with ugali and kachumbari.", price:1800, category:'dinner', dietary:['halal','gf'], photo:'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600', available:true, createdAt:ts(-30) },
  { id:'meal-2', name:'Swahili Coconut Fish', description:'Fresh catch simmered in rich coconut curry with aromatic spices. Served with coconut rice and mango chutney.', price:2200, category:'dinner', dietary:['gf','df'], photo:'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600', available:true, createdAt:ts(-30) },
  { id:'meal-3', name:'Full English Breakfast', description:'Eggs your way, crispy bacon, sausages, baked beans, grilled tomatoes, mushrooms, hash browns, and toast. Served with Kenyan coffee.', price:1500, category:'breakfast', dietary:[], photo:'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600', available:true, createdAt:ts(-30) },
  { id:'meal-4', name:'Tropical Acai Bowl', description:'Acai blended with mango, passion fruit, and banana. Topped with granola, fresh berries, coconut flakes, and Kenyan honey.', price:1200, category:'breakfast', dietary:['vegan','gf'], photo:'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600', available:true, createdAt:ts(-30) },
  { id:'meal-5', name:'Wagyu Beef Burger', description:'Premium wagyu patty with aged cheddar, caramelized onions, rocket, and truffle aioli on brioche. Served with triple-cooked fries.', price:2500, category:'lunch', dietary:[], photo:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600', available:true, createdAt:ts(-30) },
  { id:'meal-6', name:'Tiramisu Classico', description:'Layers of espresso-soaked ladyfingers, mascarpone cream, and dark cocoa. Made fresh daily by our Italian pastry chef.', price:1100, category:'dessert', dietary:['vegetarian'], photo:'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600', available:true, createdAt:ts(-30) },
  { id:'meal-7', name:'Passion Fruit Mojito', description:'Fresh passion fruit, muddled mint, lime, simple syrup, and soda. Our signature refresher.', price:800, category:'drinks', dietary:['vegan','gf'], photo:'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600', available:true, createdAt:ts(-30) },
  { id:'meal-8', name:'Samosa Platter (4pc)', description:'Crispy pastry filled with spiced minced beef or vegetable medley. Served with tamarind chutney and mint yogurt dip.', price:950, category:'appetizer', dietary:[], photo:'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600', available:true, createdAt:ts(-30) },
  { id:'meal-9', name:'Pilau with Kachumbari', description:'Fragrant spiced rice slow-cooked with tender beef. Served with fresh kachumbari salad and ripe bananas.', price:1600, category:'lunch', dietary:['halal','gf'], photo:'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600', available:true, createdAt:ts(-30) },
  { id:'meal-10', name:'Mango Cheesecake', description:'Creamy New York-style cheesecake with fresh Kenyan mango coulis and a buttery biscuit base.', price:1300, category:'dessert', dietary:['vegetarian'], photo:'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600', available:true, createdAt:ts(-30) },
  { id:'meal-11', name:'Kenyan Chai Latte', description:'Spiced masala tea brewed with fresh ginger, cardamom, and cinnamon. Served with steamed milk.', price:450, category:'drinks', dietary:['vegetarian','gf'], photo:'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600', available:true, createdAt:ts(-30) },
  { id:'meal-12', name:'Avocado Toast Deluxe', description:'Sourdough toast with smashed avocado, poached eggs, cherry tomatoes, feta, and chilli flakes.', price:1350, category:'breakfast', dietary:['vegetarian'], photo:'https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=600', available:true, createdAt:ts(-30) },
];

const reviews = [
  { roomId:'room-1', userName:'Sarah K.', rating:5, comment:'Absolutely breathtaking! The ocean view from the terrace was unforgettable. Butler service was impeccable.', createdAt:ts(-15) },
  { roomId:'room-1', userName:'James O.', rating:5, comment:'Best hotel experience in Kenya. The Presidential Suite is worth every shilling. Will definitely return.', createdAt:ts(-20) },
  { roomId:'room-1', userName:'Amina W.', rating:4, comment:'Stunning room, just wish the jacuzzi was slightly warmer. Otherwise absolutely perfect.', createdAt:ts(-25) },
  { roomId:'room-2', userName:'Tom M.', rating:5, comment:'The garden view is so peaceful. Woke up to birds singing every morning. Pure bliss.', createdAt:ts(-12) },
  { roomId:'room-2', userName:'Linda K.', rating:4, comment:'Lovely room, great location. The balcony is perfect for morning coffee.', createdAt:ts(-18) },
  { roomId:'room-3', userName:'Faith N.', rating:5, comment:'Traveling with three kids is usually chaos, but the Family Suite made it magical. Kids did not want to leave!', createdAt:ts(-8) },
  { roomId:'room-3', userName:'Peter & Mary', rating:5, comment:'Spacious, clean, and the kids play area is fantastic. Staff were incredibly helpful.', createdAt:ts(-22) },
  { roomId:'room-4', userName:'David L.', rating:4, comment:'Perfect for business travel. Fast WiFi, great desk setup, and the coffee station is a lifesaver.', createdAt:ts(-10) },
  { roomId:'room-4', userName:'Michael O.', rating:5, comment:'Stayed for a week on a work trip. The soundproofing is excellent — slept like a baby every night.', createdAt:ts(-30) },
  { roomId:'room-5', userName:'Grace W.', rating:5, comment:'Pool access from the room is genius. The hammock garden was my favorite spot. Absolute paradise.', createdAt:ts(-14) },
  { roomId:'room-5', userName:'Kevin M.', rating:4, comment:'Great bungalow, loved the outdoor shower. Would have liked more privacy from other guests.', createdAt:ts(-28) },
  { roomId:'room-6', userName:'Grace & Peter', rating:5, comment:'Our honeymoon was perfect. Champagne on arrival, rose petals everywhere. Most romantic setting imaginable.', createdAt:ts(-5) },
  { roomId:'room-6', userName:'Wanjiku & Ali', rating:5, comment:'We celebrated our anniversary here. The private dining alcove under the stars was magical. 10/10.', createdAt:ts(-35) },
];

// Bookings — mix of statuses for testing
// NOTE: booking-active has today's date so the Room Portal works
const bookings = [
  {
    id: 'booking-active',
    userId: 'test-user-id',
    userEmail: 'johnmwangi1729@gmail.com',
    userName: 'John Mwangi',
    roomId: 'room-2',
    roomName: 'Deluxe Garden View',
    checkIn: d(0),   // today — active stay for Room Portal testing
    checkOut: d(3),
    guests: 2,
    totalPrice: 75000,
    paymentMethod: 'mpesa',
    paymentStatus: 'paid',
    status: 'approved',
    specialRequests: 'Extra pillows please',
    createdAt: ts(-1),
    updatedAt: ts(-1),
  },
  {
    id: 'booking-pending-1',
    userId: 'guest-user-1',
    userEmail: 'sarah.kamau@email.com',
    userName: 'Sarah Kamau',
    roomId: 'room-1',
    roomName: 'Presidential Ocean Suite',
    checkIn: d(5),
    checkOut: d(8),
    guests: 2,
    totalPrice: 135000,
    paymentMethod: 'card',
    paymentStatus: 'paid',
    status: 'pending',
    specialRequests: 'Champagne on arrival',
    createdAt: ts(-2),
    updatedAt: ts(-2),
  },
  {
    id: 'booking-approved-1',
    userId: 'guest-user-2',
    userEmail: 'james.ochieng@email.com',
    userName: 'James Ochieng',
    roomId: 'room-5',
    roomName: 'Poolside Bungalow',
    checkIn: d(1),
    checkOut: d(4),
    guests: 2,
    totalPrice: 96000,
    paymentMethod: 'mpesa',
    paymentStatus: 'paid',
    status: 'approved',
    specialRequests: '',
    createdAt: ts(-3),
    updatedAt: ts(-1),
  },
  {
    id: 'booking-past-1',
    userId: 'guest-user-3',
    userEmail: 'amina.hassan@email.com',
    userName: 'Amina Hassan',
    roomId: 'room-6',
    roomName: 'Honeymoon Retreat',
    checkIn: d(-10),
    checkOut: d(-7),
    guests: 2,
    totalPrice: 165000,
    paymentMethod: 'pesapal',
    paymentStatus: 'paid',
    status: 'approved',
    specialRequests: 'Rose petals and champagne',
    createdAt: ts(-15),
    updatedAt: ts(-10),
  },
  {
    id: 'booking-past-2',
    userId: 'guest-user-4',
    userEmail: 'david.mwangi@email.com',
    userName: 'David Mwangi',
    roomId: 'room-4',
    roomName: 'Executive Business Room',
    checkIn: d(-20),
    checkOut: d(-18),
    guests: 1,
    totalPrice: 36000,
    paymentMethod: 'card',
    paymentStatus: 'paid',
    status: 'approved',
    specialRequests: 'Early check-in if possible',
    createdAt: ts(-25),
    updatedAt: ts(-20),
  },
  {
    id: 'booking-family-1',
    userId: 'guest-user-5',
    userEmail: 'faith.ndungu@email.com',
    userName: 'Faith Ndungu',
    roomId: 'room-3',
    roomName: 'Safari Family Suite',
    checkIn: d(10),
    checkOut: d(14),
    guests: 5,
    totalPrice: 140000,
    paymentMethod: 'pay-on-arrival',
    paymentStatus: 'pending',
    status: 'pending',
    specialRequests: 'Kids aged 4, 7, and 10. Need extra beds.',
    createdAt: ts(-1),
    updatedAt: ts(-1),
  },
];

// Orders — room service + walk-in + service requests
const orders = [
  {
    userId: 'test-user-id',
    userEmail: 'johnmwangi1729@gmail.com',
    userName: 'John Mwangi',
    bookingId: 'booking-active',
    roomNumber: 'Deluxe Garden View',
    items: [
      { mealId: 'meal-3', name: 'Full English Breakfast', price: 1500, qty: 2 },
      { mealId: 'meal-11', name: 'Kenyan Chai Latte', price: 450, qty: 2 },
    ],
    notes: 'No mushrooms please',
    total: 3900,
    type: 'food',
    status: 'delivered',
    assignedTo: 'Peter Njoroge',
    createdAt: ts(-1),
    updatedAt: ts(-1),
  },
  {
    userId: 'guest-user-2',
    userEmail: 'james.ochieng@email.com',
    userName: 'James Ochieng',
    bookingId: 'booking-approved-1',
    roomNumber: 'Poolside Bungalow',
    items: [
      { mealId: 'meal-5', name: 'Wagyu Beef Burger', price: 2500, qty: 1 },
      { mealId: 'meal-7', name: 'Passion Fruit Mojito', price: 800, qty: 2 },
    ],
    notes: '',
    total: 4100,
    type: 'food',
    status: 'received',
    createdAt: ts(0),
    updatedAt: ts(0),
  },
  {
    userId: 'test-user-id',
    userEmail: 'johnmwangi1729@gmail.com',
    userName: 'John Mwangi',
    bookingId: 'booking-active',
    roomNumber: 'Deluxe Garden View',
    items: [{ name: 'Housekeeping', qty: 1, price: 0 }],
    notes: '[Housekeeping] Please clean the room and replace towels',
    total: 0,
    type: 'service',
    status: 'preparing',
    assignedTo: 'Housekeeping',
    assignNote: 'Fresh towels and turn-down service',
    createdAt: ts(0),
    updatedAt: ts(0),
  },
  {
    userId: 'walkin-1',
    userEmail: 'walkin@azurahaven.com',
    userName: 'Walk-in Guest',
    bookingId: null,
    roomNumber: 'Table 7',
    items: [
      { mealId: 'meal-1', name: 'Grilled Nyama Choma', price: 1800, qty: 2 },
      { mealId: 'meal-8', name: 'Samosa Platter (4pc)', price: 950, qty: 1 },
      { mealId: 'meal-7', name: 'Passion Fruit Mojito', price: 800, qty: 3 },
    ],
    notes: '[MPESA · 0712345678] No onions on the nyama choma',
    total: 7950,
    type: 'walkin',
    paymentMethod: 'mpesa',
    status: 'on-the-way',
    assignedTo: 'Kitchen',
    createdAt: ts(0),
    updatedAt: ts(0),
  },
  {
    userId: 'walkin-2',
    userEmail: 'walkin@azurahaven.com',
    userName: 'Walk-in Guest',
    bookingId: null,
    roomNumber: 'Poolside',
    items: [
      { mealId: 'meal-4', name: 'Tropical Acai Bowl', price: 1200, qty: 2 },
      { mealId: 'meal-11', name: 'Kenyan Chai Latte', price: 450, qty: 2 },
    ],
    notes: '[CASH] Poolside table near the fountain',
    total: 3300,
    type: 'walkin',
    paymentMethod: 'cash',
    status: 'received',
    createdAt: ts(0),
    updatedAt: ts(0),
  },
];

const staff = [
  { name:'Mary Wanjiku',   role:'Head Housekeeper',    department:'Housekeeping', phone:'0712000001', email:'mary@azurahaven.com',   isLeader:true,  status:'active', assignedTasks:3, notes:'15 years experience', createdAt:ts(-90) },
  { name:'John Kamau',     role:'Housekeeper',         department:'Housekeeping', phone:'0712000002', email:'john@azurahaven.com',   isLeader:false, status:'active', assignedTasks:2, notes:'', createdAt:ts(-80) },
  { name:'Beatrice Auma',  role:'Housekeeper',         department:'Housekeeping', phone:'0712000013', email:'bea@azurahaven.com',    isLeader:false, status:'off',    assignedTasks:0, notes:'Day off today', createdAt:ts(-70) },
  { name:'Chef Ali Hassan',role:'Executive Chef',      department:'Kitchen',      phone:'0712000003', email:'ali@azurahaven.com',    isLeader:true,  status:'active', assignedTasks:5, notes:'Specializes in Swahili cuisine', createdAt:ts(-90) },
  { name:'Grace Otieno',   role:'Sous Chef',           department:'Kitchen',      phone:'0712000004', email:'grace@azurahaven.com',  isLeader:false, status:'active', assignedTasks:4, notes:'', createdAt:ts(-75) },
  { name:'Brian Mutua',    role:'Pastry Chef',         department:'Kitchen',      phone:'0712000014', email:'brian@azurahaven.com',  isLeader:false, status:'active', assignedTasks:2, notes:'', createdAt:ts(-60) },
  { name:'Peter Njoroge',  role:'Room Service Lead',   department:'Room Service', phone:'0712000005', email:'peter@azurahaven.com',  isLeader:true,  status:'active', assignedTasks:6, notes:'', createdAt:ts(-85) },
  { name:'Faith Ndungu',   role:'Room Attendant',      department:'Room Service', phone:'0712000006', email:'faith@azurahaven.com',  isLeader:false, status:'active', assignedTasks:3, notes:'', createdAt:ts(-65) },
  { name:'James Ochieng',  role:'Chief Engineer',      department:'Maintenance',  phone:'0712000007', email:'james@azurahaven.com',  isLeader:true,  status:'active', assignedTasks:2, notes:'Handles all electrical and plumbing', createdAt:ts(-90) },
  { name:'Kevin Mwangi',   role:'Maintenance Tech',    department:'Maintenance',  phone:'0712000015', email:'kevin@azurahaven.com',  isLeader:false, status:'active', assignedTasks:1, notes:'', createdAt:ts(-50) },
  { name:'David Mwangi',   role:'Head Concierge',      department:'Concierge',    phone:'0712000008', email:'david@azurahaven.com',  isLeader:true,  status:'active', assignedTasks:1, notes:'Fluent in English, Swahili, French', createdAt:ts(-80) },
  { name:'Amina Hassan',   role:'Security Supervisor', department:'Security',     phone:'0712000009', email:'amina@azurahaven.com',  isLeader:true,  status:'active', assignedTasks:0, notes:'', createdAt:ts(-70) },
  { name:'Tom Mutua',      role:'Security Guard',      department:'Security',     phone:'0712000016', email:'tom@azurahaven.com',    isLeader:false, status:'active', assignedTasks:0, notes:'Night shift', createdAt:ts(-45) },
  { name:'Rose Kimani',    role:'Lead Spa Therapist',  department:'Spa Team',     phone:'0712000010', email:'rose@azurahaven.com',   isLeader:true,  status:'active', assignedTasks:2, notes:'Certified in Swedish and deep tissue massage', createdAt:ts(-80) },
  { name:'Lucy Waweru',    role:'Spa Receptionist',    department:'Spa Team',     phone:'0712000017', email:'lucy@azurahaven.com',   isLeader:false, status:'active', assignedTasks:1, notes:'', createdAt:ts(-40) },
  { name:'Sandra Achieng', role:'Front Desk Manager',  department:'Front Desk',   phone:'0712000011', email:'sandra@azurahaven.com', isLeader:true,  status:'active', assignedTasks:3, notes:'', createdAt:ts(-85) },
  { name:'Mike Kariuki',   role:'Front Desk Agent',    department:'Front Desk',   phone:'0712000018', email:'mike@azurahaven.com',   isLeader:false, status:'active', assignedTasks:2, notes:'', createdAt:ts(-35) },
  { name:'Sarah Kamau',    role:'General Manager',     department:'Management',   phone:'0712000012', email:'sarah@azurahaven.com',  isLeader:true,  status:'active', assignedTasks:0, notes:'Oversees all hotel operations', createdAt:ts(-90) },
];

const housekeeping = [
  { id:'room-1', name:'Presidential Ocean Suite', status:'clean',       assignedName:'Mary Wanjiku',  notes:'Deep cleaned, fresh flowers added', updatedAt:ts(0) },
  { id:'room-2', name:'Deluxe Garden View',        status:'in-progress', assignedName:'John Kamau',    notes:'Guest checked in, turndown service', updatedAt:ts(0) },
  { id:'room-3', name:'Safari Family Suite',       status:'dirty',       assignedName:'',              notes:'Guests checked out this morning', updatedAt:ts(0) },
  { id:'room-4', name:'Executive Business Room',   status:'inspected',   assignedName:'Mary Wanjiku',  notes:'Ready for next guest', updatedAt:ts(-1) },
  { id:'room-5', name:'Poolside Bungalow',         status:'clean',       assignedName:'Beatrice Auma', notes:'', updatedAt:ts(-1) },
  { id:'room-6', name:'Honeymoon Retreat',         status:'dirty',       assignedName:'',              notes:'Honeymoon couple checked out, needs full reset', updatedAt:ts(0) },
];

const packages = [
  {
    id: 'pkg-honeymoon',
    badge: '💑 Most Popular', badgeColor: 'bg-pink-100 text-pink-700',
    title: 'Honeymoon Escape', subtitle: '3 nights · 2 guests',
    description: 'Begin your forever in absolute luxury. Champagne on arrival, couples spa, private candlelit dinner, and daily breakfast in bed.',
    price: 185000, originalPrice: 220000, roomId: 'room-6',
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
    includes: ['3 nights in Honeymoon Retreat','Champagne & roses on arrival','Couples spa (90 min)','Private candlelit dinner','Daily breakfast in bed','Late checkout (2 PM)'],
    tag: 'Romance', active: true, createdAt: ts(-30),
  },
  {
    id: 'pkg-family',
    badge: '👨‍👩‍👧‍👦 Family Favourite', badgeColor: 'bg-blue-100 text-blue-700',
    title: 'Family Adventure', subtitle: '4 nights · up to 6 guests',
    description: 'Create memories that last a lifetime. Safari Family Suite with kids play area, daily activities, family dining, and a guided Nairobi National Park safari.',
    price: 210000, originalPrice: 260000, roomId: 'room-3',
    image: 'https://images.unsplash.com/photo-1598928506311-c55ed91a1066?w=800&q=80',
    includes: ['4 nights in Safari Family Suite','Daily breakfast for all guests','Kids activity programme','Nairobi National Park safari','Family dinner (1 evening)','Airport transfers'],
    tag: 'Family', active: true, createdAt: ts(-28),
  },
  {
    id: 'pkg-business',
    badge: '💼 Business', badgeColor: 'bg-gray-100 text-gray-700',
    title: 'Executive Business Stay', subtitle: '2 nights · 1–2 guests',
    description: 'Stay productive and comfortable. Executive Business Room with high-speed WiFi, meeting room access, airport transfers, and a curated business amenity kit.',
    price: 52000, originalPrice: 65000, roomId: 'room-4',
    image: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800&q=80',
    includes: ['2 nights in Executive Business Room','Daily breakfast','Meeting room (4 hrs/day)','Airport transfers (both ways)','Business amenity kit','Express laundry service'],
    tag: 'Business', active: true, createdAt: ts(-25),
  },
  {
    id: 'pkg-weekend',
    badge: '🌅 Weekend Deal', badgeColor: 'bg-amber-100 text-amber-700',
    title: 'Weekend Getaway', subtitle: '2 nights · 2 guests',
    description: 'Escape the city for a perfect weekend. Poolside Bungalow with direct pool access, sunset cocktails, a spa credit, and a romantic dinner for two.',
    price: 89000, originalPrice: 110000, roomId: 'room-5',
    image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80',
    includes: ['2 nights in Poolside Bungalow','Daily breakfast','Sunset cocktails (1 evening)','KES 5,000 spa credit','Romantic dinner for two','Late checkout (1 PM)'],
    tag: 'Leisure', active: true, createdAt: ts(-20),
  },
  {
    id: 'pkg-spa',
    badge: '🧖 Wellness', badgeColor: 'bg-purple-100 text-purple-700',
    title: 'Spa & Wellness Retreat', subtitle: '3 nights · 1–2 guests',
    description: 'Completely disconnect and recharge. Three nights in our Deluxe Garden View room with daily spa treatments, yoga sessions, and healthy dining.',
    price: 145000, originalPrice: 175000, roomId: 'room-2',
    image: 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800&q=80',
    includes: ['3 nights in Deluxe Garden View','Daily spa treatment (60 min)','Morning yoga sessions','Healthy breakfast & lunch','Meditation workshop','Wellness consultation'],
    tag: 'Wellness', active: true, createdAt: ts(-18),
  },
];

const pricingRules = [
  {
    name: 'Weekend Surcharge',
    type: 'multiplier',
    value: 1.15,
    daysOfWeek: [5, 6], // Fri, Sat
    roomIds: [],
    startDate: null,
    endDate: null,
    active: true,
    createdAt: ts(-30),
  },
  {
    name: 'Long Stay Discount (7+ nights)',
    type: 'multiplier',
    value: 0.85,
    daysOfWeek: [],
    roomIds: [],
    startDate: null,
    endDate: null,
    active: true,
    createdAt: ts(-30),
  },
];

const transfers = [
  {
    userId: 'guest-user-3',
    userEmail: 'amina.hassan@email.com',
    userName: 'Amina Hassan',
    type: 'arrival',
    flightNumber: 'KQ101',
    arrivalDate: d(-10),
    arrivalTime: '14:30',
    passengers: 2,
    luggage: 3,
    vehicleType: 'sedan',
    notes: 'Please have a welcome sign',
    status: 'completed',
    price: 3500,
    createdAt: ts(-12),
  },
  {
    userId: 'guest-user-1',
    userEmail: 'sarah.kamau@email.com',
    userName: 'Sarah Kamau',
    type: 'arrival',
    flightNumber: 'ET308',
    arrivalDate: d(5),
    arrivalTime: '09:15',
    passengers: 2,
    luggage: 4,
    vehicleType: 'suv',
    notes: '',
    status: 'confirmed',
    price: 5000,
    createdAt: ts(-2),
  },
];

const surveys = [
  {
    userId: 'guest-user-3',
    bookingId: 'booking-past-1',
    roomId: 'room-6',
    overallRating: 5,
    cleanlinessRating: 5,
    serviceRating: 5,
    foodRating: 4,
    valueRating: 4,
    comment: 'Absolutely magical honeymoon experience. The staff went above and beyond.',
    recommend: true,
    createdAt: ts(-6),
  },
  {
    userId: 'guest-user-4',
    bookingId: 'booking-past-2',
    roomId: 'room-4',
    overallRating: 4,
    cleanlinessRating: 5,
    serviceRating: 4,
    foodRating: 4,
    valueRating: 3,
    comment: 'Great room for business. WiFi was fast and reliable. Slightly pricey but worth it.',
    recommend: true,
    createdAt: ts(-17),
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

async function seedAll() {
  console.log('\n🌱 Azura Haven — Full Data Seed');
  console.log('================================');
  if (FORCE) console.log('⚠️  --force mode: overwriting existing data\n');
  else console.log('ℹ️  Skipping collections that already have data. Use --force to overwrite.\n');

  // Rooms (with exact IDs)
  console.log('📦 Rooms...');
  const roomSnap = await db.collection('rooms').limit(1).get();
  if (!roomSnap.empty && !FORCE) {
    console.log('  ⏭️  rooms already seeded');
  } else {
    for (const room of rooms) {
      const { id, ...data } = room;
      await db.collection('rooms').doc(id).set(data, { merge: true });
    }
    console.log(`  ✅ ${rooms.length} rooms`);
  }

  // Meals (with exact IDs)
  console.log('🍽️  Meals...');
  const mealSnap = await db.collection('meals').limit(1).get();
  if (!mealSnap.empty && !FORCE) {
    console.log('  ⏭️  meals already seeded');
  } else {
    for (const meal of meals) {
      const { id, ...data } = meal;
      await db.collection('meals').doc(id).set(data, { merge: true });
    }
    console.log(`  ✅ ${meals.length} meals`);
  }

  // Reviews
  console.log('⭐ Reviews...');
  await seedCollection('reviews', reviews);

  // Bookings (with exact IDs — important for Room Portal test)
  console.log('📅 Bookings...');
  const bookingSnap = await db.collection('bookings').limit(1).get();
  if (!bookingSnap.empty && !FORCE) {
    console.log('  ⏭️  bookings already seeded');
  } else {
    for (const booking of bookings) {
      const { id, ...data } = booking;
      await db.collection('bookings').doc(id).set(data, { merge: true });
    }
    console.log(`  ✅ ${bookings.length} bookings`);
  }

  // Orders
  console.log('🛒 Orders...');
  await seedCollection('orders', orders);

  // Staff
  console.log('👥 Staff...');
  await seedCollection('staff', staff);

  // Housekeeping (with room IDs)
  console.log('🧹 Housekeeping...');
  const hkSnap = await db.collection('housekeeping').limit(1).get();
  if (!hkSnap.empty && !FORCE) {
    console.log('  ⏭️  housekeeping already seeded');
  } else {
    for (const room of housekeeping) {
      const { id, ...data } = room;
      await db.collection('housekeeping').doc(id).set(data, { merge: true });
    }
    console.log(`  ✅ ${housekeeping.length} housekeeping records`);
  }

  // Packages (with exact IDs)
  console.log('🎁 Packages...');
  const pkgSnap = await db.collection('packages').limit(1).get();
  if (!pkgSnap.empty && !FORCE) {
    console.log('  ⏭️  packages already seeded');
  } else {
    for (const pkg of packages) {
      const { id, ...data } = pkg;
      await db.collection('packages').doc(id).set(data, { merge: true });
    }
    console.log(`  ✅ ${packages.length} packages`);
  }

  // Pricing rules
  console.log('💰 Pricing rules...');
  await seedCollection('pricingRules', pricingRules);

  // Transfers
  console.log('🚗 Transfers...');
  await seedCollection('transfers', transfers);

  // Surveys
  console.log('📋 Surveys...');
  await seedCollection('surveys', surveys);

  console.log('\n🎉 Seed complete!\n');
  console.log('📊 Summary:');
  console.log(`   🏨 ${rooms.length} rooms (room-1 to room-6)`);
  console.log(`   🍽️  ${meals.length} meals (meal-1 to meal-12)`);
  console.log(`   ⭐ ${reviews.length} reviews`);
  console.log(`   📅 ${bookings.length} bookings (including 1 active today for Room Portal)`);
  console.log(`   🛒 ${orders.length} orders (room service + walk-in + service requests)`);
  console.log(`   👥 ${staff.length} staff members across 9 departments`);
  console.log(`   🧹 ${housekeeping.length} housekeeping records`);
  console.log(`   🎁 ${packages.length} packages`);
  console.log(`   💰 ${pricingRules.length} pricing rules`);
  console.log(`   🚗 ${transfers.length} airport transfers`);
  console.log(`   📋 ${surveys.length} survey responses`);
  console.log('\n⚠️  IMPORTANT: The active booking (booking-active) is linked to');
  console.log('   userId: "test-user-id". To test the Room Portal, you need to');
  console.log('   update that booking\'s userId to match your Firebase Auth UID.');
  console.log('   Run: node scripts/link-booking.js <your-firebase-uid>');
  process.exit(0);
}

seedAll().catch(err => {
  console.error('\n❌ Seed failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
