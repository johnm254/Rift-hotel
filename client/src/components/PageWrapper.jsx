import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function PageWrapper({ children }) {
  const { pathname } = useLocation();
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.classList.remove('page-enter');
      void ref.current.offsetWidth; // reflow
      ref.current.classList.add('page-enter');
    }
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return <div ref={ref}>{children}</div>;
}
