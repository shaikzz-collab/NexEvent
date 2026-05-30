import React, { useState, useEffect } from 'react';
import { Sparkles, DollarSign, Compass, Award, Heart, CheckCircle2, ChevronRight, BarChart2 } from 'lucide-react';
import { fetchCollection, saveDocument, pushNotification } from '../dbService';

export default function PortalSponsor({ user }) {
  const [activeTab, setActiveTab] = useState('explorer');
  const [events, setEvents] = useState([]);
  const [mySponsorships, setMySponsorships] = useState([]);
  const [allSponsorships, setAllSponsorships] = useState([]);
  const [activeVenueEvent, setActiveVenueEvent] = useState(null);
  const [selectedStall, setSelectedStall] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadSponsorData = async () => {
    setLoading(true);
    try {
      const allEvents = await fetchCollection('events');
      setEvents(allEvents.filter(e => e.status === 'live' && e.sponsorshipsEnabled));

      const allSpons = await fetchCollection('sponsorships');
      setMySponsorships(allSpons.filter(s => s.sponsorId === user.uid));
      setAllSponsorships(allSpons);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSponsorData();
  }, [user.uid]);

  // Industry and budget matching algorithm
  const computeMatchScore = (event) => {
    let score = 50; // base score
    
    // 1. Industry mapping check
    const industryKeywords = {
      'Software / Technology': ['Tech', 'Hackathon', 'Innovation'],
      'Education': ['Academic', 'Workshop', 'TEDxCollege'],
      'Entertainment': ['Cultural', 'Sports', 'Music']
    };

    const sponsorIndustry = user.sponsorIndustry || 'Software / Technology';
    const keywords = industryKeywords[sponsorIndustry] || ['Tech'];
    const matchedCategory = keywords.some(k => event.category.toLowerCase().includes(k.toLowerCase()) || event.title.toLowerCase().includes(k.toLowerCase()));
    
    if (matchedCategory) score += 30;
    
    // 2. Budget mapping check
    const budget = user.sponsorBudgetRange || 100000;
    // If event has packages in budget range
    const inRange = event.sponsorshipPackages?.some(p => p.price <= budget);
    if (inRange) score += 10;
    
    return Math.min(score, 100);
  };

  // Express Interest Drawer / Submission
  const handleExpressInterest = async (event, pack) => {
    const existing = mySponsorships.find(s => s.eventId === event.id && s.packageId === pack.id);
    if (existing) {
      alert("⚠️ You have already requested sponsorship for this package!");
      return;
    }

    const sponId = `spon-${Date.now()}`;
    const newSponsorship = {
      id: sponId,
      eventId: event.id,
      eventTitle: event.title,
      sponsorId: user.uid,
      sponsorName: user.name,
      sponsorCompany: user.sponsorCompany || user.name,
      packageId: pack.id,
      packageName: pack.name,
      price: pack.price,
      status: 'pending',
      timestamp: Date.now()
    };

    await saveDocument('sponsorships', sponId, newSponsorship);

    // Send notification to organizer
    await pushNotification(
      event.organizerId,
      "Sponsor Interest Expressed! 🤝",
      `${user.sponsorCompany || user.name} is interested in becoming a ${pack.name} for ${event.title}.`,
      'info'
    );

    alert(`🎉 Sponsorship request for "${pack.name}" submitted! The organizer has been notified and will review.`);
    loadSponsorData();
  };

  return (
    <div className="portal-layout">
      {/* Sidebar menu */}
      <div className="sidebar-menu">
        <div style={{ padding: '0 0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', color: '#ffffff' }}>Sponsor Dashboard</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.sponsorCompany || 'Corporate Partner'}</span>
        </div>

        <button className={`sidebar-btn ${activeTab === 'explorer' ? 'active' : ''}`} onClick={() => setActiveTab('explorer')}>
          <Compass size={18} /> Discover Events
        </button>
        <button className={`sidebar-btn ${activeTab === 'my-deals' ? 'active' : ''}`} onClick={() => setActiveTab('my-deals')}>
          <CheckCircle2 size={18} /> Active Partnerships
        </button>
        <button className={`sidebar-btn ${activeTab === 'roi' ? 'active' : ''}`} onClick={() => setActiveTab('roi')}>
          <BarChart2 size={18} /> ROI Telemetry Forecast
        </button>
      </div>

      {/* Main panel view */}
      <div className="portal-content" style={{ textAlign: 'left' }}>
        {activeTab === 'explorer' && (
          <div>
            <div className="dashboard-header">
              <div>
                <h2 style={{ fontSize: '1.8rem' }}>Target Audience Matching</h2>
                <p style={{ color: 'var(--text-muted)' }}>Interactive matchmaking maps events matching your budget scope & industry sector.</p>
              </div>
            </div>

            {/* List active sponsor opportunities */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {events.map(event => {
                const matchScore = computeMatchScore(event);
                return (
                  <div key={event.id} className="glass-panel" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '2rem' }}>
                    <div>
                      <img src={event.bannerUrl} alt={event.title} style={{ height: '140px', width: '100%', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }} />
                      <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{event.title}</h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                        {event.category} • {new Date(event.startDate).toLocaleDateString()}
                      </span>
                      
                      <div className="passport-score-badge" style={{ background: matchScore >= 80 ? 'rgba(74,222,128,0.1)' : 'rgba(99,102,241,0.1)', color: matchScore >= 80 ? '#4ade80' : 'var(--accent-indigo)' }}>
                        <Sparkles size={14} /> Affinity Score: {matchScore}%
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h4 style={{ fontSize: '1.1rem', color: '#ffffff', margin: 0 }}>Sponsorship Packages</h4>
                        <button className="btn btn-secondary" onClick={() => { setActiveVenueEvent(activeVenueEvent === event ? null : event); setSelectedStall(null); }} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderColor: 'var(--accent-cyan)', background: 'rgba(6,182,212,0.05)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          🗺️ View 3D Hologram Map
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {event.sponsorshipPackages && event.sponsorshipPackages.map(pack => {
                          const status = mySponsorships.find(s => s.eventId === event.id && s.packageId === pack.id)?.status;
                          return (
                            <div key={pack.id} className="glass-card" style={{ padding: '1rem', background: 'rgba(0,0,0,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ flex: 1, paddingRight: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <h5 style={{ fontSize: '0.95rem', color: '#ffffff' }}>{pack.name}</h5>
                                  <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--accent-cyan)' }}>₹{pack.price.toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                                  {pack.perks.map((p, i) => (
                                    <span key={i} className="tag-badge">{p}</span>
                                  ))}
                                </div>
                              </div>

                              <div style={{ marginLeft: '1rem' }}>
                                {status ? (
                                  <span className={`status-badge ${status === 'approved' ? 'pass' : status === 'rejected' ? 'fail' : 'pending'}`}>
                                    {status.toUpperCase()}
                                  </span>
                                ) : (
                                  <button className="btn btn-primary" onClick={() => handleExpressInterest(event, pack)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                                    Partner
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Interactive Visual Venue Blueprint Layout (Out-of-the-Box Pitch Enhancement) */}
                    {activeVenueEvent?.id === event.id && (() => {
                      const getStallInfo = (stallId) => {
                        const packs = event.sponsorshipPackages || [];
                        let correspondingPack = null;
                        let name = '';
                        let visibility = '';

                        if (stallId === 'A1') {
                          correspondingPack = packs.find(p => p.name.toLowerCase().includes('platinum')) || packs[0];
                          name = 'Stall A1 - Platinum Partner';
                          visibility = 'CRITICAL (Center-Stage Left, Max Traffic)';
                        } else if (stallId === 'A2') {
                          correspondingPack = packs.find(p => p.name.toLowerCase().includes('gold')) || packs[1] || packs[0];
                          name = 'Stall A2 - Gold Partner';
                          visibility = 'HIGH (Center-Stage Right, Excellent Branding)';
                        } else if (stallId === 'B1') {
                          const goldPacks = packs.filter(p => p.name.toLowerCase().includes('gold'));
                          correspondingPack = goldPacks[1] || goldPacks[0] || packs[0];
                          name = 'Stall B1 - Gold Partner';
                          visibility = 'STANDARD (Entrance Foyer, High student traffic)';
                        }

                        if (!correspondingPack) return null;

                        const deal = allSponsorships.find(s => s.eventId === event.id && s.packageId === correspondingPack.id);
                        return {
                          id: stallId,
                          name,
                          visibility,
                          package: correspondingPack,
                          deal,
                          status: deal ? deal.status : 'vacant'
                        };
                      };

                      const currentStallDetails = selectedStall ? getStallInfo(selectedStall) : null;

                      return (
                        <div style={{ gridColumn: 'span 2', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', marginTop: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div>
                              <h4 style={{ fontSize: '1.1rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                                🗺️ Live Holographic Venue Blueprint Stall Matcher
                              </h4>
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                                Interactive physical mapping of the venue layout. Click on glowing stalls to inspect visibility and claim slots.
                              </p>
                            </div>
                            <button onClick={() => { setActiveVenueEvent(null); setSelectedStall(null); }} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                              Close Blueprint
                            </button>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem', marginTop: '1.25rem' }}>
                            {/* Holographic room blueprint layout */}
                            <div className="glass-card" style={{
                              padding: '1.5rem',
                              background: 'rgba(5, 7, 12, 0.95)',
                              border: '1px solid rgba(6, 182, 212, 0.15)',
                              borderRadius: '12px',
                              backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.04) 1px, transparent 1px)',
                              backgroundSize: '15px 15px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '1.5rem',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minHeight: '260px'
                            }}>
                              {/* Central Stage Area */}
                              <div style={{
                                width: '85%',
                                padding: '0.6rem',
                                background: 'linear-gradient(90deg, rgba(99,102,241,0.15) 0%, rgba(6,182,212,0.15) 100%)',
                                border: '1px dashed var(--accent-indigo)',
                                borderRadius: '6px',
                                color: '#ffffff',
                                fontSize: '0.85rem',
                                fontWeight: '700',
                                letterSpacing: '0.15em',
                                textAlign: 'center',
                                boxShadow: '0 0 15px rgba(99,102,241,0.1)'
                              }}>
                                🎭 CENTRAL AUDITORIUM STAGE
                              </div>

                              {/* Stall Row and Seating Area */}
                              <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', padding: '0 1rem', alignItems: 'center' }}>
                                {/* Stall A1 (Platinum) */}
                                {(() => {
                                  const info = getStallInfo('A1');
                                  if (!info) return null;
                                  const isSelected = selectedStall === 'A1';
                                  const isApproved = info.status === 'approved';
                                  const isPending = info.status === 'pending';
                                  return (
                                    <div 
                                      onClick={() => setSelectedStall('A1')}
                                      style={{
                                        width: '80px',
                                        height: '70px',
                                        cursor: 'pointer',
                                        borderRadius: '6px',
                                        border: isSelected ? '2px solid var(--accent-cyan)' : '1px solid rgba(6,182,212,0.3)',
                                        background: isApproved ? 'rgba(74,222,128,0.15)' : isPending ? 'rgba(245,158,11,0.15)' : 'rgba(6,182,212,0.05)',
                                        boxShadow: isSelected ? '0 0 15px rgba(6,182,212,0.3)' : 'none',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        textAlign: 'center',
                                        padding: '0.25rem',
                                        transition: 'all 0.2s'
                                      }}
                                    >
                                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#ffffff' }}>Stall A1</span>
                                      <span style={{ fontSize: '0.55rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                                        {isApproved ? (info.deal.sponsorCompany || "Claimed") : isPending ? "Pending" : "Platinum"}
                                      </span>
                                    </div>
                                  );
                                })()}

                                {/* Audience Row Seating Indicator */}
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  [ Frontrow VIP Seats ]
                                </div>

                                {/* Stall A2 (Gold) */}
                                {(() => {
                                  const info = getStallInfo('A2');
                                  if (!info) return null;
                                  const isSelected = selectedStall === 'A2';
                                  const isApproved = info.status === 'approved';
                                  const isPending = info.status === 'pending';
                                  return (
                                    <div 
                                      onClick={() => setSelectedStall('A2')}
                                      style={{
                                        width: '80px',
                                        height: '70px',
                                        cursor: 'pointer',
                                        borderRadius: '6px',
                                        border: isSelected ? '2px solid var(--accent-purple)' : '1px solid rgba(168,85,247,0.3)',
                                        background: isApproved ? 'rgba(74,222,128,0.15)' : isPending ? 'rgba(245,158,11,0.15)' : 'rgba(168,85,247,0.05)',
                                        boxShadow: isSelected ? '0 0 15px rgba(168,85,247,0.3)' : 'none',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        textAlign: 'center',
                                        padding: '0.25rem',
                                        transition: 'all 0.2s'
                                      }}
                                    >
                                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#ffffff' }}>Stall A2</span>
                                      <span style={{ fontSize: '0.55rem', color: 'var(--accent-purple)', textTransform: 'uppercase', marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                                        {isApproved ? (info.deal.sponsorCompany || "Claimed") : isPending ? "Pending" : "Gold"}
                                      </span>
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Entrance Foyer and Seating Area */}
                              <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', padding: '0 1rem', alignItems: 'center' }}>
                                {/* Stall B1 (Gold) */}
                                {(() => {
                                  const info = getStallInfo('B1');
                                  if (!info) return null;
                                  const isSelected = selectedStall === 'B1';
                                  const isApproved = info.status === 'approved';
                                  const isPending = info.status === 'pending';
                                  return (
                                    <div 
                                      onClick={() => setSelectedStall('B1')}
                                      style={{
                                        width: '80px',
                                        height: '70px',
                                        cursor: 'pointer',
                                        borderRadius: '6px',
                                        border: isSelected ? '2px solid var(--accent-purple)' : '1px solid rgba(168,85,247,0.3)',
                                        background: isApproved ? 'rgba(74,222,128,0.15)' : isPending ? 'rgba(245,158,11,0.15)' : 'rgba(168,85,247,0.05)',
                                        boxShadow: isSelected ? '0 0 15px rgba(168,85,247,0.3)' : 'none',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        textAlign: 'center',
                                        padding: '0.25rem',
                                        transition: 'all 0.2s'
                                      }}
                                    >
                                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#ffffff' }}>Stall B1</span>
                                      <span style={{ fontSize: '0.55rem', color: 'var(--accent-purple)', textTransform: 'uppercase', marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                                        {isApproved ? (info.deal.sponsorCompany || "Claimed") : isPending ? "Pending" : "Gold"}
                                      </span>
                                    </div>
                                  );
                                })()}

                                {/* Entrance Foyer Seating Indicator */}
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  🚪 MAIN AUDITORIUM ENTRANCE
                                </div>

                                {/* Placeholder empty block for symmetrical balance */}
                                <div style={{ width: '80px', height: '70px', visibility: 'hidden' }}></div>
                              </div>
                            </div>

                            {/* Telemetry Stall Information Sidebar Panel */}
                            <div className="glass-card" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '260px' }}>
                              {!selectedStall ? (
                                <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>
                                  <Sparkles size={28} style={{ color: 'var(--accent-indigo)', marginBottom: '0.75rem', opacity: 0.7 }} />
                                  <h5 style={{ fontSize: '0.9rem', color: '#ffffff', marginBottom: '0.25rem' }}>Select Venue Stall</h5>
                                  <p style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                                    Click on any stall block in the blueprint layout to inspect branding value and reserve spots.
                                  </p>
                                </div>
                              ) : (
                                <div>
                                  <h4 style={{ fontSize: '1.05rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.3rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                                    {currentStallDetails.name}
                                  </h4>
                                  
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                                    <div>
                                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>VISIBILITY RANKING:</span>
                                      <span style={{ fontWeight: '600', color: '#ffffff' }}>{currentStallDetails.visibility}</span>
                                    </div>
                                    <div>
                                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>PACKAGE VALUE:</span>
                                      <span style={{ fontWeight: '700', color: 'var(--accent-cyan)', fontSize: '1.1rem' }}>
                                        ₹{(currentStallDetails.package.price || 0).toLocaleString()}
                                      </span>
                                    </div>
                                    <div>
                                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>STALL BENEFITS:</span>
                                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                                        {currentStallDetails.package.perks.map((p, idx) => (
                                          <span key={idx} className="tag-badge" style={{ fontSize: '0.65rem' }}>{p}</span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                                    {currentStallDetails.status === 'vacant' ? (
                                      <button 
                                        className="btn btn-primary" 
                                        type="button"
                                        onClick={() => handleExpressInterest(event, currentStallDetails.package)} 
                                        style={{ width: '100%', padding: '0.6rem', fontSize: '0.8rem' }}
                                      >
                                        🤝 Reserve & Purchase Stall
                                      </button>
                                    ) : (
                                      <div style={{
                                        textAlign: 'center',
                                        padding: '0.5rem',
                                        background: currentStallDetails.status === 'approved' ? 'rgba(74,222,128,0.08)' : 'rgba(245,158,11,0.08)',
                                        border: currentStallDetails.status === 'approved' ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(245,158,11,0.2)',
                                        color: currentStallDetails.status === 'approved' ? '#4ade80' : '#f59e0b',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem',
                                        fontWeight: '600'
                                      }}>
                                        {currentStallDetails.status === 'approved' 
                                          ? `Locked by: ${currentStallDetails.deal.sponsorCompany}` 
                                          : 'Request Pending Review'}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Partnerships */}
        {activeTab === 'my-deals' && (
          <div>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '1.5rem' }}>Active Sponsorship Deals</h2>

            {mySponsorships.length === 0 ? (
              <div style={{ padding: '3.5rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No active partnerships listed. Query the "Discover Events" list to establish sponsorships.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {mySponsorships.map(deal => (
                  <div key={deal.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', color: '#ffffff' }}>{deal.eventTitle}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Package Selected: <strong>{deal.packageName}</strong> (₹{deal.price.toLocaleString()})
                      </p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>Created on: {new Date(deal.timestamp).toLocaleDateString()}</span>
                    </div>

                    <span className={`status-badge ${deal.status === 'approved' ? 'pass' : deal.status === 'rejected' ? 'fail' : 'pending'}`}>
                      {deal.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ROI Telemetry */}
        {activeTab === 'roi' && (
          <div>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>Sponsor Impact Intelligence Dashboard</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>Predictive telemetry modeling final check-in rates, brand exposure statistics, and post-event ROI analytics.</p>

            {mySponsorships.filter(s => s.status === 'approved').length === 0 ? (
              <div style={{ padding: '3.5rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Approved partnerships required to compile telemetry dashboards.
              </div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                  <div className="glass-card" style={{ padding: '1.25rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Projected Brand Impressions</span>
                    <div className="stat-val" style={{ color: 'var(--accent-cyan)', fontSize: '1.6rem', fontWeight: 'bold', marginTop: '0.25rem' }}>14.2K Impressions</div>
                  </div>
                  <div className="glass-card" style={{ padding: '1.25rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Active Booth Lead Capture</span>
                    <div className="stat-val" style={{ color: '#4ade80', fontSize: '1.6rem', fontWeight: 'bold', marginTop: '0.25rem' }}>380 Leads</div>
                  </div>
                  <div className="glass-card" style={{ padding: '1.25rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>QR Interactions Rate</span>
                    <div className="stat-val" style={{ color: 'var(--accent-purple)', fontSize: '1.6rem', fontWeight: 'bold', marginTop: '0.25rem' }}>84.5% Engagement</div>
                  </div>
                  <div className="glass-card" style={{ padding: '1.25rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sponsorship ROI Index</span>
                    <div className="stat-val" style={{ color: '#f59e0b', fontSize: '1.6rem', fontWeight: 'bold', marginTop: '0.25rem' }}>4.2x Multiplier</div>
                  </div>
                </div>

                {/* Post-Event Sponsor Impact Report */}
                <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(6,182,212,0.15)', marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1.25rem', color: '#ffffff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    📊 Post-Event Sponsor Impact Report
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
                    Verified platform analytics compiling final student reach, brand sentiment shift, and lead conversion rates.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', color: '#ffffff', marginBottom: '0.75rem' }}>Audience Reach Metrics</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem' }}>
                          <span>Exhibition Stall Scans:</span>
                          <span style={{ fontWeight: '600', color: 'var(--accent-cyan)' }}>480 Scans</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem' }}>
                          <span>Event App Banner Clicks:</span>
                          <span style={{ fontWeight: '600', color: 'var(--accent-cyan)' }}>1.2K Interactions</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Verified Lead Captures:</span>
                          <span style={{ fontWeight: '600', color: '#4ade80' }}>148 Direct Leads</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '0.95rem', color: '#ffffff', marginBottom: '0.75rem' }}>Ecosystem Support Rank</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem' }}>
                          <span>Community Support Score:</span>
                          <span style={{ fontWeight: '600', color: 'var(--accent-purple)' }}>94 / 100</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem' }}>
                          <span>Sponsor Engagement Score:</span>
                          <span style={{ fontWeight: '600', color: 'var(--accent-purple)' }}>88% Active</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Impact Certification Level:</span>
                          <span style={{ fontWeight: '700', color: '#f59e0b' }}>🥇 BRONZE CHAMPION</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem', marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                    <button onClick={() => alert("🥇 Sponsor Impact Certificate downloaded! Code: SPON-IMPACT-" + Date.now())} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                      📥 Download Impact Certificate
                    </button>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Projected Brand Engagement Details</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                      <span>Vocal branding slot (Stage Announcements):</span>
                      <span style={{ fontWeight: '600', color: '#4ade80' }}>✓ GUARANTEED</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                      <span>VIP Ticket Allocations:</span>
                      <span style={{ fontWeight: '600' }}>6 Tickets</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Stall space backstage allocation:</span>
                      <span style={{ fontWeight: '600' }}>Premium Tier Setup</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
