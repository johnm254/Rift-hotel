import { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wishlist') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const toggle = (room) => {
    setWishlist(prev =>
      prev.find(r => r.id === room.id)
        ? prev.filter(r => r.id !== room.id)
        : [...prev, { id: room.id, name: room.name, price: room.price, photo: room.photos?.[0] }]
    );
  };

  const isWishlisted = (id) => wishlist.some(r => r.id === id);

  return (
    <WishlistContext.Provider value={{ wishlist, toggle, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
