'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function GroceryPanel() {
  const [groceryItems, setGroceryItems] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('meal_plans').select('grocery_items').eq('id', 1).single();
      if (data?.grocery_items?.length) setGroceryItems(data.grocery_items);
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const saveItems = async (items) => {
    setGroceryItems(items);
    await supabase.from('meal_plans').update({ grocery_items: items }).eq('id', 1);
  };

  const unchecked = groceryItems.filter(i => !i.checked);
  const checked = groceryItems.filter(i => i.checked);
  const grouped = unchecked.reduce((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '300px', backgroundColor: '#5AA0B4', borderLeft: '1px solid #88B0B4', padding: '20px 16px', overflowY: 'auto' }}>
      <p style={{ fontSize: '15px', fontWeight: '600', color: 'white', margin: '0 0 16px 0' }}>🛒 Grocery List</p>

      {groceryItems.length === 0 ? (
        <p style={{ fontSize: '12px', color: '#C7D1C9', fontWeight: '300', textAlign: 'center', marginTop: '40px' }}>
          Generate a meal plan to populate your grocery list!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <p style={{ fontSize: '10px', fontWeight: '600', color: '#C7D1C9', letterSpacing: '0.5px', margin: '0 0 8px 0' }}>{category.toUpperCase()}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {items.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={false}
                      onChange={() => saveItems(groceryItems.map(i => i.id === item.id ? { ...i, checked: true } : i))}
                      style={{ accentColor: '#F9D7B5', width: '14px', height: '14px', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', fontWeight: '300', color: 'white', lineHeight: '1.3' }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {checked.length > 0 && (
            <div>
              <p style={{ fontSize: '10px', fontWeight: '600', color: '#88B0B4', letterSpacing: '0.5px', margin: '0 0 8px 0' }}>COMPLETED</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {checked.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={true}
                      onChange={() => saveItems(groceryItems.map(i => i.id === item.id ? { ...i, checked: false } : i))}
                      style={{ accentColor: '#F9D7B5', width: '14px', height: '14px', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', fontWeight: '300', color: '#88B0B4', textDecoration: 'line-through', lineHeight: '1.3' }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
