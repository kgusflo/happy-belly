'use client';
import { usePathname } from 'next/navigation';
import Home from 'lucide-react/dist/esm/icons/home';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import ShoppingCart from 'lucide-react/dist/esm/icons/shopping-cart';
import User from 'lucide-react/dist/esm/icons/user';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: Home, label: 'Meals' },
    { href: '/grocery', icon: ShoppingCart, label: 'Grocery' },
    { href: '/recipes', icon: BookOpen, label: 'Recipes' },
    { href: '/profiles', icon: User, label: 'Profiles' },
  ];

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(90,160,180,0.18)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.35)',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '8px 0 16px 0', zIndex: 100,
    }}>
      {navItems.map(({ href, icon: Icon, label }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <a key={href} href={href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', gap: '2px', position: 'relative' }}>
            {active && (
              <div style={{
                position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
                width: '20px', height: '3px', borderRadius: '0 0 3px 3px',
                backgroundColor: '#D5824A',
              }} />
            )}
            <Icon size={20} color={active ? '#D5824A' : 'rgba(80,50,20,0.6)'} strokeWidth={active ? 2.2 : 1.8} />
            <span style={{
              fontSize: '8px', fontWeight: '700',
              color: active ? '#D5824A' : 'rgba(80,50,20,0.6)',
              letterSpacing: '0.6px', textTransform: 'uppercase',
              fontFamily: 'Montserrat, sans-serif', lineHeight: 1,
            }}>{label}</span>
          </a>
        );
      })}
    </nav>
  );
}
