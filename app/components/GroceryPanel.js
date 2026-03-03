'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

// Try to split "3 medium sweet potatoes" into { name: "Sweet potatoes", quantity: "3 medium" }
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

// Circular checkbox
const CircleCheck = ({ checked, onToggle }) => (
  <div
    onClick={onToggle}
    style={{
      width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
      border: `1.5px solid ${checked ? '#D5824A' : 'rgba(0,0,0,0.2)'}`,
      backgroundColor: checked ? '#D5824A' : 'transparent',
      cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.15s',
    }}
  >
    {checked && (
      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
        <path d="M1 3.5L3.2 5.8L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )}
  </div>
);

export default function GroceryPanel() {
  const [groceryItems, setGroceryItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('meal_plans').select('grocery_items').eq('id', 1).single();
    if (data?.grocery_items?.length) setGroceryItems(data.grocery_items);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const toggle = async (item) => {
    const updated = groceryItems.map(i => i.id === item.id ? { ...i, checked: !i.checked } : i);
    setGroceryItems(updated);
    await supabase.from('meal_plans').update({ grocery_items: updated }).eq('id', 1);
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
      background: 'rgba(255,255,255,0.32)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderLeft: '1px solid rgba(255,255,255,0.5)',
      display: 'flex', flexDirection: 'column',
      zIndex: 100,
    }}>

      {/* Header */}
      <div style={{ padding: '24px 20px 12px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#404F43', fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.2px' }}>Grocery List</p>
        <button
          onClick={refresh}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5AA0B4', fontSize: '12px', fontFamily: 'Montserrat, sans-serif', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '3px', padding: 0 }}
        >
          Refresh <span style={{ fontSize: '15px', display: 'inline-block', transform: refreshing ? 'rotate(360deg)' : 'none', transition: 'transform 0.4s' }}>↻</span>
        </button>
      </div>

      {/* Scrollable list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
        {groceryItems.length === 0 ? (
          <p style={{ fontSize: '12px', color: 'rgba(0,0,0,0.3)', fontWeight: '300', textAlign: 'center', marginTop: '48px', lineHeight: '1.6', fontFamily: 'Montserrat, sans-serif' }}>
            Generate a meal plan to<br />populate your grocery list.
          </p>
        ) : (
          <>
            {/* Active items grouped by category */}
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <p style={{
                  fontSize: '10px', fontWeight: '700', color: '#BDC2B4',
                  letterSpacing: '1.2px', textTransform: 'uppercase',
                  margin: '16px 0 8px', fontFamily: 'Montserrat, sans-serif',
                }}>{category}</p>
                {items.map(item => {
                  const { name, quantity } = parseItem(item.text);
                  return (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
                      <CircleCheck checked={false} onToggle={() => toggle(item)} />
                      <span style={{ flex: 1, fontSize: '13px', fontWeight: '300', color: '#404F43', lineHeight: 1.4, fontFamily: 'Montserrat, sans-serif' }}>{name}</span>
                      {quantity && (
                        <span style={{ fontSize: '11px', color: '#BDC2B4', fontWeight: '300', fontFamily: 'Montserrat, sans-serif', whiteSpace: 'nowrap' }}>{quantity}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Completed items */}
            {checked.length > 0 && (
              <div>
                <p style={{
                  fontSize: '10px', fontWeight: '700', color: '#D0C4B8',
                  letterSpacing: '1.2px', textTransform: 'uppercase',
                  margin: '16px 0 8px', fontFamily: 'Montserrat, sans-serif',
                }}>Completed</p>
                {checked.map(item => {
                  const { name, quantity } = parseItem(item.text);
                  return (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
                      <CircleCheck checked={true} onToggle={() => toggle(item)} />
                      <span style={{ flex: 1, fontSize: '13px', fontWeight: '300', color: '#C0B4A8', lineHeight: 1.4, textDecoration: 'line-through', fontFamily: 'Montserrat, sans-serif' }}>{name}</span>
                      {quantity && (
                        <span style={{ fontSize: '11px', color: '#D0C4B8', fontWeight: '300', fontFamily: 'Montserrat, sans-serif', whiteSpace: 'nowrap' }}>{quantity}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ height: '16px' }} />
          </>
        )}
      </div>

      {/* Progress bar footer */}
      {total > 0 && (
        <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(0,0,0,0.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: '#BDC2B4', fontWeight: '400', fontFamily: 'Montserrat, sans-serif' }}>
              {checked.length} of {total} checked
            </span>
            <span style={{ fontSize: '11px', color: '#D5824A', fontWeight: '600', fontFamily: 'Montserrat, sans-serif' }}>
              {pct}%
            </span>
          </div>
          <div style={{ height: '3px', backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              backgroundColor: '#D5824A', borderRadius: '2px',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      )}
    </div>
  );
}
