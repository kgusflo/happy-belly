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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [extractingFromPhoto, setExtractingFromPhoto] = useState(false);
  const [photoPreviewNames, setPhotoPreviewNames] = useState([]);

  useEffect(() => { fetchRecipes(); }, []);

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
    } catch {
      alert('Could not fetch recipe from that URL. Try adding it manually.');
    }
    setFetchingUrl(false);
  };

  const extractFromPhotos = async (files) => {
    if (!files || files.length === 0) return;
    setExtractingFromPhoto(true);
    setPhotoPreviewNames(Array.from(files).map(f => f.name));
    try {
      const images = await Promise.all(Array.from(files).map(file =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ data: reader.result.split(',')[1], mediaType: file.type || 'image/jpeg' });
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
      ));
      const res = await fetch('/api/extract-recipe-from-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images }),
      });
      const data = await res.json();
      if (data.recipe) {
        setForm(prev => ({ ...prev, ...data.recipe }));
      } else {
        alert('Could not read the recipe from those photos. Try a clearer photo or add manually.');
      }
    } catch {
      alert('Something went wrong reading the photos. Try again.');
    }
    setExtractingFromPhoto(false);
    setPhotoPreviewNames([]);
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
    } catch {
      alert('Could not analyze nutrition.');
    }
    setAnalyzingNutrition(false);
  };

  const uploadPhoto = async (file) => {
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const { error } = await supabase.storage.from('recipe-images').upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('recipe-images').getPublicUrl(fileName);
      setForm(prev => ({ ...prev, image_url: publicUrl }));
    } catch {
      alert('Could not upload photo. Make sure you have a "recipe-images" storage bucket in Supabase.');
    }
    setUploadingPhoto(false);
  };

  const proteinSources = ['All', ...new Set(recipes.map(r => r.protein_source).filter(Boolean))];
  const filtered = filterProtein === 'All' ? recipes : recipes.filter(r => r.protein_source === filterProtein);
  const favorites = filtered.filter(r => r.favorite);
  const rest = filtered.filter(r => !r.favorite);

  // ── Shared sub-components ─────────────────────────────────────────────────

  const TagBadge = ({ label, active, plain }) => (
    <span style={{
      fontSize: '11px',
      padding: '3px 10px',
      borderRadius: '20px',
      fontFamily: 'Montserrat, sans-serif',
      backgroundColor: plain ? 'transparent' : active ? 'rgba(213,130,74,0.15)' : 'rgba(0,0,0,0.06)',
      border: active ? '1px solid rgba(213,130,74,0.3)' : 'none',
      color: plain ? '#9AAC9D' : active ? '#D5824A' : '#9AAC9D',
      fontWeight: '400',
    }}>{label}</span>
  );

  const RecipeCard = ({ recipe }) => (
    <div
      onClick={() => { setSelected(recipe); setView('detail'); }}
      className="glass-card"
      style={{ padding: '16px', marginBottom: '10px', cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '500', color: '#404F43', fontFamily: 'Montserrat, sans-serif' }}>{recipe.name}</p>
          {recipe.protein_source && (
            <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#9AAC9D', fontWeight: '300', fontFamily: 'Montserrat, sans-serif' }}>{recipe.protein_source}</p>
          )}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {recipe.batch_friendly && <TagBadge label="Batch friendly" active />}
            {recipe.baby_adaptable && <TagBadge label="Baby adaptable" active />}
            {recipe.one_pan && <TagBadge label="One pan" active />}
            {recipe.prep_time && <TagBadge label={recipe.prep_time} plain />}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <span style={{ fontSize: '16px' }}>{recipe.favorite ? '⭐' : ''}</span>
          <p style={{ margin: 0, fontSize: '11px', color: '#BDC2B4', fontWeight: '300', fontFamily: 'Montserrat, sans-serif' }}>{recipe.use_count || 0}x</p>
        </div>
      </div>
    </div>
  );

  // ── Frosted glass teal header (shared between loading + main) ─────────────

  const PageHeader = () => (
    <div style={{
      background: 'rgba(90, 160, 180, 0.72)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.25)',
      padding: '16px 20px',
      borderBottomLeftRadius: '20px',
      borderBottomRightRadius: '20px',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {view !== 'list' && (
        <button
          onClick={() => { setView('list'); setSelected(null); }}
          style={{ position: 'absolute', left: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'white', fontSize: '14px', fontFamily: 'Montserrat, sans-serif', fontWeight: '300', top: '50%', transform: 'translateY(-50%)' }}
        >← Back</button>
      )}
      <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'white', fontFamily: 'Montserrat, sans-serif' }}>
        {view === 'list' ? 'Recipe Library' : view === 'add' ? (form.id ? 'Edit Recipe' : 'Add Recipe') : selected?.name}
      </h1>
    </div>
  );

  // ── Input style used in the add form ─────────────────────────────────────

  const inputStyle = {
    border: '1.5px solid rgba(189,194,180,0.7)',
    borderRadius: '12px',
    padding: '10px 14px',
    fontSize: '13px',
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: '300',
    outline: 'none',
    backgroundColor: 'rgba(255,255,255,0.6)',
    color: '#404F43',
    width: '100%',
    boxSizing: 'border-box',
  };

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading) return (
    <main style={{ minHeight: '100vh' }}>
      <div style={{
        background: 'rgba(90, 160, 180, 0.72)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.25)',
        padding: '16px 20px',
        borderBottomLeftRadius: '20px',
        borderBottomRightRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'white', fontFamily: 'Montserrat, sans-serif' }}>Recipe Library</h1>
      </div>
      <div style={{ padding: '40px', textAlign: 'center', color: '#9AAC9D', fontFamily: 'Montserrat, sans-serif' }}>Loading...</div>
    </main>
  );

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <main style={{ minHeight: '100vh' }}>

      <PageHeader />

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '20px 16px 100px' }}>

        {/* ── LIST VIEW ── */}
        {view === 'list' && (
          <>
            {/* Protein filter pills */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px' }}>
              {proteinSources.map(p => (
                <button
                  key={p}
                  onClick={() => setFilterProtein(p)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '20px',
                    border: filterProtein === p ? 'none' : '1px solid rgba(255,255,255,0.65)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontSize: '12px',
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: filterProtein === p ? '600' : '400',
                    backgroundColor: filterProtein === p ? '#D5824A' : 'rgba(255,255,255,0.55)',
                    backdropFilter: filterProtein === p ? 'none' : 'blur(8px)',
                    WebkitBackdropFilter: filterProtein === p ? 'none' : 'blur(8px)',
                    color: filterProtein === p ? 'white' : '#9AAC9D',
                    boxShadow: filterProtein === p ? '0 2px 8px rgba(213,130,74,0.35)' : '0 1px 4px rgba(0,0,0,0.06)',
                    transition: 'all 0.15s',
                  }}
                >{p}</button>
              ))}
            </div>

            {favorites.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '10px', fontWeight: '700', color: '#9AAC9D', letterSpacing: '1px', marginBottom: '8px', fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase' }}>⭐ Favorites</p>
                {favorites.map(r => <RecipeCard key={r.id} recipe={r} />)}
              </div>
            )}

            {rest.length > 0 && (
              <div>
                <p style={{ fontSize: '10px', fontWeight: '700', color: '#9AAC9D', letterSpacing: '1px', marginBottom: '8px', fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase' }}>All Recipes</p>
                {rest.map(r => <RecipeCard key={r.id} recipe={r} />)}
              </div>
            )}

            {recipes.length === 0 && (
              <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ color: '#9AAC9D', fontWeight: '300', fontSize: '14px', margin: 0, fontFamily: 'Montserrat, sans-serif' }}>No recipes yet. Add your first one!</p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <button
                onClick={() => setView('add')}
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
                  boxShadow: '0 4px 16px rgba(213,130,74,0.35)',
                }}
              >+ Add Recipe</button>
            </div>
          </>
        )}

        {/* ── DETAIL VIEW ── */}
        {view === 'detail' && selected && (
          <div className="glass-card" style={{ padding: '20px' }}>

            {selected.image_url && (
              <div style={{ margin: '-20px -20px 20px -20px' }}>
                <img
                  src={selected.image_url}
                  alt={selected.name}
                  style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '20px 20px 0 0' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {selected.batch_friendly && <TagBadge label="Batch friendly" active />}
                {selected.baby_adaptable && <TagBadge label="Baby adaptable" active />}
                {selected.one_pan && <TagBadge label="One pan" active />}
                {selected.prep_time && <TagBadge label={selected.prep_time} plain />}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => editRecipe(selected)}
                  style={{ background: 'rgba(255,255,255,0.5)', border: '1.5px solid rgba(189,194,180,0.7)', borderRadius: '20px', padding: '4px 14px', fontSize: '12px', fontFamily: 'Montserrat, sans-serif', color: '#404F43', cursor: 'pointer' }}
                >Edit</button>
                <button
                  onClick={() => updateRecipe({ ...selected, favorite: !selected.favorite })}
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
                >{selected.favorite ? '⭐' : '☆'}</button>
              </div>
            </div>

            {selected.protein_source && (
              <p style={{ fontSize: '12px', color: '#5AA0B4', fontWeight: '500', marginBottom: '16px', fontFamily: 'Montserrat, sans-serif' }}>Protein: {selected.protein_source}</p>
            )}

            {selected.ingredients && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '10px', fontWeight: '700', color: '#9AAC9D', letterSpacing: '1px', marginBottom: '6px', fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase' }}>Ingredients</p>
                <p style={{ fontSize: '14px', fontWeight: '300', color: '#404F43', lineHeight: '1.65', whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'Montserrat, sans-serif' }}>{selected.ingredients}</p>
              </div>
            )}

            {selected.instructions && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '10px', fontWeight: '700', color: '#9AAC9D', letterSpacing: '1px', marginBottom: '6px', fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase' }}>Instructions</p>
                <p style={{ fontSize: '14px', fontWeight: '300', color: '#404F43', lineHeight: '1.65', whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'Montserrat, sans-serif' }}>{selected.instructions}</p>
              </div>
            )}

            {selected.nutritional_profile && (
              <div style={{ marginBottom: '16px', backgroundColor: 'rgba(249,215,181,0.45)', borderRadius: '14px', padding: '12px 16px', border: '1px solid rgba(255,255,255,0.6)' }}>
                <p style={{ fontSize: '10px', fontWeight: '700', color: '#9AAC9D', letterSpacing: '1px', marginBottom: '6px', fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase' }}>Nutrition</p>
                <p style={{ fontSize: '13px', fontWeight: '300', color: '#404F43', lineHeight: '1.6', margin: 0, fontFamily: 'Montserrat, sans-serif' }}>{selected.nutritional_profile}</p>
              </div>
            )}

            {selected.notes && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '10px', fontWeight: '700', color: '#9AAC9D', letterSpacing: '1px', marginBottom: '6px', fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase' }}>Notes</p>
                <p style={{ fontSize: '14px', fontWeight: '300', color: '#404F43', lineHeight: '1.65', whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'Montserrat, sans-serif' }}>{selected.notes}</p>
              </div>
            )}

            {selected.url && (
              <a
                href={selected.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '13px', color: '#5AA0B4', fontWeight: '400', display: 'block', marginBottom: '16px', fontFamily: 'Montserrat, sans-serif' }}
              >🔗 View Original Recipe</a>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
              <button
                onClick={() => incrementUseCount(selected)}
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
                }}
              >✓ I made this! ({selected.use_count || 0}x)</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => deleteRecipe(selected.id)}
                style={{ background: 'none', border: 'none', fontSize: '13px', color: '#BDC2B4', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontWeight: '400' }}
              >Delete Recipe</button>
            </div>
          </div>
        )}

        {/* ── ADD / EDIT VIEW ── */}
        {view === 'add' && (
          <div className="glass-card" style={{ padding: '20px' }}>

            <p style={{ fontSize: '10px', fontWeight: '700', color: '#9AAC9D', letterSpacing: '1px', marginBottom: '8px', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Import from URL</p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                placeholder="Paste recipe URL..."
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
              />
              <button
                onClick={fetchFromUrl}
                disabled={fetchingUrl}
                style={{ backgroundColor: '#5AA0B4', color: 'white', border: 'none', borderRadius: '12px', padding: '10px 16px', fontSize: '13px', fontFamily: 'Montserrat, sans-serif', fontWeight: '400', cursor: 'pointer', flexShrink: 0 }}
              >{fetchingUrl ? '...' : 'Import'}</button>
            </div>

            <p style={{ fontSize: '10px', fontWeight: '700', color: '#9AAC9D', letterSpacing: '1px', marginBottom: '8px', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Import from Photo</p>
            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              border: '1.5px dashed rgba(189,194,180,0.8)', borderRadius: '12px', padding: '12px 16px',
              fontSize: '13px', fontFamily: 'Montserrat, sans-serif', color: '#5AA0B4',
              fontWeight: '400', cursor: extractingFromPhoto ? 'default' : 'pointer',
              marginBottom: '8px', opacity: extractingFromPhoto ? 0.6 : 1,
              backgroundColor: 'rgba(255,255,255,0.3)',
            }}>
              {extractingFromPhoto
                ? `⏳ Reading ${photoPreviewNames.length} photo${photoPreviewNames.length !== 1 ? 's' : ''}...`
                : '📸 Select photo(s) of a recipe'}
              <input type="file" accept="image/*" multiple style={{ display: 'none' }} disabled={extractingFromPhoto}
                onChange={e => e.target.files.length > 0 && extractFromPhotos(e.target.files)} />
            </label>
            <p style={{ fontSize: '11px', color: '#BDC2B4', fontWeight: '300', margin: '0 0 16px 2px', fontFamily: 'Montserrat, sans-serif' }}>
              Select multiple photos if your recipe spans several screenshots
            </p>

            <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', marginBottom: '20px' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { key: 'name', placeholder: 'Recipe name *' },
                { key: 'protein_source', placeholder: 'Protein source (e.g. Chicken, Salmon)' },
                { key: 'prep_time', placeholder: 'Prep time (e.g. 30 mins)' },
              ].map(field => (
                <input
                  key={field.key}
                  style={inputStyle}
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
                <textarea
                  key={field.key}
                  style={{ ...inputStyle, resize: 'none' }}
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
                  <label key={tag.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#404F43', cursor: 'pointer', fontWeight: '300', fontFamily: 'Montserrat, sans-serif' }}>
                    <input type="checkbox" checked={form[tag.key]}
                      onChange={e => setForm({ ...form, [tag.key]: e.target.checked })}
                      style={{ accentColor: '#D5824A' }} />
                    {tag.label}
                  </label>
                ))}
              </div>

              {/* Photo Upload */}
              <div>
                <p style={{ fontSize: '10px', fontWeight: '700', color: '#9AAC9D', letterSpacing: '1px', marginBottom: '8px', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Photo</p>
                {form.image_url && (
                  <div style={{ position: 'relative', marginBottom: '8px' }}>
                    <img src={form.image_url} alt="Recipe" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '12px' }} />
                    <button
                      onClick={() => setForm(prev => ({ ...prev, image_url: '' }))}
                      style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', color: 'white', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >✕</button>
                  </div>
                )}
                <label style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  backgroundColor: 'rgba(249,215,181,0.5)', border: '1.5px dashed rgba(189,194,180,0.8)', borderRadius: '12px',
                  padding: '12px', fontSize: '13px', fontFamily: 'Montserrat, sans-serif',
                  color: '#D5824A', fontWeight: '400', cursor: 'pointer',
                  opacity: uploadingPhoto ? 0.6 : 1,
                }}>
                  {uploadingPhoto ? '⏳ Uploading...' : '📷 ' + (form.image_url ? 'Change Photo' : 'Add Photo')}
                  <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploadingPhoto}
                    onChange={e => e.target.files[0] && uploadPhoto(e.target.files[0])} />
                </label>
              </div>

              <button
                onClick={analyzeNutrition}
                disabled={analyzingNutrition || !form.ingredients}
                style={{ backgroundColor: 'rgba(249,215,181,0.5)', border: '1.5px solid rgba(189,194,180,0.7)', borderRadius: '12px', padding: '10px', fontSize: '13px', fontFamily: 'Montserrat, sans-serif', color: '#D5824A', fontWeight: '400', cursor: 'pointer' }}
              >{analyzingNutrition ? '⏳ Analyzing...' : '🔍 Auto-analyze Nutrition'}</button>

              {form.nutritional_profile && (
                <div style={{ backgroundColor: 'rgba(249,215,181,0.45)', borderRadius: '12px', padding: '12px', border: '1px solid rgba(255,255,255,0.6)' }}>
                  <p style={{ fontSize: '12px', color: '#404F43', fontWeight: '300', margin: 0, fontFamily: 'Montserrat, sans-serif' }}>{form.nutritional_profile}</p>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
                <button
                  onClick={saveRecipe}
                  disabled={!form.name || saving}
                  style={{ backgroundColor: '#D5824A', color: 'white', border: 'none', borderRadius: '50px', padding: '12px 40px', fontSize: '14px', fontFamily: 'Montserrat, sans-serif', fontWeight: '500', cursor: 'pointer', opacity: saving ? 0.6 : 1, boxShadow: '0 4px 16px rgba(213,130,74,0.35)' }}
                >{saving ? 'Saving...' : 'Save Recipe'}</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
