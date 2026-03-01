'use client';

import { Home, BookOpen, ShoppingCart, Settings } from 'lucide-react';

export default function BottomNav() {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'white',
      borderTop: '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '8px 0 16px 0',
      zIndex: 100,
    }}>
      <a href="/" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', gap: '2px' }}>
        <Home size={20} color="#9AAC9D" />
        <span style={{ fontSize: '10px', color: '#9AAC9D', fontWeight: '500' }}>Meals</span>
      </a>
      <a href="/recipes" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', gap: '2px' }}>
        <BookOpen size={20} color="#9AAC9D" />
        <span style={{ fontSize: '10px', color: '#9AAC9D', fontWeight: '500' }}>Recipes</span>
      </a>
      <a href="/grocery" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', gap: '2px' }}>
        <ShoppingCart size={20} color="#9AAC9D" />
        <span style={{ fontSize: '10px', color: '#9AAC9D', fontWeight: '500' }}>Grocery</span>
      </a>
      <a href="/settings" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', gap: '2px' }}>
        <Settings size={20} color="#9AAC9D" />
        <span style={{ fontSize: '10px', color: '#9AAC9D', fontWeight: '500' }}>Settings</span>
      </a>
    </nav>
  );
}
