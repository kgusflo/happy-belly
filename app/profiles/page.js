'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function Profiles() {
  const [members, setMembers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

useEffect(() => {
  const check = () => setIsDesktop(window.innerWidth >= 1024);
  check();
  window.addEventListener('resize', check);
  return () => window.removeEventListener('resize', check);
}, []);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    const { data } = await supabase.from('family_members').select('*').order('created_at');
    if (data) setMembers(data);
    setLoading(false);
  };

  const saveProfile = async (member) => {
    setSaving(true);
    const cleaned = {
      ...member,
      date_of_birth: member.date_of_birth || null,
      height: member.height || null,
      weight: member.weight || null,
      activity_level: member.activity_level || null,
      goals: member.goals || null,
      supplements: member.supplements || null,
      notes: member.notes || null,
    };
    if (cleaned.id) {
      await supabase.from('family_members').update(cleaned).eq('id', cleaned.id);
    } else {
      await supabase.from('family_members').insert(cleaned);
    }
    await fetchMembers();
    setEditing(null);
    setSaving(false);
  };

  const deleteProfile = async (id) => {
    await supabase.from('family_members').delete().eq('id', id);
    await fetchMembers();
  };

  const getBabyStage = (dob) => {
    if (!dob) return null;
    const months = Math.floor((new Date() - new Date(dob)) / (1000 * 60 * 60 * 24 * 30.44));
    if (months < 5) return { stage: 'Not ready for solids yet', prep: 'Breast milk or formula only' };
    if (months < 8) return { stage: `${months} months — Starting solids`, prep: 'Smooth purees, single ingredients' };
    if (months < 10) return { stage: `${months} months — Exploring textures`, prep: 'Soft mashed foods, soft finger foods' };
    if (months < 12) return { stage: `${months} months — Table foods`, prep: 'Soft chopped table food, variety of textures' };
    return { stage: `${months} months — Toddler eating`, prep: 'Most family foods, small soft pieces' };
  };

  const emptyMember = { name: '', role: 'adult', date_of_birth: '', height: '', weight: '', activity_level: '', goals: '', supplements: '', notes: '' };

  const inputStyle = {
    border: '1.5px solid #BDC2B4',
    borderRadius: '12px',
    padding: '10px 14px',
    fontSize: '13px',
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: '300',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };

  if (loading) return (
    <main style={{ backgroundColor: '#F9D7B5', minHeight: '100vh' }}>
      <div style={{ backgroundColor: '#5AA0B4', padding: '16px 20px', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'white' }}>Profiles</h1>
      </div>
      <div style={{ padding: '40px', textAlign: 'center', color: '#9AAC9D' }}>Loading...</div>
    </main>
  );

  return (
    <main style={{ backgroundColor: '#F9D7B5', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#5AA0B4', padding: '16px 20px', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'white' }}>Profiles</h1>
        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#F9D7B5', fontWeight: '300' }}>Manage your family profiles</p>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '20px 16px 100px 16px' }}>

        <p style={{ fontSize: '11px', fontWeight: '600', color: '#9AAC9D', letterSpacing: '0.5px', marginBottom: '12px' }}>FAMILY PROFILES</p>

        {members.map(member => {
          const babyStage = member.role === 'baby' ? getBabyStage(member.date_of_birth) : null;
          return (
            <div key={member.id} style={{ backgroundColor: 'white', borderRadius: '20px', padding: '16px', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '500', color: '#404F43' }}>
                    {member.role === 'baby' ? '👶' : member.role === 'mom' ? '👩' : '👨'} {member.name}
                  </p>
                  {babyStage && (
                    <div style={{ marginTop: '4px' }}>
                      <p style={{ margin: 0, fontSize: '12px', color: '#D5824A', fontWeight: '500' }}>{babyStage.stage}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#9AAC9D', fontWeight: '300' }}>{babyStage.prep}</p>
                    </div>
                  )}
                </div>
                <button onClick={() => setEditing(member)}
                  style={{ backgroundColor: '#F9D7B5', border: '1.5px solid #BDC2B4', borderRadius: '12px', padding: '6px 14px', fontSize: '12px', fontFamily: 'Montserrat, sans-serif', fontWeight: '400', cursor: 'pointer', color: '#404F43' }}>
                  Edit
                </button>
              </div>
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {member.height && <p style={{ margin: 0, fontSize: '13px', color: '#9AAC9D', fontWeight: '300' }}>Height: {member.height}</p>}
                {member.weight && <p style={{ margin: 0, fontSize: '13px', color: '#9AAC9D', fontWeight: '300' }}>Weight: {member.weight}</p>}
                {member.activity_level && <p style={{ margin: 0, fontSize: '13px', color: '#9AAC9D', fontWeight: '300' }}>Activity: {member.activity_level}</p>}
                {member.goals && <p style={{ margin: 0, fontSize: '13px', color: '#9AAC9D', fontWeight: '300' }}>Goals: {member.goals}</p>}
                {member.supplements && <p style={{ margin: 0, fontSize: '13px', color: '#9AAC9D', fontWeight: '300' }}>Supplements: {member.supplements}</p>}
              </div>
            </div>
          );
        })}

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <button onClick={() => setEditing(emptyMember)}
            style={{ backgroundColor: '#D5824A', color: 'white', border: 'none', borderRadius: '50px', padding: '12px 32px', fontSize: '14px', fontFamily: 'Montserrat, sans-serif', fontWeight: '500', cursor: 'pointer' }}>
            + Add Family Member
          </button>
        </div>

        {/* Edit Modal */}
        {editing && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 50 }}>
            <div style={{
  position: 'fixed',
  top: '10vh',
  left: isDesktop ? '60px' : 0,
  right: isDesktop ? '300px' : 0,
  bottom: 0,
  backgroundColor: 'white',
  borderTopLeftRadius: '24px',
  borderTopRightRadius: '24px',
  padding: '24px',
  overflowY: 'scroll'
}}>
              <h2 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '500', color: '#404F43' }}>
                {editing.id ? 'Edit Profile' : 'Add Family Member'}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input style={inputStyle} placeholder="Name" value={editing.name}
                  onChange={e => setEditing({ ...editing, name: e.target.value })} />
                <select style={inputStyle} value={editing.role}
                  onChange={e => setEditing({ ...editing, role: e.target.value })}>
                  <option value="mom">Mom</option>
                  <option value="dad">Dad</option>
                  <option value="baby">Baby</option>
                  <option value="adult">Adult</option>
                </select>
                {editing.role === 'baby' && (
                  <div>
                    <label style={{ fontSize: '12px', color: '#9AAC9D', fontWeight: '300', marginBottom: '4px', display: 'block' }}>Date of Birth</label>
                    <input type="date" style={inputStyle} value={editing.date_of_birth || ''}
                      onChange={e => setEditing({ ...editing, date_of_birth: e.target.value })} />
                  </div>
                )}
                <input style={inputStyle} placeholder="Height (e.g. 5ft 9in)" value={editing.height || ''}
                  onChange={e => setEditing({ ...editing, height: e.target.value })} />
                <input style={inputStyle} placeholder="Weight (e.g. 175 lbs)" value={editing.weight || ''}
                  onChange={e => setEditing({ ...editing, weight: e.target.value })} />
                <input style={inputStyle} placeholder="Activity level" value={editing.activity_level || ''}
                  onChange={e => setEditing({ ...editing, activity_level: e.target.value })} />
                <input style={inputStyle} placeholder="Goals" value={editing.goals || ''}
                  onChange={e => setEditing({ ...editing, goals: e.target.value })} />
                <input style={inputStyle} placeholder="Supplements" value={editing.supplements || ''}
                  onChange={e => setEditing({ ...editing, supplements: e.target.value })} />
                <textarea style={{ ...inputStyle, resize: 'none' }} placeholder="Notes" rows={3}
                  value={editing.notes || ''} onChange={e => setEditing({ ...editing, notes: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button onClick={() => setEditing(null)}
                  style={{ flex: 1, border: '1.5px solid #BDC2B4', borderRadius: '16px', padding: '12px', fontSize: '13px', fontFamily: 'Montserrat, sans-serif', fontWeight: '400', cursor: 'pointer', background: 'white', color: '#9AAC9D' }}>
                  Cancel
                </button>
                {editing.id && (
                  <button onClick={() => { deleteProfile(editing.id); setEditing(null); }}
                    style={{ flex: 1, backgroundColor: '#F9D7B5', border: '1.5px solid #BDC2B4', borderRadius: '16px', padding: '12px', fontSize: '13px', fontFamily: 'Montserrat, sans-serif', fontWeight: '400', cursor: 'pointer', color: '#D5824A' }}>
                    Delete
                  </button>
                )}
                <button onClick={() => saveProfile(editing)} disabled={saving}
                  style={{ flex: 1, backgroundColor: '#D5824A', color: 'white', border: 'none', borderRadius: '16px', padding: '12px', fontSize: '13px', fontFamily: 'Montserrat, sans-serif', fontWeight: '500', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
