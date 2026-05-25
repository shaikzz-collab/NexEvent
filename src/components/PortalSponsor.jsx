import React, { useState, useEffect } from 'react';
import { Sparkles, DollarSign, Compass, Award, Heart, CheckCircle2, ChevronRight, BarChart2 } from 'lucide-react';
import { fetchCollection, saveDocument, pushNotification } from '../dbService';

export default function PortalSponsor({ user }) {
  const [activeTab, setActiveTab] = useState('explorer');
  const [events, setEvents] = useState([]);
  const [mySponsorships, setMySponsorships] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadSponsorData = async () => {
    setLoading(true);
    try {
      const allEvents = await fetchCollection('events');
      setEvents(allEvents.filter(e => e.status === 'live' && e.sponsorshipsEnabled));

      const allSpons = await fetchCollection('sponsorships');
      setMySponsorships(allSpons.filter(s => s.sponsorId === user.uid));
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
                      <h4 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#ffffff' }}>Sponsorship Packages</h4>
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
            <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>ROI Telemetry Dashboard</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>Predictive telemetry modeling final check-in rates and brand exposure statistics.</p>

            {mySponsorships.filter(s => s.status === 'approved').length === 0 ? (
              <div style={{ padding: '3.5rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Approved partnerships required to compile telemetry dashboards.
              </div>
            ) : (
              <div>
                <div className="stat-grid">
                  <div className="stat-box">
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Projected Brand Impressions</span>
                      <div className="stat-val" style={{ color: 'var(--accent-cyan)' }}>14.2K</div>
                    </div>
                  </div>
                  <div className="stat-box">
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Sponsorship Raised</span>
                      <div className="stat-val" style={{ color: '#4ade80' }}>₹85,000</div>
                    </div>
                  </div>
                  <div className="stat-box">
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Avg Lead Capture Rating</span>
                      <div className="stat-val" style={{ color: 'var(--accent-purple)' }}>84.5%</div>
                    </div>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '2rem' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Projected Brand Engagement</h3>
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
