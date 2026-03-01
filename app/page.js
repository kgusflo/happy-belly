'use client';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';

export default function Home() {
  const [mealPlan, setMealPlan] = useState('');
  const [loadingMealPlan, setLoadingMealPlan] = useState(false);
  const [weeklyContext, setWeeklyContext] = useState('');
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [showFullPlan, setShowFullPlan] = useState(false);

  useEffect(() => {
    const fetchRecipes = async () => {
      const { data } = await supabase.from('recipes').select('id, name');
      if (data) setSavedRecipes(data);
    };
    fetchRecipes();
    const savedMealPlan = localStorage.getItem('mealPlan');
    if (savedMealPlan) setMealPlan(savedMealPlan);
  }, []);

  const generateGroceryList = async (plan) => {
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'grocery-list', mealPlan: plan }),
      });
      const data = await res.json();
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
      localStorage.setItem('groceryItems', JSON.stringify(items));
    } catch (error) {
      console.error('Grocery list error:', error);
    }
  };

  const generateMealPlan = async () => {
    setLoadingMealPlan(true);
    setMealPlan('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'meal-plan', weeklyContext }),
      });
      const data = await res.json();
      setMealPlan(data.result);
      localStorage.setItem('mealPlan', data.result);
      generateGroceryList(data.result);
    } catch (error) {
      setMealPlan('Something went wrong. Please try again.');
    }
    setLoadingMealPlan(false);
  };

  const formatText = (text) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <h3 key={i} style={{ color: '#5AA0B4', fontWeight: '500' }} className="text-lg mt-4 mb-1">{line.replace(/\*\*/g, '')}</h3>;
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
                <a href={`/recipes?id=${recipe.id}`} style={{ color: '#D5824A', textDecoration: 'underline', fontWeight: '400' }}>{match}</a>
                {after}
              </span>
            );
            break;
          }
        }
        return <p key={i} style={{ fontWeight: '300' }} className="ml-2 text-gray-700">• {element}</p>;
      }
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} style={{ fontWeight: '300' }} className="text-gray-700">{line}</p>;
    });
  };

  const getTodaysMeals = (plan) => {
    if (!plan) return null;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    const lines = plan.split('\n');
    let inToday = false;
    let meals = { breakfast: '', lunch: '', dinner: '', snacks: '', baby: '' };
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes(`**${today}**`)) { inToday = true; continue; }
      if (inToday && line.startsWith('**') && !line.includes(today)) break;
      if (inToday) {
        const lower = line.toLowerCase();
        if (lower.includes('breakfast:')) meals.breakfast = line.split(':').slice(1).join(':').trim();
        if (lower.includes('lunch:')) meals.lunch = line.split(':').slice(1).join(':').trim();
        if (lower.includes('dinner:')) meals.dinner = line.split(':').slice(1).join(':').trim();
        if (lower.includes('snack')) meals.snacks = line.split(':').slice(1).join(':').trim();
        if (lower.includes('baby')) meals.baby = line.split(':').slice(1).join(':').trim();
      }
    }
    return meals.breakfast || meals.lunch || meals.dinner ? meals : null;
  };

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];
  const todaysMeals = getTodaysMeals(mealPlan);

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#F9D7B5' }}>
      {/* Header */}
      <div className="p-6 text-center" style={{ backgroundColor: '#5AA0B4' }}>
        <h1 className="text-2xl text-white tracking-wide" style={{ fontWeight: '500' }}>🥗 Happy Belly</h1>
        <p className="text-sm mt-1" style={{ color: '#F9D7B5', fontWeight: '300' }}>Family meal planning made easy</p>
      </div>

      <div className="max-w-2xl mx-auto p-4" style={{ paddingBottom: '100px' }}>

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
          style={{ backgroundColor: '#D5824A', fontWeight: '400', color: 'white' }}
        >
          {loadingMealPlan ? '⏳ Generating your meal plan...' : '🗓️ Generate This Week\'s Meal Plan'}
        </button>

        {/* Today's Meals */}
        {mealPlan && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs tracking-wide" style={{ color: '#5AA0B4', fontWeight: '600' }}>TODAY — {today.toUpperCase()}</p>
              <button
                onClick={() => setShowFullPlan(!showFullPlan)}
                style={{ color: '#404F43', fontWeight: '400', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}
              >
                {showFullPlan ? 'Hide full plan' : 'View full week'}
              </button>
            </div>

            {todaysMeals ? (
              <div className="space-y-2">
                {[
                  { label: 'Breakfast', value: todaysMeals.breakfast, emoji: '🌅' },
                  { label: 'Lunch', value: todaysMeals.lunch, emoji: '☀️' },
                  { label: 'Dinner', value: todaysMeals.dinner, emoji: '🌙' },
                  { label: 'Snacks', value: todaysMeals.snacks, emoji: '🍎' },
                  { label: "Baby's Meal", value: todaysMeals.baby, emoji: '👶' },
                ].filter(m => m.value).map(meal => (
                  <div key={meal.label} className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{meal.emoji}</span>
                      <p className="text-xs" style={{ color: '#9AAC9D', fontWeight: '500' }}>{meal.label.toUpperCase()}</p>
                    </div>
                    <p className="text-sm text-gray-700" style={{ fontWeight: '300' }}>{meal.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
                <p className="text-sm" style={{ color: '#9AAC9D', fontWeight: '300' }}>No meals found for today. Try regenerating your meal plan!</p>
              </div>
            )}

            {showFullPlan && (
              <div className="bg-white rounded-2xl p-5 mt-2 shadow-sm">
                <h2 className="text-gray-800 mb-3" style={{ fontWeight: '500' }}>Full Week</h2>
                <div className="text-sm leading-relaxed">{formatText(mealPlan)}</div>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
