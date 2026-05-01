import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Nav
      home: 'Home', rooms: 'Rooms', dining: 'Dining', offers: 'Offers',
      about: 'About', contact: 'Contact', signIn: 'Sign In', signOut: 'Sign Out',
      myAccount: 'My Account', roomService: 'Room Service',

      // Home
      welcomeToParadise: 'Welcome to Paradise',
      experienceLuxury: 'Experience Luxury Like Never Before',
      heroSubtitle: 'Nestled in the heart of Kenya, Azura Haven offers world-class hospitality, exquisite dining, and unforgettable experiences.',
      exploreRooms: 'Explore Rooms',
      viewDining: 'View Dining',
      roomsAndSuites: 'Rooms & Suites',
      diningOptions: 'Dining Options',
      guestRating: 'Guest Rating',
      yearsOfService: 'Years of Service',
      ourPremiumRooms: 'Our Premium Rooms',
      accommodations: 'Accommodations',
      viewAllRooms: 'View All Rooms',
      exquisiteDining: 'Exquisite Dining',
      culinary: 'Culinary',
      fullMenu: 'Full Menu',
      bookYourStay: 'Book Your Stay',

      // Rooms
      searchRooms: 'Search by name, description or amenity...',
      priceKES: 'Price (KES)',
      guests: 'Guests',
      anyGuests: 'Any',
      clearFilters: 'Clear filters',
      roomsFound: '{{count}} room found',
      roomsFound_plural: '{{count}} rooms found',
      filtered: '(filtered)',
      viewDetails: 'View Details',
      perNight: '/night',
      available: 'Available',
      unavailable: 'Unavailable',
      amenities: 'Amenities',
      capacity: 'Capacity',

      // Room Detail
      aboutThisRoom: 'About This Room',
      guestReviews: 'Guest Reviews',
      gallery: 'Gallery',
      bookThisRoom: 'Book This Room',
      signInToBook: 'Sign In to Book',
      similarRooms: 'Similar Rooms',
      leaveReview: 'Leave a Review',
      yourRating: 'Your Rating',
      yourReview: 'Your Review',
      submitReview: 'Submit Review',

      // Booking
      bookYourStayTitle: 'Book Your Stay',
      checkIn: 'Check-in Date',
      checkOut: 'Check-out Date',
      specialRequests: 'Special Requests',
      continueToPayment: 'Continue to Payment →',
      payment: 'Payment',
      confirmed: 'Confirmed',
      totalDue: 'Total Due',
      paymentMethod: 'Select Payment Method',
      confirmBooking: 'Confirm Booking',
      bookingConfirmed: 'Booking Confirmed!',

      // Profile
      myBookings: 'My Bookings',
      settings: 'Settings',
      upcoming: 'Upcoming',
      pastStays: 'Past Stays',
      invoice: 'Invoice',
      cancel: 'Cancel',
      loyaltyPoints: 'Loyalty Points',

      // Meals
      culinaryExcellence: 'Culinary Excellence',
      searchDishes: 'Search dishes...',
      currentlyUnavailable: 'Currently unavailable',

      // Common
      loading: 'Loading...',
      error: 'Something went wrong',
      save: 'Save',
      edit: 'Edit',
      delete: 'Delete',
      back: 'Back',
      next: 'Next',
      close: 'Close',
      all: 'All',
      night: 'night',
      nights: 'nights',
      guest: 'guest',
      total: 'Total',
    }
  },
  sw: {
    translation: {
      // Nav
      home: 'Nyumbani', rooms: 'Vyumba', dining: 'Chakula', offers: 'Ofa',
      about: 'Kuhusu', contact: 'Wasiliana', signIn: 'Ingia', signOut: 'Toka',
      myAccount: 'Akaunti Yangu', roomService: 'Huduma ya Chumba',

      // Home
      welcomeToParadise: 'Karibu Peponi',
      experienceLuxury: 'Pata Uzoefu wa Anasa Usio na Kifani',
      heroSubtitle: 'Ikiwa katikati ya Kenya, Azura Haven inatoa ukarimu wa daraja la kwanza, chakula bora, na uzoefu usiosahaulika.',
      exploreRooms: 'Chunguza Vyumba',
      viewDining: 'Tazama Chakula',
      roomsAndSuites: 'Vyumba na Suite',
      diningOptions: 'Chaguo za Chakula',
      guestRating: 'Ukadiriaji wa Wageni',
      yearsOfService: 'Miaka ya Huduma',
      ourPremiumRooms: 'Vyumba Vyetu Bora',
      accommodations: 'Malazi',
      viewAllRooms: 'Tazama Vyumba Vyote',
      exquisiteDining: 'Chakula Bora',
      culinary: 'Upishi',
      fullMenu: 'Menyu Kamili',
      bookYourStay: 'Hifadhi Kukaa Kwako',

      // Rooms
      searchRooms: 'Tafuta kwa jina, maelezo au huduma...',
      priceKES: 'Bei (KES)',
      guests: 'Wageni',
      anyGuests: 'Yoyote',
      clearFilters: 'Futa vichujio',
      roomsFound: 'Chumba {{count}} kimepatikana',
      roomsFound_plural: 'Vyumba {{count}} vimepatikana',
      filtered: '(kimechujwa)',
      viewDetails: 'Tazama Maelezo',
      perNight: '/usiku',
      available: 'Inapatikana',
      unavailable: 'Haipatikani',
      amenities: 'Huduma',
      capacity: 'Uwezo',

      // Room Detail
      aboutThisRoom: 'Kuhusu Chumba Hiki',
      guestReviews: 'Maoni ya Wageni',
      gallery: 'Picha',
      bookThisRoom: 'Hifadhi Chumba Hiki',
      signInToBook: 'Ingia ili Kuhifadhi',
      similarRooms: 'Vyumba Vinavyofanana',
      leaveReview: 'Acha Maoni',
      yourRating: 'Ukadiriaji Wako',
      yourReview: 'Maoni Yako',
      submitReview: 'Wasilisha Maoni',

      // Booking
      bookYourStayTitle: 'Hifadhi Kukaa Kwako',
      checkIn: 'Tarehe ya Kuwasili',
      checkOut: 'Tarehe ya Kuondoka',
      specialRequests: 'Maombi Maalum',
      continueToPayment: 'Endelea na Malipo →',
      payment: 'Malipo',
      confirmed: 'Imethibitishwa',
      totalDue: 'Jumla ya Kulipa',
      paymentMethod: 'Chagua Njia ya Malipo',
      confirmBooking: 'Thibitisha Uhifadhi',
      bookingConfirmed: 'Uhifadhi Umethibitishwa!',

      // Profile
      myBookings: 'Uhifadhi Wangu',
      settings: 'Mipangilio',
      upcoming: 'Inayokuja',
      pastStays: 'Kukaa Zilizopita',
      invoice: 'Ankara',
      cancel: 'Ghairi',
      loyaltyPoints: 'Pointi za Uaminifu',

      // Meals
      culinaryExcellence: 'Ubora wa Upishi',
      searchDishes: 'Tafuta vyakula...',
      currentlyUnavailable: 'Haipatikani sasa hivi',

      // Common
      loading: 'Inapakia...',
      error: 'Hitilafu imetokea',
      save: 'Hifadhi',
      edit: 'Hariri',
      delete: 'Futa',
      back: 'Rudi',
      next: 'Mbele',
      close: 'Funga',
      all: 'Zote',
      night: 'usiku',
      nights: 'usiku',
      guest: 'mgeni',
      total: 'Jumla',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;
