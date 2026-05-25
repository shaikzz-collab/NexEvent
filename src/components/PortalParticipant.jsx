import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Calendar, QrCode, Award, ShieldCheck, Heart, Sparkles, Filter, Users, X, Info, ArrowLeft, Eye } from 'lucide-react';
import { fetchCollection, saveDocument, fetchDocument } from '../dbService';

export default function PortalParticipant({ user }) {
  const [activeTab, setActiveTab] = useState('landing');
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeCert, setActiveCert] = useState(null);
  const [customName, setCustomName] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [simulatedEmailTicket, setSimulatedEmailTicket] = useState(null);
  const [emailSimState, setEmailSimState] = useState(0);
  const [destinationEmail, setDestinationEmail] = useState(user.email || '');
  const [simulatedEmailRecipient, setSimulatedEmailRecipient] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [deliveryFilter, setDeliveryFilter] = useState('All');
  const [priceFilter, setPriceFilter] = useState('All');

  // Register Form State
  const [customAnswers, setCustomAnswers] = useState({});
  const [regSuccess, setRegSuccess] = useState(false);

  const loadParticipantData = async () => {
    try {
      const allEvents = await fetchCollection('events');
      setEvents(allEvents.filter(e => e.status === 'live'));

      const allRegs = await fetchCollection('registrations');
      setRegistrations(allRegs.filter(r => r.userId === user.uid));

      const allCerts = await fetchCollection('certificates');
      setCertificates(allCerts.filter(c => c.userId === user.uid));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadParticipantData();
  }, [user.uid]);

  const handleViewCert = (cert) => {
    setActiveCert(cert);
    setCustomName(cert.userName || user.name || '');
    setCustomRole(cert.roleTitle || cert.role || 'Participant');
  };

  const handlePrintCertificate = (cert, printName, printRole) => {
    const printWindow = window.open('', '_blank', 'width=1000,height=700');
    const verifyUrl = `${window.location.origin}${window.location.pathname}#/verify/${cert.verify_code}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(verifyUrl)}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificate of Accomplishment - ${printName}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Inter:wght@300;400;600;800&family=Playfair+Display:ital,wght@0,600;1,400&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A4 landscape;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              background-color: #05070c;
              font-family: 'Inter', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              width: 100vw;
              height: 100vh;
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              overflow: hidden;
            }
            .certificate-outer {
              width: 297mm;
              height: 210mm;
              padding: 12mm;
              box-sizing: border-box;
              background: #090b15;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .certificate-inner {
              width: 100%;
              height: 100%;
              border: 5px double #d97706;
              padding: 15mm 20mm;
              box-sizing: border-box;
              position: relative;
              background: radial-gradient(circle at center, #111428 0%, #080a14 100%);
              color: #ffffff;
              text-align: center;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              border-radius: 4px;
            }
            .cert-header {
              font-weight: 800;
              font-size: 26pt;
              letter-spacing: 0.22em;
              color: #ffffff;
              margin: 0 0 3mm 0;
              text-transform: uppercase;
            }
            .cert-subtitle {
              font-family: 'Playfair Display', serif;
              font-style: italic;
              font-size: 13pt;
              color: #94a3b8;
              margin: 0 0 4mm 0;
            }
            .cert-name {
              font-weight: 800;
              font-size: 34pt;
              color: #f59e0b;
              margin: 0 auto;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              display: inline-block;
              border-bottom: 2px solid #f59e0b;
              padding-bottom: 4px;
            }
            .cert-text {
              font-size: 11pt;
              color: #94a3b8;
              margin: 3mm 0;
              line-height: 1.4;
            }
            .cert-award {
              font-weight: 700;
              font-size: 18pt;
              color: #818cf8;
              margin: 1mm 0;
              letter-spacing: 0.02em;
            }
            .cert-event {
              font-weight: 600;
              font-size: 16pt;
              color: #ffffff;
              margin: 1mm 0;
            }
            .cert-bottom {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              align-items: center;
              margin-top: 5mm;
              padding: 0 10mm;
            }
            .signature-block {
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .signature-line {
              width: 140px;
              border-top: 1px solid rgba(255, 255, 255, 0.2);
              margin-top: 6px;
            }
            .signature-title {
              font-size: 8pt;
              color: #94a3b8;
              margin-top: 4px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .signature-img {
              font-family: 'Great Vibes', cursive;
              font-size: 24pt;
              color: #ffffff;
              height: 30px;
              line-height: 30px;
              margin-bottom: 1px;
            }
            .badge-block {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            .gold-badge {
              width: 55px;
              height: 55px;
              border-radius: 50%;
              background: radial-gradient(circle, #f59e0b 0%, #b45309 100%);
              border: 2px solid #fef08a;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 8px rgba(0,0,0,0.4);
            }
            .gold-badge svg {
              fill: #ffffff;
              width: 26px;
              height: 26px;
            }
            .footer-info {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: 5mm;
              padding: 0 2mm;
              border-top: 1px solid rgba(255, 255, 255, 0.06);
              padding-top: 3mm;
            }
            .verify-id {
              font-family: monospace;
              font-size: 7.5pt;
              color: #4b5563;
              text-align: left;
              line-height: 1.3;
            }
            .qr-code-wrapper {
              display: flex;
              flex-direction: column;
              align-items: flex-end;
            }
            .qr-code-img {
              width: 60px;
              height: 60px;
              background: #ffffff;
              padding: 3px;
              border-radius: 4px;
            }
            .qr-label {
              font-size: 5.5pt;
              color: #4b5563;
              margin-top: 3px;
              letter-spacing: 0.05em;
              text-transform: uppercase;
            }
          </style>
        </head>
        <body>
          <div class="certificate-outer">
            <div class="certificate-inner">
              <div>
                <div class="cert-header">Certificate of Accomplishment</div>
                <div class="cert-subtitle">This verified credential is proud to be presented to</div>
                <div class="cert-name">${printName}</div>
              </div>

              <div>
                <div class="cert-text" style="margin-top: 0;">for their exemplary commitment and achievement as a</div>
                <div class="cert-award">${printRole}</div>
                <div class="cert-text">during the official campus presentation of</div>
                <div class="cert-event">${cert.eventTitle}</div>
              </div>

              <div>
                <div class="cert-bottom">
                  <div class="signature-block">
                    <div class="signature-img">Sameer Malhotra</div>
                    <div class="signature-line"></div>
                    <div class="signature-title">Event Host Organizer</div>
                  </div>
                  
                  <div class="badge-block">
                    <div class="gold-badge">
                      <svg viewBox="0 0 24 24">
                        <path d="M18 2H6v2H2v3c0 3.24 2.24 6 5.5 6.8a6 6 0 0 0 9 0c3.26-.8 5.5-3.56 5.5-6.8V4h-4V2zM4 6h2v3.1A4.47 4.47 0 0 1 4 6.8V6zm16 .8a4.47 4.47 0 0 1-2 2.3V6h2v.8zM12 14a3 3 0 0 0-3 3v2h6v-2a3 3 0 0 0-3-3z"/>
                      </svg>
                    </div>
                  </div>
                  
                  <div class="signature-block">
                    <div class="signature-img">Prof. M. R. Shastri</div>
                    <div class="signature-line"></div>
                    <div class="signature-title">Academic Advisor Chair</div>
                  </div>
                </div>

                <div class="footer-info">
                  <div class="verify-id">
                    <strong>Secure Verification Hash:</strong><br/>
                    ${cert.verify_code}
                  </div>
                  <div class="qr-code-wrapper">
                    <img class="qr-code-img" src="${qrUrl}" alt="Verification Link" />
                    <div class="qr-label">Scan to Verify</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const triggerEmailSimulation = (reg, emailAddr) => {
    setSimulatedEmailTicket(reg);
    setSimulatedEmailRecipient(emailAddr || user.email || '');
    setEmailSimState(1);
    setTimeout(() => {
      setEmailSimState(2);
      setTimeout(() => {
        setEmailSimState(3);
      }, 1000);
    }, 1000);
  };

  const handleEmailDispatch = (certOrReg, emailAddr) => {
    // Run the visual simulation modal
    triggerEmailSimulation(certOrReg, emailAddr);
  };

  // QR Code Renderer utilizing api.qrserver.com
  const QRCodeCanvas = ({ text }) => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(text)}`;
    return (
      <img 
        src={qrUrl} 
        alt="QR Code Ticket" 
        style={{ 
          border: '2px solid rgba(255,255,255,0.08)', 
          borderRadius: '12px', 
          width: '180px', 
          height: '180px',
          background: '#ffffff',
          padding: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }} 
      />
    );
  };

  // Submit registration checkout
  const handleRegisterEvent = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return;

    const existing = registrations.find(r => r.eventId === selectedEvent.id);
    if (existing) {
      alert("⚠️ You have already registered for this event!");
      return;
    }

    const regId = `reg-${Date.now()}`;
    const hash = btoa(`${selectedEvent.id}|${user.uid}|reg`);
    
    const newReg = {
      id: regId,
      eventId: selectedEvent.id,
      eventTitle: selectedEvent.title,
      userId: user.uid,
      userName: user.name,
      userEmail: user.email,
      ticketType: selectedEvent.pricing === 'free' ? 'General Admission' : 'Standard Paid Pass',
      customAnswers: customAnswers,
      status: 'active',
      checked_in: false,
      qrSvgString: hash,
      hash: hash,
      timestamp: Date.now()
    };

    await saveDocument('registrations', regId, newReg);
    
    // Increment registrationsCount
    const event = await fetchDocument('events', selectedEvent.id);
    if (event) {
      await saveDocument('events', selectedEvent.id, {
        ...event,
        registrationsCount: (event.registrationsCount || 0) + 1
      });
    }

    setRegSuccess(true);
    loadParticipantData();
    setTimeout(() => {
      setRegSuccess(false);
      setSelectedEvent(null);
      setActiveTab('tickets');
    }, 2500);
  };

  // Apply filters to search grid
  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'All' || e.category === categoryFilter;
    const matchesDelivery = deliveryFilter === 'All' || e.delivery === deliveryFilter;
    const matchesPrice = priceFilter === 'All' || 
                         (priceFilter === 'Free' && e.pricing === 'free') ||
                         (priceFilter === 'Paid' && e.pricing === 'paid');

    return matchesSearch && matchesCategory && matchesDelivery && matchesPrice;
  });

  return (
    <div className="portal-layout">
      {/* Sidebar menu */}
      <div className="sidebar-menu">
        <div style={{ padding: '0 0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', color: '#ffffff' }}>Attendee Portal</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Search & Discover</span>
        </div>

        <button className={`sidebar-btn ${activeTab === 'landing' ? 'active' : ''}`} onClick={() => { setActiveTab('landing'); setSelectedEvent(null); }}>
          <Search size={18} /> Event Discovery
        </button>
        <button className={`sidebar-btn ${activeTab === 'tickets' ? 'active' : ''}`} onClick={() => { setActiveTab('tickets'); setSelectedEvent(null); }}>
          <QrCode size={18} /> My Tickets
        </button>
        <button className={`sidebar-btn ${activeTab === 'certificates' ? 'active' : ''}`} onClick={() => { setActiveTab('certificates'); setSelectedEvent(null); }}>
          <Award size={18} /> Certificates drawer
        </button>
      </div>

      {/* Main panel view */}
      <div className="portal-content" style={{ textAlign: 'left' }}>
        {activeTab === 'landing' && !selectedEvent && (
          <div>
            <div className="dashboard-header">
              <div>
                <h2 style={{ fontSize: '1.8rem' }}>Discover Events</h2>
                <p style={{ color: 'var(--text-muted)' }}>Explore hackathons, workshops, and tech programs near you.</p>
              </div>
            </div>

            {/* Filter controls */}
            <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '2.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="input-field" type="text" placeholder="Search by title, description or tags..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: '2.5rem' }} />
              </div>

              <div>
                <select className="input-field" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ padding: '0.6rem 2rem' }}>
                  <option value="All">All Categories</option>
                  <option value="Tech">Technology</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Sports">Sports</option>
                  <option value="Academic">Academic</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Hackathon">Hackathon</option>
                </select>
              </div>

              <div>
                <select className="input-field" value={deliveryFilter} onChange={e => setDeliveryFilter(e.target.value)} style={{ padding: '0.6rem 2rem' }}>
                  <option value="All">All Modes</option>
                  <option value="Offline">Offline</option>
                  <option value="Online">Online</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <select className="input-field" value={priceFilter} onChange={e => setPriceFilter(e.target.value)} style={{ padding: '0.6rem 2rem' }}>
                  <option value="All">All Prices</option>
                  <option value="Free">Free Admission</option>
                  <option value="Paid">Paid Tickets</option>
                </select>
              </div>
            </div>

            {/* Discover Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {filteredEvents.map(event => (
                <div key={event.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', cursor: 'pointer' }} onClick={() => setSelectedEvent(event)}>
                  <img src={event.bannerUrl} alt={event.title} style={{ height: '150px', width: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                  
                  <div>
                    <span className="tag-badge" style={{ color: 'var(--accent-cyan)', borderColor: 'var(--accent-cyan)' }}>{event.category}</span>
                    <h3 style={{ fontSize: '1.25rem', marginTop: '0.5rem', marginBottom: '0.25rem' }}>{event.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineClamp: '2', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{event.desc}</p>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={14} /> {new Date(event.startDate).toLocaleDateString()}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <MapPin size={14} /> {event.venueName}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <span style={{ fontWeight: '600', color: event.pricing === 'free' ? '#4ade80' : 'var(--accent-cyan)' }}>
                      {event.pricing === 'free' ? "FREE" : `₹${event.ticketPrice}`}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {event.registrationsCount || 0} / {event.capacity} Registered
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Event View & Checkout */}
        {selectedEvent && (
          <div className="glass-panel" style={{ position: 'relative' }}>
            <button onClick={() => setSelectedEvent(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={24} />
            </button>

            <img src={selectedEvent.bannerUrl} alt={selectedEvent.title} style={{ height: '240px', width: '100%', objectFit: 'cover', borderRadius: '12px', marginBottom: '2rem' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '2rem' }}>
              <div>
                <span className="status-badge pass" style={{ marginBottom: '1rem', display: 'inline-block' }}>{selectedEvent.category}</span>
                <h1 style={{ fontSize: '2.2rem', marginBottom: '1rem', color: '#ffffff', textAlign: 'left' }}>{selectedEvent.title}</h1>
                
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                  {selectedEvent.desc}
                </p>

                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Venue & Location Details</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', gap: '0.7rem' }}>
                    <MapPin size={18} style={{ color: 'var(--accent-indigo)', marginTop: '0.2rem' }} />
                    <div>
                      <span style={{ fontWeight: '600', color: '#ffffff' }}>{selectedEvent.venueName}</span>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{selectedEvent.venueAddress || 'Online'}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.7rem' }}>
                    <Calendar size={18} style={{ color: 'var(--accent-cyan)', marginTop: '0.2rem' }} />
                    <div>
                      <span style={{ fontWeight: '600', color: '#ffffff' }}>Schedule Timings</span>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Starts: {new Date(selectedEvent.startDate).toLocaleDateString()} • Ends: {new Date(selectedEvent.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkout Form */}
              <div>
                {regSuccess ? (
                  <div className="glass-card" style={{ background: 'rgba(74,222,128,0.05)', borderColor: '#4ade80', textAlign: 'center', padding: '3rem 1.5rem' }}>
                    <ShieldCheck size={48} style={{ color: '#4ade80', margin: '0 auto 1rem' }} />
                    <h3 style={{ color: '#ffffff', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Registration Successful!</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Your ticket has been generated and added to your portfolio.</p>
                  </div>
                ) : (
                  <div className="glass-card" style={{ background: 'rgba(255,255,255,0.01)' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>Ticket Checkout</h3>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Ticket Type:</span>
                      <span style={{ fontWeight: '600', color: '#ffffff' }}>{selectedEvent.pricing === 'free' ? "General Admission" : "Paid Entry Pass"}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '700', marginBottom: '2rem' }}>
                      <span>Price:</span>
                      <span style={{ color: selectedEvent.pricing === 'free' ? '#4ade80' : 'var(--accent-cyan)' }}>
                        {selectedEvent.pricing === 'free' ? "FREE" : `₹${selectedEvent.ticketPrice}`}
                      </span>
                    </div>

                    <form onSubmit={handleRegisterEvent}>
                      <div className="input-group">
                        <label className="input-label">Why do you want to attend this event? *</label>
                        <textarea className="input-field" placeholder="e.g. Networking, learning new developer tools..." required onChange={e => setCustomAnswers({ ...customAnswers, 'Why attend?': e.target.value })} style={{ height: '80px', fontFamily: 'inherit', resize: 'none' }} />
                      </div>

                      <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>
                        Claim Ticket
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tickets view */}
        {activeTab === 'tickets' && (
          <div>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>Your Registered Tickets</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>Present these QR tickets at the registration desk for verification check-in admissions.</p>

            {registrations.length === 0 ? (
              <div style={{ padding: '3.5rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                You have not registered for any events yet. Check "Event Discovery" to claim tickets.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
                {registrations.map(reg => (
                  <div key={reg.id} className="glass-panel" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem', borderLeft: reg.checked_in ? '4px solid #4ade80' : '4px solid var(--accent-indigo)' }}>
                    <div>
                      <span className={`status-badge ${reg.checked_in ? 'pass' : 'pending'}`} style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
                        {reg.checked_in ? "CHECKED IN" : "ACTIVE TICKET"}
                      </span>
                      <h4 style={{ fontSize: '1.1rem', color: '#ffffff', marginBottom: '0.25rem' }}>{reg.eventTitle}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Attendee: {reg.userName}</p>
                      
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem', marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-dark)', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                        Validation Key:<br />{reg.hash}
                      </div>
                      <div style={{ marginTop: '0.5rem' }}>
                        <label style={{ fontSize: '0.65rem', color: 'var(--text-dark)', display: 'block', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Delivery Email Address</label>
                        <input 
                          type="email" 
                          className="input-field" 
                          defaultValue={reg.userEmail || user.email} 
                          id={`email-input-${reg.id}`} 
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', height: 'auto', background: 'rgba(0,0,0,0.2)' }}
                          placeholder="recipient@gmail.com"
                        />
                      </div>
                      <button 
                        onClick={() => {
                          const targetEmail = document.getElementById(`email-input-${reg.id}`)?.value || user.email;
                          handleEmailDispatch(reg, targetEmail);
                        }} 
                        className="btn btn-secondary" 
                        style={{ marginTop: '0.75rem', width: '100%', padding: '0.4rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', borderColor: 'var(--accent-indigo)', background: 'rgba(99,102,241,0.04)' }}
                      >
                        📨 Email Scannable Pass
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <QRCodeCanvas text={reg.hash} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Certificates view */}
        {activeTab === 'certificates' && (
          <div>
            <style>{`
              @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:ital,wght@0,600;1,400&display=swap');
              
              .certificate-preview-container {
                position: relative;
                background: radial-gradient(circle at center, #13172e 0%, #080912 100%);
                border: 2px solid rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                padding: 2.5rem;
                box-shadow: 0 20px 40px rgba(0,0,0,0.5);
                overflow: hidden;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                margin-bottom: 2rem;
              }
              
              .certificate-preview-container:hover {
                box-shadow: 0 25px 50px rgba(99, 102, 241, 0.15), 0 0 30px rgba(6, 182, 212, 0.1);
                border-color: rgba(99, 102, 241, 0.2);
                transform: translateY(-2px);
              }

              .certificate-preview-inner {
                border: 5px double #d97706;
                padding: 2.5rem 3rem;
                text-align: center;
                position: relative;
                border-radius: 6px;
                background: rgba(13, 16, 32, 0.8);
              }

              .signature-cursive {
                font-family: 'Great Vibes', cursive;
                font-size: 2.3rem !important;
                color: #ffffff;
                height: 40px;
                line-height: 40px;
                margin-bottom: 0.15rem;
                letter-spacing: normal !important;
                font-weight: normal !important;
                text-shadow: 0 2px 4px rgba(0,0,0,0.5);
              }

              .gold-badge-container {
                width: 55px;
                height: 55px;
                border-radius: 50%;
                background: radial-gradient(circle, #f59e0b 0%, #b45309 100%);
                border: 2px solid #fef08a;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 8px rgba(0,0,0,0.4);
              }
            `}</style>

            {!activeCert ? (
              <div>
                <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>Certificates Drawer</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>Verifiable credentials awarded to you for participating in completed event workshops.</p>

                {certificates.length === 0 ? (
                  <div style={{ padding: '3.5rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No credentials issued. Present your QR ticket and complete programs to earn certifications.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {certificates.map(c => (
                      <div key={c.code} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid var(--accent-cyan)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h4 style={{ fontSize: '1.15rem', color: '#ffffff', marginBottom: '0.25rem' }}>{c.eventTitle}</h4>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Role: {c.roleTitle || c.role}</span>
                          </div>
                          <span style={{ padding: '0.25rem 0.5rem', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', color: 'var(--accent-cyan)', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600' }}>Active Credential</span>
                        </div>

                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-dark)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          Secure Verification Hash:<br/>{c.verify_code}
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
                          <button onClick={() => handleViewCert(c)} className="btn btn-primary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.3rem' }}>
                            <Eye size={14} /> View Certificate
                          </button>
                          <a href={`#/verify/${c.verify_code}`} className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', textAlign: 'center' }}>
                            Verify Secure Ledger
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <button onClick={() => setActiveCert(null)} className="btn btn-secondary" style={{ display: 'inline-flex', gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  <ArrowLeft size={16} /> Back to Certificates Drawer
                </button>

                <div className="dashboard-header" style={{ marginBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Award style={{ color: 'var(--accent-cyan)' }} /> Verified Certificate Center</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Generate and download authentic high-fidelity, hashed certificates for completed events.</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '2rem', alignItems: 'start' }}>
                  {/* High-Fi Visual Certificate Card */}
                  <div className="certificate-preview-container">
                    <div className="certificate-preview-inner">
                      <div className="cert-badge-glow"></div>
                      
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ textTransform: 'uppercase', fontSize: '1.6rem', fontWeight: '800', letterSpacing: '0.22em', margin: '0 0 0.4rem 0', color: '#ffffff' }}>Certificate of Accomplishment</h3>
                        <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: '0.95rem', color: '#94a3b8', margin: 0 }}>This verified credential is proud to be presented to</p>
                      </div>

                      <div style={{ margin: '1.5rem 0' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#f59e0b', margin: '0 auto 0.25rem auto', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #f59e0b', display: 'inline-block', paddingBottom: '2px' }}>
                          {customName}
                        </h2>
                      </div>

                      <div style={{ margin: '1.5rem 0' }}>
                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 0.5rem 0' }}>for their exemplary commitment and achievement as a</p>
                        <h4 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#818cf8', margin: '0 0 0.5rem 0', letterSpacing: '0.02em' }}>
                          {customRole}
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 0.5rem 0' }}>during the official campus presentation of</p>
                        <h5 style={{ fontSize: '1.2rem', fontWeight: '600', color: '#ffffff', margin: 0 }}>
                          {activeCert.eventTitle}
                        </h5>
                      </div>

                      {/* Signature Row */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'center', marginTop: '2.5rem', padding: '0 1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span className="signature-cursive">Sameer Malhotra</span>
                          <div style={{ width: '110px', borderTop: '1px solid rgba(255, 255, 255, 0.15)', marginTop: '4px' }}></div>
                          <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Event Host Organizer</span>
                        </div>
                        
                        <div>
                          <div className="gold-badge-container">
                            <svg viewBox="0 0 24 24" style={{ fill: '#ffffff', width: '24px', height: '24px' }}>
                              <path d="M18 2H6v2H2v3c0 3.24 2.24 6 5.5 6.8a6 6 0 0 0 9 0c3.26-.8 5.5-3.56 5.5-6.8V4h-4V2zM4 6h2v3.1A4.47 4.47 0 0 1 4 6.8V6zm16 .8a4.47 4.47 0 0 1-2 2.3V6h2v.8zM12 14a3 3 0 0 0-3 3v2h6v-2a3 3 0 0 0-3-3z"/>
                            </svg>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span className="signature-cursive">Prof. M. R. Shastri</span>
                          <div style={{ width: '110px', borderTop: '1px solid rgba(255, 255, 255, 0.15)', marginTop: '4px' }}></div>
                          <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Academic Advisor Chair</span>
                        </div>
                      </div>

                      {/* Footer Info */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '2.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1.25rem' }}>
                        <div style={{ textAlign: 'left' }}>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-dark)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cryptographic Verification ID</span>
                          <span style={{ fontSize: '0.7rem', color: '#4b5563', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                            {activeCert.verify_code}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(`${window.location.origin}${window.location.pathname}#/verify/${activeCert.verify_code}`)}`}
                            alt="Verification QR"
                            style={{ width: '50px', height: '50px', background: '#ffffff', padding: '2px', borderRadius: '4px' }}
                          />
                          <span style={{ fontSize: '0.55rem', color: '#4b5563', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scan to Verify</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Print Customizer Configuration Panel */}
                  <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.01)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                      <Sparkles size={18} style={{ color: 'var(--accent-cyan)' }} />
                      <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: 0 }}>Print Layout Custodian</h3>
                    </div>

                    <div className="alert-bar" style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.15)', color: '#a5b4fc', fontSize: '0.8rem', padding: '0.75rem', marginBottom: '1.5rem', borderRadius: '6px', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <Info size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                      <span>
                        <strong>Ledger Lock:</strong> Adjustments made here are for print layout styling (casing, honorific titles) only and do not alter the secure, digitally hashed credential record.
                      </span>
                    </div>

                    <div className="input-group">
                      <label className="input-label">Recipient Display Name</label>
                      <input 
                        className="input-field" 
                        type="text" 
                        value={customName} 
                        onChange={e => setCustomName(e.target.value)} 
                        placeholder="e.g. PRIYA SHARMA" 
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Recognition Award Title</label>
                      <input 
                        className="input-field" 
                        type="text" 
                        value={customRole} 
                        onChange={e => setCustomRole(e.target.value)} 
                        placeholder="e.g. Outstanding Hackathon Participant" 
                      />
                    </div>

                    <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                      <label className="input-label">Destination Email Address (Deliver Secure Pass)</label>
                      <input 
                        className="input-field" 
                        type="email" 
                        value={destinationEmail} 
                        onChange={e => setDestinationEmail(e.target.value)} 
                        placeholder="e.g. recipient@gmail.com" 
                      />
                    </div>

                    <button 
                      onClick={() => handleEmailDispatch(activeCert, destinationEmail)} 
                      className="btn btn-secondary" 
                      style={{ width: '100%', padding: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', borderColor: 'var(--accent-cyan)', background: 'rgba(6,182,212,0.04)' }}
                    >
                      📨 Email Verified Certificate
                    </button>

                    <button 
                      onClick={() => handlePrintCertificate(activeCert, customName, customRole)} 
                      className="btn btn-primary" 
                      style={{ width: '100%', padding: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', background: 'var(--gradient-purple)', border: 'none' }}
                    >
                      <Award size={18} /> Download High-Fi Certificate
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Simulated Transactional Email Sandbox Modal Overlay */}
        {simulatedEmailTicket && (() => {
          const isCert = !!simulatedEmailTicket.verify_code;
          const subject = isCert 
            ? `🏆 Verified Credential: ${simulatedEmailTicket.eventTitle}` 
            : `🎟️ Ticket Confirmed: ${simulatedEmailTicket.eventTitle}`;
          
          const verifyUrl = isCert 
            ? `${window.location.origin}${window.location.pathname}#/verify/${simulatedEmailTicket.verify_code}`
            : '';
          
          const qrImageLink = isCert
            ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(verifyUrl)}`
            : `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(simulatedEmailTicket.hash)}`;

          const bodyText = isCert
            ? `Hi ${customName || simulatedEmailTicket.userName},\n\nCongratulations! Your certificate of accomplishment has been securely issued for completing: ${simulatedEmailTicket.eventTitle}.\n\nAward: ${customRole || simulatedEmailTicket.roleTitle || simulatedEmailTicket.role}\nCryptographic Verification ID: ${simulatedEmailTicket.verify_code}\n\n==========================================\n🔗 SCANNABLE QR CODE CERTIFICATE LINK:\n${qrImageLink}\n==========================================\n(Open or click the link above to instantly view and present your scannable QR Code Certificate on any device.)\n\n🔍 Or verify dynamic ledger legitimacy instantly at:\n${verifyUrl}\n\nSecure Credential issued by NexEvent Hub.`
            : `Hi ${simulatedEmailTicket.userName || user.name},\n\nYour registration is officially confirmed! Here are your secure admission pass details:\n\nEvent: ${simulatedEmailTicket.eventTitle}\nTicket Type: ${simulatedEmailTicket.ticketType}\nValidation Key: ${simulatedEmailTicket.hash}\n\n==========================================\n🎟️ YOUR SCANNABLE QR CODE TICKET PASS:\n${qrImageLink}\n==========================================\n(Click or scan the link above to load your scannable QR check-in pass at the admissions desk.)\n\nSent via NexEvent Hub Platform.`;

          return (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(5, 7, 12, 0.85)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 9999,
              padding: '2rem'
            }}>
              <div className="glass-panel" style={{
                maxWidth: '560px',
                width: '100%',
                padding: '2rem',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
                position: 'relative'
              }}>
                {emailSimState < 3 ? (
                  <div style={{ padding: '3rem 0' }}>
                     <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      border: '3px solid var(--accent-cyan)',
                      borderTopColor: 'transparent',
                      margin: '0 auto 1.5rem',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    <h3 style={{ fontSize: '1.25rem', color: '#ffffff', marginBottom: '0.5rem' }}>
                      {emailSimState === 1 ? "Compiling HTML Payload..." : "Dispatching via SendGrid API..."}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {emailSimState === 1 
                        ? "Generating dynamic scannable QR ticket vector..." 
                        : "Connecting to transactional mailer and delivering secure pass..."}
                    </p>
                  </div>
                ) : (
                  <div>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(74,222,128,0.1)', border: '2px solid #4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                      <ShieldCheck size={36} style={{ color: '#4ade80' }} />
                    </div>
                    <h3 style={{ fontSize: '1.3rem', color: '#ffffff', marginBottom: '0.25rem' }}>Outbound Credential Compiled!</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                      Your secure verification package is prepared. Select your email provider to send it:
                    </p>

                    {/* Dynamic Recipient Input & Copy QR Action */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', alignItems: 'flex-end', textAlign: 'left' }}>
                      <div className="input-group" style={{ margin: 0, flex: 1 }}>
                        <label className="input-label" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Send to Email Address:</label>
                        <input 
                          className="input-field" 
                          type="email" 
                          value={simulatedEmailRecipient} 
                          onChange={e => setSimulatedEmailRecipient(e.target.value)} 
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', height: 'auto', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}
                        />
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          navigator.clipboard.writeText(qrImageLink);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 3000);
                        }}
                        style={{ padding: '0.42rem 0.75rem', fontSize: '0.8rem', whiteSpace: 'nowrap', borderColor: 'var(--accent-cyan)', background: 'rgba(6,182,212,0.03)', color: 'var(--accent-cyan)' }}
                      >
                        {copiedLink ? "Copied URL! ✓" : "Copy QR Image URL"}
                      </button>
                    </div>

                    {/* SaaS Info Bar Notice */}
                    <div style={{ 
                      background: 'rgba(6, 182, 212, 0.05)', 
                      border: '1px solid rgba(6, 182, 212, 0.15)', 
                      color: '#a5f3fc', 
                      fontSize: '0.75rem', 
                      padding: '0.65rem 0.75rem', 
                      borderRadius: '6px', 
                      textAlign: 'left',
                      marginBottom: '1.25rem',
                      display: 'flex',
                      gap: '0.4rem',
                      alignItems: 'flex-start',
                      lineHeight: '1.4'
                    }}>
                      <span style={{ flexShrink: 0, marginTop: '0.05rem' }}>ℹ️</span>
                      <span><strong>Webmail Note:</strong> Native client protocols restrict compose deep-links to plain-text bodies. We have pre-compiled a live, high-fidelity scannable QR Code image link (api.qrserver.com) directly into your email body text for seamless scanning.</span>
                    </div>

                    {/* Provider Selection Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.75rem',
                      marginBottom: '1.5rem'
                    }}>
                      <button 
                        onClick={() => {
                          const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(simulatedEmailRecipient)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
                          window.open(gmailUrl, '_blank');
                        }}
                        className="btn"
                        style={{
                          padding: '0.5rem',
                          fontSize: '0.75rem',
                          background: 'rgba(239, 68, 68, 0.08)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          color: '#fca5a5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <span style={{ fontSize: '0.9rem' }}>🔴</span> Gmail (Web)
                      </button>

                      <button 
                        onClick={() => {
                          const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(simulatedEmailRecipient)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
                          window.open(outlookUrl, '_blank');
                        }}
                        className="btn"
                        style={{
                          padding: '0.5rem',
                          fontSize: '0.75rem',
                          background: 'rgba(59, 130, 246, 0.08)',
                          border: '1px solid rgba(59, 130, 246, 0.25)',
                          color: '#93c5fd',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <span style={{ fontSize: '0.9rem' }}>🔵</span> Outlook (Web)
                      </button>

                      <button 
                        onClick={() => {
                          const yahooUrl = `https://compose.mail.yahoo.com/?to=${encodeURIComponent(simulatedEmailRecipient)}&subj=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
                          window.open(yahooUrl, '_blank');
                        }}
                        className="btn"
                        style={{
                          padding: '0.5rem',
                          fontSize: '0.75rem',
                          background: 'rgba(139, 92, 246, 0.08)',
                          border: '1px solid rgba(139, 92, 246, 0.25)',
                          color: '#ddd6fe',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <span style={{ fontSize: '0.9rem' }}>🟣</span> Yahoo Mail
                      </button>

                      <button 
                        onClick={() => {
                          const mailtoUrl = `mailto:${simulatedEmailRecipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
                          window.location.href = mailtoUrl;
                        }}
                        className="btn"
                        style={{
                          padding: '0.5rem',
                          fontSize: '0.75rem',
                          background: 'rgba(6, 182, 212, 0.08)',
                          border: '1px solid rgba(6, 182, 212, 0.25)',
                          color: '#a5f3fc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <span style={{ fontSize: '0.9rem' }}>📧</span> Default Mail App
                      </button>
                    </div>

                    {/* High-Fi Mock Email Client Window */}
                    <div style={{
                      textAlign: 'left',
                      background: '#090b14',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      marginBottom: '1.5rem',
                      fontSize: '0.85rem'
                    }}>
                      {/* Header Bar */}
                      <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem'
                      }}>
                        <div><strong style={{ color: '#94a3b8' }}>From:</strong> NexEvent Hub Platform &lt;no-reply@nexevent.hub&gt;</div>
                        <div><strong style={{ color: '#94a3b8' }}>To:</strong> {simulatedEmailRecipient}</div>
                        <div><strong style={{ color: '#94a3b8' }}>Subject:</strong> {isCert ? '🏆 Verified Credential: ' : '🎟️ Ticket Confirmed: '}{simulatedEmailTicket.eventTitle}</div>
                      </div>

                      {/* Email Body */}
                      <div style={{ padding: '1.5rem', maxHeight: '200px', overflowY: 'auto', background: '#05070c', color: '#ffffff', fontFamily: 'sans-serif' }}>
                        <div style={{ background: '#090b15', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                          {isCert ? (
                            <div>
                              <div style={{ marginBottom: '1.5rem' }}>
                                <span style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>✨ NexEvent Hub</span>
                                <h2 style={{ fontSize: '1.3rem', margin: '0.5rem 0 0.25rem 0', color: '#ffffff' }}>Verified Credential</h2>
                                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Hi {customName || simulatedEmailTicket.userName}, congratulations!</p>
                              </div>

                              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', padding: '1rem', borderRadius: '6px', margin: '1rem 0', textAlign: 'left' }}>
                                <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                                  <tbody>
                                    <tr>
                                      <td style={{ padding: '4px 0', color: '#94a3b8' }}>Event Completer:</td>
                                      <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 'bold', color: '#ffffff' }}>{simulatedEmailTicket.eventTitle}</td>
                                    </tr>
                                    <tr>
                                      <td style={{ padding: '4px 0', color: '#94a3b8' }}>Recognition Role:</td>
                                      <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>{customRole || simulatedEmailTicket.roleTitle || simulatedEmailTicket.role}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>

                              <div style={{ margin: '1.5rem 0 0.5rem 0' }}>
                                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '10px' }}>Verify this secure credential pass on the dynamic ledger:</p>
                                <img 
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}`}
                                  alt="Scannable QR Pass"
                                  style={{ background: '#ffffff', padding: '8px', borderRadius: '6px', width: '130px', height: '130px' }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div style={{ marginBottom: '1.5rem' }}>
                                <span style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>✨ NexEvent Hub</span>
                                <h2 style={{ fontSize: '1.3rem', margin: '0.5rem 0 0.25rem 0', color: '#ffffff' }}>Your Ticket is Confirmed!</h2>
                                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Hi {user.name}, you are officially registered.</p>
                              </div>

                              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', padding: '1rem', borderRadius: '6px', margin: '1rem 0', textAlign: 'left' }}>
                                <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                                  <tbody>
                                    <tr>
                                      <td style={{ padding: '4px 0', color: '#94a3b8' }}>Event Name:</td>
                                      <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 'bold', color: '#ffffff' }}>{simulatedEmailTicket.eventTitle}</td>
                                    </tr>
                                    <tr>
                                      <td style={{ padding: '4px 0', color: '#94a3b8' }}>Ticket Type:</td>
                                      <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>{simulatedEmailTicket.ticketType}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>

                              <div style={{ margin: '1.5rem 0 0.5rem 0' }}>
                                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '10px' }}>Present this scannable QR pass at the admissions desk:</p>
                                <img 
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(simulatedEmailTicket.hash)}`}
                                  alt="Scannable QR Pass"
                                  style={{ background: '#ffffff', padding: '8px', borderRadius: '6px', width: '130px', height: '130px' }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => { setSimulatedEmailTicket(null); setEmailSimState(0); }} 
                      className="btn btn-primary" 
                      style={{ width: '100%', padding: '0.6rem' }}
                    >
                      Close Mailer Sandbox
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
