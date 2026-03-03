'use client';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Home from 'lucide-react/dist/esm/icons/home';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import ShoppingCart from 'lucide-react/dist/esm/icons/shopping-cart';
import User from 'lucide-react/dist/esm/icons/user';

const navItems = [
  { href: '/', icon: Home, label: 'Meals' },
  { href: '/recipes', icon: BookOpen, label: 'Recipes' },
  { href: '/grocery', icon: ShoppingCart, label: 'Grocery' },
  { href: '/profiles', icon: User, label: 'Profiles' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [familyNames, setFamilyNames] = useState([]);

  useEffect(() => {
    supabase.from('family_members').select('name').order('created_at').limit(3)
      .then(({ data }) => { if (data) setFamilyNames(data.map(m => m.name)); });
  }, []);

  const avatarInitial = familyNames[0]?.[0]?.toUpperCase() || '?';

  return (
    <div style={{
      position: 'fixed', left: 0, top: 0, bottom: 0, width: '220px',
      background: 'rgba(68, 130, 152, 0.9)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRight: '1px solid rgba(255, 255, 255, 0.18)',
      display: 'flex', flexDirection: 'column',
      padding: '28px 0', zIndex: 100,
    }}>

      {/* App name */}
      <div style={{ padding: '0 20px 28px 20px' }}>
        <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'white', letterSpacing: '0.2px' }}>Happy Belly</p>
        <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: 'rgba(255,255,255,0.55)', fontWeight: '300', letterSpacing: '0.4px' }}>Family meal planning</p>
      </div>

      {/* Nav items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <a
              key={href}
              href={href}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '11px 20px',
                textDecoration: 'none',
                position: 'relative',
                backgroundColor: active ? 'rgba(255,255,255,0.12)' : 'transparent',
              }}
            >
              {active && (
                <div style={{
                  position: 'absolute', left: 0, top: '22%', bottom: '22%',
                  width: '3px', borderRadius: '0 3px 3px 0',
                  backgroundColor: '#D5824A',
                }} />
              )}
              <Icon size={18} color={active ? '#F9D7B5' : 'rgba(255,255,255,0.6)'} />
              <span style={{
                fontSize: '13px',
                fontWeight: active ? '600' : '400',
                color: active ? '#F9D7B5' : 'rgba(255,255,255,0.6)',
                letterSpacing: '0.2px',
              }}>{label}</span>
            </a>
          );
        })}
      </nav>

      {/* Family avatar at bottom */}
      <div style={{ padding: '16px 20px 0', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
        <a href="/profiles" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'rgba(249, 215, 181, 0.3)',
            border: '1.5px solid rgba(255,255,255,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>{avatarInitial}</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: '12px', fontWeight: '500', color: 'rgba(255,255,255,0.88)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {familyNames.length > 0 ? familyNames.join(', ') : 'Add profiles'}
            </p>
            <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.45)', fontWeight: '300' }}>Family</p>
          </div>
        </a>
      </div>

    </div>
  );
}
