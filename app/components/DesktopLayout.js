'use client';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import GroceryPanel from './GroceryPanel';

export default function DesktopLayout({ children }) {
  const pathname = usePathname();
  const isMealsScreen = pathname === '/';

  return (
    <div className="desktop-layout">
      <Sidebar />
      <div style={{
        marginLeft: '72px',
        marginRight: isMealsScreen ? '300px' : '0',
        minHeight: '100vh',
        padding: '24px',
        background: 'linear-gradient(to right, rgba(255,255,255,0.42) 0%, rgba(185,118,65,0.22) 100%)',
      }}>
        {children}
      </div>
      {isMealsScreen && <GroceryPanel />}
    </div>
  );
}
