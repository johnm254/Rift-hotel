const express = require('express');
const router = express.Router();
const { db, auth } = require('../config/firebase');
const { authenticate, isAdmin } = require('../middleware/auth');

// GET /api/admin/dashboard
router.get('/dashboard', authenticate, isAdmin, async (req, res) => {
  try {
    const [roomsSnap, mealsSnap, bookingsSnap, usersSnap] = await Promise.all([
      db.collection('rooms').get(),
      db.collection('meals').get(),
      db.collection('bookings').get(),
      db.collection('users').get(),
    ]);
    const bookings = bookingsSnap.docs.map(d => d.data());
    const totalRevenue = bookings
      .filter(b => b.status !== 'rejected')
      .reduce((s, b) => s + (b.totalPrice || 0), 0);
    res.json({
      rooms: roomsSnap.size,
      meals: mealsSnap.size,
      bookings: bookingsSnap.size,
      users: usersSnap.size,
      totalRevenue,
      pendingBookings: bookings.filter(b => b.status === 'pending').length,
      approvedBookings: bookings.filter(b => b.status === 'approved').length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users
router.get('/users', authenticate, isAdmin, async (req, res) => {
  try {
    const usersSnap = await db.collection('users').get();
    const bookingsSnap = await db.collection('bookings').get();
    const bookings = bookingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const users = usersSnap.docs.map(doc => {
      const data = doc.data();
      const userBookings = bookings.filter(b => b.userId === doc.id);
      const totalSpent = userBookings
        .filter(b => b.status !== 'rejected')
        .reduce((s, b) => s + (b.totalPrice || 0), 0);
      return {
        uid: doc.id,
        ...data,
        bookingCount: userBookings.length,
        totalSpent,
      };
    });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/seed — seed mock data into Firestore
router.post('/seed', authenticate, isAdmin, async (req, res) => {
  try {
    const mockRooms = [
      { name: 'Presidential Ocean Suite', description: 'Floor-to-ceiling windows with panoramic ocean views, private terrace, separate living area, marble bathroom with soaking tub, and 24/7 butler service.', price: 45000, capacity: 4, amenities: ['Ocean View','King Bed','Private Terrace','Butler Service','Jacuzzi','Mini Bar','Smart TV','AC','Room Service','Walk-in Closet'], photos: [{ thumb: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&h=300&fit=crop', full: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200' }], available: true, avgRating: 4.9, reviewCount: 128, createdAt: new Date().toISOString() },
      { name: 'Deluxe Garden View', description: 'Wake up to lush tropical gardens from your private balcony. Spacious room with handcrafted furniture, premium linens, and a spa-inspired bathroom.', price: 25000, capacity: 2, amenities: ['Garden View','Queen Bed','Balcony','Rain Shower','Mini Bar','Smart TV','AC','Room Service','Work Desk'], photos: [{ thumb: 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=400&h=300&fit=crop', full: 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=1200' }], available: true, avgRating: 4.7, reviewCount: 94, createdAt: new Date().toISOString() },
      { name: 'Safari Family Suite', description: 'Two bedrooms, a play area, and stunning savannah views. African-inspired decor meets modern comfort. Kids welcome package included.', price: 35000, capacity: 6, amenities: ['Savannah View','2 Bedrooms','Kids Area','Full Kitchen','Laundry','Smart TV','AC','Room Service','Board Games'], photos: [{ thumb: 'https://images.unsplash.com/photo-1598928506311-c55ed91a1066?w=400&h=300&fit=crop', full: 'https://images.unsplash.com/photo-1598928506311-c55ed91a1066?w=1200' }], available: true, avgRating: 4.8, reviewCount: 67, createdAt: new Date().toISOString() },
      { name: 'Executive Business Room', description: 'Ergonomic workspace, high-speed WiFi, soundproofed windows, and premium coffee station. Productive days, restful nights.', price: 18000, capacity: 2, amenities: ['City View','King Bed','Work Desk','High-Speed WiFi','Coffee Station','Smart TV','AC','Soundproof'], photos: [{ thumb: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=400&h=300&fit=crop', full: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=1200' }], available: true, avgRating: 4.6, reviewCount: 52, createdAt: new Date().toISOString() },
      { name: 'Poolside Bungalow', description: 'Step directly from your room into our infinity pool. Private pool access, hammock garden, indoor-outdoor living at its finest.', price: 32000, capacity: 3, amenities: ['Pool Access','King Bed','Hammock Garden','Outdoor Shower','Mini Bar','Smart TV','AC','Room Service'], photos: [{ thumb: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&h=300&fit=crop', full: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200' }], available: true, avgRating: 4.9, reviewCount: 83, createdAt: new Date().toISOString() },
      { name: 'Honeymoon Retreat', description: 'Canopy bed, champagne on arrival, couples spa access, and private dining alcove. Celebrate love in absolute privacy.', price: 55000, capacity: 2, amenities: ['Ocean View','Canopy Bed','Champagne Service','Couples Spa','Private Dining','Jacuzzi','Smart TV','AC'], photos: [{ thumb: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop', full: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200' }], available: true, avgRating: 5.0, reviewCount: 43, createdAt: new Date().toISOString() },
    ];

    const mockMeals = [
      { name: 'Grilled Nyama Choma', description: "Kenya's signature dish — premium goat meat, slow-grilled over open flame.", price: 1800, category: 'dinner', dietary: ['halal','gf'], photo: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600', available: true, createdAt: new Date().toISOString() },
      { name: 'Swahili Coconut Fish', description: 'Fresh catch simmered in rich coconut curry with aromatic spices.', price: 2200, category: 'dinner', dietary: ['gf','df'], photo: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600', available: true, createdAt: new Date().toISOString() },
      { name: 'Full English Breakfast', description: 'Eggs your way, crispy bacon, sausages, baked beans, grilled tomatoes, and toast.', price: 1500, category: 'breakfast', dietary: [], photo: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600', available: true, createdAt: new Date().toISOString() },
      { name: 'Tropical Acai Bowl', description: 'Acai blended with mango, passion fruit, and banana. Topped with granola and Kenyan honey.', price: 1200, category: 'breakfast', dietary: ['vegan','gf'], photo: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600', available: true, createdAt: new Date().toISOString() },
      { name: 'Wagyu Beef Burger', description: 'Premium wagyu patty with aged cheddar, caramelized onions, and truffle aioli on brioche.', price: 2500, category: 'lunch', dietary: [], photo: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600', available: true, createdAt: new Date().toISOString() },
      { name: 'Tiramisu Classico', description: 'Layers of espresso-soaked ladyfingers and mascarpone cream. Made fresh daily.', price: 1100, category: 'dessert', dietary: ['vegetarian'], photo: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600', available: true, createdAt: new Date().toISOString() },
      { name: 'Passion Fruit Mojito', description: 'Fresh passion fruit, muddled mint, lime, simple syrup, and soda.', price: 800, category: 'drinks', dietary: ['vegan','gf'], photo: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600', available: true, createdAt: new Date().toISOString() },
      { name: 'Samosa Platter (4pc)', description: 'Crispy pastry filled with spiced minced beef. Served with tamarind chutney.', price: 950, category: 'appetizer', dietary: [], photo: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600', available: true, createdAt: new Date().toISOString() },
      { name: 'Pilau with Kachumbari', description: 'Fragrant spiced rice slow-cooked with tender beef. Served with fresh kachumbari salad.', price: 1600, category: 'lunch', dietary: ['halal','gf'], photo: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600', available: true, createdAt: new Date().toISOString() },
    ];

    // Check existing counts
    const [existingRooms, existingMeals] = await Promise.all([
      db.collection('rooms').get(),
      db.collection('meals').get(),
    ]);

    const results = { rooms: 0, meals: 0, skipped: [] };

    if (existingRooms.size > 0) {
      results.skipped.push(`rooms (${existingRooms.size} already exist)`);
    } else {
      const batch = db.batch();
      mockRooms.forEach(room => {
        const ref = db.collection('rooms').doc();
        batch.set(ref, room);
      });
      await batch.commit();
      results.rooms = mockRooms.length;
    }

    if (existingMeals.size > 0) {
      results.skipped.push(`meals (${existingMeals.size} already exist)`);
    } else {
      const batch = db.batch();
      mockMeals.forEach(meal => {
        const ref = db.collection('meals').doc();
        batch.set(ref, meal);
      });
      await batch.commit();
      results.meals = mockMeals.length;
    }

    res.json({
      message: 'Seed complete',
      added: `${results.rooms} rooms, ${results.meals} meals`,
      skipped: results.skipped,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
