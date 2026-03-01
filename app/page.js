'use client';

import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';


export default function Home() {
  const [mealPlan, setMealPlan] = useState('');
  const [groceryList, setGroceryList] = useState('');
  const [loadingMealPlan, setLoadingMealPlan] = useState(false);
  const [loadingGroceryList, setLoadingGroceryList] = useState(false);
  const [weeklyContext, setWeeklyContext] = useState('');
  const [groceryItems, setGroceryItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [savedRecipes, setSavedRecipes] = useState([]);

  useEffect(() => {
    const fetchRecipes = async () => {
      const { data } = await supabase.from('recipes').select('id, name');
      if (data) setSavedRecipes(data);
    };
    fetchRecipes();

    const savedMealPlan = localStorage.getItem('mealPlan');
    const savedGroceryItems = localStorage.getItem('groceryItems');
    if (savedMealPlan) setMealPlan(savedMealPlan);
    if (savedGroceryItems) setGroceryItems(JSON.parse(savedGroceryItems));
  }, []);

  const generateMealPlan = async () => {
    setLoadingMealPlan(true);
    setMealPlan('');
    setGroceryList('');
    setGroceryItems([]);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'meal-plan', weeklyContext }),
      });
      const data = await res.json();
      setMealPlan(data.result);
localStorage.setItem('mealPlan', data.result);
    } catch (error) {
      setMealPlan('Something went wrong. Please try again.');
    }
    setLoadingMealPlan(false);
  };

  const generateGroceryList = async () => {
    setLoadingGroceryList(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'grocery-list', mealPlan }),
      });
      const data = await res.json();
      setGroceryList(data.result);
      const lines = data.result.split('\n');
      const items = [];
      let currentCategory = '';
      lines.forEach((line, i) => {
        if (line.startsWith('**') && line.endsWith('**')) {
          currentCategory = line.replace(/\*\*/g, '');
        } else if (line.startsWith('- ')) {
          items.push({ id: i, text: line.slice(2), checked: false, category: currentCategory });
        }
      });
      setGroceryItems(items);
