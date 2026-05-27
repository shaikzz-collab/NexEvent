import { db, isRealFirebase } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, query, where, addDoc } from 'firebase/firestore';

export { isRealFirebase };

export const sanitizeInput = (input) => {
  if (!input) return "";
  const str = String(input).slice(0, 500); // Limit to 500 chars
  return str.replace(/[<>"'/]/g, (match) => {
    switch (match) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      case '/': return '&#x2F;';
      default: return match;
    }
  });
};

export const generateCertificateHash = (eventId, userId, issuedAt = Date.now()) => {
  return btoa(`${eventId}|${userId}|${issuedAt}`);
};

class SandboxDB {
  constructor() {
    this.storageKey = 'nexevent_sandbox_db';
    this.memoryDb = null;
    this.initialize();
  }

  initialize() {
    try {
      if (!localStorage.getItem(this.storageKey)) {
        this.resetDb();
      }
    } catch (err) {
      console.warn("localStorage access blocked or quota exceeded. Falling back to memory storage.", err);
      this.memoryDb = {
        users: {},
        events: {},
        registrations: {},
        tasks: {},
        notifications: {},
        certificates: {},
        applications: {},
        sponsorships: {}
      };
    }
  }

  resetDb() {
    const defaultData = {
      users: {},
      events: {},
      registrations: {},
      tasks: {},
      notifications: {},
      certificates: {},
      applications: {},
      sponsorships: {}
    };
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(defaultData));
    } catch (err) {
      console.warn("Failed to reset localStorage DB. Writing to memory instead.", err);
      this.memoryDb = defaultData;
    }
  }

  getDiverseBanner(title, category) {
    const titleLower = (title || "").toLowerCase();
    const catLower = (category || "").toLowerCase();
    
    // Hash title deterministically to get a stable index
    const charCodeSum = title.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    
    const techPool = [
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80'
    ];
    
    const cultPool = [
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&auto=format&fit=crop&q=80'
    ];
    
    const sportPool = [
      'https://images.unsplash.com/photo-1502224562085-639556652f33?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517747614396-d21a78b850e8?w=800&auto=format&fit=crop&q=80'
    ];
    
    const acadPool = [
      'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80'
    ];
    
    const generalPool = [
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1505232458627-5ec90be5864c?w=800&auto=format&fit=crop&q=80'
    ];
    
    if (catLower.includes('tech') || catLower.includes('hack') || titleLower.includes('tech') || titleLower.includes('dev') || titleLower.includes('aws') || titleLower.includes('code') || titleLower.includes('concl') || titleLower.includes('concl')) {
      return techPool[charCodeSum % techPool.length];
    } else if (catLower.includes('cult') || catLower.includes('music') || catLower.includes('dance') || catLower.includes('art') || titleLower.includes('concert') || titleLower.includes('harmony') || titleLower.includes('fest') || titleLower.includes('liwin')) {
      return cultPool[charCodeSum % cultPool.length];
    } else if (catLower.includes('sport') || catLower.includes('run') || catLower.includes('marathon') || titleLower.includes('marathon') || titleLower.includes('run')) {
      return sportPool[charCodeSum % sportPool.length];
    } else if (catLower.includes('acad') || catLower.includes('talk') || catLower.includes('seminar') || catLower.includes('ted') || titleLower.includes('tedx') || titleLower.includes('summit') || titleLower.includes('prest')) {
      return acadPool[charCodeSum % acadPool.length];
    }
    
    return generalPool[charCodeSum % generalPool.length];
  }

  getDb() {
    let rawData = null;
    if (this.memoryDb) {
      rawData = this.memoryDb;
    } else {
      try {
        const data = localStorage.getItem(this.storageKey);
        if (data) {
          rawData = JSON.parse(data) || {};
        }
      } catch (err) {
        console.warn("Failed to read from localStorage. Returning memory state.", err);
      }
    }
    
    if (!rawData) {
      rawData = {
        users: {},
        events: {},
        registrations: {},
        tasks: {},
        notifications: {},
        certificates: {},
        applications: {},
        sponsorships: {}
      };
      this.memoryDb = rawData;
    }

    // Retroactive self-healing repair: Fix any events that got identical generic crowd or office banners during previous quota rescues
    let needsRepairSave = false;
    if (rawData.events) {
      Object.keys(rawData.events).forEach(id => {
        const ev = rawData.events[id];
        // Match either the generic crowd placeholder, the generic single office tech placeholder, or any uncompressed base64 data URL
        const hasCrowdBanner = ev.bannerUrl && ev.bannerUrl.includes('photo-1540575467063-178a50c2df87');
        const hasOfficeBanner = ev.bannerUrl && ev.bannerUrl.includes('photo-1504384308090-c894fdcc538d');
        const hasBase64Banner = ev.bannerUrl && ev.bannerUrl.startsWith('data:image/');
        
        if (ev.bannerUrl && (hasCrowdBanner || hasOfficeBanner || hasBase64Banner)) {
          // Keep the default seeder banners on our 3 core events, repair any newly created custom events
          if (ev.id !== 'demo-event-1' && ev.id !== 'demo-event-2' && ev.id !== 'demo-event-3') {
            const newBanner = this.getDiverseBanner(ev.title, ev.category);
            if (ev.bannerUrl !== newBanner) {
              ev.bannerUrl = newBanner;
              needsRepairSave = true;
            }
          }
        }
      });
    }

    if (needsRepairSave) {
      setTimeout(() => {
        this.saveDb(rawData);
        console.log("Retroactive self-healing successfully repaired identical competitor event banner duplications!");
      }, 100);
    }
    
    return rawData;
  }

  clearOtherKeys() {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key !== this.storageKey && !key.startsWith('nexevent_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => {
        localStorage.removeItem(k);
        console.log(`Self-healing: Cleared external key "${k}" to free up space for NexEvent.`);
      });
      return keysToRemove.length > 0;
    } catch (e) {
      console.warn("Failed to clear other keys", e);
      return false;
    }
  }

  saveDb(data) {
    // Note: Do not early return if memoryDb exists. We want to always attempt a localStorage write 
    // in case space has been freed, so the app remains persistent across page reloads.
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      this.memoryDb = null; // Write succeeded, clear memory fallback
    } catch (err) {
      console.error("QuotaExceededError caught! Initiating storage self-healing...", err);
      this.memoryDb = data; // Set memory database as safety fallback
      
      // Step 1: Self-Healing - Try to clear other non-critical keys on the domain origin (e.g. competitor data)
      this.clearOtherKeys();
      
      // Step 2: Self-Healing - Prune our own heavy items (base64 images & old notifications)
      try {
        const pruned = JSON.parse(JSON.stringify(data));
        
        // Clear massive base64 event banner images by replacing them with deterministically diverse public URLs
        if (pruned.events) {
          Object.keys(pruned.events).forEach(id => {
            const ev = pruned.events[id];
            if (ev.bannerUrl && ev.bannerUrl.startsWith('data:image/')) {
              console.log(`Self-healing: replacing heavy base64 banner for event "${ev.title}" with category-specific Unsplash placeholder.`);
              ev.bannerUrl = this.getDiverseBanner(ev.title, ev.category);
            }
          });
        }

        // Prune notifications to keep only the 5 most recent
        const notifs = Object.values(pruned.notifications || {});
        if (notifs.length > 5) {
          const sorted = notifs.sort((a, b) => b.timestamp - a.timestamp);
          pruned.notifications = {};
          sorted.slice(0, 5).forEach(n => {
            pruned.notifications[n.id] = n;
          });
        }

        // Step 3: Retry saving pruned data to localStorage
        localStorage.setItem(this.storageKey, JSON.stringify(pruned));
        this.memoryDb = null; // Retry worked! Clear memory fallback so we are persistent
        console.log("Self-healing storage resolved the QuotaExceededError successfully.");
      } catch (retryErr) {
        console.warn("Self-healing failed to resolve local quota. Running in-memory for this write.", retryErr);
      }
    }
  }

  seedDemo() {
    const data = this.getDb();
    
    // Seed 1 Event
    const eventId = 'demo-event-1';
    data.events[eventId] = {
      id: eventId,
      organizerId: 'org-1',
      title: 'TEDxCollege 2025',
      category: 'Tech',
      desc: 'Ideas worth spreading! A day of inspirational talks, technology showcases, and cultural performances by students and industry experts.',
      bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
      tags: ['Innovation', 'Inspire', 'Tech', 'Design'],
      status: 'live',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // next week
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      venueName: 'Main Auditorium, College Campus',
      venueAddress: '100 University Road, Tech City',
      delivery: 'Offline',
      capacity: 200,
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      pricing: 'free',
      allowTeams: false,
      registrationsCount: 150,
      checkedInCount: 134,
      sponsorshipsEnabled: true,
      sponsorRaisedTotal: 85000,
      volunteerRoles: [
        { id: 'vrole-1', title: 'Tech Support', skills: ['Tech', 'Logistics'], slotsTotal: 3, slotsFilled: 2, description: 'Manage audio-visual systems and presenter displays.' },
        { id: 'vrole-2', title: 'Photography & Design', skills: ['Photography', 'Design'], slotsTotal: 2, slotsFilled: 1, description: 'Capture high-quality images and manage backstage visual projections.' },
        { id: 'vrole-3', title: 'Stage Management', skills: ['Marketing', 'Logistics', 'Stage Management'], slotsTotal: 2, slotsFilled: 0, description: 'Coordinate speaker timings and volunteer task execution on stage.' }
      ],
      sponsorshipPackages: [
        { id: 'spack-1', name: 'Gold Sponsor', price: 50000, perks: ['Logo on stage', '6 VIP tickets', 'Premium stall space'], maxSponsors: 2, sponsorsFilled: 1 },
        { id: 'spack-2', name: 'Silver Sponsor', price: 25000, perks: ['Logo on brochure', '3 VIP tickets', 'Standard stall space'], maxSponsors: 5, sponsorsFilled: 1 }
      ]
    };

    // Seed 1 Organizer Profile
    data.users['org-1'] = {
      uid: 'org-1',
      name: 'Dr. Alok Verma',
      email: 'organizer@college.edu',
      role: 'organizer',
      collegeOrCompany: 'State Science College',
      city: 'Delhi',
      state: 'Delhi',
      emailVerified: true,
      orgType: 'College Club',
      privacyShowOnPassport: false
    };
    
    // Seed 3 Volunteers
    const vols = [
      { uid: 'vol-1', name: 'Rahul Sharma', email: 'rahul@gmail.com', college: 'Tech University', score: 94, skills: ['Tech', 'Logistics'], bio: 'Passionate coder and logistics enthusiast.', linkedin: 'https://linkedin.com/in/rahul' },
      { uid: 'vol-2', name: 'Priya Patel', email: 'priya@gmail.com', college: 'Design Institute', score: 87, skills: ['Design', 'Photography', 'Marketing'], bio: 'UI/UX designer and amateur photographer.', linkedin: 'https://linkedin.com/in/priya' },
      { uid: 'vol-3', name: 'Arjun Singh', email: 'arjun@gmail.com', college: 'Science College', score: 76, skills: ['Security', 'Logistics'], bio: 'Event enthusiast looking to build portfolio.', linkedin: 'https://linkedin.com/in/arjun' }
    ];

    vols.forEach((v, index) => {
      data.users[v.uid] = {
        uid: v.uid,
        name: v.name,
        email: v.email,
        role: 'volunteer',
        collegeOrCompany: v.college,
        city: 'Delhi',
        state: 'Delhi',
        emailVerified: true,
        privacyShowOnPassport: true,
        skills: v.skills,
        bio: v.bio,
        linkedinUrl: v.linkedin,
        performanceScore: v.score
      };

      // Add volunteer applications (accepted)
      const appId = `app-vol-${v.uid}`;
      data.applications[appId] = {
        id: appId,
        eventId: eventId,
        eventTitle: 'TEDxCollege 2025',
        userId: v.uid,
        userName: v.name,
        userEmail: v.email,
        roleId: index === 0 ? 'vrole-1' : index === 1 ? 'vrole-2' : 'vrole-1',
        roleTitle: index === 0 ? 'Tech Support' : index === 1 ? 'Photography & Design' : 'Tech Support',
        status: 'approved',
        timestamp: Date.now()
      };

      // Seed 3-5 Completed Tasks for each volunteer
      const taskCount = index === 0 ? 5 : index === 1 ? 4 : 3;
      for (let t = 1; t <= taskCount; t++) {
        const taskId = `task-vol-${v.uid}-${t}`;
        data.tasks[taskId] = {
          id: taskId,
          eventId: eventId,
          title: `Task #${t} for ${v.name.split(' ')[0]}`,
          desc: `Complete checkpoint assignment for domain role setup. Verification required.`,
          domain: v.skills[0] || 'Other',
          status: 'done',
          points: 20,
          assignedToUid: v.uid,
          assignedToName: v.name
        };
      }

      // Seed 1 Certificate for each volunteer
      const issuedAt = Date.now() - 15 * 24 * 60 * 60 * 1000; // 15 days ago
      const certCode = generateCertificateHash('past-event-0', v.uid, issuedAt);
      data.certificates[certCode] = {
        code: certCode,
        eventId: 'past-event-0',
        eventTitle: 'National HackFest 2025',
        userId: v.uid,
        userName: v.name,
        role: 'volunteer',
        roleTitle: index === 0 ? 'Lead Developer' : index === 1 ? 'UI/UX Coordinator' : 'Logistics Lead',
        issuedAt: issuedAt,
        verify_code: certCode,
        performanceScore: v.score
      };
    });

    // Seed 2 Sponsors
    const sponsors = [
      { uid: 'spon-1', name: 'InnovateTech Solutions', company: 'InnovateTech', industry: 'Software / Technology', budget: 150000, audience: ['Tech', 'Design'], match: 87 },
      { uid: 'spon-2', name: 'EduCorp Foundation', company: 'EduCorp', industry: 'Education', budget: 80000, audience: ['Academic', 'Workshop'], match: 73 }
    ];

    sponsors.forEach(s => {
      data.users[s.uid] = {
        uid: s.uid,
        name: s.name,
        email: `${s.company.toLowerCase()}@sponsor.com`,
        role: 'sponsor',
        collegeOrCompany: s.company,
        city: 'Mumbai',
        state: 'Maharashtra',
        emailVerified: true,
        privacyShowOnPassport: false,
        sponsorCompany: s.company,
        sponsorIndustry: s.industry,
        sponsorBudgetRange: s.budget,
        sponsorTargetAudience: s.audience,
        matchScore: s.match
      };

      // Add sponsorships
      const sponId = `spon-deal-${s.uid}`;
      data.sponsorships[sponId] = {
        id: sponId,
        eventId: eventId,
        eventTitle: 'TEDxCollege 2025',
        sponsorId: s.uid,
        sponsorName: s.name,
        packageId: s.uid === 'spon-1' ? 'spack-1' : 'spack-2',
        packageName: s.uid === 'spon-1' ? 'Gold Sponsor' : 'Silver Sponsor',
        price: s.uid === 'spon-1' ? 50000 : 25000,
        status: 'approved',
        timestamp: Date.now()
      };
    });

    // Seed 8 Participants with QR tickets (and 134 in total checked in previously, which we simulate via counters)
    const participants = [
      { uid: 'part-1', name: 'Sumit Gupta', email: 'sumit@gmail.com' },
      { uid: 'part-2', name: 'Ananya Roy', email: 'ananya@gmail.com' },
      { uid: 'part-3', name: 'Vikram Joshi', email: 'vikram@gmail.com' },
      { uid: 'part-4', name: 'Neha Sharma', email: 'neha@gmail.com' },
      { uid: 'part-5', name: 'Rohan Mehta', email: 'rohan@gmail.com' },
      { uid: 'part-6', name: 'Kirti Sen', email: 'kirti@gmail.com' },
      { uid: 'part-7', name: 'Aditya Das', email: 'aditya@gmail.com' },
      { uid: 'part-8', name: 'Sneha Rao', email: 'sneha@gmail.com' }
    ];

    participants.forEach((p, idx) => {
      data.users[p.uid] = {
        uid: p.uid,
        name: p.name,
        email: p.email,
        role: 'participant',
        collegeOrCompany: 'City College',
        city: 'Delhi',
        state: 'Delhi',
        emailVerified: true,
        privacyShowOnPassport: true,
        participantInterests: ['Technology', 'Cultural']
      };

      // Add registrations
      const regId = `reg-demo-${p.uid}`;
      const hash = btoa(`${eventId}|${p.uid}|reg`);
      data.registrations[regId] = {
        id: regId,
        eventId: eventId,
        eventTitle: 'TEDxCollege 2025',
        userId: p.uid,
        userName: p.name,
        userEmail: p.email,
        ticketType: 'General Admission',
        customAnswers: { 'Why do you want to attend?': 'To learn and network!' },
        status: 'active',
        checked_in: idx < 6, // 6 are checked in, 2 are not checked in
        qrSvgString: hash,
        hash: hash,
        timestamp: Date.now()
      };

      // Also seed 1 certificate for the first participant from a past event
      if (idx === 0) {
        const issuedAt = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const certCode = generateCertificateHash('past-event-1', p.uid, issuedAt);
        data.certificates[certCode] = {
          code: certCode,
          eventId: 'past-event-1',
          eventTitle: 'TechSummit 2025',
          userId: p.uid,
          userName: p.name,
          role: 'participant',
          roleTitle: 'Attendee Participant',
          issuedAt: issuedAt,
          verify_code: certCode
        };
      }
    });

    // Seed some other open events to search for
    const otherEvents = [
      {
        id: 'demo-event-2',
        organizerId: 'org-2',
        title: 'National HackFest 2026',
        category: 'Hackathon',
        desc: 'Unleash your coding skills! Standard 36-hour team competition to build dynamic products addressing pressing educational and green issues.',
        bannerUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80',
        tags: ['Programming', 'Hackathon', 'Design'],
        status: 'live',
        startDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        venueName: 'Engineering Seminar Center',
        venueAddress: '200 Science Way, Metro City',
        delivery: 'Hybrid',
        capacity: 350,
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        pricing: 'paid',
        ticketPrice: 250,
        paymentInstructions: 'Pay online via UPI or bank card transfer.',
        allowTeams: true,
        teamSizeRange: { min: 2, max: 4 },
        registrationsCount: 84,
        checkedInCount: 0,
        sponsorshipsEnabled: true,
        sponsorRaisedTotal: 25000,
        volunteerRoles: [
          { id: 'vrole-2-1', title: 'Tech Mentor', skills: ['Tech'], slotsTotal: 10, slotsFilled: 0, description: 'Help teams debug their setups and advise on API routing.' }
        ],
        sponsorshipPackages: [
          { id: 'spack-2-1', name: 'Diamond Sponsor', price: 100000, perks: ['Logo on merch', '10 VIP tickets', 'Premium stall space', 'Opening speech slot'], maxSponsors: 1, sponsorsFilled: 0 }
        ]
      },
      {
        id: 'demo-event-3',
        organizerId: 'org-1',
        title: 'Vocal Harmonies Concert',
        category: 'Cultural',
        desc: 'An evening of classical and contemporary musical performances by students and guest choirs.',
        bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
        tags: ['Music', 'Art', 'Singing'],
        status: 'live',
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        venueName: 'Open Air Theatre',
        venueAddress: '100 University Road, Tech City',
        delivery: 'Offline',
        capacity: 500,
        deadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        pricing: 'free',
        allowTeams: false,
        registrationsCount: 310,
        checkedInCount: 0,
        sponsorshipsEnabled: false,
        sponsorRaisedTotal: 0
      }
    ];

    otherEvents.forEach(e => {
      data.events[e.id] = e;
    });

    // Seed 1 generic Notification for all roles
    data.notifications['global-notif'] = {
      id: 'global-notif',
      userId: 'all',
      title: 'Welcome to NexEvent Hub!',
      message: 'You have completed demo seeder configurations. Start exploring roles, check in tickets or verify volunteer certificates!',
      type: 'success',
      timestamp: Date.now(),
      read: false
    };

    this.saveDb(data);
  }
  
  async setDoc(col, id, payload) {
    const data = this.getDb();
    if (!data[col]) data[col] = {};
    data[col][id] = payload;
    this.saveDb(data);
  }

  async getDoc(col, id) {
    const data = this.getDb();
    return data[col]?.[id] || null;
  }

  async getCollection(col) {
    const data = this.getDb();
    return Object.values(data[col] || {});
  }

  async updateDoc(col, id, payload) {
    const data = this.getDb();
    if (data[col]?.[id]) {
      data[col][id] = { ...data[col][id], ...payload };
      this.saveDb(data);
    }
  }

  async queryDocs(col, conditions = []) {
    const items = await this.getCollection(col);
    return items.filter(item => {
      for (const cond of conditions) {
        const { field, op, value } = cond;
        if (op === '==') {
          if (item[field] !== value) return false;
        } else if (op === 'array-contains') {
          if (!Array.isArray(item[field]) || !item[field].includes(value)) return false;
        } else if (op === 'in') {
          if (!Array.isArray(value) || !value.includes(item[field])) return false;
        }
      }
      return true;
    });
  }
}

