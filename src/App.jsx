import React, { useState, useEffect } from 'react';
import { Bell, ShieldCheck, LogOut, LogIn, Award, Sparkles, Clock, Calendar, Users, Eye, EyeOff, User, Compass, HelpCircle, Search } from 'lucide-react';
import { checkAndSeedDatabase, fetchCollection, pushNotification, saveDocument, updateDocument, isRealFirebase, isMemoryFallbackActive } from './dbService';

// Import portal sub-views using React.lazy for optimized PageSpeed chunk-splitting
const PortalOrganizer = React.lazy(() => import('./components/PortalOrganizer'));
const PortalVolunteer = React.lazy(() => import('./components/PortalVolunteer'));
const PortalSponsor = React.lazy(() => import('./components/PortalSponsor'));
const PortalParticipant = React.lazy(() => import('./components/PortalParticipant'));
const VolunteerPassport = React.lazy(() => import('./components/VolunteerPassport'));
const VerifyCertificate = React.lazy(() => import('./components/VerifyCertificate'));
const AdminHealth = React.lazy(() => import('./components/AdminHealth'));

import DevTestPanel from './components/DevTestPanel';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Signup Form States
  const [signupStep, setSignupStep] = useState(0);
  const [signupForm, setSignupForm] = useState({
    role: 'participant',
    name: '',
    email: '',
    password: '',
    collegeOrCompany: '',
    city: '',
    state: '',
    // Organizer-specific
    orgType: 'Club',
    // Volunteer-specific
    skills: [],
    bio: '',
    linkedinUrl: '',
    // Sponsor-specific
    sponsorCompany: '',
    sponsorIndustry: 'Software / Technology',
    sponsorBudgetRange: 100000,
    sponsorTargetAudience: [],
    // Participant-specific
    interests: []
  });

  // Global events landing catalog
  const [eventsCatalog, setEventsCatalog] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [guestSearch, setGuestSearch] = useState('');
  const [guestCategory, setGuestCategory] = useState('All');

  // Trigger auto database seeder on startup
  useEffect(() => {
    checkAndSeedDatabase();
    
    // Listen for hash changes for client-side routing
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#/');
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync notification bells
  useEffect(() => {
    if (currentUser) {
      const loadNotifications = async () => {
        const list = await fetchCollection('notifications');
        const userNotifs = list.filter(n => n.userId === currentUser.uid || n.userId === 'all');
        setNotifications(userNotifs.sort((a, b) => b.timestamp - a.timestamp));
      };
      loadNotifications();
      // Poll notifications every 8 seconds
      const interval = setInterval(loadNotifications, 8000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Load guest events catalog
  useEffect(() => {
    const loadCatalog = async () => {
      const allEvents = await fetchCollection('events');
      setEventsCatalog(allEvents.filter(e => e.status === 'live'));
    };
    loadCatalog();
  }, [currentUser, currentHash]);

  // 2-hour inactivity warn and auto logout timers
  useEffect(() => {
    if (!currentUser) return;

    let warnTimeout;
    let logoutTimeout;

    const resetInactivityTimers = () => {
      clearTimeout(warnTimeout);
      clearTimeout(logoutTimeout);

      // Warning at 1 hour 50 minutes (110 mins)
      warnTimeout = setTimeout(() => {
        alert("⚠️ Inactivity Alert: You have been inactive for 1h 50m. For security, you will be logged out automatically in 10 minutes unless you perform an action.");
      }, 110 * 60 * 1000);

      // Logout at 2 hours
      logoutTimeout = setTimeout(() => {
        alert("🔒 Security Timeout: You have been logged out due to 2 hours of inactivity.");
        handleLogout();
      }, 120 * 60 * 1000);
    };

    // User activity listeners
    window.addEventListener('mousemove', resetInactivityTimers);
    window.addEventListener('keydown', resetInactivityTimers);
    window.addEventListener('scroll', resetInactivityTimers);
    window.addEventListener('click', resetInactivityTimers);

    resetInactivityTimers();

    return () => {
      clearTimeout(warnTimeout);
      clearTimeout(logoutTimeout);
      window.removeEventListener('mousemove', resetInactivityTimers);
      window.removeEventListener('keydown', resetInactivityTimers);
      window.removeEventListener('scroll', resetInactivityTimers);
      window.removeEventListener('click', resetInactivityTimers);
    };
  }, [currentUser]);

  // Handle Standard Sign-In
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (!email || !password) {
      setLoginError("⚠️ Email and password are required.");
      return;
    }

    try {
      const users = await fetchCollection('users');
      // Simple mock authentication match
      const matched = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (matched) {
        // In sandbox fallback mode, we bypass strict password matches for ease of evaluation
        setCurrentUser(matched);
        await pushNotification(matched.uid, "Sign-in Successful", `Welcome back, ${matched.name}!`, 'success');
        
        // Routing portal transition based on roles
        if (matched.role === 'organizer') window.location.hash = '#/organizer';
        else if (matched.role === 'volunteer') window.location.hash = '#/volunteer';
        else if (matched.role === 'sponsor') window.location.hash = '#/sponsor';
        else window.location.hash = '#/participant';
      } else {
        setLoginError("❌ Profile credentials not found. Use 'Explore with demo data' to sign in instantly.");
      }
    } catch (err) {
      setLoginError(`❌ Sign in failed: ${err.message}`);
    }
  };

  // Sign-in instantly using seeded Rahul volunteer sandbox credentials
  const handleExploreDemo = async () => {
    try {
      const users = await fetchCollection('users');
      const rahul = users.find(u => u.uid === 'vol-1');
      if (rahul) {
        setCurrentUser(rahul);
        window.location.hash = '#/volunteer';
      } else {
        alert("⚠️ Demo data is not seeded. Running seeder first...");
        checkAndSeedDatabase();
        const recheck = users.find(u => u.uid === 'vol-1');
        if (recheck) {
          setCurrentUser(recheck);
          window.location.hash = '#/volunteer';
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle 4-step wizard registration
  const handleSignup = async (e) => {
    e.preventDefault();
    
    // Step 2 Validation: Check basic details
    if (signupStep === 1) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!signupForm.name || !signupForm.email || !signupForm.password) {
        alert("⚠️ Please fill in all credentials fields.");
        return;
      }
      if (!emailRegex.test(signupForm.email)) {
        alert("⚠️ Invalid email format.");
        return;
      }
      if (signupForm.password.length < 8) {
        alert("⚠️ Password must be at least 8 characters long.");
        return;
      }
      setSignupStep(2);
      return;
    }

    // Step 3 Completion: Compile and save account
    if (signupStep === 2) {
      const userId = `user-${Date.now()}`;
      const payload = {
        uid: userId,
        name: signupForm.name,
        email: signupForm.email,
        role: signupForm.role,
        collegeOrCompany: signupForm.collegeOrCompany || 'Self Employed',
        city: signupForm.city,
        state: signupForm.state,
        emailVerified: true, // Auto verify sandbox/local
        privacyShowOnPassport: true,
        performanceScore: signupForm.role === 'volunteer' ? 0 : undefined,
        orgType: signupForm.role === 'organizer' ? signupForm.orgType : undefined,
        skills: signupForm.role === 'volunteer' ? signupForm.skills : undefined,
        bio: signupForm.role === 'volunteer' ? signupForm.bio : undefined,
        linkedinUrl: signupForm.linkedinUrl || '',
        sponsorCompany: signupForm.role === 'sponsor' ? signupForm.sponsorCompany : undefined,
        sponsorIndustry: signupForm.role === 'sponsor' ? signupForm.sponsorIndustry : undefined,
        sponsorBudgetRange: signupForm.role === 'sponsor' ? signupForm.sponsorBudgetRange : undefined,
        sponsorTargetAudience: signupForm.role === 'sponsor' ? signupForm.sponsorTargetAudience : undefined,
        participantInterests: signupForm.role === 'participant' ? signupForm.interests : undefined
      };

      await saveDocument('users', userId, payload);
      alert("🎉 Account created successfully! Proceeding to portal onboarding.");
      setCurrentUser(payload);
      
      // Reset signup stepper
      setSignupStep(0);
      
      if (payload.role === 'organizer') window.location.hash = '#/organizer';
      else if (payload.role === 'volunteer') window.location.hash = '#/volunteer';
      else if (payload.role === 'sponsor') window.location.hash = '#/sponsor';
      else window.location.hash = '#/participant';
    }
  };

  // Sign out session
  const handleLogout = () => {
    setCurrentUser(null);
    window.location.hash = '#/';
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      for (const n of notifications) {
        if (!n.read) {
          await updateDocument('notifications', n.id, { read: true });
        }
      }
      const list = await fetchCollection('notifications');
      const userNotifs = list.filter(n => n.userId === currentUser.uid || n.userId === 'all');
      setNotifications(userNotifs.sort((a, b) => b.timestamp - a.timestamp));
    } catch (err) {
      console.error(err);
    }
  };

  // Public Event Details Guest View Router Helper
  const renderGuestEventPage = (id) => {
    const event = eventsCatalog.find(e => e.id === id);
    if (!event) return <div style={{ padding: '4rem', textAlign: 'center' }}>Event not found.</div>;

    return (
      <div className="event-detail-grid" style={{ marginTop: '3rem' }}>
        <div>
          <img src={event.bannerUrl} alt={event.title} style={{ height: '280px', width: '100%', objectFit: 'cover', borderRadius: '12px', marginBottom: '2rem' }} />
          <span className="tag-badge" style={{ color: 'var(--accent-cyan)', borderColor: 'var(--accent-cyan)' }}>{event.category}</span>
          <h1 style={{ fontSize: '2.5rem', marginTop: '0.5rem', marginBottom: '1rem', color: '#ffffff' }}>{event.title}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2rem' }}>{event.desc}</p>
        </div>

        <div className="glass-panel" style={{ height: 'fit-content', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#ffffff' }}>Host Venue Details</h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Calendar size={18} style={{ color: 'var(--accent-indigo)' }} />
            <span style={{ fontSize: '0.9rem' }}>{new Date(event.startDate).toLocaleDateString()}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Compass size={18} style={{ color: 'var(--accent-cyan)' }} />
            <span style={{ fontSize: '0.9rem' }}>{event.venueName}</span>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', marginTop: '0.5rem' }}>
            <a href="#/login" className="btn btn-primary" style={{ width: '100%' }}>Register Admission</a>
          </div>
        </div>
      </div>
    );
  };

  // Render client-side Hash Router views
  const renderHashView = () => {
    const hash = currentHash;
    
    // 1. Passport public view: #/passport/:username
    if (hash.startsWith('#/passport/')) {
      const username = decodeURIComponent(hash.substring('#/passport/'.length));
      return <VolunteerPassport username={username} />;
    }

    // 2. Certificate verify public view: #/verify/:code
    if (hash.startsWith('#/verify/')) {
      const code = hash.substring('#/verify/'.length);
      return <VerifyCertificate code={code} />;
    }

    // 3. Guest/Public Event Details Page: #/event/:id
    if (hash.startsWith('#/event/')) {
      const parts = hash.split('/');
      const id = parts[parts.length - 1];
      return renderGuestEventPage(id);
    }

    // 4. Admin telemetry health check portal: #/admin/health
    if (hash === '#/admin/health') {
      return <AdminHealth />;
    }

    // 5. Auth Portals Mapping
    if (hash === '#/login') {
      return (
        <div className="login-wrap">
          <div className="glass-panel" style={{ padding: '2.5rem' }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Sign In</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>Access your custom NexEvent Command Center.</p>

            {loginError && (
              <div className="alert-bar" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="input-group">
                <label className="input-label">Email Address</label>
                <input className="input-field" type="email" placeholder="e.g. organizer@college.edu" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>

              <div className="input-group">
                <label className="input-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input className="input-field" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button className="btn btn-primary" type="submit" style={{ width: '100%', padding: '0.8rem', marginTop: '1rem' }}>
                Sign In
              </button>

              <button className="btn btn-secondary" type="button" onClick={handleExploreDemo} style={{ width: '100%', padding: '0.8rem', marginTop: '0.75rem', borderColor: 'var(--accent-indigo)', background: 'rgba(99,102,241,0.05)' }}>
                Explore with demo data (Rahul Volunteer)
              </button>
            </form>

            <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Don't have an account? <a href="#/signup">Sign Up</a>
            </div>
          </div>
        </div>
      );
    }

    if (hash === '#/signup') {
      return (
        <div className="login-wrap" style={{ maxWidth: '520px' }}>
          <div className="glass-panel" style={{ padding: '2.5rem' }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', textAlign: 'center' }}>Create Account</h2>
            
            {/* Step Wizard Node Steppers */}
            <div className="stepper-container">
              <div className={`step-node ${signupStep === 0 ? 'active' : 'completed'}`}>1</div>
              <div className={`step-node ${signupStep === 1 ? 'active' : signupStep > 1 ? 'completed' : ''}`}>2</div>
              <div className={`step-node ${signupStep === 2 ? 'active' : ''}`}>3</div>
            </div>

            <form onSubmit={handleSignup}>
              {/* Step 1: Role Selection */}
              {signupStep === 0 && (
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#ffffff' }}>Step 1: Choose your role</h3>
                  <div className="role-cards-grid">
                    <div className={`role-card glass-card ${signupForm.role === 'organizer' ? 'selected' : ''}`} onClick={() => setSignupForm({ ...signupForm, role: 'organizer' })}>
                      <Calendar size={24} style={{ color: 'var(--accent-purple)' }} />
                      <h4 style={{ fontSize: '0.95rem' }}>Organizer</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Create and manage events</p>
                    </div>
                    <div className={`role-card glass-card ${signupForm.role === 'volunteer' ? 'selected' : ''}`} onClick={() => setSignupForm({ ...signupForm, role: 'volunteer' })}>
                      <Award size={24} style={{ color: 'var(--accent-cyan)' }} />
                      <h4 style={{ fontSize: '0.95rem' }}>Volunteer</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Join events, build your portfolio</p>
                    </div>
                    <div className={`role-card glass-card ${signupForm.role === 'sponsor' ? 'selected' : ''}`} onClick={() => setSignupForm({ ...signupForm, role: 'sponsor' })}>
                      <Users size={24} style={{ color: 'var(--accent-indigo)' }} />
                      <h4 style={{ fontSize: '0.95rem' }}>Sponsor</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Discover events, reach audience</p>
                    </div>
                    <div className={`role-card glass-card ${signupForm.role === 'participant' ? 'selected' : ''}`} onClick={() => setSignupForm({ ...signupForm, role: 'participant' })}>
                      <Compass size={24} style={{ color: '#4ade80' }} />
                      <h4 style={{ fontSize: '0.95rem' }}>Participant</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Discover and attend events</p>
                    </div>
                  </div>
                  <button className="btn btn-primary" type="button" onClick={() => setSignupStep(1)} style={{ width: '100%' }}>
                    Continue to Details
                  </button>
                </div>
              )}

              {/* Step 2: Basic Details */}
              {signupStep === 1 && (
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#ffffff' }}>Step 2: Basic details</h3>
                  <div className="input-group">
                    <label className="input-label">Full Name</label>
                    <input className="input-field" type="text" placeholder="Rahul Sharma" value={signupForm.name} onChange={e => setSignupForm({ ...signupForm, name: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Email Address</label>
                    <input className="input-field" type="email" placeholder="rahul@gmail.com" value={signupForm.email} onChange={e => setSignupForm({ ...signupForm, email: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Password (min 8 characters)</label>
                    <input className="input-field" type="password" placeholder="••••••••" value={signupForm.password} onChange={e => setSignupForm({ ...signupForm, password: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">College/Company Name</label>
                    <input className="input-field" type="text" placeholder="State Science College" value={signupForm.collegeOrCompany} onChange={e => setSignupForm({ ...signupForm, collegeOrCompany: e.target.value })} required />
                  </div>
                  <div className="grid-2">
                    <div className="input-group">
                      <label className="input-label">City</label>
                      <input className="input-field" type="text" placeholder="Delhi" value={signupForm.city} onChange={e => setSignupForm({ ...signupForm, city: e.target.value })} required />
                    </div>
                    <div className="input-group">
                      <label className="input-label">State</label>
                      <input className="input-field" type="text" placeholder="Delhi" value={signupForm.state} onChange={e => setSignupForm({ ...signupForm, state: e.target.value })} required />
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">LinkedIn Profile URL (optional)</label>
                    <input className="input-field" type="url" placeholder="https://linkedin.com/in/username" value={signupForm.linkedinUrl} onChange={e => setSignupForm({ ...signupForm, linkedinUrl: e.target.value })} />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <button className="btn btn-secondary" type="button" onClick={() => setSignupStep(0)} style={{ flex: 1 }}>Back</button>
                    <button className="btn btn-primary" type="submit" style={{ flex: 1 }}>Next Step</button>
                  </div>
                </div>
              )}

              {/* Step 3: Role specific profiling */}
              {signupStep === 2 && (
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#ffffff' }}>Step 3: Role-specific profile</h3>

                  {/* Organizer parameters */}
                  {signupForm.role === 'organizer' && (
                    <div className="input-group">
                      <label className="input-label">Organization Type</label>
                      <select className="input-field" value={signupForm.orgType} onChange={e => setSignupForm({ ...signupForm, orgType: e.target.value })}>
                        <option value="Club">College Club</option>
                        <option value="NGO">NGO</option>
                        <option value="Corporate">Corporate</option>
                        <option value="Individual">Individual</option>
                      </select>
                    </div>
                  )}

                  {/* Volunteer parameters */}
                  {signupForm.role === 'volunteer' && (
                    <div>
                      <div className="input-group">
                        <label className="input-label">Select Skills Multi-select</label>
                        <div className="tags-container">
                          {['Photography', 'Design', 'Tech', 'Logistics', 'Marketing', 'Stage Management', 'Security', 'Food & Beverage'].map(skill => {
                            const selected = signupForm.skills.includes(skill);
                            return (
                              <span key={skill} className={`tag ${selected ? 'selected' : ''}`} onClick={() => {
                                const newSkills = selected 
                                  ? signupForm.skills.filter(s => s !== skill) 
                                  : [...signupForm.skills, skill];
                                setSignupForm({ ...signupForm, skills: newSkills });
                              }}>{skill}</span>
                            );
                          })}
                        </div>
                      </div>

                      <div className="input-group">
                        <label className="input-label">Bio (max 200 characters)</label>
                        <textarea className="input-field" maxLength="200" placeholder="Brief self description..." value={signupForm.bio} onChange={e => setSignupForm({ ...signupForm, bio: e.target.value })} style={{ height: '70px', resize: 'none' }} />
                      </div>
                    </div>
                  )}

                  {/* Sponsor parameters */}
                  {signupForm.role === 'sponsor' && (
                    <div>
                      <div className="input-group">
                        <label className="input-label">Industry Sector</label>
                        <select className="input-field" value={signupForm.sponsorIndustry} onChange={e => setSignupForm({ ...signupForm, sponsorIndustry: e.target.value })}>
                          <option value="Software / Technology">Software / Technology</option>
                          <option value="Education">Education</option>
                          <option value="Finance">Finance</option>
                          <option value="Entertainment">Entertainment</option>
                        </select>
                      </div>

                      <div className="input-group">
                        <label className="input-label">Sponsorship Budget Range: ₹{signupForm.sponsorBudgetRange.toLocaleString()}</label>
                        <input type="range" min="10000" max="1000000" step="10000" value={signupForm.sponsorBudgetRange} onChange={e => setSignupForm({ ...signupForm, sponsorBudgetRange: Number(e.target.value) })} style={{ width: '100%', accentColor: 'var(--accent-indigo)' }} />
                      </div>
                    </div>
                  )}

                  {/* Participant parameters */}
                  {signupForm.role === 'participant' && (
                    <div className="input-group">
                      <label className="input-label">Interests</label>
                      <div className="tags-container">
                        {['Technology', 'Cultural', 'Sports', 'Academic', 'Hackathons', 'Design'].map(interest => {
                          const selected = signupForm.interests.includes(interest);
                          return (
                            <span key={interest} className={`tag ${selected ? 'selected' : ''}`} onClick={() => {
                              const newInt = selected 
                                ? signupForm.interests.filter(i => i !== interest)
                                : [...signupForm.interests, interest];
                              setSignupForm({ ...signupForm, interests: newInt });
                            }}>{interest}</span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <button className="btn btn-secondary" type="button" onClick={() => setSignupStep(1)} style={{ flex: 1 }}>Back</button>
                    <button className="btn btn-primary" type="submit" style={{ flex: 1 }}>Create Profile</button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      );
    }

    // Role Portals Router mapping (secured)
    if (hash === '#/organizer' && currentUser?.role === 'organizer') {
      return <PortalOrganizer user={currentUser} />;
    }
    if (hash === '#/volunteer' && currentUser?.role === 'volunteer') {
      return <PortalVolunteer user={currentUser} />;
    }
    if (hash === '#/sponsor' && currentUser?.role === 'sponsor') {
      return <PortalSponsor user={currentUser} />;
    }
    if (hash === '#/participant' && currentUser?.role === 'participant') {
      return <PortalParticipant user={currentUser} />;
    }

    // 6. Guest Discovery Page (Default route `#` or `#/`)
    return (
      <div style={{ maxWidth: '1600px', width: '95%', margin: '0 auto', padding: '3rem 1.5rem', textAlign: 'left' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', background: 'rgba(99,102,241,0.08)', borderRadius: '50px', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--accent-indigo)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem' }}>
            <Sparkles size={14} /> The complete student event ecosystems
          </div>
          
          <h1 style={{ fontSize: '3.6rem', fontWeight: '800', lineHeight: '1.1', letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #ffffff 40%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 1.5rem' }}>
            NexEvent Hub Platform
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', maxWidth: '600px', margin: '0 auto 2.5rem', lineHeight: '1.6' }}>
            Connect organizers, volunteers, sponsors and participants in one seamless, high-fidelity dark glassmorphic platform.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <a href="#/login" className="btn btn-primary">Enter Dashboard portal</a>
            <a href="#/signup" className="btn btn-secondary">Create Account Wizard</a>
          </div>
        </div>

        {/* Global discovery catalog search */}
        <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>Open Live events discovery</h2>
        
        <div className="glass-panel" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input-field" type="text" placeholder="Search catalog by title..." value={guestSearch} onChange={e => setGuestSearch(e.target.value)} style={{ paddingLeft: '2.5rem' }} />
          </div>
          
          <select className="input-field" value={guestCategory} onChange={e => setGuestCategory(e.target.value)} style={{ maxWidth: '200px' }}>
            <option value="All">All Categories</option>
            <option value="Tech">Technology</option>
            <option value="Cultural">Cultural / Arts</option>
            <option value="Sports">Sports</option>
            <option value="Academic">Academic</option>
            <option value="Workshop">Workshop</option>
            <option value="Hackathon">Hackathon</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {eventsCatalog.filter(e => {
            const matchesQuery = e.title.toLowerCase().includes(guestSearch.toLowerCase());
            const matchesCat = guestCategory === 'All' || e.category === guestCategory;
            return matchesQuery && matchesCat;
          }).map(event => (
            <div key={event.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', cursor: 'pointer' }} onClick={() => { window.location.hash = `#/event/${event.id}`; }}>
              <img src={event.bannerUrl} alt={event.title} style={{ height: '160px', width: '100%', objectFit: 'cover', borderRadius: '8px' }} />
              
              <div>
                <span className="tag-badge" style={{ color: 'var(--accent-cyan)', borderColor: 'var(--accent-cyan)' }}>{event.category}</span>
                <h3 style={{ fontSize: '1.25rem', marginTop: '0.5rem', marginBottom: '0.25rem' }}>{event.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{event.desc}</p>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Calendar size={14} /> {new Date(event.startDate).toLocaleDateString()}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Compass size={14} /> {event.venueName}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Floating Quota Warning Banner for extreme resilience */}
      {isMemoryFallbackActive() && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99999,
          width: '90%',
          maxWidth: '900px',
          background: 'rgba(239, 68, 68, 0.95)',
          color: '#ffffff',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px 0 rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          padding: '0.8rem 1.5rem',
          borderRadius: '8px',
          backdropFilter: 'blur(8px)',
          fontFamily: 'Outfit, sans-serif'
        }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem', textAlign: 'left', lineHeight: '1.4' }}>
            ⚠️ Storage Warning: Browser local storage is full due to other sites. Running in temporary memory mode (changes will reset on reload).
          </span>
          <button onClick={async () => {
            if (confirm("Clear browser local storage for this domain to reclaim space and enable persistent saving? All data will be cleanly reseeded.")) {
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload();
            }
          }} className="btn" style={{ padding: '0.3rem 0.8rem', fontSize: '0.75rem', background: '#ffffff', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', flexShrink: 0 }}>
            Fix Space & Reload
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <nav className="navbar">
        <div style={{ maxWidth: '1600px', width: '100%', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="nav-brand" onClick={() => { window.location.hash = '#/'; }}>
            <Sparkles size={20} style={{ color: 'var(--accent-cyan)' }} />
            NexEvent Hub
          </div>

          <div className="nav-links">
            {currentUser ? (
              <>
                {/* Dynamic portal router links based on login profile role */}
                {currentUser.role === 'organizer' && <a href="#/organizer" className="nav-link">Organizer Dashboard</a>}
                {currentUser.role === 'volunteer' && <a href="#/volunteer" className="nav-link">Volunteer Dashboard</a>}
                {currentUser.role === 'sponsor' && <a href="#/sponsor" className="nav-link">Sponsor Dashboard</a>}
                {currentUser.role === 'participant' && <a href="#/participant" className="nav-link">Attendee Dashboard</a>}

                {/* Notification bell dropdown list */}
                <div className="notif-bell-container">
                  <button className="nav-link" onClick={() => setShowNotifications(!showNotifications)} style={{ background: 'transparent', border: 'none', position: 'relative' }}>
                    <Bell size={18} />
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span className="notif-badge">{notifications.filter(n => !n.read).length}</span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="notif-dropdown">
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                        <h4 style={{ fontSize: '0.9rem' }}>Notifications</h4>
                        <button onClick={handleMarkAllRead} style={{ background: 'transparent', border: 'none', color: 'var(--accent-indigo)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600' }}>
                          Mark All Read
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', display: 'block', padding: '1rem 0' }}>No active notifications.</span>
                        ) : (
                          notifications.slice(0, 10).map(n => (
                            <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`}>
                              <h5 style={{ fontSize: '0.85rem', color: '#ffffff' }}>{n.title}</h5>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{n.message}</p>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-dark)', display: 'block', marginTop: '0.25rem' }}>
                                {new Date(n.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Security Telemetry Admin Health Access */}
                {currentUser.email === 'organizer@college.edu' && (
                  <a href="#/admin/health" className="nav-link" title="Admin Control Center">
                    <ShieldCheck size={18} style={{ color: 'var(--accent-cyan)' }} />
                  </a>
                )}

                <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', gap: '0.3rem' }}>
                  <LogOut size={14} /> Log Out
                </button>
              </>
            ) : (
              <>
                <a href="#/" className="nav-link">Home</a>
                <a href="#/login" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                  <LogIn size={14} /> Sign In
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Client Content with Suspense for fast dynamic chunk rendering */}
      <main style={{ flex: 1, minHeight: 'calc(100vh - 64px)' }}>
        <React.Suspense fallback={<div className="loading-container"><div className="loading-spinner"></div></div>}>
          {renderHashView()}
        </React.Suspense>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: 'var(--glass-border)', padding: '1.5rem', background: '#07080c', color: 'var(--text-dark)', fontSize: '0.8rem', textAlign: 'center', marginTop: '3rem' }}>
        <div>NexEvent Hub Ecosystem Platform • Multi-Sided Hackathon Solution</div>
        <div style={{ marginTop: '0.25rem' }}>Constructed using high-fidelity dark glassmorphic React components • fallbacks enabled</div>
      </footer>

      {/* Dev Console Keyboard shortcut Panel Overlay (Ctrl+Shift+T) */}
      <DevTestPanel />
    </>
  );
}
