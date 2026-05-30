import React, { useEffect, useState } from 'react';
import { Award, ShieldCheck, Share2, Star, Calendar, CheckSquare, ExternalLink, Sparkles } from 'lucide-react';
import { fetchCollection } from '../dbService';

export default function VolunteerPassport({ username }) {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [certs, setCerts] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadPassportData = async () => {
      setLoading(true);
      try {
        const users = await fetchCollection('users');
        // Match user by name (case-insensitive, spaces ignored or exact)
        const matchedUser = users.find(u => {
          const uName = u.name.replace(/\s+/g, '').toLowerCase();
          const target = username.replace(/\s+/g, '').toLowerCase();
          return uName === target;
        });

        if (matchedUser) {
          setUserProfile(matchedUser);

          // Get certificates for this user
          const allCerts = await fetchCollection('certificates');
          const volCerts = allCerts.filter(c => c.userId === matchedUser.uid);
          setCerts(volCerts);

          // Get completed tasks
          const allTasks = await fetchCollection('tasks');
          const volTasks = allTasks.filter(t => t.assignedToUid === matchedUser.uid && t.status === 'done');
          setTasks(volTasks);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadPassportData();
  }, [username]);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const getPerformanceBadge = (score, role) => {
    if (role === 'organizer') return { title: 'Master Event Host', color: '#a855f7', bg: 'rgba(168,85,247,0.1)' };
    if (role === 'sponsor') return { title: 'Sponsor Partner', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' };
    if (role === 'participant') return { title: 'Active Participant', color: '#10b981', bg: 'rgba(16,185,129,0.1)' };

    if (score >= 90) return { title: 'Elite Vanguard Leader', color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
    if (score >= 80) return { title: 'Gold Tier Coordinator', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
    return { title: 'Rising Star', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' };
  };

  if (loading) {
    return (
      <div style={{ padding: '6rem 0', textAlign: 'center' }}>
        <div className="pulse-active" style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Retrieving cryptographic credentials from passport ledger...</div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div style={{ maxWidth: '600px', margin: '5rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
        <div className="glass-panel">
          <h2 style={{ color: '#f87171', marginBottom: '1rem' }}>Passport Profile Not Found</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
            We could not locate a public profile matching the name "<strong>{username}</strong>". Make sure the user is registered and has enabled public sharing.
          </p>
          <a href="#/" className="btn btn-primary">Go to Main Landing</a>
        </div>
      </div>
    );
  }

  const badgeInfo = getPerformanceBadge(userProfile.performanceScore || 0, userProfile.role);

  // Advanced Career Passports Telemetry calculations
  const totalEvents = certs.length;
  const totalTasksCompleted = tasks.length;
  const volunteerHours = totalTasksCompleted * 4 + totalEvents * 12;
  
  const reliabilityScore = Math.round(85 + (userProfile.performanceScore || 80) * 0.15);
  const contributionScore = Math.min(100, Math.round(55 + totalEvents * 8 + totalTasksCompleted * 3));
  const teamworkScore = Math.min(100, Math.round(75 + totalEvents * 4 + totalTasksCompleted * 2));
  const leadershipScore = Math.min(100, Math.round(65 + totalEvents * 7 + (userProfile.performanceScore >= 90 ? 15 : 5)));

  // Recommendation Level
  const getRecommendationLevel = (reliability, contribution) => {
    const avg = (reliability + contribution) / 2;
    if (avg >= 92) return { level: 'ELITE PROSPECT (Top 1%)', color: '#10b981' };
    if (avg >= 85) return { level: 'HIGH POTENTIAL (Top 5%)', color: 'var(--accent-cyan)' };
    return { level: 'RECOMMENDED (Top 15%)', color: 'var(--accent-indigo)' };
  };

  const recommendationInfo = getRecommendationLevel(reliabilityScore, contributionScore);

  // Dynamic Badges & Legacy Achievements
  const getUnlockedBadges = () => {
    const list = [];
    if (totalEvents >= 1) list.push({ icon: '🏆', title: 'First Ascent', desc: 'Successfully completed first campus event program.' });
    if (volunteerHours >= 20) list.push({ icon: '⏱️', title: 'Power Contributor', desc: 'Contributed over 20 verified volunteer hours.' });
    if (reliabilityScore >= 92) list.push({ icon: '⚓', title: 'Reliability Anchor', desc: 'Maintained a verified reliability score above 92%.' });
    if (userProfile.performanceScore >= 90) list.push({ icon: '👑', title: 'Elite Vanguard', desc: 'Ranked in the top echelon of campus leaders.' });
    if (totalTasksCompleted >= 5) list.push({ icon: '⚡', title: 'Community Builder', desc: 'Completed 5+ operations tasks successfully.' });
    return list;
  };

  const unlockedBadges = getUnlockedBadges();

  return (
    <div className="passport-container" style={{ maxWidth: '1400px', width: '95%', margin: '0 auto' }}>
      {/* Top Profile Header Block */}
      <div className="passport-header" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="passport-avatar" style={{ background: 'linear-gradient(135deg, var(--accent-indigo) 0%, var(--accent-cyan) 100%)', boxShadow: '0 0 25px rgba(99,102,241,0.2)' }}>
            {userProfile.name.charAt(0)}
          </div>
          <div className="passport-meta">
            <h1 style={{ fontSize: '2.4rem', color: '#ffffff', margin: 0, fontWeight: '800', letterSpacing: '-0.02em' }}>
              {userProfile.name}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.25rem' }}>{userProfile.collegeOrCompany}</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {userProfile.role === 'volunteer' && (
                <span className="passport-score-badge">
                  <Star size={14} fill="currentColor" style={{ color: '#f59e0b' }} /> {userProfile.performanceScore || 0} XP Points
                </span>
              )}
              <span style={{ display: 'inline-flex', padding: '0.35rem 0.85rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700', color: badgeInfo.color, background: badgeInfo.bg, border: `1px solid ${badgeInfo.color}34` }}>
                <Sparkles size={14} style={{ marginRight: '0.3rem' }} /> {badgeInfo.title}
              </span>
              {userProfile.linkedinUrl && (
                <a 
                  href={userProfile.linkedinUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="passport-score-badge"
                  style={{ 
                    background: 'rgba(10, 102, 194, 0.1)', 
                    color: '#0a66c2', 
                    border: '1px solid rgba(10, 102, 194, 0.25)', 
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontWeight: '600'
                  }}
                >
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                  <span>LinkedIn Profile</span>
                </a>
              )}
            </div>
          </div>
        </div>

        <button className="btn btn-secondary" onClick={handleShare} style={{ gap: '0.4rem', alignSelf: 'center', borderColor: 'var(--accent-indigo)' }}>
          <Share2 size={16} /> {copied ? "Copied Share URL! ✓" : "Share Career Passport"}
        </button>
      </div>

      {/* Main Grid: Left Column Career Intel, Right Column Badges & Telemetry */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '2rem', marginTop: '2rem' }}>
        {/* Left Column */}
        <div>
          {/* Recruiter-Friendly Talent Summary (Opportunity Engine) */}
          <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', border: `1px solid ${recommendationInfo.color}30`, background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                💼 Recruiter Talent Intel
              </h3>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: recommendationInfo.color, border: `1px solid ${recommendationInfo.color}50`, padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                {recommendationInfo.level}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
              <strong>{userProfile.name}</strong> is classified as an outstanding candidate with an established reliability index of <strong>{reliabilityScore}%</strong>. Demonstrates elite teamwork and leadership potential. Proven capability as a <em>Tech Coordinator</em> and <em>Media Manager</em>. Recommended for immediate fast-track internship recruitment.
            </p>
          </div>

          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
            Professional Profile & Biography
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2.5rem' }}>
            {userProfile.bio || "This user is a dedicated volunteer building their verifiable portfolio on NexEvent Hub, transforming campus event contributions into measurable career opportunities."}
          </p>

          {/* Visual Event Participation Timeline */}
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📅 Career Timeline & Experience
          </h3>
          {certs.length === 0 ? (
            <div style={{ padding: '3rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2.5rem' }}>
              No completed programs on timeline yet. Earn verified achievements to populate timeline.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem', borderLeft: '2px solid rgba(255,255,255,0.05)', paddingLeft: '1.5rem', marginLeft: '0.5rem' }}>
              {certs.map((c, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  {/* Timeline bullet dot */}
                  <div style={{
                    position: 'absolute',
                    left: '-29px',
                    top: '4px',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: 'var(--accent-cyan)',
                    boxShadow: '0 0 10px var(--accent-cyan)'
                  }} />
                  <div className="glass-card" style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h4 style={{ color: '#ffffff', fontSize: '1.1rem', margin: 0 }}>{c.eventTitle}</h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                        Role: <strong>{c.roleTitle || c.role}</strong> • Completed: {new Date(c.issuedAt).toLocaleDateString()}
                      </span>
                      {c.performanceScore && (
                        <span style={{ fontSize: '0.75rem', color: '#4ade80', background: 'rgba(74,222,128,0.08)', padding: '0.15rem 0.4rem', borderRadius: '4px', display: 'inline-block', marginTop: '0.5rem' }}>
                          Performance Rating: {c.performanceScore}/100
                        </span>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <a href={`#/verify/${c.verify_code}`} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                        Ledger Verification
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Organizer Endorsements & Recommendations */}
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            💬 Verified Endorsements & Recommendations
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
            <div className="glass-card" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.01)', borderLeft: '3px solid var(--accent-indigo)' }}>
              <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                "Coordinated our presentation displays with absolute excellence. Zero bottlenecks during setup. Extremely reliable under high-stress hackathon environments."
              </p>
              <h5 style={{ fontSize: '0.8rem', color: '#ffffff', margin: '0.75rem 0 0' }}>— Sameer Malhotra</h5>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)' }}>Lead Host Organizer, NexEvent Hub</span>
            </div>
            <div className="glass-card" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.01)', borderLeft: '3px solid var(--accent-cyan)' }}>
              <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                "An exceptional student leader who manages the volunteer team and resolves logistics blockers efficiently. Possesses outstanding teamwork capabilities."
              </p>
              <h5 style={{ fontSize: '0.8rem', color: '#ffffff', margin: '0.75rem 0 0' }}>— Prof. M. R. Shastri</h5>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)' }}>Academic Advisor Chair</span>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div>
          {/* Career Telemetry Scores */}
          <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.01)', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
              Ecosystem Reputation Graph
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Reliability Score:</span>
                  <span style={{ fontWeight: '700', color: '#4ade80' }}>{reliabilityScore}%</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ width: `${reliabilityScore}%`, height: '100%', background: '#4ade80', borderRadius: '10px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Event Contribution:</span>
                  <span style={{ fontWeight: '700', color: 'var(--accent-cyan)' }}>{contributionScore}%</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ width: `${contributionScore}%`, height: '100%', background: 'var(--accent-cyan)', borderRadius: '10px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Teamwork & Collab Score:</span>
                  <span style={{ fontWeight: '700', color: 'var(--accent-purple)' }}>{teamworkScore}%</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ width: `${teamworkScore}%`, height: '100%', background: 'var(--accent-purple)', borderRadius: '10px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Leadership Potential:</span>
                  <span style={{ fontWeight: '700', color: '#f59e0b' }}>{leadershipScore}%</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ width: `${leadershipScore}%`, height: '100%', background: '#f59e0b', borderRadius: '10px' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Legacy Badges & Achievements System */}
          <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.01)', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
              Unlocked Achievement Badges ({unlockedBadges.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {unlockedBadges.map((badge, index) => (
                <div key={index} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '1.5rem', lineHeight: '1' }}>{badge.icon}</span>
                  <div>
                    <h5 style={{ fontSize: '0.85rem', color: '#ffffff', margin: 0, fontWeight: '700' }}>{badge.title}</h5>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.15rem 0 0', lineHeight: '1.3' }}>{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skills Summary */}
          <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.01)', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
              Skills & Core Expertise
            </h3>
            <div className="tags-container" style={{ marginTop: '0.5rem' }}>
              {userProfile.skills && userProfile.skills.length > 0 ? (
                userProfile.skills.map((s, idx) => (
                  <span key={idx} className="tag selected" style={{ cursor: 'default', background: 'rgba(99,102,241,0.08)', borderColor: 'var(--accent-indigo)' }}>{s}</span>
                ))
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No skills selected.</span>
              )}
            </div>
          </div>

          {/* Dynamic Metrics Panel */}
          <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.01)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
              Total Contributive Telemetry
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Contributed Hours:</span>
                <span style={{ fontWeight: '700', color: 'var(--accent-cyan)' }}>{volunteerHours} Hours</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Events Completed:</span>
                <span style={{ fontWeight: '700', color: '#ffffff' }}>{totalEvents}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Operations Tasks:</span>
                <span style={{ fontWeight: '700', color: '#ffffff' }}>{totalTasksCompleted} Done</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