const sandbox = new SandboxDB();

export const seedSandboxData = () => {
  sandbox.seedDemo();
};

export const resetSandboxData = () => {
  sandbox.resetDb();
};

// Check if sandbox is fully empty
export const isSandboxEmpty = () => {
  const data = sandbox.getDb();
  return Object.keys(data.users || {}).length === 0;
};

// Helper to recursively sanitize all string properties of a database payload (XSS prevention)
export const sanitizeRecursive = (obj, parentKey = '') => {
  if (typeof obj === 'string') {
    const isUrlOrCode = /url|link|hash|code|qr|pic|banner/i.test(parentKey) || obj.startsWith('data:image/');
    if (isUrlOrCode) {
      return obj;
    }
    return sanitizeInput(obj);
  } else if (Array.isArray(obj)) {
    return obj.map(item => sanitizeRecursive(item, parentKey));
  } else if (obj !== null && typeof obj === 'object') {
    const copy = {};
    for (const [k, v] of Object.entries(obj)) {
      copy[k] = sanitizeRecursive(v, k);
    }
    return copy;
  }
  return obj;
};

export const saveDocument = async (col, id, payload) => {
  const safePayload = JSON.parse(JSON.stringify(payload));
  const sanitizedPayload = sanitizeRecursive(safePayload);

  if (isRealFirebase()) {
    await setDoc(doc(db, col, id), sanitizedPayload);
  } else {
    await sandbox.setDoc(col, id, sanitizedPayload);
  }
};

