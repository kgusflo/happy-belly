'use client';

import { useState, useEffect } from 'react';

export default function Grocery() {
  const [groceryItems, setGroceryItems] = useState([]);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('groceryItems');
    if (saved) setGroceryItems(JSON.parse(saved));
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
    <main style={{ backgroundColor: '#F9D7B5', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#5AA0B4', padding: '16px 20px', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'white' }}>Grocery List</h1>
        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#F9D7B5', fontWeight: '300' }}>Auto-generated from your meal plan</p>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '20px 16px 100px 16px' }}>

        {/* Add Item */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input
            style={{ flex: 1, border: '1.5px solid #BDC2B4', borderRadius: '16px', padding: '10px 16px', fontSize: '13px', fontFamily: 'Montserrat, sans-serif', fontWeight: '300', outline: 'none', backgroundColor: '#F9D7B5' }}
            placeholder="Add an item..."
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && newItem.trim()) {
                saveItems([...groceryItems, { id: Date.now(), text: newItem.trim(), checked: false, category: 'Other' }]);
                setNewItem('');
              }
            }}
          />
          <button
            onClick={() => {
              if (newItem.trim()) {
                saveItems([...groceryItems, { id: Date.now(), text: newItem.trim(), checked: false, category: 'Other' }]);
                setNewItem('');
              }
            }}
            style={{ backgroundColor: '#D5824A', color: 'white', border: 'none', borderRadius: '16px', padding: '10px 20px', fontSize: '13px', fontFamily: 'Montserrat, sans-serif', fontWeight: '400', cursor: 'pointer' }}
          >
            Add
          </button>
        </div>

        {groceryItems.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button onClick={() => saveItems([])}
              style={{ background: 'none', border: 'none', fontSize: '12px', color: '#BDC2B4', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontWeight: '400' }}>
              Clear all
            </button>
          </div>
        )}

        {groceryItems.length === 0 && (
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '40px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginTop: '8px' }}>
            <p style={{ color: '#9AAC9D', fontWeight: '300', fontSize: '14px', margin: 0 }}>No items yet. Generate a meal plan to get started!</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} style={{ backgroundColor: 'white', borderRadius: '20px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: '11px', fontWeight: '600', color: '#5AA0B4', letterSpacing: '0.5px', margin: '0 0 12px 0' }}>{category.toUpperCase()}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {items.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => saveItems(groceryItems.map(i =>
                        i.id === item.id ? { ...i, checked: !i.checked } : i
                      ))}
                      style={{ accentColor: '#5AA0B4', width: '16px', height: '16px' }}
                    />
                    <span style={{
                      flex: 1,
                      fontSize: '14px',
                      fontWeight: '300',
                      color: item.checked ? '#BDC2B4' : '#404F43',
                      textDecoration: item.checked ? 'line-through' : 'none',
                    }}>
                      {item.text}
                    </span>
                    <button
                      onClick={() => saveItems(groceryItems.filter(i => i.id !== item.id))}
                      style={{ background: 'none', border: 'none', color: '#BDC2B4', fontSize: '18px', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}
