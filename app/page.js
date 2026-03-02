'use client';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';

export default function Home() {
  const [mealPlan, setMealPlan] = useState('');
  const [loadingMealPlan, setLoadingMealPlan] = useState(false);
  const [weeklyContext, setWeeklyContext] = useState('');
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [showFullPlan, setShowFullPlan] = useState(false);
  const [swapping, setSwapping] = useState(null);

  useEffect(() => {
    const init = async () => {
      const { data: recipes } = await supabase.from('recipes').select('id, name');
      if (recipes) setSavedRecipes(recipes);

      const { data: planData } = await supabase.from('meal_plans').select('plan_text').eq('id', 1).single();
      if (planData?.plan_text) {
        setMealPlan(planData.plan_text);
        localStorage.setItem('mealPlan', planData.plan_text);
      } else {
        const saved = localStorage.getItem('mealPlan');
        if (saved) setMealPlan(saved);
      }
    };
    init();
  }, []);

const swapMealInText = (planText, day, mealType, newMeal) => {
  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const otherDays = allDays.filter(d => d !== day);
  const lines = planText.split('\n');
  let inDay = false;
  let replaced = false;
  return lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().includes(day.toLowerCase()) && (trimmed.startsWith('**') || trimmed.startsWith('#'))) {
      inDay = true; return line;
    }
    if (inDay && (trimmed.startsWith('**') || trimmed.startsWith('#')) && otherDays.some(d => trimmed.toLowerCase().includes(d.toLowerCase()))) {
      inDay = false; return line;
    }
    const keyword = mealType.toLowerCase().includes('baby') ? 'baby' : mealType.toLowerCase().includes('snack') ? 'snack' : mealType.toLowerCase().split("'")[0];
    if (inDay && !replaced && trimmed.toLowerCase().includes(keyword)) {
      replaced = true;
      const colonIdx = line.indexOf(':');
      return line.substring(0, colonIdx + 1) + ' ' + newMeal;
    }
    return line;
  }).join('\n');
};

  const generateGroceryList = async (plan) => {
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'grocery-list', mealPlan: plan }),
      });
      const data = await res.json();
      const items = [];
      const cleaned = data.result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      parsed.forEach(group => {
        group.items.forEach((text, i) => {
          items.push({ id: Date.now() + i + Math.random(), text, checked: false, category: group.category });
        });
      });


      localStorage.setItem('groceryItems', JSON.stringify(items));
      await supabase.from('meal_plans').update({ grocery_items: items }).eq('id', 1);
    } catch (error) {
      console.error('Grocery list error:', error);
    }
  };

  const swapMeal = async (day, mealType, currentMeal) => {
  setSwapping({ day, mealType });
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'swap-meal', mealPlan, mealType, day, currentMeal }),
    });
    const data = await res.json();
    const newMeal = data.result.trim().replace(/\*\*/g, '');
    const updatedPlan = swapMealInText(mealPlan, day, mealType, newMeal);
    setMealPlan(updatedPlan);
    localStorage.setItem('mealPlan', updatedPlan);
    await supabase.from('meal_plans').update({ plan_text: updatedPlan }).eq('id', 1);
  } catch (error) {
    console.error('Swap error:', error);
  }
  setSwapping(null);
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
      await supabase.from('meal_plans').update({ plan_text: data.result }).eq('id', 1);
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
      return <p key={i} style={{ fontWeight: '300' }} className="text-gray-700">{line.replace(/\*\*/g, '').replace(/^#+\s?/, '')}</p>;
    });
  };

  const getTodaysMeals = (plan) => {
  if (!plan) return null;
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];
  const otherDays = days.filter(d => d !== today);
  const lines = plan.split('\n');
  let inToday = false;
  let meals = { breakfast: '', lunch: '', dinner: '', snacks: '', baby: '' };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.toLowerCase().includes(today.toLowerCase()) && (line.startsWith('**') || line.startsWith('#'))) {
      inToday = true; continue;
    }
    if (inToday && (line.startsWith('**') || line.startsWith('#')) && otherDays.some(d => line.toLowerCase().includes(d.toLowerCase()))) break;
    if (inToday) {
      const lower = line.toLowerCase();
      if (lower.includes('breakfast:')) meals.breakfast = line.split(':').slice(1).join(':').trim().replace(/\*\*/g, '');
      if (lower.includes('lunch:')) meals.lunch = line.split(':').slice(1).join(':').trim().replace(/\*\*/g, '');
      if (lower.includes('dinner:')) meals.dinner = line.split(':').slice(1).join(':').trim().replace(/\*\*/g, '');
      if (lower.includes('snack')) meals.snacks = line.split(':').slice(1).join(':').trim().replace(/\*\*/g, '');
      if (lower.includes('baby')) meals.baby = line.split(':').slice(1).join(':').trim().replace(/\*\*/g, '');
    }
  }
  return meals.breakfast || meals.lunch || meals.dinner ? meals : null;
};

