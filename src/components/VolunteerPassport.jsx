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
    if (role === 'organizer') return { title: 'Event Organizer', color: '#a855f7', bg: 'rgba(168,85,247,0.1)' };
    if (role === 'sponsor') return { title: 'Sponsor Partner', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' };
    if (role === 'participant') return { title: 'Attendee', color: '#10b981', bg: 'rgba(16,185,129,0.1)' };

    // Default/volunteer logic
    if (score >= 90) return { title: 'Elite Vanguard', color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
    if (score >= 80) return { title: 'Gold Tier Advisor', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
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

  return (
    <div className="passport-container">
      <div className="passport-header">
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div className="passport-avatar">
            {userProfile.name.charAt(0)}
          </div>
          <div className="passport-meta">
            <h1 style={{ fontSize: '2rem', color: '#ffffff', margin: 0 }}>{userProfile.name}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{userProfile.collegeOrCompany}</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {userProfile.role === 'volunteer' && (
                <span className="passport-score-badge">
                  <Star size={14} fill="currentColor" /> {userProfile.performanceScore || 0} Score
                </span>
              )}
              <span style={{ display: 'inline-flex', padding: '0.35rem 0.85rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', color: badgeInfo.color, background: badgeInfo.bg, border: `1px solid ${badgeInfo.color}44` }}>
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
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(10, 102, 194, 0.18)';
                    e.currentTarget.style.borderColor = 'rgba(10, 102, 194, 0.45)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(10, 102, 194, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(10, 102, 194, 0.25)';
                  }}
                >
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" style={{ flexShrink: 0 }}>
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                  <span>LinkedIn</span>
                </a>
              )}
            </div>
          </div>
        </div>

        <button className="btn btn-secondary" onClick={handleShare} style={{ gap: '0.4rem' }}>
          <Share2 size={16} /> {copied ? "Copied Link!" : "Share My Passport"}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '2rem', marginTop: '1.5rem' }}>
        {/* Left column */}
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
            About & Bio
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2rem' }}>
            {userProfile.bio || "No biography provided. This user is a dedicated volunteer building their portfolio on NexEvent Hub."}
          </p>

          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={20} style={{ color: 'var(--accent-purple)' }} /> Verified Certifications ({certs.length})
          </h3>

          {certs.length === 0 ? (
            <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.05)', textAlign: 'center', color: 'var(--text-muted)' }}>
              No certificates issued yet. Certificates are automatically generated after successfully completing a program.
            </div>
          ) : (
            certs.map((c, idx) => (
              <div key={idx} className="passport-cert-card">
                <div>
                  <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: '600' }}>{c.eventTitle}</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                    Role: {c.roleTitle || c.role} • Issued: {new Date(c.issuedAt).toLocaleDateString()}
                  </span>
                </div>
                <a href={`#/verify/${c.verify_code}`} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                  Verify <ExternalLink size={12} style={{ marginLeft: '0.25rem' }} />
                </a>
              </div>
            ))
          )}
        </div>

        {/* Right column */}
        <div>
          <div className="glass-card" style={{ background: 'rgba(255,255,255,0.01)', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
              Skills & Expertise
            </h3>
            <div className="tags-container">
              {userProfile.skills && userProfile.skills.length > 0 ? (
                userProfile.skills.map((s, idx) => (
                  <span key={idx} className="tag selected" style={{ cursor: 'default' }}>{s}</span>
                ))
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No skills selected.</span>
              )}
            </div>
          </div>

          <div className="glass-card" style={{ background: 'rgba(255,255,255,0.01)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
              Activity Telemetry
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckSquare size={16} /> Completed Tasks:
                </span>
                <span style={{ fontWeight: '600', color: '#ffffff' }}>{tasks.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={16} /> Events Participated:
                </span>
                <span style={{ fontWeight: '600', color: '#ffffff' }}>{certs.length}</span>
              </div>
              {userProfile.linkedinUrl && (
                <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                  <a href={userProfile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem' }}>
                    LinkedIn Profile <ExternalLink size={12} style={{ marginLeft: '0.25rem' }} />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
