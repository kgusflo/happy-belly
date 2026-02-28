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
        return <h3 key={i} className="font-bold text-lg mt-4 mb-1 text-emerald-700">{line.replace(/\*\*/g, '')}</h3>;
      }
      if (line.startsWith('- ')) {
        return <p key={i} className="ml-2 text-gray-700">• {line.slice(2)}</p>;
      }
      if (line.trim() === '') {
        return <br key={i} />;
      }
      return <p key={i} className="text-gray-700">{line}</p>;
    });
  };

  return (
    <main className="min-h-screen bg-emerald-50">
      <div className="bg-emerald-600 text-white p-6 text-center">
        <h1 className="text-2xl font-bold">🥗 Happy Belly</h1>
        <p className="text-emerald-100 text-sm mt-1">Family meal planning made easy</p>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-white rounded-2xl p-4 mt-4 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-3">Your Family</h2>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-lg">👩</span>
              <div>
                <p className="font-medium text-sm">You</p>
                <p className="text-xs text-gray-500">5'9" · Postpartum · Returning to sand volleyball · 140-165g protein/day</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-lg">👨</span>
              <div>
                <p className="font-medium text-sm">Your Husband</p>
                <p className="text-xs text-gray-500">6'5" · Athletic · Strength training · High protein + carbs</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-lg">👶</span>
              <div>
                <p className="font-medium text-sm">Baby</p>
                <p className="text-xs text-gray-500">~6 months · Starting solids · Iron-rich foods · 2 tbsp portions</p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={generateMealPlan}
          disabled={loadingMealPlan}
          className="w-full bg-emerald-600 text-white rounded-2xl p-4 mt-4 font-semibold text-lg shadow-sm active:bg-emerald-700 disabled:opacity-60"
        >
          {loadingMealPlan ? '⏳ Generating your meal plan...' : '🗓️ Generate This Week\'s Meal Plan'}
        </button>

        {mealPlan && (
          <div className="bg-white rounded-2xl p-4 mt-4 shadow-sm">
            <h2 className="font-bold text-gray-800 mb-3">This Week's Meal Plan</h2>
            <div className="text-sm">{formatText(mealPlan)}</div>
          </div>
        )}

        {mealPlan && (
          <button
            onClick={generateGroceryList}
            disabled={loadingGroceryList}
            className="w-full bg-orange-500 text-white rounded-2xl p-4 mt-4 font-semibold text-lg shadow-sm active:bg-orange-600 disabled:opacity-60"
          >
            {loadingGroceryList ? '⏳ Building your grocery list...' : '🛒 Generate Grocery List'}
          </button>
        )}

        {groceryList && (
          <div className="bg-white rounded-2xl p-4 mt-4 shadow-sm mb-8">
            <h2 className="font-bold text-gray-800 mb-3">Grocery List</h2>
            <div className="text-sm">{formatText(groceryList)}</div>
          </div>
        )}
      </div>
    </main>
  );
}
