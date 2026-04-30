// Mock data with Unsplash images for beautiful visuals
// Displayed when backend is unavailable or Firestore is empty

export const mockRooms = [
  {
    id: 'room-1', name: 'Presidential Ocean Suite',
    description: 'Floor-to-ceiling windows with panoramic ocean views, private terrace, separate living area, marble bathroom with soaking tub, and 24/7 butler service. The epitome of refined elegance.',
    price: 45000, capacity: 4,
    amenities: ['Ocean View','King Bed','Private Terrace','Butler Service','Jacuzzi','Mini Bar','Smart TV','AC','Room Service','Walk-in Closet'],
    photos: [
      { thumb: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&h=300&fit=crop', full: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200' },
      { thumb: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&h=300&fit=crop', full: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200' },
      { thumb: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400&h=300&fit=crop', full: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1200' }
    ], available: true, avgRating: 4.9, reviewCount: 128, createdAt: new Date().toISOString()
  },
  {
    id: 'room-2', name: 'Deluxe Garden View',
    description: 'Wake up to lush tropical gardens from your private balcony. Spacious room with handcrafted furniture, premium linens, and a spa-inspired bathroom. Perfect for couples.',
    price: 25000, capacity: 2,
    amenities: ['Garden View','Queen Bed','Balcony','Rain Shower','Mini Bar','Smart TV','AC','Room Service','Work Desk'],
    photos: [
      { thumb: 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=400&h=300&fit=crop', full: 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=1200' },
      { thumb: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop', full: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200' }
    ], available: true, avgRating: 4.7, reviewCount: 94, createdAt: new Date().toISOString()
  },
  {
    id: 'room-3', name: 'Safari Family Suite',
    description: 'Two bedrooms, a play area, and stunning savannah views. African-inspired decor meets modern comfort. Kids welcome package included.',
    price: 35000, capacity: 6,
    amenities: ['Savannah View','2 Bedrooms','Kids Area','Full Kitchen','Laundry','Smart TV','AC','Room Service','Board Games'],
    photos: [
      { thumb: 'https://images.unsplash.com/photo-1598928506311-c55ed91a1066?w=400&h=300&fit=crop', full: 'https://images.unsplash.com/photo-1598928506311-c55ed91a1066?w=1200' },
      { thumb: 'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=400&h=300&fit=crop', full: 'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=1200' }
    ], available: true, avgRating: 4.8, reviewCount: 67, createdAt: new Date().toISOString()
  },
  {
    id: 'room-4', name: 'Executive Business Room',
    description: 'Ergonomic workspace, high-speed WiFi, soundproofed windows, and premium coffee station. Productive days, restful nights.',
    price: 18000, capacity: 2,
    amenities: ['City View','King Bed','Work Desk','High-Speed WiFi','Coffee Station','Smart TV','AC','Soundproof'],
    photos: [
      { thumb: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=400&h=300&fit=crop', full: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=1200' },
      { thumb: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop', full: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200' }
    ], available: true, avgRating: 4.6, reviewCount: 52, createdAt: new Date().toISOString()
  },
  {
    id: 'room-5', name: 'Poolside Bungalow',
    description: 'Step directly from your room into our infinity pool. Private pool access, hammock garden, indoor-outdoor living at its finest.',
    price: 32000, capacity: 3,
    amenities: ['Pool Access','King Bed','Hammock Garden','Outdoor Shower','Mini Bar','Smart TV','AC','Room Service'],
    photos: [
      { thumb: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&h=300&fit=crop', full: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200' },
      { thumb: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop', full: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200' }
    ], available: true, avgRating: 4.9, reviewCount: 83, createdAt: new Date().toISOString()
  },
  {
    id: 'room-6', name: 'Honeymoon Retreat',
    description: 'Canopy bed, champagne on arrival, couples spa access, and private dining alcove. Celebrate love in absolute privacy.',
    price: 55000, capacity: 2,
    amenities: ['Ocean View','Canopy Bed','Champagne Service','Couples Spa','Private Dining','Jacuzzi','Smart TV','AC'],
    photos: [
      { thumb: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop', full: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200' },
      { thumb: 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=400&h=300&fit=crop', full: 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=1200' }
    ], available: true, avgRating: 5.0, reviewCount: 43, createdAt: new Date().toISOString()
  }
];

