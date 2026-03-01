'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const [filterProtein, setFilterProtein] = useState('All');
  const [form, setForm] = useState({
    name: '',
    protein_source: '',
    ingredients: '',
    instructions: '',
    notes: '',
    prep_time: '',
    batch_friendly: false,
    baby_adaptable: false,
    one_pan: false,
    favorite: false,
    nutritional_profile: '',
    url: '',
    image_url: '',
  });
  const [urlInput, setUrlInput] = useState('');
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [analyzingNutrition, setAnalyzingNutrition] = useState(false);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    const { data } = await supabase.from('recipes').select('*').order('use_count', { ascending: false });
    if (data) {
      setRecipes(data);
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (id) {
        const recipe = data.find(r => r.id === id);
        if (recipe) {
          setSelected(recipe);
          setView('detail');
        }
      }
    }
    setLoading(false);
  };

  const saveRecipe = async () => {
    const cleaned = {
      ...form,
      protein_source: form.protein_source || null,
      ingredients: form.ingredients || null,
      instructions: form.instructions || null,
      notes: form.notes || null,
      prep_time: form.prep_time || null,
      nutritional_profile: form.nutritional_profile || null,
      url: form.url || null,
      image_url: form.image_url || null,
    };
    const { data, error } = await supabase.from('recipes').insert(cleaned).select();
    if (data) {
      await fetchRecipes();
      setView('list');
      setForm({
        name: '', protein_source: '', ingredients: '', instructions: '',
        notes: '', prep_time: '', batch_friendly: false, baby_adaptable: false,
        one_pan: false, favorite: false, nutritional_profile: '', url: '', image_url: '',
      });
    }
  };

  const updateRecipe = async (recipe) => {
    await supabase.from('recipes').update(recipe).eq('id', recipe.id);
    await fetchRecipes();
    setSelected(recipe);
  };

  const deleteRecipe = async (id) => {
    await supabase.from('recipes').delete().eq('id', id);
    await fetchRecipes();
    setView('list');
    setSelected(null);
  };

  const incrementUseCount = async (recipe) => {
    const updated = { ...recipe, use_count: (recipe.use_count || 0) + 1 };
    await supabase.from('recipes').update({ use_count: updated.use_count }).eq('id', recipe.id);
    await fetchRecipes();
  };

  const fetchFromUrl = async () => {
    if (!urlInput.trim()) return;
    setFetchingUrl(true);
    try {
      const res = await fetch('/api/fetch-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput }),
      });
      const data = await res.json();
      if (data.recipe) {
        setForm({ ...form, ...data.recipe, url: urlInput });
      }
    } catch (e) {
      alert('Could not fetch recipe from that URL. Try adding it manually.');
    }
    setFetchingUrl(false);
  };

  const analyzeNutrition = async () => {
    if (!form.ingredients) return;
    setAnalyzingNutrition(true);
    try {
      const res = await fetch('/api/analyze-nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: form.ingredients, instructions: form.instructions }),
      });
      const data = await res.json();
      setForm({ ...form, nutritional_profile: data.nutrition });
    } catch (e) {
      alert('Could not analyze nutrition. Try again.');
    }
    setAnalyzingNutrition(false);
  };

  const proteinSources = ['All', ...new Set(recipes.map(r => r.protein_source).filter(Boolean))];
  const filtered = filterProtein === 'All' ? recipes : recipes.filter(r => r.protein_source === filterProtein);
  const favorites = filtered.filter(r => r.favorite);
  const rest = filtered.filter(r => !r.favorite);

  const TagBadge = ({ label, active, plain }) => (
    <span className="text-xs px-2 py-0.5 rounded-full" style={{
      backgroundColor: plain ? 'transparent' : active ? '#f1caa6' : '#f3f4f6',
      color: plain ? '#000000' : active ? '#d5824a' : '#9ca3af',
      fontWeight: '400'
    }}>{label}</span>
  );

  if (loading) return (
    <main className="min-h-screen" style={{ backgroundColor: '#d9d0bc' }}>
      <div className="p-6 text-center" style={{ backgroundColor: '#5aa0b4' }}>
        <h1 className="text-2xl text-white tracking-wide" style={{ fontWeight: '500' }}>Recipe Library</h1>
      </div>
      <div className="p-8 text-center text-gray-500">Loading...</div>
    </main>
  );

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#d9d0bc' }}>

      {/* Header */}
      <div className="p-6 text-center" style={{ backgroundColor: '#5aa0b4', position: 'relative' }}>
        {view !== 'list' && (
          <button onClick={() => { setView('list'); setSelected(null); setAdding(false); }}
            style={{ fontWeight: '300', color: 'black', position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>← Back</button>

        )}
        {view === 'list' && (
          <a href="/" style={{ fontWeight: '300', color: 'black', position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' , fontSize: '14px' }}>← Home</a>
        )}
        <h1 className="text-2xl text-white tracking-wide" style={{ fontWeight: '500' }}>
          {view === 'list' ? '📖 Recipe Library' : view === 'add' ? 'Add Recipe' : selected?.name}
        </h1>
      </div>

      <div className="max-w-2xl mx-auto p-4" style={{ paddingBottom: '100px' }}>

        {/* LIST VIEW */}
        {view === 'list' && (
          <>
            {/* Protein Filter */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {proteinSources.map(p => (
                <button key={p} onClick={() => setFilterProtein(p)}
                  className="text-xs px-3 py-1 rounded-full whitespace-nowrap"
                  style={{
                    backgroundColor: filterProtein === p ? '#5aa0b4' : 'white',
                    color: filterProtein === p ? 'white' : '#6b7280',
                    fontWeight: '400'
                  }}>
                  {p}
                </button>
              ))}
            </div>

            {/* Favorites */}
            {favorites.length > 0 && (
              <div className="mt-4">
                <p className="text-xs tracking-wide mb-2" style={{ color: '#5aa0b4', fontWeight: '600' }}>⭐ FAVORITES</p>
                {favorites.map(recipe => (
                  <div key={recipe.id} onClick={() => { setSelected(recipe); setView('detail'); }}
                    className="bg-white rounded-2xl p-4 mb-2 shadow-sm cursor-pointer">
                    <div className="flex justify-between items-start">
                      <p className="text-gray-800" style={{ fontWeight: '500' }}>{recipe.name}</p>
                      <p className="text-xs text-gray-400" style={{ fontWeight: '300' }}>Used {recipe.use_count || 0}x</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-1" style={{ fontWeight: '300' }}>{recipe.protein_source}</p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {recipe.batch_friendly && <TagBadge label="Batch friendly" active />}
                      {recipe.baby_adaptable && <TagBadge label="Baby adaptable" active />}
                      {recipe.one_pan && <TagBadge label="One pan" active />}
                      {recipe.prep_time && <TagBadge label={recipe.prep_time} plain />}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* All Recipes */}
            {rest.length > 0 && (
              <div className="mt-4">
                <p className="text-xs tracking-wide mb-2" style={{ color: '#5aa0b4', fontWeight: '600' }}>ALL RECIPES</p>
                {rest.map(recipe => (
                  <div key={recipe.id} onClick={() => { setSelected(recipe); setView('detail'); }}
                    className="bg-white rounded-2xl p-4 mb-2 shadow-sm cursor-pointer">
                    <div className="flex justify-between items-start">
                      <p className="text-gray-800" style={{ fontWeight: '500' }}>{recipe.name}</p>
                      <p className="text-xs text-gray-400" style={{ fontWeight: '300' }}>Used {recipe.use_count || 0}x</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-1" style={{ fontWeight: '300' }}>{recipe.protein_source}</p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {recipe.batch_friendly && <TagBadge label="Batch friendly" active />}
                      {recipe.baby_adaptable && <TagBadge label="Baby adaptable" active />}
                      {recipe.one_pan && <TagBadge label="One pan" active />}
                      {recipe.prep_time && <TagBadge label={recipe.prep_time} plain />}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {recipes.length === 0 && (
              <div className="bg-white rounded-2xl p-8 mt-4 text-center shadow-sm">
                <p className="text-gray-400" style={{ fontWeight: '300' }}>No recipes yet. Add your first one!</p>
              </div>
            )}

            {/* Add Button */}
            <button onClick={() => setView('add')}
              className="w-full text-white rounded-2xl p-4 mt-4 text-base shadow-sm tracking-wide"
              style={{ backgroundColor: '#d5824a', fontWeight: '400', color: 'white' }}>
              + Add Recipe
            </button>
          </>
        )}

        {/* DETAIL VIEW */}
        {view === 'detail' && selected && (
          <div className="bg-white rounded-2xl p-5 mt-4 shadow-sm mb-8">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2 flex-wrap">
                {selected.batch_friendly && <TagBadge label="Batch friendly" active />}
                {selected.baby_adaptable && <TagBadge label="Baby adaptable" active />}
                {selected.one_pan && <TagBadge label="One pan" active />}
                {selected.prep_time && <TagBadge label={selected.prep_time} plain />}
              </div>
              <button onClick={() => updateRecipe({ ...selected, favorite: !selected.favorite })}
                className="text-xl">{selected.favorite ? '⭐' : '☆'}</button>
            </div>

            {selected.protein_source && (
              <p className="text-xs mb-3" style={{ color: '#5aa0b4', fontWeight: '500' }}>Protein: {selected.protein_source}</p>
            )}

            {selected.ingredients && (
              <>
                <p className="text-sm text-gray-800 mb-1" style={{ fontWeight: '500' }}>Ingredients</p>
                <p className="text-sm text-gray-600 mb-4 whitespace-pre-wrap" style={{ fontWeight: '300' }}>{selected.ingredients}</p>
              </>
            )}

            {selected.instructions && (
              <>
                <p className="text-sm text-gray-800 mb-1" style={{ fontWeight: '500' }}>Instructions</p>
                <p className="text-sm text-gray-600 mb-4 whitespace-pre-wrap" style={{ fontWeight: '300' }}>{selected.instructions}</p>
              </>
            )}

            {selected.nutritional_profile && (
              <>
                <p className="text-sm text-gray-800 mb-1" style={{ fontWeight: '500' }}>Nutrition</p>
                <p className="text-sm text-gray-600 mb-4 whitespace-pre-wrap" style={{ fontWeight: '300' }}>{selected.nutritional_profile}</p>
              </>
            )}

            {selected.notes && (
              <>
                <p className="text-sm text-gray-800 mb-1" style={{ fontWeight: '500' }}>Notes</p>
                <p className="text-sm text-gray-600 mb-4 whitespace-pre-wrap" style={{ fontWeight: '300' }}>{selected.notes}</p>
              </>
            )}

            {selected.url && (
              <a href={selected.url} target="_blank" rel="noopener noreferrer"
                className="text-sm" style={{ color: '#5aa0b4', fontWeight: '400' }}>
                🔗 View Original Recipe
              </a>
            )}

            <button onClick={() => incrementUseCount(selected)}
              className="w-full text-white rounded-2xl p-3 mt-4 text-sm"
              style={{ backgroundColor: '#99b8b8', fontWeight: '400', color: 'white' }}>
              ✓ I made this! ({selected.use_count || 0}x)
            </button>

            <button onClick={() => deleteRecipe(selected.id)}
              className="w-full rounded-2xl p-3 mt-2 text-sm"
              style={{ backgroundColor: '#f3f4f6', color: '#9ca3af', fontWeight: '400' }}>
              Delete Recipe
            </button>
          </div>
        )}

        {/* ADD VIEW */}
        {view === 'add' && (
          <div className="bg-white rounded-2xl p-5 mt-4 shadow-sm mb-8">

            {/* URL Import */}
            <p className="text-sm text-gray-800 mb-2" style={{ fontWeight: '500' }}>Import from URL</p>
            <div className="flex gap-2 mb-4">
              <input
                className="flex-1 border border-gray-200 rounded-xl p-3 text-sm"
                placeholder="Paste recipe URL..."
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                style={{ fontWeight: '300' }}
              />
              <button onClick={fetchFromUrl} disabled={fetchingUrl}
                className="text-white rounded-xl px-3 text-sm"
                style={{ backgroundColor: '#5aa0b4', color: 'white', fontWeight: '400' }}>
                {fetchingUrl ? '...' : 'Import'}
              </button>
            </div>

            <div className="border-t border-gray-100 my-4" />

            {/* Manual Entry */}
            <div className="space-y-3">
              <input className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                placeholder="Recipe name" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                style={{ fontWeight: '300' }} />

              <input className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                placeholder="Protein source (e.g. Chicken, Salmon, Lentils)"
                value={form.protein_source}
                onChange={e => setForm({ ...form, protein_source: e.target.value })}
                style={{ fontWeight: '300' }} />

              <input className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                placeholder="Prep time (e.g. 30 mins)"
                value={form.prep_time}
                onChange={e => setForm({ ...form, prep_time: e.target.value })}
                style={{ fontWeight: '300' }} />

              <textarea className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                placeholder="Ingredients" rows={4} value={form.ingredients}
                onChange={e => setForm({ ...form, ingredients: e.target.value })}
                style={{ fontWeight: '300' }} />

              <textarea className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                placeholder="Instructions" rows={4} value={form.instructions}
                onChange={e => setForm({ ...form, instructions: e.target.value })}
                style={{ fontWeight: '300' }} />

              <textarea className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                placeholder="Notes" rows={2} value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                style={{ fontWeight: '300' }} />

              {/* Tags */}
              <div className="flex flex-wrap gap-3">
                {[
                  { key: 'batch_friendly', label: 'Batch friendly' },
                  { key: 'baby_adaptable', label: 'Baby adaptable' },
                  { key: 'one_pan', label: 'One pan' },
                ].map(tag => (
                  <label key={tag.key} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={form[tag.key]}
                      onChange={e => setForm({ ...form, [tag.key]: e.target.checked })}
                      style={{ accentColor: '#5aa0b4' }} />
                    <span style={{ fontWeight: '300' }}>{tag.label}</span>
                  </label>
                ))}
              </div>

              {/* Analyze Nutrition */}
              <button onClick={analyzeNutrition} disabled={analyzingNutrition || !form.ingredients}
                className="w-full rounded-2xl p-3 text-sm"
                style={{ backgroundColor: '#f1caa6', color: '#d5824a', fontWeight: '400' }}>
                {analyzingNutrition ? '⏳ Analyzing...' : '🔍 Auto-analyze Nutrition'}
              </button>

              {form.nutritional_profile && (
                <div className="rounded-xl p-3" style={{ backgroundColor: '#f9f9f7' }}>
                  <p className="text-xs text-gray-500" style={{ fontWeight: '300' }}>{form.nutritional_profile}</p>
                </div>
              )}

              <button onClick={saveRecipe} disabled={!form.name}
                className="w-full text-white rounded-2xl p-4 text-base"
                style={{ backgroundColor: '#d5824a', fontWeight: '400', color: 'white' }}>
                Save Recipe
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