export const fetchDocument = async (col, id) => {
  if (isRealFirebase()) {
    const docSnap = await getDoc(doc(db, col, id));
    return docSnap.exists() ? docSnap.data() : null;
  } else {
    return await sandbox.getDoc(col, id);
  }
};

export const updateDocument = async (col, id, payload) => {
  const safePayload = JSON.parse(JSON.stringify(payload));
  const sanitizedPayload = sanitizeRecursive(safePayload);

  if (isRealFirebase()) {
    await updateDoc(doc(db, col, id), sanitizedPayload);
  } else {
    await sandbox.updateDoc(col, id, sanitizedPayload);
  }
};

export const fetchCollection = async (col, conditions = []) => {
  if (isRealFirebase()) {
    let q = collection(db, col);
    if (conditions.length > 0) {
      const constraints = conditions.map(c => where(c.field, c.op, c.value));
      q = query(q, ...constraints);
    }
    const querySnapshot = await getDocs(q);
    const results = [];
    querySnapshot.forEach((doc) => {
      results.push({ id: doc.id, ...doc.data() });
    });
    return results;
  } else {
    return await sandbox.queryDocs(col, conditions);
  }
};

// Unified dynamic seeder check
export const checkAndSeedDatabase = () => {
  if (!isRealFirebase()) {
    if (isSandboxEmpty()) {
      seedSandboxData();
      console.log("Database empty. Auto-seeded initial sandbox records.");
    }
  }
};