export const mockMeals = [
  { id:'meal-1',name:'Grilled Nyama Choma',description:"Kenya's signature dish — premium goat meat, slow-grilled over open flame with secret spice blend. Served with ugali and kachumbari.",price:1800,category:'dinner',dietary:['halal','gf'],photo:'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600',available:true },
  { id:'meal-2',name:'Swahili Coconut Fish',description:'Fresh catch simmered in rich coconut curry with aromatic spices. Served with coconut rice and mango chutney.',price:2200,category:'dinner',dietary:['gf','df'],photo:'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600',available:true },
  { id:'meal-3',name:'Full English Breakfast',description:'Eggs your way, crispy bacon, sausages, baked beans, grilled tomatoes, mushrooms, hash browns, and toast. Served with Kenyan coffee.',price:1500,category:'breakfast',dietary:[],photo:'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600',available:true },
  { id:'meal-4',name:'Tropical Acai Bowl',description:'Acai blended with mango, passion fruit, and banana. Topped with granola, fresh berries, coconut flakes, and Kenyan honey.',price:1200,category:'breakfast',dietary:['vegan','gf'],photo:'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600',available:true },
  { id:'meal-5',name:'Wagyu Beef Burger',description:'Premium wagyu patty with aged cheddar, caramelized onions, rocket, and truffle aioli on brioche. Served with triple-cooked fries.',price:2500,category:'lunch',dietary:[],photo:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600',available:true },
  { id:'meal-6',name:'Tiramisu Classico',description:'Layers of espresso-soaked ladyfingers, mascarpone cream, and dark cocoa. Made fresh daily by our Italian pastry chef.',price:1100,category:'dessert',dietary:['vegetarian'],photo:'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600',available:true },
  { id:'meal-7',name:'Passion Fruit Mojito',description:'Fresh passion fruit, muddled mint, lime, simple syrup, and soda. Our signature refresher.',price:800,category:'drinks',dietary:['vegan','gf'],photo:'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600',available:true },
  { id:'meal-8',name:'Samosa Platter (4pc)',description:'Crispy pastry filled with spiced minced beef or vegetable medley. Served with tamarind chutney and mint yogurt dip.',price:950,category:'appetizer',dietary:[],photo:'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600',available:true },
  { id:'meal-9',name:'Pilau with Kachumbari',description:'Fragrant spiced rice slow-cooked with tender beef. Served with fresh kachumbari salad and ripe bananas.',price:1600,category:'lunch',dietary:['halal','gf'],photo:'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600',available:true },
];

export const mockReviews = [
  { id:'rev-1',roomId:'room-1',userName:'Sarah K.',rating:5,comment:'Absolutely breathtaking! The ocean view from the terrace was unforgettable. Butler service was impeccable.',createdAt:'2026-04-15' },
  { id:'rev-2',roomId:'room-1',userName:'James O.',rating:5,comment:'Best hotel experience in Kenya. The Presidential Suite is worth every shilling.',createdAt:'2026-04-10' },
  { id:'rev-3',roomId:'room-1',userName:'Amina W.',rating:4,comment:'Stunning room, just wish the jacuzzi was slightly warmer. Otherwise perfect.',createdAt:'2026-04-05' },
  { id:'rev-4',roomId:'room-2',userName:'Tom M.',rating:5,comment:'The garden view is so peaceful. Woke up to birds singing every morning. Pure bliss.',createdAt:'2026-04-12' },
  { id:'rev-5',roomId:'room-3',userName:'Faith N.',rating:5,comment:'Traveling with three kids is usually chaos, but the Family Suite made it magical. Kids did not want to leave!',createdAt:'2026-04-08' },
  { id:'rev-6',roomId:'room-5',userName:'David L.',rating:4,comment:'Pool access from the room is genius. The hammock garden was my favorite spot.',createdAt:'2026-04-14' },
  { id:'rev-7',roomId:'room-6',userName:'Grace & Peter',rating:5,comment:'Our honeymoon was perfect. Champagne on arrival, rose petals everywhere. Most romantic setting imaginable.',createdAt:'2026-04-01' },
];
