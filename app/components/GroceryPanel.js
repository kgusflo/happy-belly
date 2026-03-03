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
  const total = groceryItems.length;
  const pct = total > 0 ? Math.round((checked.length / total) * 100) : 0;

  const grouped = unchecked.reduce((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div style={{
      position: 'fixed', right: 0, top: 0, bottom: 0, width: '300px',
      background: 'rgba(58, 120, 142, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderLeft: '1px solid rgba(255,255,255,0.18)',
      display: 'flex', flexDirection: 'column',
      zIndex: 100,
    }}>

      {/* Header */}
      <div style={{ padding: '28px 18px 16px', flexShrink: 0 }}>
        <p style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: 'white', letterSpacing: '0.2px' }}>Grocery List</p>
        {total > 0 && (
          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.55)', fontWeight: '300' }}>
            {checked.length} of {total} items checked
          </p>
        )}
      </div>

      {/* Scrollable list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px' }}>
        {groceryItems.length === 0 ? (
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontWeight: '300', textAlign: 'center', marginTop: '48px', lineHeight: '1.6' }}>
            Generate a meal plan to<br />populate your grocery list.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', paddingBottom: '16px' }}>
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <p style={{ fontSize: '9px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', margin: '0 0 8px 0', textTransform: 'uppercase' }}>{category}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {items.map(item => (
                    <label key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={() => saveItems(groceryItems.map(i => i.id === item.id ? { ...i, checked: true } : i))}
                        style={{ accentColor: '#D5824A', width: '14px', height: '14px', marginTop: '2px', flexShrink: 0 }}
                      />
                      <span style={{ fontSize: '12px', fontWeight: '300', color: 'rgba(255,255,255,0.9)', lineHeight: '1.45' }}>{item.text}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {checked.length > 0 && (
              <div>
                <p style={{ fontSize: '9px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px', margin: '0 0 8px 0', textTransform: 'uppercase' }}>Completed</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {checked.map(item => (
                    <label key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={() => saveItems(groceryItems.map(i => i.id === item.id ? { ...i, checked: false } : i))}
                        style={{ accentColor: '#D5824A', width: '14px', height: '14px', marginTop: '2px', flexShrink: 0 }}
                      />
                      <span style={{ fontSize: '12px', fontWeight: '300', color: 'rgba(255,255,255,0.35)', lineHeight: '1.45', textDecoration: 'line-through' }}>{item.text}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progress bar footer */}
      {total > 0 && (
        <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: '400' }}>{checked.length} checked</span>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>{pct}%</span>
          </div>
          <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${pct}%`,
              backgroundColor: '#D5824A',
              borderRadius: '2px',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      )}
    </div>
  );
}
