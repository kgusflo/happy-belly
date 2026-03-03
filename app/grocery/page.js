'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function Grocery() {
  const [groceryItems, setGroceryItems] = useState([]);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('meal_plans').select('grocery_items').eq('id', 1).single();
      if (data?.grocery_items?.length) {
        setGroceryItems(data.grocery_items);
      } else {
        const saved = localStorage.getItem('groceryItems');
        if (saved) setGroceryItems(JSON.parse(saved));
      }
    };
    load();
  }, []);

  const saveItems = async (items) => {
    setGroceryItems(items);
    localStorage.setItem('groceryItems', JSON.stringify(items));
    await supabase.from('meal_plans').update({ grocery_items: items }).eq('id', 1);
  };

  const unchecked = groceryItems.filter(i => !i.checked);
  const checked = groceryItems.filter(i => i.checked);
  const total = groceryItems.length;
  const pct = total > 0 ? Math.round((checked.length / total) * 100) : 0;

  const grouped = unchecked.reduce((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <main style={{ minHeight: '100vh' }}>

      {/* Slim header */}
      <div style={{ padding: '20px 16px 12px' }}>
        <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#404F43', letterSpacing: '0.2px' }}>Grocery List</p>
        {total > 0 ? (
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9AAC9D', fontWeight: '300' }}>{checked.length} of {total} items checked · {pct}%</p>
        ) : (
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9AAC9D', fontWeight: '300' }}>Auto-generated from your meal plan</p>
        )}
      </div>

      <div style={{ padding: '0 16px 100px' }}>

        {/* Add item row */}
        <div className="glass-card" style={{ padding: '12px 14px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '13px',
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: '300',
              color: '#404F43',
              minWidth: 0,
            }}
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
            style={{
              backgroundColor: '#D5824A', color: 'white', border: 'none',
              borderRadius: '12px', padding: '8px 18px',
              fontSize: '12px', fontFamily: 'Montserrat, sans-serif',
              fontWeight: '500', cursor: 'pointer', flexShrink: 0,
            }}
          >Add</button>
        </div>

        {groceryItems.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
            <button
              onClick={() => saveItems([])}
              style={{ background: 'none', border: 'none', fontSize: '12px', color: '#BDC2B4', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontWeight: '400' }}
            >Clear all</button>
          </div>
        )}

        {/* Progress bar */}
        {total > 0 && (
          <div className="glass-card" style={{ padding: '12px 16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', color: '#9AAC9D', fontWeight: '400' }}>{checked.length} checked</span>
              <span style={{ fontSize: '11px', color: '#D5824A', fontWeight: '600' }}>{pct}%</span>
            </div>
            <div style={{ height: '5px', backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                backgroundColor: '#D5824A',
                borderRadius: '3px',
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        )}

        {/* Empty state */}
        {groceryItems.length === 0 && (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', marginTop: '8px' }}>
            <p style={{ color: '#9AAC9D', fontWeight: '300', fontSize: '14px', margin: 0 }}>No items yet. Generate a meal plan to get started!</p>
          </div>
        )}

        {/* Unchecked items grouped by category */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="glass-card" style={{ padding: '14px 16px' }}>
              <p style={{ fontSize: '9px', fontWeight: '700', color: '#9AAC9D', letterSpacing: '1px', margin: '0 0 10px', textTransform: 'uppercase' }}>{category}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {items.map(item => (
                  <label key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => saveItems(groceryItems.map(i => i.id === item.id ? { ...i, checked: true } : i))}
                      style={{ accentColor: '#D5824A', width: '16px', height: '16px', marginTop: '2px', flexShrink: 0 }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: '300', color: '#404F43', lineHeight: '1.4' }}>{item.text}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {/* Checked items */}
          {checked.length > 0 && (
            <div className="glass-card" style={{ padding: '14px 16px' }}>
              <p style={{ fontSize: '9px', fontWeight: '700', color: '#BDC2B4', letterSpacing: '1px', margin: '0 0 10px', textTransform: 'uppercase' }}>Completed</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {checked.map(item => (
                  <label key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={true}
                      onChange={() => saveItems(groceryItems.map(i => i.id === item.id ? { ...i, checked: false } : i))}
                      style={{ accentColor: '#D5824A', width: '16px', height: '16px', marginTop: '2px', flexShrink: 0 }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: '300', color: '#BDC2B4', lineHeight: '1.4', textDecoration: 'line-through' }}>{item.text}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
