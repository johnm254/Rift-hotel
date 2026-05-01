import { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

const PropertyContext = createContext(null);

// Default single property — used when multi-property is not configured
const DEFAULT_PROPERTY = {
  id: 'default',
  name: 'Azura Haven',
  location: 'Westlands, Nairobi',
  description: 'Kenya\'s premier luxury hotel',
  phone: '+254 700 000 000',
  email: 'reservations@azurahaven.com',
};

export function PropertyProvider({ children }) {
  const [currentPropertyId, setCurrentPropertyId] = useState(() => {
    try { return localStorage.getItem('propertyId') || 'default'; } catch { return 'default'; }
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: () => api.get('/properties').then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : (d.properties || []);
    }).catch(() => []),
    staleTime: 1000 * 60 * 10, // cache 10 min
  });

  const currentProperty = properties.find(p => p.id === currentPropertyId) || DEFAULT_PROPERTY;
  const hasMultiple = properties.length > 1;

  const switchProperty = (id) => {
    setCurrentPropertyId(id);
    localStorage.setItem('propertyId', id);
  };

  return (
    <PropertyContext.Provider value={{ properties, currentProperty, currentPropertyId, switchProperty, hasMultiple }}>
      {children}
    </PropertyContext.Provider>
  );
}

export const useProperty = () => useContext(PropertyContext);
