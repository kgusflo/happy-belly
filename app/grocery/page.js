'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

// Split "3 medium sweet potatoes" → { name: "Sweet potatoes", quantity: "3 medium" }
const parseItem = (text) => {
  if (!text) return { name: text, quantity: '' };
  const m = text.match(
    /^(\d+(?:[\/\-]\d+)?(?:\.\d+)?\s*(?:large|medium|small|lbs?|oz|g|kg|ml|L|cups?|tbsp|tsp|heads?|dozen|loafs?|loaves|bags?|pints?|quarts?|packs?|bunches?|cans?|bottles?|jars?|boxes?|pieces?|slices?|sticks?|cloves?|fillets?|portions?|links?))\s+(.+)/i
  );
  if (m) {
    const name = m[2].trim();
    return { name: name.charAt(0).toUpperCase() + name.slice(1), quantity: m[1].trim() };
  }
  const parens = text.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (parens) return { name: parens[1].trim(), quantity: parens[2].trim() };
  return { name: text, quantity: '' };
};

// Circle checkbox — matches desktop GroceryPanel
const CircleCheck = ({ checked, onToggle }) => (
  <div
    onClick={onToggle}
    style={{
      width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
      border: `1.5px solid ${checked ? '#D5824A' : 'rgba(213,130,74,0.5)'}`,
      backgroundColor: checked ? '#D5824A' : 'transparent',
      cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.15s',
    }}
  >
    {checked && (
      <svg width="10" height="8" viewBox="0 0 9 7" fill="none">
        <path d="M1 3.5L3.2 5.8L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )}
  </div>
);

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

  const toggle = (item) => saveItems(groceryItems.map(i => i.id === item.id ? { ...i, checked: !i.checked } : i));

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
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ padding: '20px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: 'rgba(80,45,10,0.88)', fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.3px' }}>Grocery List</p>
        {groceryItems.length > 0 && (
          <button
            onClick={() => saveItems([])}
            style={{ background: 'none', border: 'none', fontSize: '11px', color: 'rgba(80,45,10,0.35)', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontWeight: '500' }}
          >Clear all</button>
        )}
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, padding: '0 16px', paddingBottom: '16px' }}>

        {/* Add item card */}
        <div className="glass-card" style={{ padding: '10px 14px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: '13px', fontFamily: 'Montserrat, sans-serif', fontWeight: '400',
              color: 'rgba(80,45,10,0.8)', minWidth: 0,
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
              background: 'linear-gradient(135deg, #E2A06F, #D5824A)',
              color: 'white', border: 'none',
              borderRadius: '10px', padding: '7px 16px',
              fontSize: '11px', fontFamily: 'Montserrat, sans-serif',
              fontWeight: '700', cursor: 'pointer', flexShrink: 0,
            }}
          >Add</button>
        </div>

        {/* Empty state */}
        {groceryItems.length === 0 && (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', marginTop: '8px' }}>
            <p style={{ color: 'rgba(80,45,10,0.4)', fontWeight: '300', fontSize: '14px', margin: 0, fontFamily: 'Montserrat, sans-serif' }}>
              No items yet. Generate a meal plan to get started!
            </p>
          </div>
        )}

        {/* Unchecked items grouped by category */}
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            {/* Category header — underline border style matching desktop */}
            <div style={{ paddingBottom: '6px', marginBottom: '8px', marginTop: '16px', borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
              <span style={{
                fontSize: '9px', fontWeight: '700', color: 'rgba(80,45,10,0.4)',
                letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif',
              }}>{category}</span>
            </div>
            {items.map(item => {
              const { name, quantity } = parseItem(item.text);
              return (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px', marginBottom: '6px',
                  background: 'rgba(255,255,255,0.18)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.35)',
                }}>
                  <CircleCheck checked={false} onToggle={() => toggle(item)} />
                  <span style={{ flex: 1, fontSize: '13px', fontWeight: '500', color: 'rgba(80,45,10,0.8)', lineHeight: 1.3, fontFamily: 'Montserrat, sans-serif' }}>{name}</span>
                  {quantity && (
                    <span style={{ fontSize: '11px', color: 'rgba(80,45,10,0.4)', fontWeight: '600', fontFamily: 'Montserrat, sans-serif', whiteSpace: 'nowrap' }}>{quantity}</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* Completed items */}
        {checked.length > 0 && (
          <div>
            <div style={{ paddingBottom: '6px', marginBottom: '8px', marginTop: '16px', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
              <span style={{
                fontSize: '9px', fontWeight: '700', color: 'rgba(80,45,10,0.3)',
                letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif',
              }}>Completed</span>
            </div>
            {checked.map(item => {
              const { name, quantity } = parseItem(item.text);
              return (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px', marginBottom: '6px',
                  background: 'rgba(255,255,255,0.10)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.22)',
                }}>
                  <CircleCheck checked={true} onToggle={() => toggle(item)} />
                  <span style={{ flex: 1, fontSize: '13px', fontWeight: '500', color: 'rgba(80,45,10,0.35)', lineHeight: 1.3, textDecoration: 'line-through', fontFamily: 'Montserrat, sans-serif' }}>{name}</span>
                  {quantity && (
                    <span style={{ fontSize: '11px', color: 'rgba(80,45,10,0.25)', fontWeight: '600', fontFamily: 'Montserrat, sans-serif', whiteSpace: 'nowrap' }}>{quantity}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Progress bar — pinned at bottom above nav */}
      {total > 0 && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255,255,255,0.22)',
          background: 'rgba(255,255,255,0.10)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: 'rgba(80,45,10,0.5)', fontWeight: '400', fontFamily: 'Montserrat, sans-serif' }}>
              {checked.length} of {total} checked
            </span>
            <span style={{ fontSize: '11px', color: '#D5824A', fontWeight: '700', fontFamily: 'Montserrat, sans-serif' }}>
              {pct}%
            </span>
          </div>
          <div style={{ height: '3px', backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              backgroundColor: '#D5824A', borderRadius: '2px',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      )}

    </main>
  );
}