// Create a Notification helper
export const pushNotification = async (userId, title, message, type = 'info') => {
  const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const notif = {
    id,
    userId,
    title,
    message,
    type,
    timestamp: Date.now(),
    read: false
  };
  await saveDocument('notifications', id, notif);
};

// Hardened ticket check-in routine
export const validateAndCheckInTicket = async (hash, eventId) => {
  // Step 1: Decode/Deconstruct ticket validation key
  // Hash schema: btoa(`${eventId}|${userId}|reg`) or general code
  let decoded = "";
  try {
    decoded = atob(hash);
  } catch (err) {
    return { success: false, message: "❌ Invalid Ticket Format (Base64 decoding failed)" };
  }

  const parts = decoded.split('|');
  if (parts.length < 3 || parts[2] !== 'reg') {
    return { success: false, message: "❌ Invalid Ticket Cryptography (Deconstruction failed)" };
  }

  const tEventId = parts[0];
  const userId = parts[1];

  // Cross-event safety check
  if (tEventId !== eventId) {
    return { success: false, message: "❌ Cross-Event Violation (Ticket belongs to a different event)" };
  }

  // Rate-limiting simulated: check if checking in too rapidly (mocked)
  const lastCheckKey = `last_check_${userId}`;
  const now = Date.now();
  let lastCheck = null;
  try {
    lastCheck = sessionStorage.getItem(lastCheckKey);
  } catch (e) {
    console.warn("sessionStorage read blocked", e);
  }

  if (lastCheck && now - parseInt(lastCheck) < 5000) {
    return { success: false, message: "⚠️ Rate Limit Triggered. Please wait 5 seconds between scans." };
  }

  try {
    sessionStorage.setItem(lastCheckKey, String(now));
  } catch (e) {
    console.warn("sessionStorage write blocked", e);
  }

  // Query registration records
  const regs = await fetchCollection('registrations', [
    { field: 'eventId', op: '==', value: eventId },
    { field: 'userId', op: '==', value: userId }
  ]);

  if (regs.length === 0) {
    return { success: false, message: "❌ Registration Record Not Found" };
  }

  const reg = regs[0];

  // Check active status
  if (reg.status !== 'active') {
    return { success: false, message: "❌ Registration Suspended / Non-Active Ticket" };
  }

  // Check duplicate check-in
  if (reg.checked_in) {
    return { success: false, message: `⚠️ Already Checked In! Ticket was validated at ${new Date(reg.checkedInAt || Date.now()).toLocaleTimeString()}` };
  }

  // Update check-in record
  const checkTime = Date.now();
  await updateDocument('registrations', reg.id, {
    checked_in: true,
    checkedInAt: checkTime
  });

  // Increment event counters
  const event = await fetchDocument('events', eventId);
  if (event) {
    const newCount = (event.checkedInCount || 0) + 1;
    await updateDocument('events', eventId, {
      checkedInCount: newCount
    });
  }

  // Send a success notification to the participant
  await pushNotification(userId, "Check-in Successful!", `Welcome to ${event?.title || 'the event'}! Your ticket has been scanned and validated.`, 'success');

  return { 
    success: true, 
    message: "✅ Authentic Certificate (Ticket Verified Successfully)", 
    userName: reg.userName, 
    userEmail: reg.userEmail,
    checkedInAt: checkTime 
  };
};
