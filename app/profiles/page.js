'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';

export default function Profiles() {
  const [members, setMembers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    const { data, error } = await supabase
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
    await supabase
      .from('family_members')
      .delete()
      .eq('id', id);
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
    <main className="min-h-screen" style={{ backgroundColor: '#d9d0bc' }}>
      <div className="p-6 text-center" style={{ backgroundColor: '#5aa0b4', position: 'relative' }}>
        <h1 className="text-2xl text-white tracking-wide" style={{ fontWeight: '500' }}>Family Profiles</h1>
      </div>
      <div className="p-8 text-center text-gray-500">Loading...</div>
    </main>
  );

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#d9d0bc' }}>
      <div className="p-6 text-center" style={{ backgroundColor: '#5aa0b4' }}>
        <a href="/" style={{ fontWeight: '300', color: 'black', position: 'absolute', left: '16px', top: '30px', fontSize: '14px' }}>← Back</a>
        <h1 className="text-2xl text-white tracking-wide" style={{ fontWeight: '500' }}>Family Profiles</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4">

        {/* Family Members */}
        {members.map(member => {
          const babyStage = member.role === 'baby' ? getBabyStage(member.date_of_birth) : null;
          return (
            <div key={member.id} className="bg-white rounded-2xl p-5 mt-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-gray-800 text-lg" style={{ fontWeight: '500' }}>
                    {member.role === 'baby' ? '👶' : member.role === 'mom' ? '👩' : '👨'} {member.name}
                  </h2>
                  {babyStage && (
                    <div className="mt-1 text-xs">
                      <p style={{ fontWeight: '500' }}>{babyStage.stage}</p>
                      <p style={{ fontWeight: '300' }}>{babyStage.prep}</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setEditing(member)}
                  className="text-sm px-3 py-1 rounded-lg text-white"
                  style={{ backgroundColor: '#99b8b8', fontWeight: '400' }}
                >
                  Edit
                </button>
              </div>
              <div className="mt-3 space-y-1 text-sm text-gray-500" style={{ fontWeight: '300' }}>
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

        {/* Add New Member Button */}
        <button
          onClick={() => setEditing(emptyMember)}
          className="w-full text-white rounded-2xl p-4 mt-4 text-base shadow-sm tracking-wide"
          style={{ backgroundColor: '#d5824a', fontWeight: '400', color: 'white' }}
        >
          + Add Family Member
        </button>

        {/* Edit / Add Modal */}
        {editing && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-50">
            <div style={{ position: 'fixed', top: '10vh', left: 0, right: 0, bottom: 0, backgroundColor: 'white', borderTopLeftRadius: '24px', padding: '24px', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' }}>

              <h2 className="text-lg text-gray-800 mb-4" style={{ fontWeight: '500' }}>
                {editing.id ? 'Edit Profile' : 'Add Family Member'}
              </h2>
              <div className="space-y-3">
                <input
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                  placeholder="Name"
                  value={editing.name}
                  onChange={e => setEditing({ ...editing, name: e.target.value })}
                  style={{ fontWeight: '300' }}
                />
                <select
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                  value={editing.role}
                  onChange={e => setEditing({ ...editing, role: e.target.value })}
                  style={{ fontWeight: '300' }}
                >
                  <option value="mom">Mom</option>
                  <option value="dad">Dad</option>
                  <option value="baby">Baby</option>
                  <option value="adult">Adult</option>
                </select>
                {editing.role === 'baby' && (
                  <div>
                    <label className="text-xs text-gray-400 ml-1" style={{ fontWeight: '300' }}>Date of Birth</label>
                    <input
                      type="date"
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm mt-1"
                      value={editing.date_of_birth || ''}
                      onChange={e => setEditing({ ...editing, date_of_birth: e.target.value })}
                      style={{ fontWeight: '300' }}
                    />
                  </div>
                )}
                <input
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                  placeholder="Height (e.g. 5ft 9in)"
                  value={editing.height || ''}
                  onChange={e => setEditing({ ...editing, height: e.target.value })}
                  style={{ fontWeight: '300' }}
                />
                <input
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                  placeholder="Weight (e.g. 175 lbs)"
                  value={editing.weight || ''}
                  onChange={e => setEditing({ ...editing, weight: e.target.value })}
                  style={{ fontWeight: '300' }}
                />
                <input
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                  placeholder="Activity level"
                  value={editing.activity_level || ''}
                  onChange={e => setEditing({ ...editing, activity_level: e.target.value })}
                  style={{ fontWeight: '300' }}
                />
                <input
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                  placeholder="Goals"
                  value={editing.goals || ''}
                  onChange={e => setEditing({ ...editing, goals: e.target.value })}
                  style={{ fontWeight: '300' }}
                />
                <input
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                  placeholder="Supplements"
                  value={editing.supplements || ''}
                  onChange={e => setEditing({ ...editing, supplements: e.target.value })}
                  style={{ fontWeight: '300' }}
                />
                <textarea
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                  placeholder="Notes"
                  rows={3}
                  value={editing.notes || ''}
                  onChange={e => setEditing({ ...editing, notes: e.target.value })}
                  style={{ fontWeight: '300' }}
                />
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setEditing(null)}
                  className="flex-1 border border-gray-200 text-gray-500 rounded-xl p-3 text-sm"
                  style={{ fontWeight: '400' }}
                >
                  Cancel
                </button>
                {editing.id && (
                  <button
                    onClick={() => { deleteProfile(editing.id); setEditing(null); }}
                    className="flex-1 text-white rounded-xl p-3 text-sm"
                    style={{ backgroundColor: '#e3a578', fontWeight: '400', color: 'white' }}
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={() => saveProfile(editing)}
                  disabled={saving}
                  className="flex-1 text-white rounded-xl p-3 text-sm"
                  style={{ backgroundColor: '#d5824a', fontWeight: '400', color: 'white' }}
                >
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
