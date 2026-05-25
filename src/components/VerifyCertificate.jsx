import React, { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, Award, Calendar, User, Star, ArrowLeft, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { fetchDocument } from '../dbService';

export default function VerifyCertificate({ code }) {
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState(null);

  useEffect(() => {
    const checkCert = async () => {
      setLoading(true);
      try {
        // Add a tiny deliberate delay for high-fidelity SaaS evaluation feel (lets skeleton animate)
        await new Promise(resolve => setTimeout(resolve, 800));
        const doc = await fetchDocument('certificates', code);
        setCert(doc);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    checkCert();
  }, [code]);

  if (loading) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '0 1.5rem' }}>
        <style>{`
          @keyframes skeleton-pulse {
            0% { opacity: 0.5; }
            50% { opacity: 0.8; }
            100% { opacity: 0.5; }
          }
          .skeleton-pulse-element {
            animation: skeleton-pulse 1.5s infinite ease-in-out;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 6px;
          }
        `}</style>
        <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <div className="skeleton-pulse-element" style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 1.5rem' }}></div>
          <div className="skeleton-pulse-element" style={{ width: '60%', height: '24px', margin: '0 auto 0.75rem' }}></div>
          <div className="skeleton-pulse-element" style={{ width: '40%', height: '16px', margin: '0 auto 2.5rem' }}></div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div className="skeleton-pulse-element" style={{ width: '20px', height: '20px', borderRadius: '50%' }}></div>
                <div style={{ flex: 1 }}>
                  <div className="skeleton-pulse-element" style={{ width: '30%', height: '12px', marginBottom: '6px' }}></div>
                  <div className="skeleton-pulse-element" style={{ width: '70%', height: '18px' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const issueDateString = cert
    ? new Date(cert.issuedAt || cert.timestamp || Date.now()).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '0 1.5rem' }}>
      <style>{`
        @keyframes scale-up-elastic {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.1); }
          75% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes fade-slide-in {
          0% { transform: translateY(15px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }

        @keyframes check-glow {
          0% { border-color: rgba(74,222,128,0.2); box-shadow: 0 0 10px rgba(74,222,128,0.1); }
          50% { border-color: rgba(74,222,128,0.6); box-shadow: 0 0 25px rgba(74,222,128,0.3); }
          100% { border-color: rgba(74,222,128,0.2); box-shadow: 0 0 10px rgba(74,222,128,0.1); }
        }

        .success-badge-animate {
          animation: scale-up-elastic 0.75s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .verified-card-animate {
          animation: fade-slide-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          background: rgba(13, 16, 32, 0.75);
          border: 1px solid rgba(74, 222, 128, 0.15);
          box-shadow: 0 20px 45px rgba(0,0,0,0.4);
        }

        .success-badge-container {
          width: 85px;
          height: 85px;
          border-radius: 50%;
          background: rgba(74,222,128,0.06);
          border: 2px solid #4ade80;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          animation: check-glow 2.5s infinite ease-in-out;
        }
      `}</style>

      <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Glow accent backdrop */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '240px',
          height: '240px',
          background: cert ? 'radial-gradient(circle, rgba(74,222,128,0.12) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />

        {cert ? (
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Confetti details */}
            <div className="success-badge-animate">
              <div className="success-badge-container">
                <ShieldCheck size={48} style={{ color: '#4ade80' }} />
              </div>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.9rem', background: 'rgba(74,222,128,0.08)', borderRadius: '50px', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
              <Sparkles size={12} /> Secure Verified Success
            </div>

            <h1 style={{ fontSize: '1.8rem', color: '#ffffff', marginBottom: '0.25rem', fontWeight: '800' }}>Authentic Certificate</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '2.2rem' }}>Verified Cryptographic Ledger Credential</p>

            <div className="glass-card verified-card-animate" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={16} style={{ color: 'var(--accent-indigo)' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified Recipient</span>
                  <span style={{ fontWeight: '700', fontSize: '1.1rem', color: '#ffffff' }}>{cert.userName}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(6,182,212,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={16} style={{ color: 'var(--accent-cyan)' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Event / Program Title</span>
                  <span style={{ fontWeight: '700', color: '#ffffff', fontSize: '1rem' }}>{cert.eventTitle}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(139,92,246,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={16} style={{ color: 'var(--accent-purple)' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recognition Role</span>
                  <span style={{ fontWeight: '700', color: '#a78bfa', fontSize: '0.95rem' }}>{cert.roleTitle || cert.role}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(234,179,8,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={16} style={{ color: '#facc15' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Credential Issue Date</span>
                  <span style={{ fontWeight: '700', color: '#facc15', fontSize: '0.95rem' }}>{issueDateString}</span>
                </div>
              </div>

              {cert.performanceScore !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(234,179,8,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Star size={16} style={{ color: '#facc15' }} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Performance Appraisal</span>
                    <span style={{ fontWeight: '700', color: '#ffffff', fontSize: '0.95rem' }}>{cert.performanceScore} / 100 XP Rating</span>
                  </div>
                </div>
              )}

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-dark)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cryptographic Verification ID</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', wordBreak: 'break-all', fontFamily: 'monospace', letterSpacing: '0.02em', display: 'block', marginTop: '3px' }}>
                  {cert.verify_code}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '2.5rem' }}>
              <a href="#/" className="btn btn-secondary" style={{ display: 'inline-flex', width: '100%', padding: '0.7rem', justifyContent: 'center', alignItems: 'center', gap: '0.4rem' }}>
                <ArrowLeft size={16} /> Return to Dashboard Hub
              </a>
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239,68,68,0.08)', border: '2px solid #ef4444', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <ShieldAlert size={44} style={{ color: '#ef4444' }} />
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.9rem', background: 'rgba(239,68,68,0.08)', borderRadius: '50px', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
              Verification Failed
            </div>

            <h1 style={{ fontSize: '1.8rem', color: '#ffffff', marginBottom: '0.5rem', fontWeight: '800' }}>Invalid Certificate</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2.2rem' }}>
              The cryptographic key could not be verified on the secure database.
            </p>
            
            <div className="glass-card" style={{ background: 'rgba(239,68,68,0.02)', borderColor: 'rgba(239,68,68,0.1)', textAlign: 'left', padding: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              <strong>Troubleshooting tips:</strong>
              <ul style={{ margin: '0.5rem 0 0 1.2rem', padding: 0 }}>
                <li>Double check that the verification hash in your link URL matches exactly.</li>
                <li>Make sure the credential has not been revoked or re-issued under a new cryptographic index.</li>
                <li>Reach out to the event administrator if this validation continues to fail.</li>
              </ul>
            </div>

            <div style={{ marginTop: '2.5rem' }}>
              <a href="#/" className="btn btn-secondary" style={{ display: 'inline-flex', width: '100%', padding: '0.7rem', justifyContent: 'center', alignItems: 'center', gap: '0.4rem' }}>
                <ArrowLeft size={16} /> Return to Dashboard Hub
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
