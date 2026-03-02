'use client';
import { supabase } from '../lib/supabase';
import Shuffle from 'lucide-react/dist/esm/icons/shuffle';
import ThumbsUp from 'lucide-react/dist/esm/icons/thumbs-up';
import ThumbsDown from 'lucide-react/dist/esm/icons/thumbs-down';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const calendarDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = calendarDays[new Date().getDay()];
  const todayIndex = Math.max(allDays.indexOf(todayName), 0);

  const [mealPlan, setMealPlan] = useState('');
  const [loadingMealPlan, setLoadingMealPlan] = useState(false);
  const [weeklyContext, setWeeklyContext] = useState('');
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(todayIndex);
  const [swapping, setSwapping] = useState(null);
  const [ratedMeals, setRatedMeals] = useState({});
  const [feedbackModal, setFeedbackModal] = useState(null);
  const [feedbackTags, setFeedbackTags] = useState([]);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const pullStartY = useRef(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
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

    const { data: feedback } = await supabase
      .from('meal_feedback')
      .select('meal_name, rating')
      .order('created_at', { ascending: false })
      .limit(200);
    if (feedback) {
      const rated = {};
      feedback.forEach(f => { rated[f.meal_name] = f.rating; });
      setRatedMeals(rated);
    }
  };

  useEffect(() => { loadData(); }, []);

  const swapMealInText = (planText, day, mealType, newMeal) => {
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
      generateGroceryList(updatedPlan);
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

  const getAllDaysMeals = (plan) => {
    if (!plan) return [];
    const result = [];
    for (const day of allDays) {
      const otherDays = allDays.filter(d => d !== day);
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

  const linkifyMeal = (text) => {
    const clean = text.replace(/\*\*/g, '');
    for (const recipe of savedRecipes) {
      const idx = clean.toLowerCase().indexOf(recipe.name.toLowerCase());
      if (idx !== -1) {
        const before = clean.slice(0, idx);
        const match = clean.slice(idx, idx + recipe.name.length);
        const after = clean.slice(idx + recipe.name.length);
        return (
          <span>
            {before}
            <a href={`/recipes?id=${recipe.id}`} style={{ color: '#D5824A', textDecoration: 'underline', fontWeight: '400' }}>{match}</a>
            {after}
          </span>
        );
      }
    }
    return clean;
  };

  const likeMeal = async (day, mealType, mealValue) => {
    const clean = mealValue.replace(/\*\*/g, '').trim();
    setRatedMeals(prev => ({ ...prev, [clean]: prev[clean] === 'liked' ? null : 'liked' }));
    await supabase.from('meal_feedback').insert({ meal_name: clean, meal_type: mealType, rating: 'liked' });
  };

  const openDislikeModal = (day, mealType, mealValue) => {
    setFeedbackModal({ day, mealType, meal: mealValue.replace(/\*\*/g, '').trim() });
    setFeedbackTags([]);
    setFeedbackNote('');
  };

  const submitDislike = async () => {
    if (!feedbackModal) return;
    setSubmittingFeedback(true);
    const notes = [...feedbackTags, feedbackNote.trim() ? feedbackNote.trim() : null].filter(Boolean).join('; ');
    setRatedMeals(prev => ({ ...prev, [feedbackModal.meal]: 'disliked' }));
    await supabase.from('meal_feedback').insert({
      meal_name: feedbackModal.meal,
      meal_type: feedbackModal.mealType,
      rating: 'disliked',
      feedback_notes: notes || null,
    });
    setFeedbackModal(null);
    setSubmittingFeedback(false);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    const diffY = touchStartY.current - e.changedTouches[0].clientY;
    // Only trigger if horizontal swipe is dominant (not a scroll)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
      if (diffX > 0 && selectedDayIndex < allDays.length - 1) {
        setSelectedDayIndex(prev => prev + 1);
      } else if (diffX < 0 && selectedDayIndex > 0) {
        setSelectedDayIndex(prev => prev - 1);
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handlePullStart = (e) => {
    if (window.scrollY === 0) {
      pullStartY.current = e.touches[0].clientY;
    }
  };

  const handlePullMove = (e) => {
    if (pullStartY.current === null) return;
    const dist = e.touches[0].clientY - pullStartY.current;
    if (dist > 0) {
      setPullDistance(Math.min(dist * 0.4, 80));
    }
  };

  const handlePullEnd = async () => {
    if (pullDistance > 55) {
      setRefreshing(true);
      setPullDistance(0);
      pullStartY.current = null;
      await loadData();
      setRefreshing(false);
    } else {
      setPullDistance(0);
      pullStartY.current = null;
    }
  };

  const allDaysMeals = getAllDaysMeals(mealPlan);
  const selectedDay = allDays[selectedDayIndex];
  const isToday = selectedDay === todayName;
  const currentDayData = allDaysMeals.find(d => d.day === selectedDay);

  return (
    <main
      style={{ backgroundColor: '#F9D7B5', minHeight: '100vh' }}
      onTouchStart={handlePullStart}
      onTouchMove={handlePullMove}
      onTouchEnd={handlePullEnd}
    >
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Pull-to-refresh indicator */}
      {(pullDistance > 0 || refreshing) && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: `${refreshing ? 40 : pullDistance}px`, overflow: 'hidden', transition: refreshing ? 'none' : 'height 0.1s' }}>
          <RefreshCw
            size={20}
            color="#5AA0B4"
            style={refreshing
              ? { animation: 'spin 0.8s linear infinite' }
              : { transform: `rotate(${pullDistance * 4}deg)` }
            }
          />
        </div>
      )}

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

        {/* Generate Button */}
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

        {/* Day Navigation + Meal Cards */}
        {mealPlan && (
          <div>

            {/* Day Selector Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <button
                onClick={() => setSelectedDayIndex(i => Math.max(i - 1, 0))}
                disabled={selectedDayIndex === 0}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: selectedDayIndex === 0 ? 'default' : 'pointer',
                  fontSize: '24px',
                  lineHeight: '1',
                  color: selectedDayIndex === 0 ? '#D9C9B8' : '#9AAC9D',
                  padding: '0 8px',
                  fontFamily: 'Montserrat, sans-serif',
                }}
              >
                ‹
              </button>

              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#9AAC9D', margin: 0, letterSpacing: '0.5px' }}>
                  {isToday ? `TODAY — ${selectedDay.toUpperCase()}` : selectedDay.toUpperCase()}
                </p>
              </div>

              <button
                onClick={() => setSelectedDayIndex(i => Math.min(i + 1, allDays.length - 1))}
                disabled={selectedDayIndex === allDays.length - 1}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: selectedDayIndex === allDays.length - 1 ? 'default' : 'pointer',
                  fontSize: '24px',
                  lineHeight: '1',
                  color: selectedDayIndex === allDays.length - 1 ? '#D9C9B8' : '#9AAC9D',
                  padding: '0 8px',
                  fontFamily: 'Montserrat, sans-serif',
                }}
              >
                ›
              </button>
            </div>

            {/* Dot Indicators */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', marginBottom: '16px' }}>
              {allDays.map((day, i) => (
                <button
                  key={day}
                  onClick={() => setSelectedDayIndex(i)}
                  style={{
                    width: i === selectedDayIndex ? '20px' : '7px',
                    height: '7px',
                    borderRadius: '4px',
                    backgroundColor: i === selectedDayIndex ? '#D5824A' : day === todayName ? '#5AA0B4' : '#BDC2B4',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'width 0.2s ease, background-color 0.2s ease',
                  }}
                />
              ))}
            </div>

            {/* Swipeable Meal Cards Area */}
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {currentDayData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { label: 'BREAKFAST', value: currentDayData.meals.breakfast, emoji: '🌅' },
                    { label: 'LUNCH', value: currentDayData.meals.lunch, emoji: '☀️' },
                    { label: 'DINNER', value: currentDayData.meals.dinner, emoji: '🌙' },
                    { label: 'SNACKS', value: currentDayData.meals.snacks, emoji: '🍎' },
                    { label: "BABY'S MEAL", value: currentDayData.meals.baby, emoji: '👶' },
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <button
                            onClick={() => likeMeal(selectedDay, meal.label, meal.value)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', opacity: ratedMeals[meal.value.replace(/\*\*/g, '').trim()] === 'liked' ? 1 : 0.3, transition: 'opacity 0.15s' }}
                            title="I liked this"
                          ><ThumbsUp size={14} color="#9AAC9D" /></button>
                          <button
                            onClick={() => openDislikeModal(selectedDay, meal.label, meal.value)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', opacity: ratedMeals[meal.value.replace(/\*\*/g, '').trim()] === 'disliked' ? 1 : 0.3, transition: 'opacity 0.15s' }}
                            title="I didn't like this"
                          ><ThumbsDown size={14} color="#9AAC9D" /></button>
                          <button
                            onClick={() => swapMeal(selectedDay, meal.label, meal.value)}
                            disabled={swapping !== null}
                            style={{ background: 'none', border: 'none', cursor: swapping !== null ? 'default' : 'pointer', opacity: swapping?.day === selectedDay && swapping?.mealType === meal.label ? 0.4 : 1, color: '#BDC2B4', display: 'flex', alignItems: 'center', padding: '4px' }}
                          >
                            {swapping?.day === selectedDay && swapping?.mealType === meal.label ? '⏳' : <Shuffle size={14} color="#BDC2B4" />}
                          </button>
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '300', color: '#404F43', lineHeight: '1.5' }}>{linkifyMeal(meal.value)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <p style={{ color: '#9AAC9D', fontWeight: '300', fontSize: '14px', margin: 0 }}>No meals found for {selectedDay}. Try regenerating!</p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Dislike Feedback Modal */}
      {feedbackModal && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}
          onClick={e => { if (e.target === e.currentTarget) setFeedbackModal(null); }}
        >
          <div style={{ backgroundColor: 'white', borderRadius: '24px 24px 0 0', padding: '24px', width: '100%', maxWidth: '680px', margin: '0 auto', boxSizing: 'border-box' }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#404F43' }}>What didn't you like? 👎</p>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#9AAC9D', fontWeight: '300' }}>{feedbackModal.meal}</p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {['Too complex', 'Not enough protein', 'Too heavy', "Didn't enjoy the taste", 'Wrong ingredients', 'Boring / repetitive', 'Too time-consuming'].map(tag => (
                <button
                  key={tag}
                  onClick={() => setFeedbackTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                  style={{
                    padding: '7px 14px', borderRadius: '20px', fontSize: '12px',
                    fontFamily: 'Montserrat, sans-serif', cursor: 'pointer', fontWeight: '400',
                    border: '1.5px solid', transition: 'all 0.15s',
                    borderColor: feedbackTags.includes(tag) ? '#D5824A' : '#BDC2B4',
                    backgroundColor: feedbackTags.includes(tag) ? '#F9D7B5' : 'white',
                    color: feedbackTags.includes(tag) ? '#D5824A' : '#9AAC9D',
                  }}
                >{tag}</button>
              ))}
            </div>

            <textarea
              placeholder="Anything else? (optional)"
              rows={2}
              value={feedbackNote}
              onChange={e => setFeedbackNote(e.target.value)}
              style={{ width: '100%', border: '1.5px solid #BDC2B4', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', fontFamily: 'Montserrat, sans-serif', fontWeight: '300', outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: '16px', color: '#404F43' }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setFeedbackModal(null)}
                style={{ flex: 1, border: '1.5px solid #BDC2B4', borderRadius: '16px', padding: '12px', fontSize: '13px', fontFamily: 'Montserrat, sans-serif', background: 'white', color: '#9AAC9D', cursor: 'pointer', fontWeight: '400' }}
              >Cancel</button>
              <button
                onClick={submitDislike}
                disabled={submittingFeedback}
                style={{ flex: 2, backgroundColor: '#D5824A', color: 'white', border: 'none', borderRadius: '16px', padding: '12px', fontSize: '13px', fontFamily: 'Montserrat, sans-serif', fontWeight: '500', cursor: 'pointer', opacity: submittingFeedback ? 0.6 : 1 }}
              >{submittingFeedback ? 'Saving...' : 'Save Feedback'}</button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