localStorage.setItem('groceryItems', JSON.stringify(items));
    } catch (error) {
      setGroceryList('Something went wrong. Please try again.');
    }
    setLoadingGroceryList(false);
  };

  const formatText = (text) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <h3 key={i} style={{ color: '#5aa0b4', fontWeight: '500' }} className="text-lg mt-4 mb-1">{line.replace(/\*\*/g, '')}</h3>;
      }
      if (line.startsWith('- ')) {
        const content = line.slice(2);
        let element = <span>{content}</span>;
        for (const recipe of savedRecipes) {
          if (content.toLowerCase().includes(recipe.name.toLowerCase())) {
            const idx = content.toLowerCase().indexOf(recipe.name.toLowerCase());
            const before = content.slice(0, idx);
            const match = content.slice(idx, idx + recipe.name.length);
            const after = content.slice(idx + recipe.name.length);
            element = (
              <span>
                {before}
                <a href={`/recipes?id=${recipe.id}`} style={{ color: '#d5824a', textDecoration: 'underline', fontWeight: '400' }}>{match}</a>
                {after}
              </span>
            );
            break;
          }
        }
        return <p key={i} style={{ fontWeight: '300' }} className="ml-2 text-gray-700">• {element}</p>;
      }
      if (line.trim() === '') {
        return <br key={i} />;
      }
      return <p key={i} style={{ fontWeight: '300' }} className="text-gray-700">{line}</p>;
    });
  };

  const grouped = groceryItems.reduce((groups, item) => {
    const cat = item.category || 'Other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
    return groups;
  }, {});

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#d9d0bc' }}>

      {/* Header */}
      <div className="p-6 text-center" style={{ backgroundColor: '#5AA0B4' }}>
        <h1 className="text-2xl text-white tracking-wide" style={{ fontWeight: '500' }}>🥗 Happy Belly</h1>
        <p className="text-sm mt-1" style={{ color: '#F9D7B5', fontWeight: '300' }}>Family meal planning made easy</p>
      </div>

      <div className="max-w-2xl mx-auto p-4" style={{ paddingBottom: '100px' }}>

        {/* Family Profiles */}
        <div className="bg-white rounded-2xl p-5 mt-4 shadow-sm">
          <h2 className="text-gray-800 mb-3 tracking-wide" style={{ fontWeight: '500' }}>Your Family</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-xl">👩</span>
              <div>
                <p className="text-sm text-gray-800" style={{ fontWeight: '400' }}>You</p>
                <p className="text-xs text-gray-400 mt-0.5" style={{ fontWeight: '300' }}>5'9" · Postpartum · Sand volleyball · 140-165g protein/day</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">👨</span>
              <div>
                <p className="text-sm text-gray-800" style={{ fontWeight: '400' }}>Your Husband</p>
                <p className="text-xs text-gray-400 mt-0.5" style={{ fontWeight: '300' }}>6'5" · Athletic · Strength training · High protein + carbs</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">👶</span>
              <div>
                <p className="text-sm text-gray-800" style={{ fontWeight: '400' }}>Baby</p>
                <p className="text-xs text-gray-400 mt-0.5" style={{ fontWeight: '300' }}>~6 months · Starting solids · Iron-rich foods · 2 tbsp portions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Context */}
        <div className="bg-white rounded-2xl p-5 mt-4 shadow-sm">
          <h2 className="text-gray-800 mb-2 tracking-wide" style={{ fontWeight: '500' }}>This Week's Context</h2>
          <textarea
            className="w-full border border-gray-200 rounded-xl p-3 text-sm"
            placeholder="Tell me about your week... cravings, schedule, training plans, anything that should shape your meal plan!"
            rows={4}
            value={weeklyContext}
            onChange={e => setWeeklyContext(e.target.value)}
            style={{ fontWeight: '300' }}
          />
        </div>

        {/* Generate Meal Plan Button */}
        <button
          onClick={generateMealPlan}
          disabled={loadingMealPlan}
          className="w-full text-white rounded-2xl p-4 mt-4 text-base shadow-sm disabled:opacity-60 tracking-wide"
          style={{ backgroundColor: '#d5824a', fontWeight: '400', color: 'white' }}
        >
          {loadingMealPlan ? '⏳ Generating your meal plan...' : '🗓️ Generate This Week\'s Meal Plan'}
        </button>

        {/* Meal Plan Display */}
        {mealPlan && (
          <div className="bg-white rounded-2xl p-5 mt-4 shadow-sm">
            <h2 className="text-gray-800 mb-3 tracking-wide" style={{ fontWeight: '500' }}>This Week's Meal Plan</h2>
            <div className="text-sm leading-relaxed">{formatText(mealPlan)}</div>
          </div>
        )}

        {/* Generate Grocery List Button */}
        {mealPlan && (
          <button
            onClick={generateGroceryList}
            disabled={loadingGroceryList}
            className="w-full text-white rounded-2xl p-4 mt-4 text-base shadow-sm disabled:opacity-60 tracking-wide"
            style={{ backgroundColor: '#99b8b8', fontWeight: '400', color: 'white' }}
          >
            {loadingGroceryList ? '⏳ Building your grocery list...' : '🛒 Generate Grocery List'}
          </button>
        )}

        {/* Grocery List Display */}
        {groceryItems.length > 0 && (
          <div className="bg-white rounded-2xl p-5 mt-4 shadow-sm mb-8">
            <h2 className="text-gray-800 mb-3 tracking-wide" style={{ fontWeight: '500' }}>Grocery List</h2>

            {/* Add Item */}
            <div className="flex gap-2 mb-4">
              <input
                className="flex-1 border border-gray-200 rounded-xl p-2 text-sm"
                placeholder="Add an item..."
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newItem.trim()) {
                    setGroceryItems([...groceryItems, { id: Date.now(), text: newItem.trim(), checked: false, category: 'Other' }]);
                    setNewItem('');
                  }
                }}
                style={{ fontWeight: '300' }}
              />
              <button
                onClick={() => {
                  if (newItem.trim()) {
                    setGroceryItems([...groceryItems, { id: Date.now(), text: newItem.trim(), checked: false, category: 'Other' }]);
                    setNewItem('');
                  }
                }}
                className="text-white rounded-xl px-3 text-sm"
                style={{ backgroundColor: '#d5824a', color: 'white', fontWeight: '400' }}
              >
                Add
              </button>
            </div>

            {/* Grouped Items */}
            <div className="space-y-4">
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <p className="text-xs tracking-wide mb-2" style={{ color: '#5aa0b4', fontWeight: '600' }}>{category}</p>
                  <div className="space-y-2">
                    {items.map(item => (
                      <div key={item.id} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => setGroceryItems(groceryItems.map(i =>
                            i.id === item.id ? { ...i, checked: !i.checked } : i
                          ))}
                          className="w-4 h-4 rounded"
                          style={{ accentColor: '#5aa0b4' }}
                        />
                        <span
                          className="flex-1 text-sm"
                          style={{ fontWeight: '300', textDecoration: item.checked ? 'line-through' : 'none', color: item.checked ? '#9ca3af' : '#374151' }}
                        >
                          {item.text}
                        </span>
                        <button
                          onClick={() => setGroceryItems(groceryItems.filter(i => i.id !== item.id))}
                          className="text-gray-300 text-lg"
                          style={{ lineHeight: 1, backgroundColor: '#d9d0bc', borderRadius: '6px', padding: '2px 6px', border: 'none' }}
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
        )}

      </div>
    </main>
  );
}
