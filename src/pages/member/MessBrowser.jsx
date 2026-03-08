/**
 * pages/member/MessBrowser.jsx
 * Searchable mess listing — shown after member registration.
 * Member searches by mess name, cards show owner name + address + pricing.
 */
import { useState, useEffect } from 'react';
import { C } from '../../theme';
import { Card, Btn, Badge, Field, Toast } from '../../components/ui';

export default function MessBrowser({ onSelect, addLog }) {
  const [messes,  setMesses]  = useState([]);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    addLog('GET', '/api/messes');
    import('../../mock/flask').then(({ flask }) =>
      flask.listMesses()
        .then((data) => { addLog('GET', '/api/messes', 200); setMesses(data); })
        .catch(() => addLog('GET', '/api/messes', 500))
        .finally(() => setLoading(false))
    );
  }, [addLog]);

  const filtered = messes.filter((m) =>
    m.messName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '28px 16px',
      background: `linear-gradient(160deg, ${C.cream}, #FFF8EE)`,
    }}>
      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 28, width: '100%', maxWidth: 460 }}>
        {['Register', 'Find Mess', 'Choose Plan', 'Dashboard'].map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 800, fontSize: 12, transition: 'all .3s',
                background: i < 1 ? C.green : i === 1 ? C.saffron : C.lightGray,
                color: i <= 1 ? '#fff' : C.gray,
                boxShadow: i === 1 ? `0 0 0 4px ${C.saffron}33` : 'none',
              }}>
                {i < 1 ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap',
                color: i === 1 ? C.saffron : i < 1 ? C.green : C.gray }}>{s}</span>
            </div>
            {i < 3 && (
              <div style={{ width: 28, height: 2, margin: '0 4px', marginBottom: 16,
                background: i < 1 ? C.green : C.lightGray, transition: 'background .3s' }} />
            )}
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 20, maxWidth: 420 }}>
        <div style={{ fontSize: 44 }}>🔍</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.charcoal, margin: '8px 0 4px' }}>
          Find Your Mess
        </h2>
        <p style={{ color: C.lightBrown, fontSize: 14 }}>
          Search for a mess by name. Select one to view their meal plans.
        </p>
      </div>

      {/* Search */}
      <div style={{ width: '100%', maxWidth: 460, marginBottom: 16 }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            fontSize: 18, pointerEvents: 'none' }}>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type mess name to search…"
            style={{
              width: '100%', padding: '14px 14px 14px 44px', borderRadius: 14,
              border: `2px solid ${C.border}`, fontSize: 15, background: '#fff',
              outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
              transition: 'border-color .2s', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}
            onFocus={(e) => e.target.style.borderColor = C.saffron}
            onBlur={(e) => e.target.style.borderColor = C.border}
          />
        </div>
      </div>

      {/* Results */}
      <div style={{ width: '100%', maxWidth: 460 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: C.gray }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>⏳</div>
            Loading messes…
          </div>
        ) : filtered.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🍽️</div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>No messes found</div>
            <div style={{ color: C.gray, fontSize: 14 }}>
              {search ? `No mess matches "${search}". Try a different name.` : 'No messes are available yet.'}
            </div>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map((mess) => (
              <Card key={mess.id} style={{ padding: 0, overflow: 'hidden' }}>
                {/* Mess header */}
                <div style={{ padding: '16px 18px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 17, color: C.charcoal, marginBottom: 4 }}>
                        🍱 {mess.messName}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: C.lightBrown }}>👤</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.lightBrown }}>
                          {mess.ownerName}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                        <span style={{ fontSize: 13, color: C.gray, flexShrink: 0 }}>📍</span>
                        <span style={{ fontSize: 13, color: C.gray, lineHeight: 1.4 }}>
                          {mess.messAddress}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
                    marginTop: 12, marginBottom: 4,
                  }}>
                    {[
                      { icon: '🌞', label: 'Lunch',  price: mess.pricing.lunch },
                      { icon: '🌙', label: 'Dinner', price: mess.pricing.dinner },
                      { icon: '🍱', label: 'Both',   price: mess.pricing.both },
                    ].map((p) => (
                      <div key={p.label} style={{
                        background: C.lightGray, borderRadius: 10,
                        padding: '8px 6px', textAlign: 'center',
                      }}>
                        <div style={{ fontSize: 16, marginBottom: 2 }}>{p.icon}</div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: C.saffron }}>₹{p.price}</div>
                        <div style={{ fontSize: 10, color: C.gray, fontWeight: 600 }}>{p.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Select button */}
                <button
                  onClick={() => onSelect(mess)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = C.deepSaffron;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = C.saffron;
                  }}
                  style={{
                    width: '100%', padding: '13px 0', border: 'none',
                    background: C.saffron, color: '#fff', fontWeight: 700,
                    fontSize: 14, cursor: 'pointer', transition: 'background .15s',
                    fontFamily: 'inherit',
                  }}>
                  Select This Mess →
                </button>
              </Card>
            ))}
          </div>
        )}

        {!loading && messes.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: C.gray }}>
            Showing {filtered.length} of {messes.length} messes
          </div>
        )}
      </div>
    </div>
  );
}
