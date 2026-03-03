'use client';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Utensils from 'lucide-react/dist/esm/icons/utensils';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import User from 'lucide-react/dist/esm/icons/user';

// Desktop sidebar: Meals · Recipes · Profiles  (no Grocery — handled by right panel on Meals screen)
const navItems = [
  { href: '/', icon: Utensils, label: 'Meals' },
  { href: '/recipes', icon: BookOpen, label: 'Recipes' },
  { href: '/profiles', icon: User, label: 'Profiles' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [avatarInitial, setAvatarInitial] = useState('?');

  useEffect(() => {
    supabase.from('family_members').select('name').order('created_at').limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setAvatarInitial(data[0].name[0].toUpperCase());
      });
  }, []);

  return (
    <div style={{
      position: 'fixed', left: 0, top: 0, bottom: 0, width: '72px',
      background: 'rgba(205,155,85,0.35)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderRight: '1px solid rgba(255,255,255,0.45)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '20px 0',
      zIndex: 100,
    }}>

      {/* App icon */}
      <div style={{
        width: '40px', height: '40px', borderRadius: '14px',
        background: 'linear-gradient(140deg, #E8924A 0%, #C86F32 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '28px', flexShrink: 0,
        boxShadow: '0 4px 14px rgba(213,130,74,0.4)',
      }}>
        <span style={{ fontSize: '19px', lineHeight: 1 }}>🍽️</span>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, alignItems: 'center', width: '100%' }}>
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <a
              key={href}
              href={href}
              title={label}
              style={{
                width: '48px', height: '48px', borderRadius: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                textDecoration: 'none', position: 'relative',
                backgroundColor: active ? 'rgba(213,130,74,0.13)' : 'transparent',
                transition: 'background-color 0.15s',
              }}
            >
              {active && (
                <div style={{
                  position: 'absolute', left: -12, top: '22%', bottom: '22%',
                  width: '3px', borderRadius: '0 3px 3px 0',
                  backgroundColor: '#D5824A',
                }} />
              )}
              <Icon
                size={20}
                color={active ? '#D5824A' : 'rgba(0,0,0,0.32)'}
                strokeWidth={active ? 2.2 : 1.8}
              />
            </a>
          );
        })}
      </nav>

      {/* Family avatar */}
      <a href="/profiles" style={{ textDecoration: 'none', flexShrink: 0 }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: 'rgba(213,130,74,0.16)',
          border: '1.5px solid rgba(213,130,74,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#D5824A', fontFamily: 'Montserrat, sans-serif' }}>
            {avatarInitial}
          </span>
        </div>
      </a>

    </div>
  );
}
