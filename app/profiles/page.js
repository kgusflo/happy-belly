'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ProfileModal from '../components/ProfileModal';

export default function Profiles() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatModal, setChatModal] = useState({ isOpen: false, memberType: null, existingProfile: null });
  const autoLaunched = { current: false };

  const fetchMembers = async () => {
    const { data } = await supabase.from('family_members').select('*').order('created_at');
    if (data) {
      setMembers(data);
      if (data.length === 0 && !autoLaunched.current) {
        autoLaunched.current = true;
        setChatModal({ isOpen: true, memberType: null, existingProfile: null });
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchMembers(); }, []); // eslint-disable-line

  const deleteProfile = async (id, name) => {
    if (!window.confirm(`Remove ${name}'s profile?`)) return;
    await supabase.from('family_members').delete().eq('id', id);
    await fetchMembers();
  };

  const openChat = (memberType, existingProfile = null) => {
    setChatModal({ isOpen: true, memberType, existingProfile });
  };

  const closeChat = () => {
    setChatModal({ isOpen: false, memberType: null, existingProfile: null });
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

  // ── Frosted teal header ───────────────────────────────────────────────────

  const tealHeader = (
    <div style={{
      background: 'rgba(90, 160, 180, 0.72)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.25)',
      padding: '16px 20px',
      borderBottomLeftRadius: '20px',
      borderBottomRightRadius: '20px',
    }}>
      <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'white', fontFamily: 'Montserrat, sans-serif' }}>Profiles</h1>
      <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.75)', fontWeight: '300', fontFamily: 'Montserrat, sans-serif' }}>Manage your family profiles</p>
    </div>
  );

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading) return (
    <main style={{ minHeight: '100vh' }}>
      {tealHeader}
      <div style={{ padding: '40px', textAlign: 'center', color: '#9AAC9D', fontFamily: 'Montserrat, sans-serif' }}>Loading...</div>
    </main>
  );

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <main style={{ minHeight: '100vh' }}>

      {tealHeader}

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '20px 16px 100px' }}>

        <p style={{ fontSize: '10px', fontWeight: '700', color: '#9AAC9D', letterSpacing: '1px', marginBottom: '12px', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Family Profiles</p>

        {/* Empty state */}
        {members.length === 0 && (
          <div className="glass-card" style={{ padding: '24px', textAlign: 'center', marginBottom: '12px' }}>
            <p style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '500', color: '#404F43', fontFamily: 'Montserrat, sans-serif' }}>No profiles yet</p>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: '300', color: '#9AAC9D', fontFamily: 'Montserrat, sans-serif' }}>Add your family members so Claude can personalise your meal plans.</p>
          </div>
        )}

        {/* Profile cards */}
        {members.map(member => {
          const babyStage = member.role === 'baby' ? getBabyStage(member.date_of_birth) : null;
          return (
            <div key={member.id} className="glass-card" style={{ padding: '16px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '500', color: '#404F43', fontFamily: 'Montserrat, sans-serif' }}>
                    {member.name}
                  </p>
                  {babyStage && (
                    <div style={{ marginTop: '4px' }}>
                      <p style={{ margin: 0, fontSize: '12px', color: '#D5824A', fontWeight: '500', fontFamily: 'Montserrat, sans-serif' }}>{babyStage.stage}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#9AAC9D', fontWeight: '300', fontFamily: 'Montserrat, sans-serif' }}>{babyStage.prep}</p>
                    </div>
                  )}
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {member.height && <p style={{ margin: 0, fontSize: '13px', color: '#9AAC9D', fontWeight: '300', fontFamily: 'Montserrat, sans-serif' }}>Height: {member.height}</p>}
                    {member.weight && <p style={{ margin: 0, fontSize: '13px', color: '#9AAC9D', fontWeight: '300', fontFamily: 'Montserrat, sans-serif' }}>Weight: {member.weight}</p>}
                    {member.activity_level && <p style={{ margin: 0, fontSize: '13px', color: '#9AAC9D', fontWeight: '300', fontFamily: 'Montserrat, sans-serif' }}>Activity: {member.activity_level}</p>}
                    {member.goals && <p style={{ margin: 0, fontSize: '13px', color: '#9AAC9D', fontWeight: '300', fontFamily: 'Montserrat, sans-serif' }}>Goals: {member.goals}</p>}
                    {member.supplements && <p style={{ margin: 0, fontSize: '13px', color: '#9AAC9D', fontWeight: '300', fontFamily: 'Montserrat, sans-serif' }}>Supplements: {member.supplements}</p>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginLeft: '12px' }}>
                  <button
                    onClick={() => openChat(member.role === 'baby' ? 'baby' : 'adult', member)}
                    style={{ backgroundColor: 'rgba(249,215,181,0.5)', border: '1.5px solid rgba(189,194,180,0.7)', borderRadius: '12px', padding: '6px 14px', fontSize: '12px', fontFamily: 'Montserrat, sans-serif', fontWeight: '400', cursor: 'pointer', color: '#404F43' }}
                  >Edit</button>
                  <button
                    onClick={() => deleteProfile(member.id, member.name)}
                    style={{ backgroundColor: 'transparent', border: '1.5px solid rgba(196,136,122,0.6)', borderRadius: '12px', padding: '6px 10px', fontSize: '12px', fontFamily: 'Montserrat, sans-serif', fontWeight: '400', cursor: 'pointer', color: '#C4887A' }}
                  >✕</button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add family member button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <button
            onClick={() => openChat(null, null)}
            style={{
              backgroundColor: '#D5824A',
              color: 'white',
              border: 'none',
              borderRadius: '50px',
              padding: '12px 32px',
              fontSize: '14px',
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: '500',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(213,130,74,0.35)',
            }}
          >+ Add Family Member</button>
        </div>

      </div>

      <ProfileModal
        isOpen={chatModal.isOpen}
        onClose={closeChat}
        memberType={chatModal.memberType}
        existingProfile={chatModal.existingProfile}
        onSaved={fetchMembers}
      />

    </main>
  );
}
