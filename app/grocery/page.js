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
    <main className="min-h-screen" style={{ backgroundColor: '#F9D7B5' }}>

      {/* Header */}
      <div className="p-6 text-center" style={{ backgroundColor: '#5AA0B4' }}>
        <h1 className="text-2xl text-white tracking-wide" style={{ fontWeight: '500' }}>🛒 Grocery List</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4" style={{ paddingBottom: '100px' }}>

        {/* Add Item */}
        <div className="flex gap-2 mt-4">
          <input
            className="flex-1 border border-gray-200 rounded-xl p-3 text-sm"
            placeholder="Add an item..."
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && newItem.trim()) {
                saveItems([...groceryItems, { id: Date.now(), text: newItem.trim(), checked: false, category: 'Other' }]);
                setNewItem('');
              }
            }}
            style={{ fontWeight: '300', backgroundColor: 'white' }}
          />
          <button
            onClick={() => {
              if (newItem.trim()) {
                saveItems([...groceryItems, { id: Date.now(), text: newItem.trim(), checked: false, category: 'Other' }]);
                setNewItem('');
              }
            }}
            className="text-white rounded-xl px-4 text-sm"
            style={{ backgroundColor: '#D5824A', color: 'white', fontWeight: '400' }}
          >
            Add
          </button>
        </div>

        {/* Clear All */}
        {groceryItems.length > 0 && (
          <button
            onClick={() => saveItems([])}
            className="w-full rounded-xl p-2 mt-2 text-xs"
            style={{ color: '#9AAC9D', fontWeight: '400', background: 'none', border: 'none' }}
          >
            Clear all
          </button>
        )}

        {/* Grouped Items */}
        {groceryItems.length === 0 && (
          <div className="bg-white rounded-2xl p-8 mt-4 text-center shadow-sm">
            <p style={{ color: '#9AAC9D', fontWeight: '300', fontSize: '14px' }}>No items yet. Generate a meal plan to get started!</p>
          </div>
        )}

        <div className="space-y-4 mt-4">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-xs tracking-wide mb-3" style={{ color: '#5AA0B4', fontWeight: '600' }}>{category}</p>
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => saveItems(groceryItems.map(i =>
                        i.id === item.id ? { ...i, checked: !i.checked } : i
                      ))}
                      style={{ accentColor: '#5AA0B4' }}
                    />
                    <span className="flex-1 text-sm" style={{
                      fontWeight: '300',
                      textDecoration: item.checked ? 'line-through' : 'none',
                      color: item.checked ? '#9ca3af' : '#374151'
                    }}>
                      {item.text}
                    </span>
                    <button
                      onClick={() => saveItems(groceryItems.filter(i => i.id !== item.id))}
                      style={{ color: '#9ca3af', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', padding: '0 4px' }}
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
