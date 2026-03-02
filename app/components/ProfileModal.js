'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import Send from 'lucide-react/dist/esm/icons/send';

export default function ProfileModal({ isOpen, onClose, memberType: initialMemberType, existingProfile, onSaved }) {
  const [memberType, setMemberType] = useState(initialMemberType || null);
  // messages are { role: 'assistant'|'user', content: string } — display only (no __START__)
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const bottomRef = useRef(null);
  const hasStarted = useRef(false);

  // Reset state whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setMemberType(initialMemberType || null);
      setMessages([]);
      setInput('');
      setLoading(false);
      setSaving(false);
      hasStarted.current = false;
    }
  }, [isOpen]); // eslint-disable-line

  // Start conversation once type is confirmed
  useEffect(() => {
    if (isOpen && memberType && !hasStarted.current) {
      hasStarted.current = true;
      startConversation(memberType);
    }
  }, [isOpen, memberType]); // eslint-disable-line

  // Auto-scroll to newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const callAPI = async (apiMessages, type) => {
    const res = await fetch('/api/profile-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: apiMessages,
        memberType: type,
        existingProfile: existingProfile || null,
      }),
    });
    const data = await res.json();
    return data.message || '';
  };

  const startConversation = async (type) => {
    setLoading(true);
    const reply = await callAPI([{ role: 'user', content: '__START__' }], type);
    setMessages([{ role: 'assistant', content: reply }]);
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || saving) return;
    const userText = input.trim();
    setInput('');

    const updatedMessages = [...messages, { role: 'user', content: userText }];
    setMessages(updatedMessages);
    setLoading(true);

    // Build the full API messages array: __START__ triggers the opening, then the real conversation
    const apiMessages = [
      { role: 'user', content: '__START__' },
      ...updatedMessages,
    ];

    const reply = await callAPI(apiMessages, memberType);
    setMessages([...updatedMessages, { role: 'assistant', content: reply }]);
    setLoading(false);

    // Detect profile completion
    if (reply.includes('PROFILE_DATA:')) {
      const jsonStr = reply.split('PROFILE_DATA:')[1]?.trim().split('\n')[0];
      if (jsonStr) {
        try {
          const profileData = JSON.parse(jsonStr);
          await saveProfile(profileData);
        } catch (e) {
          console.error('Failed to parse profile JSON:', e, jsonStr);
        }
      }
    }
  };

  const saveProfile = async (data) => {
    setSaving(true);

    // Determine date_of_birth
    let dobString = data.date_of_birth || null;
    if (!dobString && data.birth_year) {
      dobString = `${data.birth_year}-07-01`; // approximate mid-year
    }

    const record = {
      name: data.name || '',
      role: memberType === 'baby' ? 'baby' : 'adult',
      date_of_birth: dobString,
      height: data.height || null,
      weight: data.weight || null,
      activity_level: data.activity_level || null,
      goals: data.goals || null,
      supplements: data.supplements || null,
      notes: [
        data.notes || null,
        data.sex ? `Biological sex: ${data.sex}` : null,
      ].filter(Boolean).join('. ') || null,
    };

    if (existingProfile?.id) {
      await supabase.from('family_members').update(record).eq('id', existingProfile.id);
    } else {
      await supabase.from('family_members').insert(record);
    }

    setSaving(false);
    onSaved?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 300,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        backgroundColor: '#F9D7B5',
        borderRadius: '24px',
        width: '100%', maxWidth: '480px',
        height: '82vh', maxHeight: '720px',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          padding: '18px 20px 14px',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#404F43', fontFamily: 'Montserrat, sans-serif' }}>
              {existingProfile ? `Edit ${existingProfile.name}'s Profile` : 'New Profile'}
            </p>
            <p style={{ margin: 0, fontSize: '10px', color: '#9AAC9D', fontWeight: '300', fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.4px' }}>
              powered by Claude
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#BDC2B4', fontSize: '20px', padding: '4px', lineHeight: 1, fontFamily: 'Montserrat, sans-serif' }}
          >✕</button>
        </div>

        {/* Type selector — shown when creating a new profile */}
        {!memberType ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '32px 24px', gap: '12px',
          }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '500', color: '#404F43', fontFamily: 'Montserrat, sans-serif', textAlign: 'center' }}>
              Who is this profile for?
            </p>
            {[
              { type: 'adult', label: '👤  Adult / Teen', desc: 'For yourself or another adult in the family' },
              { type: 'baby', label: '👶  Baby / Child', desc: "We'll track their developmental stage automatically" },
            ].map(opt => (
              <button
                key={opt.type}
                onClick={() => setMemberType(opt.type)}
                style={{
                  width: '100%', padding: '16px 18px',
                  backgroundColor: 'white',
                  border: '1.5px solid #BDC2B4', borderRadius: '18px',
                  fontFamily: 'Montserrat, sans-serif', cursor: 'pointer', textAlign: 'left',
                  transition: 'border-color 0.15s',
                }}
              >
                <p style={{ margin: '0 0 3px 0', fontSize: '14px', fontWeight: '500', color: '#404F43' }}>{opt.label}</p>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: '300', color: '#9AAC9D' }}>{opt.desc}</p>
              </button>
            ))}
          </div>

        ) : (
          <>
            {/* Chat messages */}
            <div style={{
              flex: 1, overflowY: 'auto',
              padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px',
            }}>
              {messages.map((msg, i) => {
                // Strip PROFILE_DATA line and markdown bold markers from display
                const displayText = msg.content.split('PROFILE_DATA:')[0].replace(/\*\*/g, '').trim();
                if (!displayText) return null;
                const isUser = msg.role === 'user';
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '82%',
                      padding: '10px 14px',
                      borderRadius: isUser ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                      backgroundColor: isUser ? '#D5824A' : 'white',
                      color: isUser ? 'white' : '#404F43',
                      fontSize: '13px', fontFamily: 'Montserrat, sans-serif', fontWeight: '300',
                      lineHeight: '1.55',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {displayText}
                    </div>
                  </div>
                );
              })}

              {/* Typing / saving indicator */}
              {(loading || saving) && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{
                    backgroundColor: 'white', padding: '10px 16px',
                    borderRadius: '4px 18px 18px 18px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                  }}>
                    <span style={{ color: '#BDC2B4', fontSize: '20px', letterSpacing: '3px' }}>···</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input row */}
            <div style={{
              padding: '12px 14px',
              paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
              borderTop: '1px solid rgba(0,0,0,0.07)',
              display: 'flex', gap: '8px', alignItems: 'flex-end', flexShrink: 0,
            }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                }}
                placeholder="Type your answer..."
                rows={1}
                disabled={loading || saving}
                style={{
                  flex: 1, border: '1.5px solid #BDC2B4', borderRadius: '20px',
                  padding: '10px 14px', fontSize: '13px',
                  fontFamily: 'Montserrat, sans-serif', fontWeight: '300',
                  outline: 'none', resize: 'none',
                  backgroundColor: 'white', color: '#404F43', lineHeight: '1.4',
                  maxHeight: '80px', overflowY: 'auto',
                  opacity: loading || saving ? 0.6 : 1,
                }}
              />
              <button
                onClick={sendMessage}
                disabled={loading || saving || !input.trim()}
                style={{
                  backgroundColor: '#D5824A', border: 'none', borderRadius: '50%',
                  width: '40px', height: '40px', minWidth: '40px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: loading || saving || !input.trim() ? 'default' : 'pointer',
                  opacity: loading || saving || !input.trim() ? 0.4 : 1,
                  flexShrink: 0, transition: 'opacity 0.15s',
                }}
              >
                <Send size={16} color="white" />
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
