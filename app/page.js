'use client';

import { useState } from 'react';

export default function Home() {
  const [mealPlan, setMealPlan] = useState('');
  const [groceryList, setGroceryList] = useState('');
  const [loadingMealPlan, setLoadingMealPlan] = useState(false);
  const [loadingGroceryList, setLoadingGroceryList] = useState(false);

  const generateMealPlan = async () => {
    setLoadingMealPlan(true);
    setMealPlan('');
    setGroceryList('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'meal-plan' }),
      });
      const data = await res.json();
      setMealPlan(data.result);
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
        return <p key={i} style={{ fontWeight: '300' }} className="ml-2 text-gray-700">• {line.slice(2)}</p>;
      }
      if (line.trim() === '') {
        return <br key={i} />;
      }
      return <p key={i} style={{ fontWeight: '300' }} className="text-gray-700">{line}</p>;
    });
  };

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#d9d0bc' }}>

      {/* Header */}
      <div className="p-6 text-center" style={{ backgroundColor: '#5aa0b4' }}>
        <h1 className="text-2xl text-white tracking-wide" style={{ fontWeight: '500' }}>🥗 Happy Belly</h1>
        <p className="text-sm mt-1" style={{ color: '#d9d0bc', fontWeight: '300' }}>Family meal planning made easy</p>
      </div>

      <div className="max-w-2xl mx-auto p-4">

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

        {/* Generate Meal Plan Button */}
        <button
          onClick={generateMealPlan}
          disabled={loadingMealPlan}
          className="w-full text-white rounded-2xl p-4 mt-4 text-base shadow-sm disabled:opacity-60 tracking-wide"
          style={{ backgroundColor: '#d5824a', fontWeight: '400' }}
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
            style={{ backgroundColor: '#99b8b8', fontWeight: '400' }}
          >
            {loadingGroceryList ? '⏳ Building your grocery list...' : '🛒 Generate Grocery List'}
          </button>
        )}

        {/* Grocery List Display */}
        {groceryList && (
          <div className="bg-white rounded-2xl p-5 mt-4 shadow-sm mb-8">
            <h2 className="text-gray-800 mb-3 tracking-wide" style={{ fontWeight: '500' }}>Grocery List</h2>
            <div className="text-sm leading-relaxed">{formatText(groceryList)}</div>
          </div>
        )}

      </div>
    </main>
  );
}
