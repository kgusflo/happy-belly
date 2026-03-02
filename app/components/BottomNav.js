'use client';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, ShoppingCart, User } from 'lucide-react';

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
      backgroundColor: 'white', borderTop: '1px solid #e5e7eb',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '8px 0 16px 0', zIndex: 100,
    }}>
      {navItems.map(({ href, icon: Icon, label }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <a key={href} href={href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', gap: '2px' }}>
            <Icon size={20} color={active ? '#D5824A' : '#9AAC9D'} />
            <span style={{ fontSize: '10px', color: active ? '#D5824A' : '#9AAC9D', fontWeight: active ? '600' : '500' }}>{label}</span>
          </a>
        );
      })}
    </nav>
  );
}
