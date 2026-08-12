import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout } from './services/firebaseAuth';
import { WorkspaceResources, RoutingConfiguration, Client, ReviewRecord } from './types';
import { useLanguage } from './i18n/LanguageContext';
import LogicParametersTab from './components/LogicParametersTab';
import SheetAndScriptTab from './components/SheetAndScriptTab';
import PipelineSandbox from './components/PipelineSandbox';
import QRCodeTab from './components/QRCodeTab';
import SocialShareTab from './components/SocialShareTab';
import ReviewsDashboard from './components/ReviewsDashboard';
import GmbConnectionVerifier from './components/GmbConnectionVerifier';
import mkLogo from './assets/images/mk_logo_1781902335896.jpg';
import {
  Sparkles,
  Sheet,
  FileCheck,
  Mail,
  GitFork,
  ArrowRight,
  Info,
  Layers,
  Code2,
  Terminal,
  Activity,
  UserCheck,
  Play,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Database,
  Plus,
  Trash2,
  Edit3,
  QrCode,
  Wrench,
  Share2,
  Sliders,
  ExternalLink
} from 'lucide-react';

const defaultRoutingConfig = (userEmail: string = ''): RoutingConfiguration => ({
  supportEmail: userEmail || 'support@yourcompany.com',
  businessSignature: 'Warmest regards,\nThe M&K Customer Team',
  googleReviewsUrl: 'https://g.page/r/CajrrF4R_V20EAI/review',
  excellentSubject: 'Your feedback means the world to us, ${name}! ⭐',
  excellentBody: `<div style="font-family: 'Times New Roman', Times, serif; line-height: 25px; font-size: 17px; color: #000000; max-width: 600px; margin: 0 auto; padding: 25px; border: none; border-radius: 16px; background: #ffffff;">
  <h2 style="color: #000000; margin-top: 0; margin-bottom: 16px; font-size: 20px; font-weight: 700; font-family: 'Times New Roman', Times, serif; line-height: 25px;">⭐ Outstanding, thank you \${name}!</h2>
  <p style="font-size: 17px; line-height: 25px; margin-top: 0; margin-bottom: 16px;">Hi <strong>\${name}</strong>,</p>
  <p style="font-size: 17px; line-height: 25px; margin-top: 0; margin-bottom: 16px;">Thank you so much for taking the time to share your feedback. We are absolutely thrilled to receive your <strong>5-Star rating!</strong> Your kind comments keep our team motivated:</p>
  <div style="background: #f5f0e6; padding: 12px 18px; margin: 18px 0; border-radius: 6px; color: #000000; font-weight: bold; font-style: italic; font-size: 17px; line-height: 25px;">
    "\${comments}"
  </div>
  <p style="font-size: 17px; line-height: 25px; color: #000000; margin-top: 25px; margin-bottom: 0;">\${signature}</p>
</div>`,
  goodSubject: 'We value your input, ${name}!  ⭐',
  goodBody: `<div style="font-family: 'Times New Roman', Times, serif; line-height: 25px; font-size: 17px; color: #000000; max-width: 600px; margin: 0 auto; padding: 25px; border: none; border-radius: 16px; background: #ffffff;">
  <h2 style="color: #000000; margin-top: 0; margin-bottom: 16px; font-size: 20px; font-weight: 700; font-family: 'Times New Roman', Times, serif; line-height: 25px;">⭐ Wonderful! Thank you, \${name}</h2>
  <p style="font-size: 17px; line-height: 25px; margin-top: 0; margin-bottom: 16px;">Hi <strong>\${name}</strong>,</p>
  <p style="font-size: 17px; line-height: 25px; margin-top: 0; margin-bottom: 16px;">We saw that you gave us a <strong>4-Star rating</strong>. Thank you so much for your support! We are constantly working to improve, and your comments are invaluable:</p>
  <div style="background: #f5f0e6; padding: 12px 18px; margin: 18px 0; border-radius: 6px; color: #000000; font-weight: bold; font-style: italic; font-size: 17px; line-height: 25px;">
    "\${comments}"
  </div>
  <p style="font-size: 17px; line-height: 25px; color: #000000; margin-top: 25px; margin-bottom: 0;">\${signature}</p>
</div>`,

  neutralSubject: 'Regarding your recent experience, ${name}',
  neutralBody: `<div style="font-family: 'Times New Roman', Times, serif; line-height: 25px; font-size: 17px; color: #000000; max-width: 600px; margin: 0 auto; padding: 25px; border: none; border-radius: 16px; background: #ffffff;">
  <h2 style="color: #000000; margin-top: 0; margin-bottom: 16px; font-size: 20px; font-weight: 700; font-family: 'Times New Roman', Times, serif; line-height: 25px;">We want to make this right</h2>
  <p style="font-size: 17px; line-height: 25px; margin-top: 0; margin-bottom: 16px;">Hi <strong>\${name}</strong>,</p>
  <p style="font-size: 17px; line-height: 25px; margin-top: 0; margin-bottom: 16px;">Thank you for submitting your <strong>3-Star rating</strong> feedback. We appreciate you reaching out, but we are sorry that we only delivered a satisfactory experience, rather than a perfect one.</p>
  <p style="font-size: 17px; line-height: 25px; margin-top: 0; margin-bottom: 16px;">We have captured your comments:</p>
  <div style="background: #f5f0e6; padding: 12px 18px; margin: 18px 0; border-radius: 6px; color: #000000; font-weight: bold; font-style: italic; font-size: 17px; line-height: 25px;">
    "\${comments}"
  </div>
  <p style="font-size: 17px; line-height: 25px; margin-top: 0; margin-bottom: 16px;">What can we do to make your next experience a perfect 5 stars? Simply respond directly to this email to start a conversation with a service supervisor.</p>
  <p style="font-size: 17px; line-height: 25px; color: #000000; margin-top: 25px; margin-bottom: 0;">\${signature}</p>
</div>`,

  poorSubject: '${name} We are concern regarding your recent experience',
  poorBody: `<div style="font-family: 'Times New Roman', Times, serif; line-height: 25px; font-size: 17px; color: #000000; max-width: 600px; margin: 0 auto; padding: 25px; border: none; border-radius: 16px; background: #ffffff;">
  <h2 style="color: #000000; margin-top: 0; margin-bottom: 16px; font-size: 20px; font-weight: 700; font-family: 'Times New Roman', Times, serif; line-height: 25px;">A Sincere Apology</h2>
  <p style="font-size: 17px; line-height: 25px; margin-top: 0; margin-bottom: 16px;">Dear <strong>\${name}</strong>,</p>
  <p style="font-size: 17px; line-height: 25px; margin-top: 0; margin-bottom: 16px;">Thank you for taking the time to share your review. We were very distressed to see your <strong>\${rating} rating</strong> and read about your recent experience:</p>
  <div style="background: #f5f0e6; padding: 12px 18px; margin: 18px 0; border-radius: 6px; color: #000000; font-weight: bold; font-style: italic; font-size: 17px; line-height: 25px;">
    "\${comments}"
  </div>
  <p style="font-size: 17px; line-height: 25px; margin-top: 0; margin-bottom: 16px;">This falls completely short of our company core standards. We would love to make this right for you as soon as possible.</p>
  <p style="font-size: 17px; line-height: 25px; margin-top: 0; margin-bottom: 16px;">Can you please reply to this email, or let us know a convenient time to schedule a phone call? We would appreciate the opportunity to listen to your concerns and seek a resolution.</p>
  <p style="font-size: 17px; line-height: 25px; color: #000000; margin-top: 25px; margin-bottom: 0;">\${signature}</p>
</div>`,
  companyLogoUrl: '',
  starThreshold: 3,
  yelpEnabled: true,
  yelpUrl: 'https://www.yelp.com/biz/m-and-k-used-auto-parts-vero-beach-2',
  facebookEnabled: true,
  facebookUrl: 'https://www.facebook.com/MKusedautoparts/reviews',
  bbbEnabled: false,
  bbbUrl: 'https://www.bbb.org'
});

