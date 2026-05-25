import React, { useState, useEffect } from 'react';
import { Plus, Check, X, Users, Award, Calendar, DollarSign, Image, Sparkles, AlertCircle, Camera, CheckCircle, RefreshCw } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { fetchCollection, saveDocument, updateDocument, pushNotification, validateAndCheckInTicket } from '../dbService';

export default function PortalOrganizer({ user }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [events, setEvents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Scanner states
  const [scannerActive, setScannerActive] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scanResult, setScanResult] = useState(null);

  // 6-step Event Wizard Form state
  const [wizardStep, setWizardStep] = useState(0);
  const [eventForm, setEventForm] = useState({
    title: '',
    category: 'Tech',
    desc: '',
    bannerUrl: '',
    tags: '',
    startDate: '',
    endDate: '',
    venueName: '',
    venueAddress: '',
    delivery: 'Offline',
    meetingLink: '',
    capacity: 100,
    deadline: '',
    pricing: 'free',
    ticketPrice: 0,
    allowTeams: false,
    teamSizeMin: 2,
    teamSizeMax: 4,
    vRoles: [
      { id: 'vr-1', title: 'Tech Coordinator', skills: 'Tech, Logistics', slots: 5, desc: 'Setup presentation displays and manage equipment.' },
      { id: 'vr-2', title: 'Media Manager', skills: 'Photography, Design', slots: 2, desc: 'Document key talks and backstage activities.' }
    ],
    sPackages: [
      { id: 'sp-1', name: 'Platinum Partner', price: 100000, perks: 'Logo on banner, 10 VIP passes, custom booth space', slots: 1 },
      { id: 'sp-2', name: 'Gold Partner', price: 50000, perks: 'Logo on website, 5 VIP passes, custom booth space', slots: 2 }
    ]
  });

  const loadOrganizerData = async () => {
    setLoading(true);
    try {
      const allEvents = await fetchCollection('events', [{ field: 'organizerId', op: '==', value: user.uid }]);
      setEvents(allEvents);

      if (allEvents.length > 0) {
        setSelectedEventId(allEvents[0].id);
      }

      const allApps = await fetchCollection('applications');
      // Filter applications for events owned by this organizer
      const ownedEventIds = allEvents.map(e => e.id);
      const filteredApps = allApps.filter(app => ownedEventIds.includes(app.eventId));
      setApplications(filteredApps);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizerData();
  }, [user.uid]);

  useEffect(() => {
    if (selectedEventId) {
      const loadRegs = async () => {
        const allRegs = await fetchCollection('registrations', [{ field: 'eventId', op: '==', value: selectedEventId }]);
        setRegistrations(allRegs);
      };
      loadRegs();
    }
  }, [selectedEventId]);

  // Image upload base64 converter
  const handleBannerUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("⚠️ File size must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setEventForm(prev => ({ ...prev, bannerUrl: uploadEvent.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // 6-step event publisher
  const handleCreateEvent = async (status = 'live') => {
    if (!eventForm.title || !eventForm.startDate || !eventForm.venueName) {
      alert("⚠️ Please fill in all required fields (Title, Start Date, Venue Name)");
      return;
    }

    const eventId = `event-${Date.now()}`;
    const newEvent = {
      id: eventId,
      organizerId: user.uid,
      title: eventForm.title,
      category: eventForm.category,
      desc: eventForm.desc,
      bannerUrl: eventForm.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      tags: eventForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      status: status,
      startDate: eventForm.startDate,
      endDate: eventForm.endDate || eventForm.startDate,
      venueName: eventForm.venueName,
      venueAddress: eventForm.venueAddress,
      delivery: eventForm.delivery,
      meetingLink: eventForm.meetingLink,
      capacity: Number(eventForm.capacity),
      deadline: eventForm.deadline || eventForm.startDate,
      pricing: eventForm.pricing,
      ticketPrice: Number(eventForm.ticketPrice),
      allowTeams: eventForm.allowTeams,
      teamSizeRange: eventForm.allowTeams ? { min: Number(eventForm.teamSizeMin), max: Number(eventForm.teamSizeMax) } : null,
      registrationsCount: 0,
      checkedInCount: 0,
      sponsorshipsEnabled: true,
      sponsorRaisedTotal: 0,
      volunteerRoles: eventForm.vRoles.map(v => ({
        id: v.id,
        title: v.title,
        skills: v.skills.split(',').map(s => s.trim()).filter(Boolean),
        slotsTotal: Number(v.slots),
        slotsFilled: 0,
        description: v.desc
      })),
      sponsorshipPackages: eventForm.sPackages.map(sp => ({
        id: sp.id,
        name: sp.name,
        price: Number(sp.price),
        perks: sp.perks.split(',').map(p => p.trim()).filter(Boolean),
        maxSponsors: Number(sp.slots),
        sponsorsFilled: 0
      }))
    };

    await saveDocument('events', eventId, newEvent);
    alert(`🎉 Event "${eventForm.title}" has been successfully published!`);
    loadOrganizerData();
    setActiveTab('dashboard');
    // Reset form
    setWizardStep(0);
  };

  // Volunteer approval routing
  const handleApproveVolunteer = async (appId, approved = true) => {
    try {
      const status = approved ? 'approved' : 'rejected';
      await updateDocument('applications', appId, { status });
      
      const app = applications.find(a => a.id === appId);
      if (app) {
        // Send a notification to volunteer
        await pushNotification(
          app.userId,
          approved ? "Application Approved! 🎉" : "Application Status Update",
          approved 
            ? `Congratulations! You have been selected as a ${app.roleTitle} for ${app.eventTitle}.` 
            : `Thank you for your interest. Unfortunately, all slots are filled for ${app.eventTitle}.`,
          approved ? 'success' : 'alert'
        );

        if (approved) {
          // Increment filled slot counter
          const event = await fetchCollection('events', [{ field: 'id', op: '==', value: app.eventId }]);
          if (event.length > 0) {
            const updatedRoles = event[0].volunteerRoles.map(r => {
              if (r.id === app.roleId) {
                return { ...r, slotsFilled: (r.slotsFilled || 0) + 1 };
              }
              return r;
            });
            await updateDocument('events', app.eventId, { volunteerRoles: updatedRoles });
          }
        }
      }

      alert(`Application has been ${status}.`);
      loadOrganizerData();
    } catch (err) {
      console.error(err);
    }
  };

  // Manual check-in override
  const handleManualCheckIn = async (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    setScanResult({ loading: true });
    const res = await validateAndCheckInTicket(manualCode, selectedEventId);
    setScanResult(res);
    setManualCode('');
    
    // Refresh registration checkin statistics
    if (res.success) {
      const allRegs = await fetchCollection('registrations', [{ field: 'eventId', op: '==', value: selectedEventId }]);
      setRegistrations(allRegs);
    }
  };

  // Init html5-qrcode camera scanner
  const startCameraScanner = () => {
    setScannerActive(true);
    setScanResult(null);
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner("reader-container", { fps: 10, qrbox: 250 }, false);
      scanner.render(async (decodedText) => {
        scanner.clear();
        setScannerActive(false);
        setScanResult({ loading: true });
        
        const res = await validateAndCheckInTicket(decodedText, selectedEventId);
        setScanResult(res);

        // Refresh registrations
        const allRegs = await fetchCollection('registrations', [{ field: 'eventId', op: '==', value: selectedEventId }]);
        setRegistrations(allRegs);
      }, (err) => {
        // console.warn(err);
      });
    }, 200);
  };

  // Trigger End Event & Issue Certificates
  const handleEndEvent = async (eventId) => {
    if (!window.confirm("⚠️ Are you sure you want to end this event? This will automatically generate certificates for all approved volunteers and checked-in attendees!")) {
      return;
    }

    try {
      await updateDocument('events', eventId, { status: 'completed' });
      const event = events.find(e => e.id === eventId);
      
      // Issue Certificates to checked in attendees
      const eventRegs = await fetchCollection('registrations', [
        { field: 'eventId', op: '==', value: eventId },
        { field: 'checked_in', op: '==', value: true }
      ]);

      for (const reg of eventRegs) {
        const code = btoa(`${eventId}|${reg.userId}|reg-cert-${Date.now()}`);
        const certObj = {
          code,
          eventId,
          eventTitle: event.title,
          userId: reg.userId,
          userName: reg.userName,
          role: 'participant',
          roleTitle: 'Attendee Participant',
          issuedAt: Date.now(),
          verify_code: code
        };
        await saveDocument('certificates', code, certObj);
        await pushNotification(reg.userId, "Event Completed! Certificate Issued 🎓", `Your participation certificate for ${event.title} is ready! Check your dashboard portfolio.`, 'success');
      }

      // Issue Certificates to volunteers
      const volApps = applications.filter(a => a.eventId === eventId && a.status === 'approved');
      for (const app of volApps) {
        const code = btoa(`${eventId}|${app.userId}|vol-cert-${Date.now()}`);
        const score = Math.round(80 + Math.random() * 20); // Assign a dynamic performance rating
        const certObj = {
          code,
          eventId,
          eventTitle: event.title,
          userId: app.userId,
          userName: app.userName,
          role: 'volunteer',
          roleTitle: app.roleTitle,
          issuedAt: Date.now(),
          verify_code: code,
          performanceScore: score
        };
        await saveDocument('certificates', code, certObj);
        
        // Also update volunteer score
        const users = await fetchCollection('users');
        const volUser = users.find(u => u.uid === app.userId);
        if (volUser) {
          const newScore = Math.round(((volUser.performanceScore || 0) + score) / (volUser.performanceScore ? 2 : 1));
          await updateDocument('users', app.userId, { performanceScore: newScore });
        }

        await pushNotification(app.userId, "Volunteer Certificate Ready! 🌟", `Thank you for your amazing support at ${event.title}! Your certificate rating is ${score}/100.`, 'success');
      }

      alert("🎉 Event successfully completed! Certificates have been securely issued to participants & volunteers.");
      loadOrganizerData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="portal-layout">
      {/* Sidebar menu */}
      <div className="sidebar-menu">
        <div style={{ padding: '0 0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', color: '#ffffff' }}>Organizer Console</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.orgType || 'College Club'}</span>
        </div>

        <button className={`sidebar-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <Calendar size={18} /> Event Dashboard
        </button>
        <button className={`sidebar-btn ${activeTab === 'publish' ? 'active' : ''}`} onClick={() => { setActiveTab('publish'); setWizardStep(0); }}>
          <Plus size={18} /> Publish New Event
        </button>
        <button className={`sidebar-btn ${activeTab === 'roster' ? 'active' : ''}`} onClick={() => setActiveTab('roster')}>
          <Users size={18} /> Volunteers Roster
        </button>
        <button className={`sidebar-btn ${activeTab === 'attendees' ? 'active' : ''}`} onClick={() => setActiveTab('attendees')}>
          <Users size={18} /> Registered Attendees
        </button>
        <button className={`sidebar-btn ${activeTab === 'scanner' ? 'active' : ''}`} onClick={() => setActiveTab('scanner')}>
          <Camera size={18} /> Ticket checkin scanner
        </button>
      </div>

      {/* Main panel view */}
      <div className="portal-content" style={{ textAlign: 'left' }}>
        {activeTab === 'dashboard' && (
          <div>
            <div className="dashboard-header">
              <div>
                <h2 style={{ fontSize: '1.8rem' }}>Welcome Back, {user.name}</h2>
                <p style={{ color: 'var(--text-muted)' }}>Manage your college clubs, host workshops, and track attendance.</p>
              </div>
              <button className="btn btn-secondary" onClick={loadOrganizerData}>
                <RefreshCw size={16} /> Refresh
              </button>
            </div>

            {/* SVG budget breakdown charts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <DollarSign size={18} style={{ color: '#4ade80' }} /> Sponsorship Revenue
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <svg width="80" height="80" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#4ade80" strokeWidth="3" strokeDasharray="75 25" />
                  </svg>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Capital Raised</span>
                    <div className="stat-val" style={{ fontSize: '1.5rem' }}>₹85,000</div>
                  </div>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={18} style={{ color: 'var(--accent-cyan)' }} /> Active VolunTeer slots
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <svg width="80" height="80" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--accent-cyan)" strokeWidth="3" strokeDasharray="43 57" />
                  </svg>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Slots Filled / Total</span>
                    <div className="stat-val" style={{ fontSize: '1.5rem' }}>3 / 7 Slots</div>
                  </div>
                </div>
              </div>
            </div>

            <h2 style={{ fontSize: '1.4rem', marginBottom: '1.25rem' }}>Your Events</h2>
            {events.length === 0 ? (
              <div style={{ padding: '3rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                You haven't created any events yet. Click "Publish New Event" to get started!
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {events.map(event => (
                  <div key={event.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                      <span className={`status-badge ${event.status === 'live' ? 'pass' : event.status === 'draft' ? 'pending' : 'fail'}`}>
                        {event.status.toUpperCase()}
                      </span>
                    </div>

                    <img src={event.bannerUrl} alt={event.title} style={{ height: '140px', width: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                    
                    <div>
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{event.title}</h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{event.category} • {new Date(event.startDate).toLocaleDateString()}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Capacity: <strong>{event.capacity}</strong></span>
                      <span>Registered: <strong>{event.registrationsCount || 0}</strong></span>
                      <span>Checked-In: <strong>{event.checkedInCount || 0}</strong></span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <a href={`#/event/${event.id}`} className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}>
                        View Page
                      </a>
                      {event.status === 'live' && (
                        <button className="btn btn-primary" onClick={() => handleEndEvent(event.id)} style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}>
                          End Event
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 6-step Event Wizard */}
        {activeTab === 'publish' && (
          <div className="glass-panel">
            <h2 style={{ fontSize: '1.6rem', marginBottom: '1.5rem' }}>Host a New Event / Program</h2>
            
            <div className="event-wizard-tabs">
              {['1. Basics', '2. Schedule', '3. Reg Settings', '4. Volunteers', '5. Sponsors', '6. Review'].map((tab, idx) => (
                <button key={tab} className={`wizard-tab ${wizardStep === idx ? 'active' : ''}`} onClick={() => setWizardStep(idx)}>
                  {tab}
                </button>
              ))}
            </div>

            <div style={{ minHeight: '300px', marginTop: '1.5rem' }}>
              {/* Step 1: Basics */}
              {wizardStep === 0 && (
                <div>
                  <div className="input-group">
                    <label className="input-label">Event Program Title *</label>
                    <input className="input-field" type="text" placeholder="e.g. TEDxCollege, National Coding HackFest..." value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} />
                  </div>
                  <div className="grid-2">
                    <div className="input-group">
                      <label className="input-label">Category</label>
                      <select className="input-field" value={eventForm.category} onChange={e => setEventForm({...eventForm, category: e.target.value})}>
                        <option value="Tech">Technology</option>
                        <option value="Cultural">Cultural / Arts</option>
                        <option value="Sports">Sports</option>
                        <option value="Academic">Academic</option>
                        <option value="Workshop">Workshop</option>
                        <option value="Hackathon">Hackathon</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Search tags (comma separated)</label>
                      <input className="input-field" type="text" placeholder="e.g. coding, networking, design" value={eventForm.tags} onChange={e => setEventForm({...eventForm, tags: e.target.value})} />
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Event Banner Photo (Max size 2MB)</label>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <input type="file" accept="image/*" onChange={handleBannerUpload} style={{ display: 'none' }} id="event-file-picker" />
                      <label htmlFor="event-file-picker" className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                        <Image size={16} /> Choose Image
                      </label>
                      {eventForm.bannerUrl ? (
                        <span style={{ fontSize: '0.85rem', color: '#4ade80' }}>✓ Banner loaded successfully</span>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No file chosen (default fallback will apply)</span>
                      )}
                    </div>
                    {eventForm.bannerUrl && (
                      <img src={eventForm.bannerUrl} alt="Preview" style={{ marginTop: '1rem', maxHeight: '100px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} />
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Schedule & Delivery */}
              {wizardStep === 1 && (
                <div>
                  <div className="grid-2">
                    <div className="input-group">
                      <label className="input-label">Start Date *</label>
                      <input className="input-field" type="date" value={eventForm.startDate} onChange={e => setEventForm({...eventForm, startDate: e.target.value})} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">End Date</label>
                      <input className="input-field" type="date" value={eventForm.endDate} onChange={e => setEventForm({...eventForm, endDate: e.target.value})} />
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Delivery Mode</label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      {['Offline', 'Online', 'Hybrid'].map(m => (
                        <button key={m} className={`btn ${eventForm.delivery === m ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setEventForm({...eventForm, delivery: m})}>
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                  {eventForm.delivery !== 'Online' && (
                    <div className="grid-2">
                      <div className="input-group">
                        <label className="input-label">Venue Location Title *</label>
                        <input className="input-field" type="text" placeholder="e.g. Main Seminar Auditorium" value={eventForm.venueName} onChange={e => setEventForm({...eventForm, venueName: e.target.value})} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Physical Address</label>
                        <input className="input-field" type="text" placeholder="e.g. 100 University Rd, Sector 4" value={eventForm.venueAddress} onChange={e => setEventForm({...eventForm, venueAddress: e.target.value})} />
                      </div>
                    </div>
                  )}
                  {eventForm.delivery !== 'Offline' && (
                    <div className="input-group">
                      <label className="input-label">Virtual Link (Zoom/Meet/YouTube)</label>
                      <input className="input-field" type="url" placeholder="https://meet.google.com/..." value={eventForm.meetingLink} onChange={e => setEventForm({...eventForm, meetingLink: e.target.value})} />
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Registration Settings */}
              {wizardStep === 2 && (
                <div>
                  <div className="grid-2">
                    <div className="input-group">
                      <label className="input-label">Capacity (Max Attendees)</label>
                      <input className="input-field" type="number" value={eventForm.capacity} onChange={e => setEventForm({...eventForm, capacity: Number(e.target.value)})} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Registration Deadline</label>
                      <input className="input-field" type="date" value={eventForm.deadline} onChange={e => setEventForm({...eventForm, deadline: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid-2">
                    <div className="input-group">
                      <label className="input-label">Pricing Mode</label>
                      <select className="input-field" value={eventForm.pricing} onChange={e => setEventForm({...eventForm, pricing: e.target.value})}>
                        <option value="free">Free General Admission</option>
                        <option value="paid">Paid Ticket</option>
                      </select>
                    </div>
                    {eventForm.pricing === 'paid' && (
                      <div className="input-group">
                        <label className="input-label">Ticket Price (₹)</label>
                        <input className="input-field" type="number" placeholder="₹250" value={eventForm.ticketPrice} onChange={e => setEventForm({...eventForm, ticketPrice: Number(e.target.value)})} />
                      </div>
                    )}
                  </div>
                  <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                    <input type="checkbox" id="allowTeams" checked={eventForm.allowTeams} onChange={e => setEventForm({...eventForm, allowTeams: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                    <label htmlFor="allowTeams" style={{ fontWeight: '500', cursor: 'pointer' }}>Enable Team registrations (Hackathons/Comps)</label>
                  </div>
                  {eventForm.allowTeams && (
                    <div className="grid-2" style={{ marginTop: '1rem' }}>
                      <div className="input-group">
                        <label className="input-label">Min Team Size</label>
                        <input className="input-field" type="number" value={eventForm.teamSizeMin} onChange={e => setEventForm({...eventForm, teamSizeMin: Number(e.target.value)})} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Max Team Size</label>
                        <input className="input-field" type="number" value={eventForm.teamSizeMax} onChange={e => setEventForm({...eventForm, teamSizeMax: Number(e.target.value)})} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Volunteer Requirements */}
              {wizardStep === 3 && (
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Define Volunteer Roles</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Assign roles that volunteers can claim. Match score percentages will compile based on skill tags defined.</p>
                  
                  {eventForm.vRoles.map((role, idx) => (
                    <div key={role.id} className="glass-card" style={{ marginBottom: '1rem', background: 'rgba(0,0,0,0.15)' }}>
                      <div className="grid-2">
                        <div className="input-group">
                          <label className="input-label">Role Title</label>
                          <input className="input-field" type="text" value={role.title} onChange={e => {
                            const updated = [...eventForm.vRoles];
                            updated[idx].title = e.target.value;
                            setEventForm({...eventForm, vRoles: updated});
                          }} />
                        </div>
                        <div className="input-group">
                          <label className="input-label">Required Skills (comma separated)</label>
                          <input className="input-field" type="text" value={role.skills} onChange={e => {
                            const updated = [...eventForm.vRoles];
                            updated[idx].skills = e.target.value;
                            setEventForm({...eventForm, vRoles: updated});
                          }} />
                        </div>
                      </div>
                      <div className="input-group">
                        <label className="input-label">Total Slots</label>
                        <input className="input-field" type="number" value={role.slots} onChange={e => {
                          const updated = [...eventForm.vRoles];
                          updated[idx].slots = Number(e.target.value);
                          setEventForm({...eventForm, vRoles: updated});
                        }} style={{ maxWidth: '120px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Step 5: Sponsorship Tiers */}
              {wizardStep === 4 && (
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Enable Sponsor Tiers</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Create partnership layers to fund your event. Corporate partners can choose packages.</p>
                  
                  {eventForm.sPackages.map((pack, idx) => (
                    <div key={pack.id} className="glass-card" style={{ marginBottom: '1rem', background: 'rgba(0,0,0,0.15)' }}>
                      <div className="grid-2">
                        <div className="input-group">
                          <label className="input-label">Package Layer Name</label>
                          <input className="input-field" type="text" value={pack.name} onChange={e => {
                            const updated = [...eventForm.sPackages];
                            updated[idx].name = e.target.value;
                            setEventForm({...eventForm, sPackages: updated});
                          }} />
                        </div>
                        <div className="input-group">
                          <label className="input-label">Investment Target (₹)</label>
                          <input className="input-field" type="number" value={pack.price} onChange={e => {
                            const updated = [...eventForm.sPackages];
                            updated[idx].price = Number(e.target.value);
                            setEventForm({...eventForm, sPackages: updated});
                          }} />
                        </div>
                      </div>
                      <div className="input-group">
                        <label className="input-label">Perks Offered (comma separated)</label>
                        <input className="input-field" type="text" value={pack.perks} onChange={e => {
                          const updated = [...eventForm.sPackages];
                          updated[idx].perks = e.target.value;
                          setEventForm({...eventForm, sPackages: updated});
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Step 6: Review & Publish */}
              {wizardStep === 5 && (
                <div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Ready to Host!</h3>
                  <div className="glass-card" style={{ background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>TITLE:</span>
                      <h4 style={{ fontSize: '1.2rem' }}>{eventForm.title || "Untitled Program"}</h4>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>VENUE & DELIVERY:</span>
                      <p>{eventForm.venueName || "Not set"} ({eventForm.delivery})</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>SCHEDULE:</span>
                      <p>{eventForm.startDate ? new Date(eventForm.startDate).toLocaleDateString() : "Not set"}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                    <button className="btn btn-secondary" onClick={() => handleCreateEvent('draft')} style={{ flex: 1 }}>
                      Save as Draft
                    </button>
                    <button className="btn btn-primary" onClick={() => handleCreateEvent('live')} style={{ flex: 1 }}>
                      Publish Live Page
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setWizardStep(prev => Math.max(0, prev - 1))} disabled={wizardStep === 0}>
                Previous Step
              </button>
              {wizardStep < 5 ? (
                <button className="btn btn-secondary" onClick={() => setWizardStep(prev => Math.min(5, prev + 1))}>
                  Next Step
                </button>
              ) : null}
            </div>
          </div>
        )}

        {/* Volunteer applications list */}
        {activeTab === 'roster' && (
          <div className="glass-panel">
            <h2 style={{ fontSize: '1.6rem', marginBottom: '1.5rem' }}>Pending Volunteer Applications ({applications.filter(a => a.status === 'pending').length})</h2>
            
            {applications.length === 0 ? (
              <div style={{ padding: '3.5rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No active volunteer applications reported.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {applications.map(app => (
                  <div key={app.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h4 style={{ color: '#ffffff', fontSize: '1.1rem' }}>{app.userName}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Wants to join: <strong>{app.roleTitle}</strong> at <em>{app.eventTitle}</em>
                      </p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>Applied: {new Date(app.timestamp).toLocaleString()}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span className={`status-badge ${app.status === 'approved' ? 'pass' : app.status === 'rejected' ? 'fail' : 'pending'}`}>
                        {app.status.toUpperCase()}
                      </span>
                      {app.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-primary" onClick={() => handleApproveVolunteer(app.id, true)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                            <Check size={14} /> Approve
                          </button>
                          <button className="btn btn-danger" onClick={() => handleApproveVolunteer(app.id, false)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                            <X size={14} /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Registered Attendees list */}
        {activeTab === 'attendees' && (
          <div className="glass-panel">
            <h2 style={{ fontSize: '1.6rem', marginBottom: '1rem' }}>Registered Attendees</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>View registered participants and check-in statuses for your selected hosted event program.</p>

            <div className="input-group">
              <label className="input-label">Select Event Program</label>
              <select className="input-field" value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}>
                {events.map(e => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
            </div>

            {registrations.length === 0 ? (
              <div style={{ padding: '3.5rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)', marginTop: '1.5rem' }}>
                No active registrations reported for this event program.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                {registrations.map(reg => (
                  <div key={reg.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h4 style={{ color: '#ffffff', fontSize: '1.1rem' }}>{reg.userName}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Email: <strong>{reg.userEmail}</strong> • Ticket: <em>{reg.ticketType || 'General Admission'}</em>
                      </p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>Registered on: {new Date(reg.timestamp).toLocaleDateString()}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span className={`status-badge ${reg.checked_in ? 'pass' : 'pending'}`}>
                        {reg.checked_in ? "CHECKED IN" : "NOT CHECKED IN"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Live scanner checks */}
        {activeTab === 'scanner' && (
          <div className="glass-panel">
            <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>Webcam QR Check-In Scanner</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>Scan QR tickets dynamically for attendee admission. Verify database credentials instantly.</p>

            <div className="input-group">
              <label className="input-label">Select Event for Scans</label>
              <select className="input-field" value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}>
                {events.map(e => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', marginTop: '2rem' }}>
              <div>
                {!scannerActive ? (
                  <button className="btn btn-primary" onClick={startCameraScanner} style={{ width: '100%', padding: '2.5rem 1.5rem', flexDirection: 'column', gap: '1rem', borderRadius: '16px' }}>
                    <Camera size={44} />
                    <span>Launch Webcam Scanner Camera</span>
                  </button>
                ) : (
                  <div>
                    <div id="reader-container" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden' }} />
                    <button className="btn btn-secondary" onClick={() => { setScannerActive(false); }} style={{ width: '100%', marginTop: '1rem' }}>
                      Cancel Camera Scan
                    </button>
                  </div>
                )}

                <div style={{ margin: '2rem 0', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dark)', display: 'block', marginBottom: '1rem' }}>— OR INPUT CODE MANUALLY —</span>
                  
                  <form onSubmit={handleManualCheckIn} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input className="input-field" type="text" placeholder="Paste ticket validation code here..." value={manualCode} onChange={e => setManualCode(e.target.value)} />
                    <button className="btn btn-primary" type="submit">Verify</button>
                  </form>
                </div>
              </div>

              {/* Scan telemetry results */}
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                  Scan Result Output
                </h3>

                {!scanResult ? (
                  <div style={{ padding: '2.5rem', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Scan a barcode or type validation keys to verify tickets in real-time.
                  </div>
                ) : scanResult.loading ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--accent-cyan)' }} className="pulse-active">
                    Querying credentials ledger...
                  </div>
                ) : scanResult.success ? (
                  <div className="glass-card" style={{ borderColor: '#4ade80', background: 'rgba(74,222,128,0.03)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4ade80', fontWeight: '600' }}>
                      <CheckCircle size={20} /> APPROVED
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ATTENDEE NAME</span>
                      <h4 style={{ color: '#ffffff', fontSize: '1.1rem' }}>{scanResult.userName}</h4>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>EMAIL</span>
                      <p style={{ fontSize: '0.85rem' }}>{scanResult.userEmail}</p>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>
                      Checked in at: {new Date(scanResult.checkedInAt).toLocaleTimeString()}
                    </div>
                  </div>
                ) : (
                  <div className="glass-card" style={{ borderColor: '#ef4444', background: 'rgba(239,68,68,0.03)', color: '#f87171' }}>
                    <div style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertCircle size={20} /> CHECK-IN DENIED
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{scanResult.message}</p>
                  </div>
                )}

                {selectedEventId && (
                  <div className="glass-card" style={{ background: 'rgba(255,255,255,0.01)', marginTop: '1.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>LATEST EVENT TELEMETRY</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#ffffff' }}>
                      {registrations.filter(r => r.checked_in).length} / {registrations.length} Checked In
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
