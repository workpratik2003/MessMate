import { useState, useEffect } from 'react';
import { C } from '../../theme';
import { Card, Btn, Toast } from '../../components/ui';

export default function MessBrowser({ onSelect, addLog }) {
  const [messes,  setMesses]  = useState([]);
  const [search,  setSearch]  = useState('');
  const [activeSearch, setActiveSearch] = useState(''); // Only filters when search is clicked
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [showPlansId, setShowPlansId] = useState(null);

  useEffect(() => {
    addLog('GET', '/api/messes');
    import('../../mock/flask').then(({ flask }) =>
      flask.listMesses()
        .then((data) => { addLog('GET', '/api/messes', 200); setMesses(data); })
        .catch(() => addLog('GET', '/api/messes', 500))
        .finally(() => setLoading(false))
    );
  }, [addLog]);

  const handleSearch = () => {
    setActiveSearch(search.trim());
    setExpandedId(null);
    setShowPlansId(null);
  };

  const filtered = messes.filter((m) =>
    (m.messAddress || '').toLowerCase().includes(activeSearch.toLowerCase())
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
          Find Your Mess Area
        </h2>
        <p style={{ color: C.lightBrown, fontSize: 14 }}>
          Enter your area to find messes nearby. Click a mess name to view details.
        </p>
      </div>

      {/* Search Input and Button */}
      <div style={{ width: '100%', maxWidth: 460, marginBottom: 24, display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            fontSize: 18, pointerEvents: 'none' }}>📍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            placeholder="E.g., Viman Nagar, Pune…"
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
        <Btn onClick={handleSearch} style={{ padding: '0 24px', borderRadius: 14 }}>
          Search
        </Btn>
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
              {activeSearch ? `No mess found in "${activeSearch}". Try a different area.` : 'Search an area to find messes.'}
            </div>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map((mess) => {
              const isExpanded = expandedId === mess.id;
              const showingPlans = showPlansId === mess.id;

              return (
                <Card key={mess.id} style={{ padding: '0', overflow: 'hidden' }}>
                  {/* Clickable Mess Name Header (Bold Black) */}
                  <div
                    onClick={() => {
                      setExpandedId(isExpanded ? null : mess.id);
                      if (isExpanded) setShowPlansId(null); // Reset plan view when collapsing
                    }}
                    style={{
                      padding: '16px 18px', cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: isExpanded ? C.warmWhite : '#fff',
                      borderBottom: isExpanded ? `1px solid ${C.border}` : 'none',
                      transition: 'background .2s',
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: 18, color: '#000' }}>
                      {mess.messName}
                    </div>
                    <div style={{ color: C.gray, fontSize: 18 }}>
                      {isExpanded ? '▲' : '▼'}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div style={{ padding: '16px 18px', background: '#fff' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 15 }}>👤</span>
                          <span style={{ fontSize: 14, color: C.charcoal, fontWeight: 600 }}>
                            Owner: {mess.ownerName}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 15 }}>📞</span>
                          <span style={{ fontSize: 14, color: C.charcoal }}>
                            {mess.ownerPhone || 'Not provided'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <span style={{ fontSize: 15, flexShrink: 0 }}>📍</span>
                          <span style={{ fontSize: 14, color: C.charcoal, lineHeight: 1.4 }}>
                            {mess.messAddress}
                          </span>
                        </div>
                      </div>

                      {/* Buy Plan or Pricing Selection */}
                      {!showingPlans ? (
                        <Btn
                          onClick={(e) => { e.stopPropagation(); setShowPlansId(mess.id); }}
                          full
                        >
                          Buy Plan
                        </Btn>
                      ) : (
                        <div style={{
                          background: C.lightGray, borderRadius: 12, padding: 12, marginTop: 4,
                          border: `1px solid ${C.border}`,
                        }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: C.lightBrown, marginBottom: 12, textAlign: 'center' }}>
                            Select a Meal Plan:
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                            {[
                              { icon: '🌞', label: 'Lunch',  price: mess.pricing.lunch },
                              { icon: '🌙', label: 'Dinner', price: mess.pricing.dinner },
                              { icon: '🍱', label: 'Both',   price: mess.pricing.both },
                            ].map((p) => (
                              <div
                                key={p.label}
                                onClick={() => onSelect(mess)}
                                style={{
                                  background: '#fff', borderRadius: 8, padding: '10px 4px',
                                  textAlign: 'center', border: `1px solid ${C.border}`,
                                  cursor: 'pointer', transition: 'all .2s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.saffron; e.currentTarget.style.boxShadow = `0 2px 6px ${C.saffron}33`; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none'; }}
                              >
                                <div style={{ fontSize: 18, marginBottom: 4 }}>{p.icon}</div>
                                <div style={{ fontWeight: 800, fontSize: 15, color: C.saffron }}>₹{p.price}</div>
                                <div style={{ fontSize: 11, color: C.gray, fontWeight: 600 }}>{p.label}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {!loading && messes.length > 0 && activeSearch && (
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: C.gray }}>
            Showing {filtered.length} messes in "{activeSearch}"
          </div>
        )}
      </div>
    </div>
  );
}
