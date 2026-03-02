'use client';
import { usePathname } from 'next/navigation';
import Home from 'lucide-react/dist/esm/icons/home';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import User from 'lucide-react/dist/esm/icons/user';

const navItems = [
  { href: '/', icon: Home, label: 'Meals' },
  { href: '/recipes', icon: BookOpen, label: 'Recipes' },
  { href: '/profiles', icon: User, label: 'Profiles' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div style={{
      position: 'fixed', left: 0, top: 0, bottom: 0, width: '60px',
      backgroundColor: 'white', borderRight: '1px solid #e5e7eb',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '24px 0', gap: '8px', zIndex: 100,
    }}>
      <div style={{ marginBottom: '24px' }}>
        <span style={{ fontSize: '22px' }}>🥗</span>
      </div>
      {navItems.map(({ href, icon: Icon, label }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <a key={href} href={href} className="nav-item" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '44px', height: '44px', borderRadius: '12px',
            textDecoration: 'none',
            backgroundColor: active ? '#F9D7B5' : 'transparent',
          }}>
            <Icon size={20} color={active ? '#D5824A' : '#9AAC9D'} />
            <span className="nav-tooltip">{label}</span>
          </a>
        );
      })}
    </div>
  );
}
