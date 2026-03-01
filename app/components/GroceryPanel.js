'use client';

import { useState, useEffect } from 'react';

export default function GroceryPanel() {
  const [groceryItems, setGroceryItems] = useState([]);

  useEffect(() => {
    const load = () => {
      const saved = localStorage.getItem('groceryItems');
      if (saved) setGroceryItems(JSON.parse(saved));
      else setGroceryItems([]);
    };
    load();
    window.addEventListener('storage', load);
    const interval = setInterval(load, 2000);
    return () => {
      window.removeEventListener('storage', load);
      clearInterval(interval);
    };
  }, []);

  const saveItems = (items) => {
    setGroceryItems(items);
    localStorage.setItem('groceryItems', JSON.stringify(items));
  };

  const grouped = groceryItems.reduce((groups, item) => {
    const cat = item.category || 'Other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
    return groups;
  }, {});

  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: 0,
      bottom: 0,
      width: '300px',
      backgroundColor: '#5AA0B4',
      borderLeft: '1px solid #88B0B4',
      padding: '20px 16px',
      overflowY: 'auto',
    }}>
      <p style={{ fontSize: '15px', fontWeight: '600', color: 'white', margin: '0 0 16px 0' }}>🛒 Grocery List</p>

      {groceryItems.length === 0 ? (
        <p style={{ fontSize: '12px', color: '#C7D1C9', fontWeight: '300', textAlign: 'center', marginTop: '40px' }}>
          Generate a meal plan to populate your grocery list!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <p style={{ fontSize: '10px', fontWeight: '600', color: '#C7D1C9', letterSpacing: '0.5px', margin: '0 0 8px 0' }}>
                {category.toUpperCase()}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {items.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => saveItems(groceryItems.map(i =>
                        i.id === item.id ? { ...i, checked: !i.checked } : i
                      ))}
                      style={{ accentColor: '#F9D7B5', width: '14px', height: '14px', flexShrink: 0 }}
                    />
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '300',
                      color: item.checked ? '#88B0B4' : 'white',
                      textDecoration: item.checked ? 'line-through' : 'none',
                      lineHeight: '1.3',
                    }}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
