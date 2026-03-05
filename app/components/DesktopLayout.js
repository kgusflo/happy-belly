'use client';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import GroceryPanel from './GroceryPanel';

export default function DesktopLayout({ children }) {
  const pathname = usePathname();
  const isMealsScreen = pathname === '/';
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <>
      {/* Only mount Sidebar and GroceryPanel on desktop — no CSS tricks needed */}
      {isDesktop && <Sidebar />}

      <div className={`page-content${isMealsScreen ? ' page-content--meals' : ''}`}>
        {children}
      </div>

      {isDesktop && isMealsScreen && <GroceryPanel />}
    </>
  );
}