const getAllDaysMeals = (plan) => {
  if (!plan) return [];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const result = [];
  for (const day of days) {
    const otherDays = days.filter(d => d !== day);
    const lines = plan.split('\n');
    let inDay = false;
    let meals = { breakfast: '', lunch: '', dinner: '', snacks: '', baby: '' };
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.toLowerCase().includes(day.toLowerCase()) && (line.startsWith('**') || line.startsWith('#'))) {
        inDay = true; continue;
      }
      if (inDay && (line.startsWith('**') || line.startsWith('#')) && otherDays.some(d => line.toLowerCase().includes(d.toLowerCase()))) break;
      if (inDay) {
        const lower = line.toLowerCase();
        if (lower.includes('breakfast:')) meals.breakfast = line.split(':').slice(1).join(':').trim().replace(/\*\*/g, '');
        if (lower.includes('lunch:')) meals.lunch = line.split(':').slice(1).join(':').trim().replace(/\*\*/g, '');
        if (lower.includes('dinner:')) meals.dinner = line.split(':').slice(1).join(':').trim().replace(/\*\*/g, '');
        if (lower.includes('snack')) meals.snacks = line.split(':').slice(1).join(':').trim().replace(/\*\*/g, '');
        if (lower.includes('baby')) meals.baby = line.split(':').slice(1).join(':').trim().replace(/\*\*/g, '');
      }
    }
    if (meals.breakfast || meals.lunch || meals.dinner) result.push({ day, meals });
  }
  return result;
};


  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];
  const todaysMeals = getTodaysMeals(mealPlan);

  return (
    <main style={{ backgroundColor: '#F9D7B5', minHeight: '100vh' }}>

      {/* Slim Header */}
      <div style={{ backgroundColor: '#5AA0B4', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px' }}>

        <div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'white', letterSpacing: '0.5px' }}>Happy Belly</h1>
          <p style={{ margin: 0, fontSize: '11px', color: '#F9D7B5', fontWeight: '300' }}>Family meal planning</p>
        </div>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '20px 16px 100px 16px' }}>

        {/* Context Input */}
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '12px', fontWeight: '500', color: '#9AAC9D', marginBottom: '8px', letterSpacing: '0.5px' }}>THIS WEEK</p>
          <textarea
            placeholder="Tell me about your week... cravings, schedule, training plans..."
            rows={3}
            value={weeklyContext}
            onChange={e => setWeeklyContext(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#F9D7B5',
              border: '1.5px solid #BDC2B4',
              borderRadius: '16px',
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: '300',
              fontFamily: 'Montserrat, sans-serif',
              resize: 'none',
              outline: 'none',
              boxSizing: 'border-box',
              color: '#404F43',
            }}
          />
        </div>

        {/* Pill Button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <button
            onClick={generateMealPlan}
            disabled={loadingMealPlan}
            style={{
              backgroundColor: '#D5824A',
              color: 'white',
              border: 'none',
              borderRadius: '50px',
              padding: '12px 32px',
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: 'Montserrat, sans-serif',
              cursor: 'pointer',
              opacity: loadingMealPlan ? 0.6 : 1,
              letterSpacing: '0.3px',
            }}
          >
            {loadingMealPlan ? '⏳ Generating...' : '🗓️ Generate Meal Plan'}
          </button>
        </div>

        {/* Today's Meals */}
        {mealPlan && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#9AAC9D', margin: 0, letterSpacing: '0.5px' }}>TODAY — {today.toUpperCase()}</p>
              <button
                onClick={() => setShowFullPlan(!showFullPlan)}
                style={{ color: '#404F43', fontWeight: '400', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontFamily: 'Montserrat, sans-serif' }}
              >
                {showFullPlan ? 'Hide full plan' : 'View full week'}
              </button>
            </div>

            {todaysMeals ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'BREAKFAST', value: todaysMeals.breakfast, emoji: '🌅' },
                  { label: 'LUNCH', value: todaysMeals.lunch, emoji: '☀️' },
                  { label: 'DINNER', value: todaysMeals.dinner, emoji: '🌙' },
                  { label: 'SNACKS', value: todaysMeals.snacks, emoji: '🍎' },
                  { label: "BABY'S MEAL", value: todaysMeals.baby, emoji: '👶' },
                ].filter(m => m.value).map(meal => (
                  <div key={meal.label} style={{
                    backgroundColor: 'white',
                    borderRadius: '20px',
                    padding: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>{meal.emoji}</span>
                        <p style={{ margin: 0, fontSize: '11px', fontWeight: '600', color: '#E2A06F', letterSpacing: '0.8px' }}>{meal.label}</p>
                      </div>
                      <button
                        onClick={() => swapMeal(today, meal.label, meal.value)}
                        disabled={swapping !== null}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', opacity: swapping?.day === today && swapping?.mealType === meal.label ? 0.4 : 1, color: '#BDC2B4' }}
                      >
                        {swapping?.day === today && swapping?.mealType === meal.label ? '⏳' : '🔀'}
                      </button>
                    </div>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '300', color: '#404F43', lineHeight: '1.5' }}>{meal.value.replace(/\*\*/g, '')}</p>
                  </div>
                ))}

              </div>
            ) : (
              <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <p style={{ color: '#9AAC9D', fontWeight: '300', fontSize: '14px', margin: 0 }}>No meals found for today. Try regenerating!</p>
              </div>
            )}

            {showFullPlan && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {getAllDaysMeals(mealPlan).map(({ day, meals }) => (
                  <div key={day} style={{ backgroundColor: 'white', borderRadius: '20px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <p style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '600', color: '#5AA0B4', letterSpacing: '0.5px' }}>{day.toUpperCase()}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[
                        { label: 'Breakfast', value: meals.breakfast, emoji: '🌅' },
                        { label: 'Lunch', value: meals.lunch, emoji: '☀️' },
                        { label: 'Dinner', value: meals.dinner, emoji: '🌙' },
                        { label: 'Snacks', value: meals.snacks, emoji: '🍎' },
                        { label: "Baby's Meal", value: meals.baby, emoji: '👶' },
                      ].filter(m => m.value).map(meal => (
                        <div key={meal.label} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '14px', marginTop: '1px' }}>{meal.emoji}</span>
                          <div>
                            <p style={{ margin: 0, fontSize: '10px', fontWeight: '600', color: '#E2A06F', letterSpacing: '0.8px' }}>{meal.label.toUpperCase()}</p>
                            <p style={{ margin: 0, fontSize: '13px', fontWeight: '300', color: '#404F43', lineHeight: '1.5' }}>{meal.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
