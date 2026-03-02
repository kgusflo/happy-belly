'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);
  const [filterProtein, setFilterProtein] = useState('All');
  const [form, setForm] = useState({
    name: '', protein_source: '', ingredients: '', instructions: '',
    notes: '', prep_time: '', batch_friendly: false, baby_adaptable: false,
    one_pan: false, favorite: false, nutritional_profile: '', url: '', image_url: '',
  });
  const [urlInput, setUrlInput] = useState('');
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [analyzingNutrition, setAnalyzingNutrition] = useState(false);
  const [saving, setSaving] = useState(false);

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
        if (recipe) { setSelected(recipe); setView('detail'); }
      }
    }
    setLoading(false);
  };

const editRecipe = (recipe) => {
  setForm({
    name: recipe.name || '',
    protein_source: recipe.protein_source || '',
    ingredients: recipe.ingredients || '',
    instructions: recipe.instructions || '',
    notes: recipe.notes || '',
    prep_time: recipe.prep_time || '',
    batch_friendly: recipe.batch_friendly || false,
    baby_adaptable: recipe.baby_adaptable || false,
    one_pan: recipe.one_pan || false,
    favorite: recipe.favorite || false,
    nutritional_profile: recipe.nutritional_profile || '',
    url: recipe.url || '',
    image_url: recipe.image_url || '',
    id: recipe.id,
  });
  setView('add');
};

  const saveRecipe = async () => {
    setSaving(true);
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
    if (form.id) {
  await supabase.from('recipes').update(cleaned).eq('id', form.id);
} else {
  await supabase.from('recipes').insert(cleaned);
}
    await fetchRecipes();
    setView('list');
    setForm({
      name: '', protein_source: '', ingredients: '', instructions: '',
      notes: '', prep_time: '', batch_friendly: false, baby_adaptable: false,
      one_pan: false, favorite: false, nutritional_profile: '', url: '', image_url: '',
    });
    setSaving(false);
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
    setSelected(updated);
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
      if (data.recipe) setForm({ ...form, ...data.recipe, url: urlInput });
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
      alert('Could not analyze nutrition.');
    }
    setAnalyzingNutrition(false);
  };

  const proteinSources = ['All', ...new Set(recipes.map(r => r.protein_source).filter(Boolean))];
  const filtered = filterProtein === 'All' ? recipes : recipes.filter(r => r.protein_source === filterProtein);
  const favorites = filtered.filter(r => r.favorite);
  const rest = filtered.filter(r => !r.favorite);

  const TagBadge = ({ label, active, plain }) => (
    <span style={{
      fontSize: '11px',
      padding: '3px 10px',
      borderRadius: '20px',
      backgroundColor: plain ? 'transparent' : active ? '#F9D7B5' : '#f3f4f6',
      color: plain ? '#404F43' : active ? '#D5824A' : '#9ca3af',
      fontWeight: '400',
    }}>{label}</span>
  );

  const RecipeCard = ({ recipe }) => (
    <div onClick={() => { setSelected(recipe); setView('detail'); }}
      style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '16px',
        marginBottom: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        cursor: 'pointer',
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '500', color: '#404F43' }}>{recipe.name}</p>
          {recipe.protein_source && <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#9AAC9D', fontWeight: '300' }}>{recipe.protein_source}</p>}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {recipe.batch_friendly && <TagBadge label="Batch friendly" active />}
            {recipe.baby_adaptable && <TagBadge label="Baby adaptable" active />}
            {recipe.one_pan && <TagBadge label="One pan" active />}
            {recipe.prep_time && <TagBadge label={recipe.prep_time} plain />}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <span style={{ fontSize: '16px' }}>{recipe.favorite ? '⭐' : ''}</span>
          <p style={{ margin: 0, fontSize: '11px', color: '#BDC2B4', fontWeight: '300' }}>{recipe.use_count || 0}x</p>
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <main style={{ backgroundColor: '#F9D7B5', minHeight: '100vh' }}>
      <div style={{ backgroundColor: '#5AA0B4', padding: '16px 20px', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'white' }}>Recipe Library</h1>
      </div>
      <div style={{ padding: '40px', textAlign: 'center', color: '#9AAC9D' }}>Loading...</div>
    </main>
  );

  return (
    <main style={{ backgroundColor: '#F9D7B5', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#5AA0B4', padding: '16px 20px', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {view !== 'list' && (
          <button onClick={() => { setView('list'); setSelected(null); }}
            style={{ position: 'absolute', left: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'black', fontSize: '14px', fontFamily: 'Montserrat, sans-serif', fontWeight: '300', top: '50%', transform: 'translateY(-50%)' }}>
            ← Back
          </button>
        )}
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'white', paddingLeft: view !== 'list' ? '60px' : '0', paddingRight: view !== 'list' ? '60px' : '0', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {view === 'list' ? 'Recipe Library' : view === 'add' ? 'Add Recipe' : selected?.name}
        </h1>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '20px 16px 100px 16px' }}>

        {/* LIST VIEW */}
        {view === 'list' && (
          <>
            {/* Protein Filter */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px' }}>
              {proteinSources.map(p => (
                <button key={p} onClick={() => setFilterProtein(p)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontSize: '12px',
                    fontFamily: 'Montserrat, sans-serif',
                    backgroundColor: filterProtein === p ? '#5AA0B4' : 'white',
                    color: filterProtein === p ? 'white' : '#6b7280',
                    fontWeight: '400',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  }}>
                  {p}
                </button>
              ))}
            </div>

            {favorites.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '11px', fontWeight: '600', color: '#9AAC9D', letterSpacing: '0.5px', marginBottom: '8px' }}>⭐ FAVORITES</p>
                {favorites.map(r => <RecipeCard key={r.id} recipe={r} />)}
              </div>
            )}

            {rest.length > 0 && (
              <div>
                <p style={{ fontSize: '11px', fontWeight: '600', color: '#9AAC9D', letterSpacing: '0.5px', marginBottom: '8px' }}>ALL RECIPES</p>
                {rest.map(r => <RecipeCard key={r.id} recipe={r} />)}
              </div>
            )}

            {recipes.length === 0 && (
              <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '40px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <p style={{ color: '#9AAC9D', fontWeight: '300', fontSize: '14px', margin: 0 }}>No recipes yet. Add your first one!</p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <button onClick={() => setView('add')}
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
                }}>
                + Add Recipe
              </button>
            </div>
          </>
        )}

        {/* DETAIL VIEW */}
        {view === 'detail' && selected && (
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {selected.batch_friendly && <TagBadge label="Batch friendly" active />}
                {selected.baby_adaptable && <TagBadge label="Baby adaptable" active />}
                {selected.one_pan && <TagBadge label="One pan" active />}
                {selected.prep_time && <TagBadge label={selected.prep_time} plain />}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={() => editRecipe(selected)}
                  style={{ background: 'none', border: '1.5px solid #BDC2B4', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontFamily: 'Montserrat, sans-serif', color: '#404F43', cursor: 'pointer' }}>
                  Edit
                </button>
                <button onClick={() => updateRecipe({ ...selected, favorite: !selected.favorite })}
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>
                  {selected.favorite ? '⭐' : '☆'}
                </button>
              </div>
            </div>

            {selected.protein_source && (
              <p style={{ fontSize: '12px', color: '#5AA0B4', fontWeight: '500', marginBottom: '16px' }}>Protein: {selected.protein_source}</p>
            )}

            {selected.ingredients && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#9AAC9D', letterSpacing: '0.5px', marginBottom: '6px' }}>INGREDIENTS</p>
                <p style={{ fontSize: '14px', fontWeight: '300', color: '#404F43', lineHeight: '1.6', whiteSpace: 'pre-wrap', margin: 0 }}>{selected.ingredients}</p>
              </div>
            )}

            {selected.instructions && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#9AAC9D', letterSpacing: '0.5px', marginBottom: '6px' }}>INSTRUCTIONS</p>
                <p style={{ fontSize: '14px', fontWeight: '300', color: '#404F43', lineHeight: '1.6', whiteSpace: 'pre-wrap', margin: 0 }}>{selected.instructions}</p>
              </div>
            )}

            {selected.nutritional_profile && (
              <div style={{ marginBottom: '16px', backgroundColor: '#F9D7B5', borderRadius: '16px', padding: '12px 16px' }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#9AAC9D', letterSpacing: '0.5px', marginBottom: '6px' }}>NUTRITION</p>
                <p style={{ fontSize: '13px', fontWeight: '300', color: '#404F43', lineHeight: '1.6', margin: 0 }}>{selected.nutritional_profile}</p>
              </div>
            )}

            {selected.notes && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#9AAC9D', letterSpacing: '0.5px', marginBottom: '6px' }}>NOTES</p>
                <p style={{ fontSize: '14px', fontWeight: '300', color: '#404F43', lineHeight: '1.6', whiteSpace: 'pre-wrap', margin: 0 }}>{selected.notes}</p>
              </div>
            )}

            {selected.url && (
              <a href={selected.url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '13px', color: '#5AA0B4', fontWeight: '400', display: 'block', marginBottom: '16px' }}>
                🔗 View Original Recipe
              </a>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
              <button onClick={() => incrementUseCount(selected)}
                style={{
                  backgroundColor: '#9AAC9D',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '10px 24px',
                  fontSize: '13px',
                  fontWeight: '500',
                  fontFamily: 'Montserrat, sans-serif',
                  cursor: 'pointer',
                }}>
                  
                ✓ I made this! ({selected.use_count || 0}x)
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button onClick={() => deleteRecipe(selected.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '13px',
                  color: '#BDC2B4',
                  cursor: 'pointer',
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: '400',
                }}>
                Delete Recipe
              </button>
            </div>
          </div>
        )}

        {/* ADD VIEW */}
        {view === 'add' && (
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>

            <p style={{ fontSize: '12px', fontWeight: '600', color: '#9AAC9D', letterSpacing: '0.5px', marginBottom: '8px' }}>IMPORT FROM URL</p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input
                style={{ flex: 1, border: '1.5px solid #BDC2B4', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', fontFamily: 'Montserrat, sans-serif', fontWeight: '300', outline: 'none' }}
                placeholder="Paste recipe URL..."
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
              />
              <button onClick={fetchFromUrl} disabled={fetchingUrl}
                style={{ backgroundColor: '#5AA0B4', color: 'white', border: 'none', borderRadius: '12px', padding: '10px 16px', fontSize: '13px', fontFamily: 'Montserrat, sans-serif', fontWeight: '400', cursor: 'pointer' }}>
                {fetchingUrl ? '...' : 'Import'}
              </button>
            </div>

            <div style={{ borderTop: '1px solid #f3f4f6', marginBottom: '20px' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { key: 'name', placeholder: 'Recipe name', required: true },
                { key: 'protein_source', placeholder: 'Protein source (e.g. Chicken, Salmon)' },
                { key: 'prep_time', placeholder: 'Prep time (e.g. 30 mins)' },
              ].map(field => (
                <input key={field.key}
                  style={{ border: '1.5px solid #BDC2B4', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', fontFamily: 'Montserrat, sans-serif', fontWeight: '300', outline: 'none' }}
                  placeholder={field.placeholder}
                  value={form[field.key]}
                  onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                />
              ))}

              {[
                { key: 'ingredients', placeholder: 'Ingredients', rows: 4 },
                { key: 'instructions', placeholder: 'Instructions', rows: 4 },
                { key: 'notes', placeholder: 'Notes', rows: 2 },
              ].map(field => (
                <textarea key={field.key}
                  style={{ border: '1.5px solid #BDC2B4', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', fontFamily: 'Montserrat, sans-serif', fontWeight: '300', outline: 'none', resize: 'none' }}
                  placeholder={field.placeholder}
                  rows={field.rows}
                  value={form[field.key]}
                  onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                />
              ))}

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {[
                  { key: 'batch_friendly', label: 'Batch friendly' },
                  { key: 'baby_adaptable', label: 'Baby adaptable' },
                  { key: 'one_pan', label: 'One pan' },
                ].map(tag => (
                  <label key={tag.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#404F43', cursor: 'pointer', fontWeight: '300' }}>
                    <input type="checkbox" checked={form[tag.key]}
                      onChange={e => setForm({ ...form, [tag.key]: e.target.checked })}
                      style={{ accentColor: '#5AA0B4' }} />
                    {tag.label}
                  </label>
                ))}
              </div>

              <button onClick={analyzeNutrition} disabled={analyzingNutrition || !form.ingredients}
                style={{ backgroundColor: '#F9D7B5', border: '1.5px solid #BDC2B4', borderRadius: '12px', padding: '10px', fontSize: '13px', fontFamily: 'Montserrat, sans-serif', color: '#D5824A', fontWeight: '400', cursor: 'pointer' }}>
                {analyzingNutrition ? '⏳ Analyzing...' : '🔍 Auto-analyze Nutrition'}
              </button>

              {form.nutritional_profile && (
                <div style={{ backgroundColor: '#F9D7B5', borderRadius: '12px', padding: '12px' }}>
                  <p style={{ fontSize: '12px', color: '#404F43', fontWeight: '300', margin: 0 }}>{form.nutritional_profile}</p>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
                <button onClick={saveRecipe} disabled={!form.name || saving}
                  style={{ backgroundColor: '#D5824A', color: 'white', border: 'none', borderRadius: '50px', padding: '12px 40px', fontSize: '14px', fontFamily: 'Montserrat, sans-serif', fontWeight: '500', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Saving...' : 'Save Recipe'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