const isPublished = () => {
  try {
    const hostname = window.location.hostname;
    return hostname.includes('-pre-') || (!hostname.includes('-dev-') && hostname !== 'localhost' && hostname !== '127.0.0.1');
  } catch {
    return false;
  }
};

export default function App() {
  const { t } = useLanguage();
  const [forceLivePreview, setForceLivePreview] = useState(() => {
    try {
      return localStorage.getItem('g_force_live_preview') === 'true';
    } catch {
      return false;
    }
  });

  const getPublishedState = () => {
    if (forceLivePreview) return true;
    return isPublished();
  };

  const [activeTab, setActiveTab] = useState<'blueprint' | 'logic' | 'dashboard' | 'script' | 'sandbox' | 'qr' | 'social' | 'gmb-verify'>(() => {
    try {
      if (getPublishedState()) {
        return 'sandbox';
      }
      return (localStorage.getItem('g_active_tab') as any) || 'blueprint';
    } catch {
      return 'blueprint';
    }
  });
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const savedClients = localStorage.getItem('g_clients');
      let loadedClients: Client[] = [];
      
      const defaultResources = {
        spreadsheetId: '1NFtZc8tbp3DCOT4JKze7b7np3iB8kjgBRsvXc4X5lQ4',
        spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1NFtZc8tbp3DCOT4JKze7b7np3iB8kjgBRsvXc4X5lQ4/edit?usp=sharing',
        formId: null,
        formUrl: null
      };

      if (savedClients) {
        loadedClients = JSON.parse(savedClients);
      } else {
        const savedResources = localStorage.getItem('g_resources');
        const savedRoutingConfig = localStorage.getItem('g_routing_config');
        
        let initialResources = defaultResources;
        if (savedResources) {
          try {
            const parsed = JSON.parse(savedResources);
            initialResources = {
              ...defaultResources,
              ...parsed,
              spreadsheetId: parsed.spreadsheetId || defaultResources.spreadsheetId,
              spreadsheetUrl: parsed.spreadsheetUrl || defaultResources.spreadsheetUrl,
            };
          } catch {}
        }

        let initialRoutingConfig = defaultRoutingConfig();
        if (savedRoutingConfig) {
          try {
            const parsed = JSON.parse(savedRoutingConfig);
            initialRoutingConfig = {
              ...defaultRoutingConfig(parsed.supportEmail || ''),
              ...parsed
            };
          } catch {}
        }

        loadedClients = [{
          id: 'mandk',
          name: 'MandK App',
          appUrl: 'https://mandk-app.ai.studio',
          resources: initialResources,
          routingConfig: initialRoutingConfig
        }];
      }

      // Automatically inject custom client from URL parameters if not exists (for clean environment testing / mobile scanning)
      const urlParams = new URLSearchParams(window.location.search);
      const urlClientId = urlParams.get('client') || urlParams.get('clientId');
      if (urlClientId && urlClientId !== 'mandk') {
        const exists = loadedClients.some(c => c.id === urlClientId);
        if (!exists) {
          // Format a nice display name
          let clientName = 'Custom Client';
          if (urlClientId.startsWith('client_')) {
            clientName = `Client ${loadedClients.length + 1}`;
          } else {
            clientName = urlClientId.charAt(0).toUpperCase() + urlClientId.slice(1);
          }
          loadedClients.push({
            id: urlClientId,
            name: clientName,
            resources: { ...defaultResources },
            routingConfig: defaultRoutingConfig()
          });
        }
      }

      return loadedClients;
    } catch {
      return [{
        id: 'mandk',
        name: 'MandK App',
        resources: {
          spreadsheetId: '1NFtZc8tbp3DCOT4JKze7b7np3iB8kjgBRsvXc4X5lQ4',
          spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1NFtZc8tbp3DCOT4JKze7b7np3iB8kjgBRsvXc4X5lQ4/edit?usp=sharing',
          formId: null,
          formUrl: null
        },
        routingConfig: defaultRoutingConfig()
      }];
    }
  });

  const [reviews, setReviews] = useState<ReviewRecord[]>(() => {
    try {
      const saved = localStorage.getItem('g_recorded_reviews');
      if (saved) return JSON.parse(saved);
      
      const defaultReviews: ReviewRecord[] = [
        {
          id: 'rev_1',
          clientId: 'mandk',
          clientName: 'MandK App',
          timestamp: new Date(Date.now() - 3600000 * 3).toLocaleString(),
          name: 'Sarah Jenkins',
          email: 'sarah.j@example.com',
          rating: 5,
          comments: 'They did a great job helping me find the quality used auto parts I needed for my vehicle. The service was quick, straightforward, and highly professional.',
          status: 'synced'
        },
        {
          id: 'rev_2',
          clientId: 'mandk',
          clientName: 'MandK App',
          timestamp: new Date(Date.now() - 3600000 * 8).toLocaleString(),
          name: 'Michael Chang',
          email: 'm.chang99@example.com',
          rating: 4,
          comments: 'Great selection and very prompt responses. Will definitely use them again for replacement components!',
          status: 'synced'
        },
        {
          id: 'rev_3',
          clientId: 'mandk',
          clientName: 'MandK App',
          timestamp: new Date(Date.now() - 3600000 * 24).toLocaleString(),
          name: 'Dave Miller',
          email: 'dave.miller@example.com',
          rating: 2,
          comments: 'Took almost two days to get a callback about the transmission unit. Hopefully the routing speeds up next time.',
          status: 'local'
        }
      ];
      localStorage.setItem('g_recorded_reviews', JSON.stringify(defaultReviews));
      return defaultReviews;
    } catch {
      return [];
    }
  });

  const handleAddReview = (newReview: Omit<ReviewRecord, 'id' | 'timestamp'>) => {
    const record: ReviewRecord = {
      ...newReview,
      id: `rev_${Date.now()}`,
      timestamp: new Date().toLocaleString(),
    };
    setReviews(prev => {
      const updated = [record, ...prev];
      try {
        localStorage.setItem('g_recorded_reviews', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const handleClearReviews = () => {
    setReviews([]);
    try {
      localStorage.setItem('g_recorded_reviews', JSON.stringify([]));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSeedDemoReviews = () => {
    const activeClient = clients.find(c => c.id === activeClientId) || clients[0];
    const clientName = activeClient?.name || 'MandK App';
    const clientId = activeClient?.id || 'mandk';

    const now = Date.now();
    const mockReviews: ReviewRecord[] = [
      {
        id: `demo_${now}_1`,
        clientId,
        clientName,
        timestamp: new Date(now - 3600000 * 0.5).toLocaleString(), // 30 mins ago
        name: 'James Reynolds',
        email: 'reynolds.j@gmail.com',
        rating: 5,
        comments: 'Outstanding service! Needed a rare side mirror for my 2018 Camry and they had it pulled and ready in 20 minutes. Pricing was extremely fair too.',
        status: 'synced'
      },
      {
        id: `demo_${now}_2`,
        clientId,
        clientName,
        timestamp: new Date(now - 3600000 * 2).toLocaleString(), // 2 hours ago
        name: 'Clara Oswald',
        email: 'clara.o@yahoo.com',
        rating: 5,
        comments: 'Super helpful staff. They helped me verify the engine serial compatibility and gave me detailed maintenance tips. 5-star experience!',
        status: 'synced'
      },
      {
        id: `demo_${now}_3`,
        clientId,
        clientName,
        timestamp: new Date(now - 3600000 * 5).toLocaleString(), // 5 hours ago
        name: 'David Tennant',
        email: 'tennant.d@outlook.com',
        rating: 3,
        comments: 'Parts selection is incredible but the checkout line was quite long on Saturday. Product quality is good though.',
        status: 'local'
      },
      {
        id: `demo_${now}_4`,
        clientId,
        clientName,
        timestamp: new Date(now - 3600000 * 12).toLocaleString(), // 12 hours ago
        name: 'Amelia Pond',
        email: 'amy.pond@example.com',
        rating: 1,
        comments: 'Received the wrong alternator model for my Honda Accord. Tried calling support but got put on hold twice before getting disconnected.',
        status: 'local'
      },
      {
        id: `demo_${now}_5`,
        clientId,
        clientName,
        timestamp: new Date(now - 3600000 * 18).toLocaleString(), // 18 hours ago
        name: 'Rory Williams',
        email: 'rory.w@gmail.com',
        rating: 4,
        comments: 'Found a great condition bumper cover here. Shipped quickly and color matched perfectly. Solid service.',
        status: 'synced'
      },
      {
        id: `demo_${now}_6`,
        clientId,
        clientName,
        timestamp: new Date(now - 3600000 * 28).toLocaleString(), // 1.2 days ago
        name: 'Martha Jones',
        email: 'martha.jones@hospital.org',
        rating: 5,
        comments: 'M&K never disappoints. Best auto parts yard in town. Very organized inventory and super competitive prices!',
        status: 'synced'
      },
      {
        id: `demo_${now}_7`,
        clientId,
        clientName,
        timestamp: new Date(now - 3600000 * 36).toLocaleString(), // 1.5 days ago
        name: 'John Smith',
        email: 'jsmith.mechanic@yahoo.com',
        rating: 4,
        comments: 'Good reliable parts for my client vehicles. Been coming here for years and they always treat me right.',
        status: 'synced'
      },
      {
        id: `demo_${now}_8`,
        clientId,
        clientName,
        timestamp: new Date(now - 3600000 * 48).toLocaleString(), // 2 days ago
        name: 'Donna Noble',
        email: 'donna.noble@chitchat.co.uk',
        rating: 2,
        comments: 'The online inventory showed a fender was in stock, but when I drove all the way there, it had already been sold. Please keep database updated!',
        status: 'local'
      },
      {
        id: `demo_${now}_9`,
        clientId,
        clientName,
        timestamp: new Date(now - 3600000 * 60).toLocaleString(), // 2.5 days ago
        name: 'Rose Tyler',
        email: 'rose.tyler@badwolf.com',
        rating: 5,
        comments: 'Polite and professional phone sales team. Saved me hundreds of dollars compared to buying brand new OEM parts.',
        status: 'synced'
      },
      {
        id: `demo_${now}_10`,
        clientId,
        clientName,
        timestamp: new Date(now - 3600000 * 72).toLocaleString(), // 3 days ago
        name: 'Danny Pink',
        email: 'danny.pink@school.edu',
        rating: 3,
        comments: 'Decent customer lounge. Part was in fair condition. Average salvage yard experience.',
        status: 'synced'
      },
      {
        id: `demo_${now}_11`,
        clientId,
        clientName,
        timestamp: new Date(now - 3600000 * 96).toLocaleString(), // 4 days ago
        name: 'Wilfred Mott',
        email: 'wilf.mott@stargaze.net',
        rating: 5,
        comments: 'A wonderful local family business. Staff treated me with utmost respect and found a replacement tail light assembly for me instantly.',
        status: 'synced'
      },
      {
        id: `demo_${now}_12`,
        clientId,
        clientName,
        timestamp: new Date(now - 3600000 * 120).toLocaleString(), // 5 days ago
        name: 'Harriet Jones',
        email: 'harriet.jones@pm.gov.uk',
        rating: 4,
        comments: 'Very clear guidance and professional team. Appreciated the transparent 90-day warranty policy on the starter motor.',
        status: 'synced'
      }
    ];

    setReviews(prev => {
      // Avoid inserting duplicates if the user double clicks
      const existingEmails = new Set(prev.map(r => r.email));
      const newUnique = mockReviews.filter(r => !existingEmails.has(r.email));
      const updated = [...newUnique, ...prev];
      try {
        localStorage.setItem('g_recorded_reviews', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const handleImportGmbReviews = (gmbReviews: ReviewRecord[]) => {
    setReviews(prev => {
      const existingIds = new Set(prev.map(r => r.id));
      const existingComments = new Set(prev.map(r => r.comments.trim()));
      
      const newUnique = gmbReviews.filter(
        r => !existingIds.has(r.id) && !existingComments.has(r.comments.trim())
      );
      const updated = [...newUnique, ...prev];
      try {
        localStorage.setItem('g_recorded_reviews', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const [activeClientId, setActiveClientId] = useState<string>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlClientId = urlParams.get('client') || urlParams.get('clientId');
      if (urlClientId) {
        return urlClientId;
      }
      return localStorage.getItem('g_active_client_id') || 'mandk';
    } catch {
      return 'mandk';
    }
  });

  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');

  const activeClient = clients.find(c => c.id === activeClientId) || clients[0] || {
    id: 'mandk',
    name: 'MandK App',
    resources: {
      spreadsheetId: '1NFtZc8tbp3DCOT4JKze7b7np3iB8kjgBRsvXc4X5lQ4',
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1NFtZc8tbp3DCOT4JKze7b7np3iB8kjgBRsvXc4X5lQ4/edit?usp=sharing',
      formId: null,
      formUrl: null
    },
    routingConfig: defaultRoutingConfig()
  };

  const resources = activeClient.resources;
  const routingConfig = activeClient.routingConfig;

  const handleResourcesChange = (newResources: WorkspaceResources | ((prev: WorkspaceResources) => WorkspaceResources)) => {
    setClients(prev => prev.map(c => {
      if (c.id === activeClientId) {
        const resolved = typeof newResources === 'function' ? newResources(c.resources) : newResources;
        return { ...c, resources: resolved };
      }
      return c;
    }));
  };

  const handleRoutingConfigChange = (newRoutingConfig: RoutingConfiguration | ((prev: RoutingConfiguration) => RoutingConfiguration)) => {
    setClients(prev => prev.map(c => {
      if (c.id === activeClientId) {
        const resolved = typeof newRoutingConfig === 'function' ? newRoutingConfig(c.routingConfig) : newRoutingConfig;
        return { 
          ...c, 
          routingConfig: resolved,
          logoUrl: resolved.companyLogoUrl !== undefined && resolved.companyLogoUrl !== '' ? resolved.companyLogoUrl : c.logoUrl
        };
      }
      return c;
    }));
  };

  const handleUpdateLogo = (logoUrl: string) => {
    setClients(prev => prev.map(c => c.id === activeClientId ? {
      ...c,
      logoUrl,
      routingConfig: { ...c.routingConfig, companyLogoUrl: logoUrl }
    } : c));
  };

  const handleUpdateHeader = (updates: { portalTitle?: string; portalSubtitle?: string; logoUrl?: string }) => {
    setClients(prev => prev.map(c => c.id === activeClientId ? {
      ...c,
      ...updates,
      ...(updates.logoUrl !== undefined ? { routingConfig: { ...c.routingConfig, companyLogoUrl: updates.logoUrl } } : {})
    } : c));
  };

  const handleAddClient = () => {
    const nextNum = clients.length + 1;
    const newId = `client_${Date.now()}`;
    const newClientName = `Client ${nextNum}`;
    const newClient: Client = {
      id: newId,
      name: newClientName,
      resources: {
        spreadsheetId: null,
        spreadsheetUrl: null,
        formId: null,
        formUrl: null
      },
      routingConfig: defaultRoutingConfig()
    };
    
    newClient.routingConfig.excellentBody = newClient.routingConfig.excellentBody.replace(/M&K Customer Team/g, `${newClientName} Support Team`);
    newClient.routingConfig.goodBody = newClient.routingConfig.goodBody.replace(/M&K Customer Team/g, `${newClientName} Support Team`);

    setClients(prev => [...prev, newClient]);
    setActiveClientId(newId);
  };

  const startEditing = (client: Client) => {
    setEditingClientId(client.id);
    setEditingNameValue(client.name);
  };

  const saveEditing = () => {
    if (editingNameValue.trim()) {
      setClients(prev => prev.map(c => c.id === editingClientId ? { ...c, name: editingNameValue.trim() } : c));
    }
    setEditingClientId(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEditing();
    } else if (e.key === 'Escape') {
      setEditingClientId(null);
    }
  };

  const handleDeleteClient = (clientId: string, clientName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (clients.length <= 1) {
      alert("You must have at least one client.");
      return;
    }
    const confirmDelete = window.confirm(`Are you sure you want to delete "${clientName}"? This will permanently delete its custom configuration.`);
    if (confirmDelete) {
      const remainingClients = clients.filter(c => c.id !== clientId);
      setClients(remainingClients);
      if (activeClientId === clientId) {
        setActiveClientId(remainingClients[0].id);
      }
    }
  };

  // Keep state synchronized with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('g_active_tab', activeTab);
    } catch (e) {
      console.warn(e);
    }
  }, [activeTab]);

  useEffect(() => {
    try {
      localStorage.setItem('g_clients', JSON.stringify(clients));
    } catch (e) {
      console.warn(e);
    }
  }, [clients]);

  useEffect(() => {
    try {
      localStorage.setItem('g_active_client_id', activeClientId);
    } catch (e) {
      console.warn(e);
    }
  }, [activeClientId]);

  useEffect(() => {
    try {
      localStorage.setItem('g_resources', JSON.stringify(resources));
    } catch (e) {
      console.warn(e);
    }
  }, [resources]);

  useEffect(() => {
    try {
      localStorage.setItem('g_routing_config', JSON.stringify(routingConfig));
    } catch (e) {
      console.warn(e);
    }
  }, [routingConfig]);

  useEffect(() => {
    // Listen for Firebase auth state and parse cached tokens if user is already signed in
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        if (accessToken) {
          setToken(accessToken);
        }
        setClients((prev) => prev.map(c => {
          const updatedConfig = { ...c.routingConfig };
          if (!updatedConfig.supportEmail || updatedConfig.supportEmail === 'support@yourcompany.com') {
            updatedConfig.supportEmail = currentUser.email || 'support@yourcompany.com';
          }
          return { ...c, routingConfig: updatedConfig };
        }));
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async (includeGmb: boolean = false) => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn(includeGmb);
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setClients((prev) => prev.map(c => {
          const updatedConfig = { ...c.routingConfig };
          if (!updatedConfig.supportEmail || updatedConfig.supportEmail === 'support@yourcompany.com') {
            updatedConfig.supportEmail = result.user.email || 'support@yourcompany.com';
          }
          return { ...c, routingConfig: updatedConfig };
        }));
      }
    } catch (err: any) {
      console.error('Google authorization error:', err);
      if (err?.code === 'auth/popup-blocked' || err?.message?.includes('popup')) {
        setAuthError('OAuth Popup blocked by browser policy. To resolve, click the "Open in New Tab" link below, or enable popups for this site in your browser search/address bar.');
      } else {
        setAuthError(err?.message || 'Failed to authenticate Google Account.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setAuthError(null);
    handleResourcesChange({
      spreadsheetId: '1NFtZc8tbp3DCOT4JKze7b7np3iB8kjgBRsvXc4X5lQ4',
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1NFtZc8tbp3DCOT4JKze7b7np3iB8kjgBRsvXc4X5lQ4/edit?usp=sharing',
      formId: null,
      formUrl: null
    });
    try {
      localStorage.removeItem('g_resources');
      localStorage.removeItem('g_routing_config');
      localStorage.removeItem('g_active_tab');
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <div className={`min-h-screen text-slate-800 font-sans tracking-normal selection:bg-slate-200 ${getPublishedState() ? 'bg-slate-50 flex flex-col justify-center py-8 sm:py-12' : 'bg-[#222222] bg-black/50 text-slate-100'}`}>
      
      {/* Main Header Container */}
      {!getPublishedState() && (
        <header className="bg-[#222222] bg-black/50 backdrop-blur-md border-b border-zinc-700/60 sticky top-0 z-40 shadow-md py-3 text-zinc-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              
              {/* Left Logo / Title & Client Workspace Selector */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Client Workspace Selector */}
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none shrink-0">
                  {clients.map((client) => {
                    const isActive = client.id === activeClientId;
                    const isEditing = client.id === editingClientId;
                    const clientAppUrl = client.appUrl || 'https://mandk-app.ai.studio';
                    return (
                      <div
                        key={client.id}
                        onClick={() => {
                          if (!isEditing) {
                            if (!isActive) {
                              setActiveClientId(client.id);
                            } else {
                              window.open(clientAppUrl, '_blank', 'noopener,noreferrer');
                            }
                          }
                        }}
                        className={`group relative flex items-center gap-2.5 px-3 py-1 rounded-full font-bold transition-all duration-150 select-none ${
                          isActive
                            ? 'text-zinc-100 text-xl sm:text-2xl font-extrabold bg-zinc-800/40 hover:bg-zinc-800/70 cursor-pointer'
                            : 'text-zinc-400 hover:text-zinc-200 text-lg cursor-pointer'
                        }`}
                        title={isActive ? `Click to open ${clientAppUrl} in a new tab` : `Switch to ${client.name}`}
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingNameValue}
                            onChange={(e) => setEditingNameValue(e.target.value)}
                            onBlur={saveEditing}
                            onKeyDown={handleKeyPress}
                            autoFocus
                            className="bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-full px-3 py-1 text-xl w-48 outline-none font-sans font-bold shadow-xs focus:ring-1 focus:ring-zinc-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="flex items-center gap-2">
                            {client.id === 'mandk' && <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 fill-yellow-400 shrink-0" />}
                            <span className="truncate max-w-[240px]">{client.name}</span>
                            <a
                              href={clientAppUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 hover:bg-zinc-700/80 rounded-full text-zinc-400 hover:text-yellow-400 transition-colors shrink-0 inline-flex items-center"
                              title={`Open ${clientAppUrl} in a new tab`}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </span>
                        )}

                        {!isEditing && isActive && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(client);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-800/80 rounded-full text-zinc-400 hover:text-zinc-100 transition-opacity shrink-0 ml-0.5"
                            title="Rename Workspace"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}

                        {clients.length > 1 && (
                          <button
                            onClick={(e) => handleDeleteClient(client.id, client.name, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-950/50 rounded-full text-zinc-400 hover:text-red-400 transition-opacity shrink-0 ml-0.5"
                            title="Delete Workspace"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  <button
                    onClick={handleAddClient}
                    className="w-8 h-8 rounded-full hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-90 shrink-0 ml-1"
                    title="Add New Workspace"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Right Side: Google Integration */}
              <div className="flex items-center gap-2.5 shrink-0">
                {/* Google Connection Pill */}
                {user && token && (
                  <div className="flex items-center gap-2.5 px-2 py-1.5 text-zinc-200 text-xs font-semibold select-none" id="top-nav-connector-id">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-zinc-700 text-zinc-200 flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                        {(user.displayName || user.email || 'G').charAt(0)}
                      </div>
                    )}
                    <div className="flex flex-col text-left">
                      <span className="truncate max-w-[140px] font-bold text-zinc-100 text-xs leading-none">
                        {user.displayName || 'Google User'}
                      </span>
                      {user.email && (
                        <span className="truncate max-w-[140px] text-[10px] text-zinc-400 font-normal leading-none mt-0.5">
                          {user.email}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="ml-1.5 px-2 py-0.5 text-[10px] font-bold text-zinc-300 hover:text-amber-300 rounded-full transition-all cursor-pointer shrink-0 active:scale-95"
                      title="Disconnect Account"
                      id="top-nav-disconnect-btn"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Row 2: Navigation Tabs */}
            <div className="flex items-center justify-start mt-2.5">
              {/* Navigation Tabs in Header */}
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none max-w-full shrink-0">
                <button
                  onClick={() => {
                    setForceLivePreview(false);
                    try { localStorage.setItem('g_force_live_preview', 'false'); } catch {}
                    setActiveTab('sandbox');
                  }}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-full flex items-center gap-2 transition-all duration-150 select-none cursor-pointer shrink-0 ${
                    activeTab === 'sandbox' && !forceLivePreview
                      ? 'text-white font-bold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                  id="tab-sandbox"
                >
                  <span>{t('tab.sandbox', 'Input Simulator')}</span>
                </button>

                <button
                  onClick={() => {
                    setForceLivePreview(false);
                    try { localStorage.setItem('g_force_live_preview', 'false'); } catch {}
                    setActiveTab('blueprint');
                  }}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-full flex items-center gap-2 transition-all duration-150 select-none cursor-pointer shrink-0 ${
                    activeTab === 'blueprint'
                      ? 'text-white font-bold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                  id="tab-blueprint"
                >
                  <span>Google Sheet</span>
                </button>

                <button
                  onClick={() => {
                    setForceLivePreview(false);
                    try { localStorage.setItem('g_force_live_preview', 'false'); } catch {}
                    setActiveTab('logic');
                  }}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-full flex items-center gap-2 transition-all duration-150 select-none cursor-pointer shrink-0 ${
                    activeTab === 'logic'
                      ? 'text-white font-bold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                  id="tab-logic-parameters"
                >
                  <span>Logic Parameters</span>
                </button>

                <button
                  onClick={() => {
                    setForceLivePreview(false);
                    try { localStorage.setItem('g_force_live_preview', 'false'); } catch {}
                    setActiveTab('qr');
                  }}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-full flex items-center gap-2 transition-all duration-150 select-none cursor-pointer shrink-0 ${
                    activeTab === 'qr'
                      ? 'text-white font-bold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                  id="tab-qr"
                >
                  <span>{t('tab.qr', 'QR Code')}</span>
                </button>

                <button
                  onClick={() => {
                    setForceLivePreview(false);
                    try { localStorage.setItem('g_force_live_preview', 'false'); } catch {}
                    setActiveTab('social');
                  }}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-full flex items-center gap-2 transition-all duration-150 select-none cursor-pointer shrink-0 ${
                    activeTab === 'social'
                      ? 'text-white font-bold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                  id="tab-social"
                >
                  <span>{t('tab.social', 'Social Share')}</span>
                </button>
              </div>
            </div>

          </div>
        </header>
      )}

      {/* Main Dynamic Workflow Interface */}
      <main className={`${getPublishedState() ? 'max-w-2xl mt-4 sm:mt-8 pb-8' : 'max-w-7xl mt-6 sm:mt-10 pt-4 sm:pt-8 pb-20'} mx-auto px-4 sm:px-6 lg:px-8`}>

        {/* Dynamic Tab Panes */}
        <div>
          {activeTab === 'blueprint' && (
            <SheetAndScriptTab
              user={user}
              token={token}
              resources={resources}
              onResourcesChange={handleResourcesChange}
              onLogin={handleLogin}
              onLogout={handleLogout}
              isLoggingIn={isLoggingIn}
              authError={authError}
              reviews={reviews}
              onClearReviews={handleClearReviews}
              activeClientId={activeClientId}
              routingConfig={routingConfig}
              onConfigChange={handleRoutingConfigChange}
            />
          )}

          {activeTab === 'logic' && (
            <LogicParametersTab
              routingConfig={routingConfig}
              onConfigChange={handleRoutingConfigChange}
              onNavigateToScript={() => setActiveTab('blueprint')}
              onNavigateToSandbox={() => setActiveTab('sandbox')}
            />
          )}

          {activeTab === 'dashboard' && (
            <ReviewsDashboard
              reviews={reviews}
              onClearReviews={handleClearReviews}
              onSeedDemoData={handleSeedDemoReviews}
              activeClientId={activeClientId}
              clients={clients}
              user={user}
              token={token}
              onLogin={handleLogin}
              onImportReviews={handleImportGmbReviews}
            />
          )}

          {activeTab === 'sandbox' && (
            <PipelineSandbox
              token={token}
              resources={resources}
              routingConfig={routingConfig}
              onLogin={handleLogin}
              isLoggingIn={isLoggingIn}
              user={user}
              onLogout={handleLogout}
              isLivePreview={getPublishedState()}
              authError={authError}
              onAddReview={handleAddReview}
              activeClient={activeClient}
              onUpdateLogo={handleUpdateLogo}
              onUpdateHeader={handleUpdateHeader}
            />
          )}

          {activeTab === 'qr' && (
            <QRCodeTab
              activeClientName={activeClient.name}
              activeClientId={activeClient.id}
            />
          )}

          {activeTab === 'social' && (
            <SocialShareTab
              activeClientName={activeClient.name}
              activeClientId={activeClient.id}
            />
          )}

          {activeTab === 'gmb-verify' && (
            <GmbConnectionVerifier
              user={user}
              token={token}
              onLogin={handleLogin}
              onImportReviews={handleImportGmbReviews}
              activeClientId={activeClientId}
              activeClientName={activeClient.name}
            />
          )}
        </div>
      </main>

      {/* Return to Designer floating hub (Only visible when simulating Customer View in Dev mode) */}
      {!isPublished() && forceLivePreview && (
        <div className="fixed top-3 right-3 z-50">
          <button
            onClick={() => {
              setForceLivePreview(false);
              try {
                localStorage.setItem('g_force_live_preview', 'false');
              } catch (e) {
                console.warn(e);
              }
            }}
            title="Return to Designer"
            className="w-10 h-10 rounded-full bg-slate-900/95 hover:bg-slate-950 border border-slate-800 text-white shadow-xl backdrop-blur-md flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer hover:border-slate-700"
          >
            <Wrench className="w-4.5 h-4.5 text-white stroke-[2.5]" />
          </button>
        </div>
      )}
    </div>
  );
}
