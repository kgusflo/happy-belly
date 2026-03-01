'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function Settings() {
  const [members, setMembers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    const { data } = await supabase
      .from('family_members')
      .select('*')
      .order('created_at');
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

  if (loading) return (
    <main className="min-h-screen" style={{ backgroundColor: '#F9D7B5' }}>
      <div className="p-6 text-center" style={{ backgroundColor: '#5AA0B4' }}>
        <h1 className="text-2xl text-white tracking-wide" style={{ fontWeight: '500' }}>Settings</h1>
      </div>
      <div className="p-8 text-center" style={{ color: '#9AAC9D' }}>Loading...</div>
    </main>
  );

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#F9D7B5' }}>
      <div className="p-6 text-center" style={{ backgroundColor: '#5AA0B4' }}>
        <h1 className="text-2xl text-white tracking-wide" style={{ fontWeight: '500' }}>⚙️ Settings</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4" style={{ paddingBottom: '100px' }}>
        <p className="text-xs tracking-wide mt-4 mb-2" style={{ color: '#5AA0B4', fontWeight: '600' }}>FAMILY PROFILES</p>

        {members.map(member => {
          const babyStage = member.role === 'baby' ? getBabyStage(member.date_of_birth) : null;
          return (
            <div key={member.id} className="bg-white rounded-2xl p-5 mt-2 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-gray-800 text-lg" style={{ fontWeight: '500' }}>
                    {member.role === 'baby' ? '👶' : member.role === 'mom' ? '👩' : '👨'} {member.name}
                  </h2>
                  {babyStage && (
                    <div className="mt-1">
                      <p className="text-xs" style={{ color: '#D5824A', fontWeight: '500' }}>{babyStage.stage}</p>
                      <p className="text-xs" style={{ color: '#9AAC9D', fontWeight: '300' }}>{babyStage.prep}</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setEditing(member)}
                  className="text-sm px-3 py-1 rounded-lg text-white"
                  style={{ backgroundColor: '#9AAC9D', fontWeight: '400', color: 'white' }}
                >
                  Edit
                </button>
              </div>
              <div className="mt-3 space-y-1 text-sm" style={{ color: '#6b7280', fontWeight: '300' }}>
                {member.height && <p>Height: {member.height}</p>}
                {member.weight && <p>Weight: {member.weight}</p>}
                {member.activity_level && <p>Activity: {member.activity_level}</p>}
                {member.goals && <p>Goals: {member.goals}</p>}
                {member.supplements && <p>Supplements: {member.supplements}</p>}
                {member.notes && <p>Notes: {member.notes}</p>}
              </div>
            </div>
          );
        })}

        <button
          onClick={() => setEditing(emptyMember)}
          className="w-full text-white rounded-2xl p-4 mt-4 text-base shadow-sm"
          style={{ backgroundColor: '#D5824A', fontWeight: '400', color: 'white' }}
        >
          + Add Family Member
        </button>

        {/* Edit Modal */}
        {editing && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-50">
            <div style={{ position: 'fixed', top: '10vh', left: 0, right: 0, bottom: 0, backgroundColor: 'white', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', overflowY: 'scroll' }}>
              <h2 className="text-lg text-gray-800 mb-4" style={{ fontWeight: '500' }}>
                {editing.id ? 'Edit Profile' : 'Add Family Member'}
              </h2>
              <div className="space-y-3">
                <input className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                  placeholder="Name" value={editing.name}
                  onChange={e => setEditing({ ...editing, name: e.target.value })}
                  style={{ fontWeight: '300' }} />
                <select className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                  value={editing.role}
                  onChange={e => setEditing({ ...editing, role: e.target.value })}
                  style={{ fontWeight: '300' }}>
                  <option value="mom">Mom</option>
                  <option value="dad">Dad</option>
                  <option value="baby">Baby</option>
                  <option value="adult">Adult</option>
                </select>
                {editing.role === 'baby' && (
                  <div>
                    <label className="text-xs ml-1" style={{ color: '#9AAC9D', fontWeight: '300' }}>Date of Birth</label>
                    <input type="date" className="w-full border border-gray-200 rounded-xl p-3 text-sm mt-1"
                      value={editing.date_of_birth || ''}
                      onChange={e => setEditing({ ...editing, date_of_birth: e.target.value })}
                      style={{ fontWeight: '300' }} />
                  </div>
                )}
                <input className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                  placeholder="Height (e.g. 5ft 9in)" value={editing.height || ''}
                  onChange={e => setEditing({ ...editing, height: e.target.value })}
                  style={{ fontWeight: '300' }} />
                <input className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                  placeholder="Weight (e.g. 175 lbs)" value={editing.weight || ''}
                  onChange={e => setEditing({ ...editing, weight: e.target.value })}
                  style={{ fontWeight: '300' }} />
                <input className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                  placeholder="Activity level" value={editing.activity_level || ''}
                  onChange={e => setEditing({ ...editing, activity_level: e.target.value })}
                  style={{ fontWeight: '300' }} />
                <input className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                  placeholder="Goals" value={editing.goals || ''}
                  onChange={e => setEditing({ ...editing, goals: e.target.value })}
                  style={{ fontWeight: '300' }} />
                <input className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                  placeholder="Supplements" value={editing.supplements || ''}
                  onChange={e => setEditing({ ...editing, supplements: e.target.value })}
                  style={{ fontWeight: '300' }} />
                <textarea className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                  placeholder="Notes" rows={3} value={editing.notes || ''}
                  onChange={e => setEditing({ ...editing, notes: e.target.value })}
                  style={{ fontWeight: '300' }} />
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setEditing(null)}
                  className="flex-1 border border-gray-200 rounded-xl p-3 text-sm"
                  style={{ color: '#6b7280', fontWeight: '400' }}>
                  Cancel
                </button>
                {editing.id && (
                  <button onClick={() => { deleteProfile(editing.id); setEditing(null); }}
                    className="flex-1 text-white rounded-xl p-3 text-sm"
                    style={{ backgroundColor: '#E2A06F', fontWeight: '400', color: 'white' }}>
                    Delete
                  </button>
                )}
                <button onClick={() => saveProfile(editing)} disabled={saving}
                  className="flex-1 text-white rounded-xl p-3 text-sm"
                  style={{ backgroundColor: '#D5824A', fontWeight: '400', color: 'white' }}>
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
