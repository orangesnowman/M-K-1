import React, { useState, useMemo, useEffect } from 'react';
import { FormConfig, RoutingConfiguration, WorkspaceResources, ReviewRecord, Client } from '../types';
import { sendGmailEmail, appendFeedbackToSheet } from '../services/googleWorkspace';
import mkLogo from '../assets/images/mk_logo_1781902335896.jpg';
import pixelRobotHeart from '../assets/images/pixel_robot_heart_1783882654344.jpg';
import {
  Inbox,
  Play,
  Mail,
  Table,
  CheckCircle,
  Check,
  AlertOctagon,
  ArrowRight,
  TrendingDown,
  User,
  Star,
  CheckSquare,
  Sparkles,
  Info,
  Copy,
  ExternalLink,
  Facebook,
  Share2,
  Search,
  Edit2,
  Image as ImageIcon,
  Link as LinkIcon,
  X,
  RotateCcw,
  Settings
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

// Dynamic suggested comments based on numeric star ratings to inspire users and test different branch routes
const RATING_SUGGESTIONS: Record<number, string[]> = {
  5: [
    "🛠️ M&K Auto Parts saved me lots of money by sourcing a premium used transmission from their yard and installing it for a fraction of what the dealership quoted.",
    "⚡ They fixed my car for literally half the price my regular mechanic quoted because they have all the parts right on-site.",
    "🔍 Their ASE-certified mechanics quickly diagnosed an electrical issue that two other local shops completely missed.",
    "🌍 They tracked down a rare engine component for me in less than 24 hours using their incredible nationwide parts-locating service."
  ],
  4: [
    "📦 After checking yards all over Florida, M&K was the only place that had the exact matching truck door panel I needed in stock.",
    "🤝 The mechanics here are incredibly trustworthy, explaining my brake issue clearly without trying to upsell me on unnecessary repairs.",
    "🚗 They hooked me up with a used tire that looked brand new and had me safely back on the road in under 45 minutes.",
    "⏱️ I dropped my car off in the morning and they sourced the rotors and finished my brake repair before lunch."
  ],
  3: [
    "💰 They gave me a fair cash offer over the phone for my old sedan and picked it up with a free tow truck the same afternoon.",
    "🚛 M&K made getting rid of my scrap car completely hassle-free by handling all the paperwork and providing fast, free towing.",
    "🔧 Found the part I needed, though it took a little longer to locate in the inventory tracker than expected."
  ],
  2: [
    "⚠️ Sourced the brake calipers okay, but the service queue was backed up and it took much longer than initially promised.",
    "🔧 Yard carries a huge collection, but the website's listed inventory status wasn't fully up-to-date with actual stock."
  ],
  1: [
    "🚨 Quoted one price on the phone, but when they arrived with the tow truck, they tried to pay less for my scrap car.",
    "❌ Part was labeled as tested and working, but was dead on arrival when my mechanic opened the box."
  ]
};

const isPublished = () => {
  try {
    const hostname = window.location.hostname;
    return hostname.includes('-pre-') || (!hostname.includes('-dev-') && hostname !== 'localhost' && hostname !== '127.0.0.1');
  } catch {
    return false;
  }
};

interface PipelineSandboxProps {
  token: string | null;
  resources: WorkspaceResources;
  routingConfig: RoutingConfiguration;
  onLogin?: () => void;
  isLoggingIn?: boolean;
  user?: any;
  onLogout?: () => void;
  isLivePreview?: boolean;
  authError?: string | null;
  onAddReview?: (review: Omit<ReviewRecord, 'id' | 'timestamp'>) => void;
  activeClient?: Client;
  onUpdateLogo?: (logoUrl: string) => void;
  onUpdateHeader?: (updates: { portalTitle?: string; portalSubtitle?: string; logoUrl?: string }) => void;
}

export default function PipelineSandbox({ 
  token, 
  resources, 
  routingConfig,
  onLogin,
  isLoggingIn,
  user,
  onLogout,
  isLivePreview = false,
  authError,
  onAddReview,
  activeClient,
  onUpdateLogo,
  onUpdateHeader
}: PipelineSandboxProps) {
  const { t, isSpanish, language, getRatingSuggestions } = useLanguage();
  const isCurrentlyPublished = isLivePreview || isPublished();
  const client: Client = activeClient || {
    id: 'mandk',
    name: 'M&K Auto Parts',
    resources,
    routingConfig
  };

  // Header Editing States (Title, Subtitle, Logo)
  const [isEditingLogo, setIsEditingLogo] = useState(false);
  const [isEditingTitleInline, setIsEditingTitleInline] = useState(false);
  const [inlineTitleInput, setInlineTitleInput] = useState('');

  const [isEditingSubtitleInline, setIsEditingSubtitleInline] = useState(false);
  const [inlineSubtitleInput, setInlineSubtitleInput] = useState('');

  const [isEditingHeaderModal, setIsEditingHeaderModal] = useState(false);
  const [modalTitleInput, setModalTitleInput] = useState('');
  const [modalSubtitleInput, setModalSubtitleInput] = useState('');
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [logoImageError, setLogoImageError] = useState(false);

  const currentTitle = client.portalTitle || (client.id === 'mandk' ? t('sandbox.title', 'Customer Feedback') : client.name);
  const currentSubtitle = client.portalSubtitle || (client.id === 'mandk' ? t('sandbox.subtitle', 'We value your experience!') : t('sandbox.subtitleAlt', 'We value your feedback!'));

  const handleSaveInlineTitle = () => {
    const val = inlineTitleInput.trim() || currentTitle;
    if (onUpdateHeader) {
      onUpdateHeader({ portalTitle: val });
    }
    setIsEditingTitleInline(false);
  };

  const handleSaveInlineSubtitle = () => {
    const val = inlineSubtitleInput.trim() || currentSubtitle;
    if (onUpdateHeader) {
      onUpdateHeader({ portalSubtitle: val });
    }
    setIsEditingSubtitleInline(false);
  };

  const handleOpenHeaderModal = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setModalTitleInput(currentTitle);
    setModalSubtitleInput(currentSubtitle);
    setLogoUrlInput(client.logoUrl || (client.id === 'mandk' ? mkLogo : ''));
    setLogoImageError(false);
    setIsEditingHeaderModal(true);
  };

  const handleSaveHeaderModal = () => {
    if (onUpdateHeader) {
      onUpdateHeader({
        portalTitle: modalTitleInput.trim() || currentTitle,
        portalSubtitle: modalSubtitleInput.trim() || currentSubtitle,
        logoUrl: logoUrlInput.trim()
      });
    } else if (onUpdateLogo) {
      onUpdateLogo(logoUrlInput.trim());
    }
    setIsEditingHeaderModal(false);
  };

  const renderPublishedHeader = () => {
    const displayLogo = client.logoUrl || (client.id === 'mandk' ? mkLogo : null);

    return (
      <div className="flex flex-row items-center gap-4 pb-2 mb-4 group/header-container relative" id="sandbox-card-header">
        {/* Brand Logo Container with Hover Edit Trigger */}
        <div className="relative group/logo-container shrink-0">
          <button
            onClick={handleOpenHeaderModal}
            className="group relative cursor-pointer block rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            title="Click to edit logo, title & subtitle"
            type="button"
          >
            {displayLogo ? (
              <div className="shrink-0 select-none bg-white overflow-hidden h-16 w-16 sm:h-20 sm:w-20 flex items-center justify-center relative rounded-xl border border-slate-100 shadow-2xs">
                <img
                  src={displayLogo}
                  alt={`${client.name} Logo`}
                  className="max-h-full max-w-full object-contain transform-gpu mix-blend-multiply"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="shrink-0 select-none bg-red-650 p-0 m-0 overflow-hidden h-16 w-16 sm:h-20 sm:w-20 flex items-center justify-center rounded-xl text-white shadow-xs">
                <span className="text-lg sm:text-xl font-black tracking-wider">
                  {client.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}

            {/* Hover Edit Overlay Badge */}
            <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-1 backdrop-blur-xs">
              <Edit2 className="w-4 h-4 text-yellow-400 mb-0.5" />
              <span className="text-[10px] font-bold tracking-tight uppercase">Edit Logo</span>
            </div>
          </button>
        </div>

        {/* Title & Subtitle */}
        <div className="flex-1 text-left min-w-0">
          {/* Title row */}
          {isEditingTitleInline ? (
            <div className="flex items-center gap-1.5 mb-1">
              <input
                type="text"
                value={inlineTitleInput}
                onChange={(e) => setInlineTitleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveInlineTitle();
                  if (e.key === 'Escape') setIsEditingTitleInline(false);
                }}
                className="text-[1.1rem] sm:text-[1.25rem] font-bold px-2 py-1 bg-white border-2 border-red-500 rounded-lg text-zinc-900 focus:outline-none w-full shadow-2xs"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveInlineTitle}
                className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer shrink-0"
                title="Save Title"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsEditingTitleInline(false)}
                className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors cursor-pointer shrink-0"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="group/title relative inline-flex items-center gap-2 max-w-full">
              <h1
                onClick={() => {
                  setInlineTitleInput(currentTitle);
                  setIsEditingTitleInline(true);
                }}
                className={`text-[1.2rem] sm:text-[1.35rem] font-bold tracking-[0.02em] leading-none cursor-pointer hover:opacity-85 transition-all rounded px-1 -ml-1 hover:bg-red-50/80 ${
                  client.id === 'mandk' ? 'text-[#dc2626]' : 'text-red-650'
                }`}
                title="Click to edit title inline"
              >
                {currentTitle}
              </h1>
              <button
                type="button"
                onClick={() => {
                  setInlineTitleInput(currentTitle);
                  setIsEditingTitleInline(true);
                }}
                className="opacity-0 group-hover/title:opacity-100 transition-opacity p-1 text-slate-400 hover:text-red-600 cursor-pointer rounded hover:bg-red-50"
                title="Edit Title inline"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Subtitle row */}
          {isEditingSubtitleInline ? (
            <div className="flex items-center gap-1.5 mt-1">
              <input
                type="text"
                value={inlineSubtitleInput}
                onChange={(e) => setInlineSubtitleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveInlineSubtitle();
                  if (e.key === 'Escape') setIsEditingSubtitleInline(false);
                }}
                className="text-[0.85rem] sm:text-[0.9rem] font-semibold px-2 py-1 bg-white border-2 border-red-500 rounded-lg text-zinc-900 focus:outline-none w-full shadow-2xs"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveInlineSubtitle}
                className="p-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer shrink-0"
                title="Save Subtitle"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsEditingSubtitleInline(false)}
                className="p-1 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors cursor-pointer shrink-0"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="group/subtitle relative flex items-center gap-1.5 mt-1.5 max-w-full">
              <p
                onClick={() => {
                  setInlineSubtitleInput(currentSubtitle);
                  setIsEditingSubtitleInline(true);
                }}
                className={`text-[0.85rem] sm:text-[0.9rem] leading-none font-semibold cursor-pointer hover:opacity-85 transition-all rounded px-1 -ml-1 hover:bg-red-50/80 ${
                  client.id === 'mandk' ? 'text-[#dc2626]' : 'text-red-650'
                }`}
                title="Click to edit subtitle inline"
              >
                {currentSubtitle}
              </p>
              <button
                type="button"
                onClick={() => {
                  setInlineSubtitleInput(currentSubtitle);
                  setIsEditingSubtitleInline(true);
                }}
                className="opacity-0 group-hover/subtitle:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-red-600 cursor-pointer rounded hover:bg-red-50"
                title="Edit Subtitle inline"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Quick Edit Header Settings Button */}
        <button
          type="button"
          onClick={handleOpenHeaderModal}
          className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer shrink-0"
          title="Edit Header & Branding (Logo, Title, Subtitle)"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    );
  };

  // Shuffle array helper
  const shuffleArray = (array: string[]) => {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  // Generate randomized suggestions for the current session to ensure unique layout & selections
  const randomizedSuggestions = useMemo(() => {
    const result: Record<number, string[]> = {};
    [1, 2, 3, 4, 5].forEach((numKey) => {
      result[numKey] = shuffleArray(getRatingSuggestions(numKey));
    });
    return result;
  }, [language]);

  const [formData, setFormData] = useState<FormConfig>(() => {
    const initialRating = 5;

    return {
      name: user?.displayName || '',
      email: user?.email || '',
      rating: initialRating,
      comments: ''
    };
  });

  // Sync state with Google Auth user to autofill Name and Email instantly
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.displayName || prev.name,
        email: user.email || prev.email,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        name: '',
        email: '',
      }));
    }
  }, [user]);

  const [processedRoute, setProcessedRoute] = useState<string | null>(null);
  const [emailPreviewSubject, setEmailPreviewSubject] = useState('');
  const [emailPreviewBody, setEmailPreviewBody] = useState('');
  const [supportAlertTriggered, setSupportAlertTriggered] = useState(false);
  
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetSuccess, setSheetSuccess] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [sheetEnabled, setSheetEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);
  const [autoSubmitLogs, setAutoSubmitLogs] = useState<string[]>([]);
  const [hasSubmittedAuto, setHasSubmittedAuto] = useState(false);
  const [visitedPlatforms, setVisitedPlatforms] = useState<string[]>([]);
  const [hasFinishedSharing, setHasFinishedSharing] = useState(false);

  // Custom modal states to avoid iframe-hostile native dialog blocks
  const [showSheetConfirm, setShowSheetConfirm] = useState(false);
  const [showGmailModal, setShowGmailModal] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [sendEscalationAlert, setSendEscalationAlert] = useState(false);
  const [gmailModalError, setGmailModalError] = useState<string | null>(null);

  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
  const [showCopiedNotification, setShowCopiedNotification] = useState(false);
  const [showAiCopiedBanner, setShowAiCopiedBanner] = useState(false);

  const [fixTogether, setFixTogether] = useState(true);
  const [showUgcNotice, setShowUgcNotice] = useState(false);
  const [showPolishInfo, setShowPolishInfo] = useState(false);

  // Enabled platforms based on settings
  const enabledPlatforms = useMemo(() => {
    const list: { name: string; url: string; color: string; hoverColor: string }[] = [];
    if (routingConfig.facebookEnabled && routingConfig.facebookUrl) {
      list.push({ 
        name: 'Facebook', 
        url: routingConfig.facebookUrl, 
        color: 'bg-[#1877f2]', 
        hoverColor: 'hover:bg-[#115bc5]' 
      });
    }
    if (routingConfig.yelpEnabled && routingConfig.yelpUrl) {
      list.push({ 
        name: 'Yelp', 
        url: routingConfig.yelpUrl, 
        color: 'bg-[#d32323]', 
        hoverColor: 'hover:bg-[#b01d1d]' 
      });
    }
    if (routingConfig.bbbEnabled && routingConfig.bbbUrl) {
      list.push({ 
        name: 'BBB', 
        url: routingConfig.bbbUrl, 
        color: 'bg-[#005187]', 
        hoverColor: 'hover:bg-[#003d66]' 
      });
    }
    return list;
  }, [routingConfig]);

  // Remaining platforms to share on
  const remainingPlatforms = useMemo(() => {
    return enabledPlatforms.filter(p => !visitedPlatforms.includes(p.name));
  }, [enabledPlatforms, visitedPlatforms]);

  const handleSharePlatformClick = (platform: { name: string; url: string }) => {
    try {
      const win = window.open(platform.url, '_blank');
      if (win) {
        win.focus();
      }
    } catch (e) {
      console.warn("Popup blocked by browser:", e);
    }
    setVisitedPlatforms(prev => [...prev, platform.name]);
  };

  const getEffectiveComments = () => {
    const threshold = routingConfig.starThreshold ?? 3;
    if (formData.rating <= threshold && fixTogether) {
      if (formData.comments && formData.comments.trim()) {
        return `${formData.comments.trim()}\n\nLet's try to fix this together`;
      }
      return "";
    }
    return formData.comments;
  };

  const copyTextToClipboard = (text: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      console.warn("execCommand copy failed, falling back to navigator.clipboard:", err);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(e => console.warn(e));
        return true;
      }
      return false;
    }
  };

  const handleCopyComments = () => {
    if (!formData.comments) return;
    copyTextToClipboard(formData.comments);
    setShowCopiedNotification(true);
    setTimeout(() => setShowCopiedNotification(false), 4400);
  };

  const formatExceptionMessage = (err: any) => {
    const msg = String(err.message || err);
    const lower = msg.toLowerCase();
    if (
      lower.includes('authentication') ||
      lower.includes('credential') ||
      lower.includes('oauth') ||
      lower.includes('unauthorized') ||
      lower.includes('token') ||
      msg.includes('401')
    ) {
      return `${msg}. 💡 Help: Google Authorization is expired, missing, or needs fresh permissions! Click "Re-authorize Google" or "Connect Google Account" to refresh your token and accept permissions.`;
    }
    if (
      lower.includes('403') ||
      lower.includes('permission') ||
      lower.includes('forbidden')
    ) {
      return `${msg}. 💡 Help: You do not have edit permissions for this spreadsheet. If you are using the default template sheet, please click on the "Sheet Feedback" tab and click "Deploy Workflow" or "Re-authorize & Setup" to automatically provision a brand-new personal spreadsheet inside your own Google Drive!`;
    }
    return msg;
  };

  const handleGenerateSeoSuggestion = async () => {
    setIsGeneratingSeo(true);
    setFeedbackError(null);
    setShowCopiedNotification(false);
    try {
      const response = await fetch('/api/suggest-seo-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          rating: formData.rating,
          currentComments: formData.comments,
          language: language
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate SEO review suggestion.');
      }

      if (data.suggestion) {
        setFormData((prev) => ({
          ...prev,
          comments: data.suggestion,
        }));
        setValidationError(null);
        
        // The text is placed into the form field, and the user can copy/submit it with a clear single click
        setShowCopiedNotification(false);

        // Copy the newly generated AI suggestion directly to clipboard & display under "Click again..."
        copyTextToClipboard(data.suggestion);
        setShowAiCopiedBanner(true);
      }
    } catch (err: any) {
      console.error(err);
      setFeedbackError(err.message || 'Error occurred while contacting Gemini AI.');
    } finally {
      setIsGeneratingSeo(false);
    }
  };

  // Parse Subject string with name/comments replacements (keeps emoji stars intact for rendering)
  const parseSubject = (template: string, rating: number) => {
    const firstName = formData.name ? formData.name.trim().split(/\s+/)[0] : '';
    return template
      .replace(/\${name}/g, firstName)
      .replace(/\${comments}/g, getEffectiveComments() || '(No comments provided)')
      .replace(/\${rating}/g, `${rating} Star${rating > 1 ? 's' : ''}`)
      .replace(/\${googleReviewsUrl}/g, routingConfig.googleReviewsUrl || 'https://g.page/r/CajrrF4R_V20EAI/review');
  };

  // Parse HTML Body with name/comments replacements
  const parseBody = (template: string, rating: number) => {
    const firstName = formData.name ? formData.name.trim().split(/\s+/)[0] : '';
    const yellowStarSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: -3px; margin-right: 4px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;

    const formattedSignature = (routingConfig.businessSignature || 'Warmest regards,\nThe M&K Customer Team')
      .trim()
      .replace(/\n/g, '<br/>');

    let parsed = template
      .replace(/(🌟|⭐)/g, yellowStarSvg)
      .replace(/\${name}/g, firstName)
      .replace(/\${comments}/g, getEffectiveComments() || '(No comments provided)')
      .replace(/\${rating}/g, `${rating} Star${rating > 1 ? 's' : ''}`)
      .replace(/\${googleReviewsUrl}/g, routingConfig.googleReviewsUrl || 'https://g.page/r/CajrrF4R_V20EAI/review')
      .replace(/\${signature}/g, formattedSignature);

    // Transform font family, font size, line height and clean up borders
    parsed = parsed
      .replace(/font-family:\s*[^;]+;?/gi, 'font-family: "Times New Roman", Times, serif;')
      .replace(/line-height:\s*[^;]+;?/gi, 'line-height: 25px;')
      .replace(/font-size:\s*(13px|14px);?/gi, 'font-size: 17px;')
      .replace(/border:\s*[^;]+;?/gi, 'border: none;')
      .replace(/border-top:\s*[^;]+;?/gi, '')
      .replace(/<hr[^>]*\/?>/gi, '')
      .replace(/background:\s*#(fef2f2|fffbeb|f3f4f6);?/gi, 'background: #ffffff;')
      .replace(/border-left:\s*4px solid [^;]+;?/gi, '')
      .replace(/color:\s*#(7f1d1d|991b1b|78350f|111827|5c3d2e);?/gi, 'color: #000000; font-weight: bold; font-style: italic;')
      .replace(/color:\s*#dc2626;?/gi, 'color: #000000;')
      .replace(/color:\s*#64748b;?/gi, 'color: #000000;');

    return parsed;
  };

  const renderSubjectWithYellowStars = (text: string) => {
    const parts = text.split(/(⭐|🌟)/);
    return parts.map((part, idx) => {
      if (part === '⭐' || part === '🌟') {
        return (
          <Star
            key={idx}
            className="w-4 h-4 text-amber-400 fill-amber-400 inline-block align-text-bottom ml-1 shrink-0"
          />
        );
      }
      return part;
    });
  };

  // Keep the simulated mailbox routing and email preview updated in real-time as the developer alters form inputs!
  useEffect(() => {
    let subject = '';
    let body = '';
    let route = '';
    let alertSupport = false;

    const threshold = routingConfig.starThreshold ?? 3;
    const isPositive = formData.rating > threshold;

    if (isPositive) {
      if (formData.rating === 5) {
        route = 'Excellent (5-Star Branch)';
        subject = parseSubject(routingConfig.excellentSubject, 5);
        body = parseBody(routingConfig.excellentBody, 5);
      } else if (formData.rating === 4) {
        route = 'Very Good (4-Star Branch)';
        subject = parseSubject(routingConfig.goodSubject, 4);
        body = parseBody(routingConfig.goodBody, 4);
      } else {
        route = 'Neutral (3-Star Branch)';
        subject = parseSubject(routingConfig.neutralSubject, 3);
        body = parseBody(routingConfig.neutralBody, 3);
      }
    } else {
      route = `Direct Feedback / Escalation Branch (${formData.rating} Stars)`;
      subject = parseSubject(routingConfig.poorSubject, formData.rating);
      body = parseBody(routingConfig.poorBody, formData.rating);
      alertSupport = true;
    }

    setProcessedRoute(route);
    setEmailPreviewSubject(subject);
    setEmailPreviewBody(body);
    setSupportAlertTriggered(alertSupport);
  }, [formData.rating, formData.comments, formData.name, formData.email, routingConfig, fixTogether]);

  const handleSimulateRouting = () => {
    setSheetSuccess(false);
    setEmailSuccess(false);
    setFeedbackError(null);
  };

  const handleAutoSubmit = async () => {
    setIsAutoSubmitting(true);
    setHasSubmittedAuto(true);
    setAutoSubmitLogs([]);
    setFeedbackError(null);

    // 1. Calculate routes and email bodies first
    let subject = '';
    let body = '';
    let route = '';
    let alertSupport = false;

    const threshold = routingConfig.starThreshold ?? 3;
    const isPositive = formData.rating > threshold;

    if (isPositive) {
      if (formData.rating === 5) {
        route = 'Excellent (5-Star Branch)';
        subject = parseSubject(routingConfig.excellentSubject, 5);
        body = parseBody(routingConfig.excellentBody, 5);
      } else if (formData.rating === 4) {
        route = 'Very Good (4-Star Branch)';
        subject = parseSubject(routingConfig.goodSubject, 4);
        body = parseBody(routingConfig.goodBody, 4);
      } else {
        route = 'Neutral (3-Star Branch)';
        subject = parseSubject(routingConfig.neutralSubject, 3);
        body = parseBody(routingConfig.neutralBody, 3);
      }
    } else {
      route = `Direct Feedback / Escalation Branch (${formData.rating} Stars)`;
      subject = parseSubject(routingConfig.poorSubject, formData.rating);
      body = parseBody(routingConfig.poorBody, formData.rating);
      alertSupport = true;
    }

    setProcessedRoute(route);
    setEmailPreviewSubject(subject);
    setEmailPreviewBody(body);
    setSupportAlertTriggered(alertSupport);

    const logs: string[] = [];

    // A. Record to Sheet
    if (token) {
      if (resources.spreadsheetId) {
        try {
          logs.push(`📝 Appending row to Sheet: "${formData.name}", ${formData.rating} Stars...`);
          setAutoSubmitLogs([...logs]);
          await appendFeedbackToSheet(
            token,
            resources.spreadsheetId,
            formData.name,
            formData.email,
            formData.rating,
            getEffectiveComments()
          );
          logs.push(`✅ Successfully recorded feedback row to Google Sheet.`);
          setSheetSuccess(true);
          setAutoSubmitLogs([...logs]);
        } catch (err: any) {
          const prettyErr = formatExceptionMessage(err);
          logs.push(`⚠️ Failed writing to Google Sheet: ${prettyErr}`);
          setAutoSubmitLogs([...logs]);
          setFeedbackError(`Sheet Append Error: ${prettyErr}`);
        }
      } else {
        logs.push(`ℹ️ Google Sheet database is offline. Skipping row record.`);
        setAutoSubmitLogs([...logs]);
      }

      // B. Send Gmail Responder
      try {
        const ccEmail = routingConfig.supportEmail;
        logs.push(`✉️ Routing response to client address: ${formData.email}${ccEmail ? ` (CC: ${ccEmail})` : ''}...`);
        setAutoSubmitLogs([...logs]);
        await sendGmailEmail(token, formData.email, subject, body, ccEmail);
        logs.push(`✅ Auto-responder Gmail sent successfully.`);
        setEmailSuccess(true);
        setAutoSubmitLogs([...logs]);

        // C. If poor rating, send escalation alert
        if (alertSupport && routingConfig.supportEmail) {
          logs.push(`🚨 Escalating notification email to support: ${routingConfig.supportEmail}...`);
          setAutoSubmitLogs([...logs]);
          const alertBody = `⚠️ URGENT ESCALATION: Negative Feedback received from ${formData.name}. Ratings: ${formData.rating} Stars. Comments: ${getEffectiveComments()}`;
          await sendGmailEmail(token, routingConfig.supportEmail, '⚠️ URGENT ESCALATION: Poor customer feedback', alertBody);
          logs.push(`✅ Escalation alert dispatched successfully.`);
          setAutoSubmitLogs([...logs]);
        }
      } catch (err: any) {
        const prettyErr = formatExceptionMessage(err);
        logs.push(`⚠️ Failed sending response email: ${prettyErr}`);
        setAutoSubmitLogs([...logs]);
        setFeedbackError((prev) => prev ? `${prev} | Email Error: ${prettyErr}` : `Email Error: ${prettyErr}`);
      }
    } else {
      // No token
      logs.push(`ℹ️ Live routing completed locally. To write to spreadsheets and send live Gmail emails, click 'Connect Google Account' above.`);
      setAutoSubmitLogs([...logs]);
    }

    setIsAutoSubmitting(false);
  };

  const handleSubmitClick = () => {
    const effectiveComments = getEffectiveComments();
    if (!effectiveComments || !effectiveComments.trim()) {
      setValidationError("You must fill out the review.");
      return;
    }
    setValidationError(null);

    // Reset sharing states for a fresh submission
    setVisitedPlatforms([]);
    setHasFinishedSharing(false);

    const threshold = routingConfig.starThreshold ?? 3;
    const isPositive = formData.rating > threshold;

    // Automatically copy the review to clipboard when rating is positive (above threshold)
    if (isPositive) {
      copyTextToClipboard(effectiveComments);
      setShowCopiedNotification(true);
      setTimeout(() => setShowCopiedNotification(false), 4400);
    }

    // Record review to the Sheet Feedback Center list
    if (onAddReview) {
      onAddReview({
        clientId: activeClient?.id || 'mandk',
        clientName: activeClient?.name || 'MandK App',
        name: formData.name,
        email: formData.email,
        rating: formData.rating,
        comments: effectiveComments,
        status: (token && resources.spreadsheetId) ? 'synced' : 'local'
      });
    }

    if (isCurrentlyPublished) {
      if (isPositive) {
        try {
          const reviewUrl = routingConfig.googleReviewsUrl || "https://g.page/r/CajrrF4R_V20EAI/review";
          const win = window.open(reviewUrl, '_blank');
          if (win) {
            win.focus();
          }
        } catch (e) {
          console.warn("Direct navigation / popup was blocked by browser:", e);
        }
      }
      handleAutoSubmit();
    } else {
      handleSimulateRouting();
      // Set hasSubmittedAuto to true in simulator so the developer can interact with the congrats screen
      setHasSubmittedAuto(true);
      // Proactively trigger Sheet append automatically if Google account is connected
      if (token && resources.spreadsheetId) {
        handleAppendToRealSheet();
      }
    }
  };

  const triggerAppendToRealSheet = () => {
    if (!token || !resources.spreadsheetId) return;
    setShowSheetConfirm(true);
  };

  const handleAppendToRealSheet = async () => {
    setShowSheetConfirm(false);
    setSheetLoading(true);
    setFeedbackError(null);
    try {
      await appendFeedbackToSheet(
        token!,
        resources.spreadsheetId!,
        formData.name,
        formData.email,
        formData.rating,
        getEffectiveComments()
      );
      setSheetSuccess(true);
      setTimeout(() => setSheetSuccess(false), 4000);
    } catch (err: any) {
      const prettyErr = formatExceptionMessage(err);
      setFeedbackError(prettyErr);
    } finally {
      setSheetLoading(false);
    }
  };

  const triggerSendTestGmail = () => {
    if (!token) return;
    setTestEmailRecipient(formData.email);
    setSendEscalationAlert(supportAlertTriggered);
    setGmailModalError(null);
    setShowGmailModal(true);
  };

  const handleSendTestGmail = async () => {
    setEmailLoading(true);
    setGmailModalError(null);
    setFeedbackError(null);
    try {
      await sendGmailEmail(token!, testEmailRecipient, emailPreviewSubject, emailPreviewBody);
      
      // If critical, optionally simulate support alert too
      if (sendEscalationAlert) {
        const alertBody = `⚠️ URGENT ESCALATION: Negative Feedback received from ${formData.name}. Ratings: ${formData.rating} Stars. Comments: ${getEffectiveComments()}`;
        await sendGmailEmail(token!, routingConfig.supportEmail, '⚠️ URGENT ESCALATION: Poor customer feedback', alertBody);
      }

      setEmailSuccess(true);
      setShowGmailModal(false);
      setTimeout(() => setEmailSuccess(false), 4000);
    } catch (err: any) {
      const prettyErr = formatExceptionMessage(err);
      setGmailModalError(prettyErr);
      setFeedbackError(prettyErr);
    } finally {
      setEmailLoading(false);
    }
  };

  const showRightColumn = !isCurrentlyPublished;

  return (
    <div className="p-0 border-none bg-transparent shadow-none pt-2 sm:pt-4" id="sandbox-section">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Dynamic Simulator Inputs */}
        <div className={showRightColumn ? "lg:col-span-5 space-y-6" : "lg:col-span-12 max-w-2xl mx-auto w-full"}>
          {(() => {
            const innerContent = (
              <>
                {hasSubmittedAuto ? (
                  (() => {
                    const threshold = routingConfig.starThreshold ?? 3;
                    const isPositive = formData.rating > threshold;
                    const displayName = formData.name && formData.name.trim() ? formData.name.trim().split(' ')[0] : '';

                    if (!isPositive) {
                      // Negative rating: show the direct private feedback Thank You card
                      return (
                        <div className={isCurrentlyPublished ? "space-y-5" : "bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-left space-y-5"} id="negative-feedback-thanks">
                          <div className="w-16 h-16 bg-red-50 text-[#dc2626] rounded-full flex items-center justify-center">
                            <CheckCircle className="w-8 h-8" />
                          </div>
                          <div className="space-y-3">
                            <h3 className="text-xl font-bold text-slate-950 text-left">
                              {displayName ? t('sandbox.thankYouName', 'Thank you, {name}!', { name: displayName }) : t('sandbox.thankYou', 'Thank you!')}
                            </h3>
                            <p className="text-sm text-slate-500 max-w-md leading-relaxed text-left">
                              {t('sandbox.privateFeedbackDesc', 'Your comments have been sent directly to our management team to help us improve. We truly appreciate your valuable feedback!')}
                            </p>
                          </div>
                          <div className="pt-2 text-left">
                            <button
                              onClick={() => {
                                setHasSubmittedAuto(false);
                                setVisitedPlatforms([]);
                                setHasFinishedSharing(false);
                                setFormData(prev => ({ ...prev, comments: '' }));
                              }}
                              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-all active:scale-95 animate-fade-in"
                            >
                              {t('sandbox.submitAnother', 'Submit Another Feedback')}
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // Positive rating: show the sequential review platforms sharing flow
                    if (enabledPlatforms.length === 0 || hasFinishedSharing || remainingPlatforms.length === 0) {
                      // Final positive thank you state
                      return (
                        <div className={isCurrentlyPublished ? "space-y-5" : "bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-left space-y-5"} id="published-congrats-card-final">
                          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center animate-fade-in">
                            <CheckCircle className="w-8 h-8" />
                          </div>
                          <div className="space-y-3">
                            <h3 className="text-xl font-bold text-slate-950 text-left">
                              {displayName ? t('sandbox.thankYouName', 'Thank you, {name}!', { name: displayName }) : t('sandbox.thankYou', 'Thank you!')}
                            </h3>
                            <p className="text-sm text-slate-500 max-w-md leading-relaxed text-left">
                              {t('sandbox.recordedDesc', 'Your review has been successfully recorded and shared. We are extremely grateful for your support!')}
                            </p>
                          </div>
                          <div className="pt-2 text-left">
                            <button
                              onClick={() => {
                                setHasSubmittedAuto(false);
                                setVisitedPlatforms([]);
                                setHasFinishedSharing(false);
                                setFormData(prev => ({ ...prev, comments: '' }));
                              }}
                              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-all active:scale-95"
                            >
                              {t('sandbox.submitAnother', 'Submit Another Feedback')}
                            </button>
                          </div>
                        </div>
                      );
                    }

                    if (visitedPlatforms.length === 0) {
                      // First step of positive flow: Show all enabled platforms to let them choose or skip
                      return (
                        <div className={isCurrentlyPublished ? "space-y-5 animate-fade-in" : "bg-slate-950 p-6 rounded-3xl border border-slate-900 shadow-xl text-left space-y-5 animate-fade-in"} id="share-step-1">
                          <div className="flex flex-col items-start justify-start gap-3">
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-650 rounded-full flex items-center justify-center shrink-0">
                              <Share2 className="w-5 h-5" />
                            </div>
                            <h3 className={isCurrentlyPublished ? "text-xl font-bold text-slate-950 text-left" : "text-xl font-normal text-white text-left"}>
                              {displayName ? t('sandbox.thanksName', 'Thanks {name}!', { name: displayName }) : t('sandbox.thanks', 'Thanks!')}
                            </h3>
                          </div>
                          <div className="space-y-3">
                            <p className={isCurrentlyPublished ? "text-sm text-slate-500 max-w-md leading-relaxed text-left" : "text-sm text-white max-w-md leading-relaxed font-normal text-left"}>
                              {t('sandbox.keepSharing', 'Keep sharing the love! Your review is already copied to the clipboard, all you have to do is click one of the platforms and paste it.')}
                            </p>
                          </div>

                          <div className="space-y-3 max-w-sm pt-2 text-left">
                            <p className={isCurrentlyPublished ? "text-[11px] text-slate-400 font-bold uppercase tracking-wider text-left" : "text-[11px] text-white font-normal uppercase tracking-wider text-left"}>CHOOSE A PLATFORM</p>
                            <div className="flex flex-row justify-start gap-4 items-center flex-wrap">
                              {remainingPlatforms.map((platform) => {
                                let IconComponent = null;
                                if (platform.name === 'Facebook') {
                                  IconComponent = (
                                    <div className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center shrink-0 shadow-3xs">
                                      <Facebook className="w-4 h-4 fill-[#1877f2] text-[#1877f2]" />
                                    </div>
                                  );
                                } else if (platform.name === 'Yelp') {
                                  IconComponent = (
                                    <div className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center shrink-0 shadow-3xs">
                                      <Star className="w-4 h-4 fill-[#d32323] text-[#d32323]" />
                                    </div>
                                  );
                                } else {
                                  IconComponent = (
                                    <div className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center shrink-0 shadow-3xs">
                                      <CheckSquare className="w-4 h-4 text-blue-500" />
                                    </div>
                                  );
                                }

                                return (
                                  <button
                                    key={platform.name}
                                    onClick={() => handleSharePlatformClick(platform)}
                                    className={isCurrentlyPublished 
                                      ? "px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-3xs select-none"
                                      : "text-sm font-normal text-yellow-400 hover:text-yellow-300 hover:underline transition-all cursor-pointer flex items-center gap-2 select-none"}
                                  >
                                    {!isCurrentlyPublished && IconComponent}
                                    {isCurrentlyPublished && IconComponent}
                                    <span>{platform.name}</span>
                                  </button>
                                );
                              })}

                              {/* Third Option: Share via Email */}
                              <a
                                href={`mailto:?subject=${encodeURIComponent("Highly Recommend!")}&body=${encodeURIComponent(formData.comments || "Highly recommended feedback!")}`}
                                className={isCurrentlyPublished 
                                  ? "px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-3xs select-none"
                                  : "text-sm font-normal text-yellow-400 hover:text-yellow-300 hover:underline transition-all cursor-pointer flex items-center gap-2 select-none"}
                              >
                                <div className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center shrink-0 shadow-3xs">
                                  <Mail className="w-4 h-4 text-slate-700" />
                                </div>
                                <span>Email</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Subsequent steps of positive flow: Ask gently one-at-a-time for the remaining platforms
                    const nextPlatform = remainingPlatforms[0];
                    return (
                      <div className={isCurrentlyPublished ? "space-y-5 animate-fade-in" : "bg-slate-950 p-6 rounded-3xl border border-slate-900 shadow-xl text-left space-y-5 animate-fade-in"} id="share-step-subsequent">
                        <div className="flex flex-col items-start justify-start gap-3">
                          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                            <Share2 className="w-5 h-5" />
                          </div>
                          <h3 className={isCurrentlyPublished ? "text-xl font-bold text-slate-950 text-left" : "text-xl font-normal text-white font-sans text-left"}>Awesome!</h3>
                        </div>
                        <div className="space-y-3">
                          <p className={isCurrentlyPublished ? "text-sm text-slate-500 max-w-md leading-relaxed text-left" : "text-sm text-white max-w-md leading-relaxed font-normal text-left"}>
                            Gently, would you also like to share your review on <strong className={isCurrentlyPublished ? "text-slate-800 font-bold" : "text-white font-normal"}>{nextPlatform.name}</strong>? Your review text is still copied in your clipboard.
                          </p>
                        </div>

                        <div className="space-y-3 max-w-xs pt-2 text-left">
                          {(() => {
                            let IconComponent = null;
                            if (nextPlatform.name === 'Facebook') {
                              IconComponent = (
                                <div className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center shrink-0 shadow-3xs">
                                  <Facebook className="w-4 h-4 fill-[#1877f2] text-[#1877f2]" />
                                </div>
                              );
                            } else if (nextPlatform.name === 'Yelp') {
                              IconComponent = (
                                <div className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center shrink-0 shadow-3xs">
                                  <Star className="w-4 h-4 fill-[#d32323] text-[#d32323]" />
                                </div>
                              );
                            } else {
                              IconComponent = (
                                <div className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center shrink-0 shadow-3xs">
                                  <CheckSquare className="w-4 h-4 text-blue-500" />
                                </div>
                              );
                            }

                            return (
                              <div className="flex justify-start">
                                <button
                                  key={nextPlatform.name}
                                  onClick={() => handleSharePlatformClick(nextPlatform)}
                                  className={isCurrentlyPublished 
                                    ? "px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-3xs select-none"
                                    : "text-sm font-normal text-yellow-400 hover:text-yellow-300 hover:underline transition-all cursor-pointer flex items-center gap-2 select-none"}
                                >
                                  {IconComponent}
                                  <span>Yes, {nextPlatform.name}</span>
                                </button>
                              </div>
                            );
                          })()}

                          <button
                            onClick={() => setHasFinishedSharing(true)}
                            className="w-full py-2 text-xs font-normal text-slate-500 hover:text-slate-400 hover:underline transition-all cursor-pointer text-left"
                          >
                            No thanks, I'm all done
                          </button>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div>
                    {!isCurrentlyPublished && (
                      <div className="text-xl sm:text-[22px] font-bold text-white mb-3 select-none">
                        Input Simulator
                      </div>
                    )}
                    <div className={isCurrentlyPublished ? "space-y-6" : "bg-white rounded-2xl border border-slate-100 p-6 shadow-xs"}>
                      {!isCurrentlyPublished && renderPublishedHeader()}

                      {!isCurrentlyPublished && (
                      !user && (
                        /* Only Connect with Google option styled as requested */
                        <div className="mb-4">
                          {onLogin && (
                            <div id="live-form-google-signin-wrapper">
                              <button
                                type="button"
                                onClick={onLogin}
                                disabled={isLoggingIn}
                                className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-yellow-400 hover:bg-yellow-500 border border-transparent text-slate-900 rounded-xl text-xs font-bold shadow-2xs transition-all duration-150 cursor-pointer active:scale-98"
                                id="live-form-google-signin-btn"
                              >
                                {isLoggingIn ? (
                                  <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4.5 h-4.5 shrink-0">
                                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                                  </svg>
                                )}
                                <span>Connect with Google</span>
                              </button>
                            </div>
                          )}
                          {authError && (
                            <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs font-semibold rounded-xl leading-relaxed mt-2" id="sandbox-auth-error">
                              ⚠️ {authError}
                            </div>
                          )}
                        </div>
                      )
                    )}

                    <div className="space-y-4">

                    <div>
                      <label className="flex items-center text-[15px] font-bold text-black mb-2">
                        <span className="flex items-center justify-center w-6 h-6 mr-1.5 rounded-full bg-black text-white text-[12px] font-bold shrink-0">1</span>
                        <span>{t('sandbox.selectRating', 'Select Your Rating')}</span>
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => {
                              setFormData({ ...formData, rating: star });
                              setValidationError(null);
                              setShowAiCopiedBanner(false);
                            }}
                            className="p-1 transition-transform active:scale-95 cursor-pointer"
                            id={`star-${star}-btn`}
                          >
                            <Star
                              className={`w-10 h-10 ${
                                star <= formData.rating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-200 hover:text-amber-200'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-2">
                        <label className="flex items-center text-[15px] font-bold text-black">
                          <span className="flex items-center justify-center w-6 h-6 mr-1.5 rounded-full bg-black text-white text-[12px] font-bold shrink-0">2</span>
                          <span>{t('sandbox.composeReview', 'Compose Review')}</span>
                        </label>
                      </div>
                      <textarea
                        value={formData.comments}
                        onChange={(e) => {
                          setFormData({ ...formData, comments: e.target.value });
                          if (validationError) {
                            setValidationError(null);
                          }
                          setShowAiCopiedBanner(false);
                        }}
                        rows={3}
                        className={`w-full px-5 py-4 border rounded-xl focus:ring-2 focus:ring-slate-300 font-typewriter text-[17px] leading-[22px] font-normal text-slate-900 ${
                          validationError ? 'border-red-500 focus:ring-red-500 bg-red-50/20' : 'border-slate-300'
                        }`}
                        id="sim-comments-input"
                        placeholder={t('sandbox.commentsPlaceholder', 'Share details here...')}
                      ></textarea>

                      {validationError && (
                        <p className="text-red-600 text-[14.5px] font-semibold mt-1.5 flex items-center gap-1.5" id="comments-validation-error">
                          <span className="shrink-0">⚠️</span>
                          <span>{validationError}</span>
                        </p>
                      )}

                      {formData.rating <= (routingConfig.starThreshold ?? 3) && (
                        <div className="mt-2.5 flex flex-col gap-1.5" id="fix-together-container">
                          <button
                            type="button"
                            onClick={() => {
                              setFixTogether(!fixTogether);
                              setValidationError(null);
                            }}
                            className={`text-[14px] transition-all py-1 flex items-center gap-2 cursor-pointer active:scale-95 self-start select-none ${
                              fixTogether
                                ? 'text-slate-600 font-semibold'
                                : 'text-slate-400 hover:text-slate-500 font-normal'
                            }`}
                            id="fix-together-btn"
                          >
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                              fixTogether
                                ? 'border-slate-400 bg-slate-100'
                                : 'border-slate-300'
                            }`}>
                              {fixTogether && (
                                <Check className="w-3 h-3 text-slate-600 stroke-[3] shrink-0" />
                              )}
                            </div>
                            <span>{t('sandbox.fixTogether', "Let's try to fix this together")}</span>
                          </button>
                        </div>
                      )}

                      {formData.rating > (routingConfig.starThreshold ?? 3) && (
                        <div className="flex flex-col items-start gap-1.5 mt-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={handleGenerateSeoSuggestion}
                              disabled={isGeneratingSeo}
                              className="text-[12px] sm:text-[13px] font-bold text-black bg-yellow-400 hover:bg-black hover:text-white disabled:bg-slate-200 disabled:text-slate-400 flex items-center justify-center gap-1.5 transition-all py-2 px-4 rounded-lg active:scale-95 cursor-pointer disabled:pointer-events-none shadow-xs self-start"
                              id="ai-seo-suggest-btn"
                            >
                              {isGeneratingSeo ? (
                                <>
                                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0"></div>
                                  <span>{t('sandbox.polishingDraft', 'Polishing Draft...')}</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4 text-current shrink-0" />
                                  <span>{t('sandbox.polishDraft', 'Polish Draft')}</span>
                                </>
                              )}
                            </button>
                          </div>
                          <span className="text-[13px] text-slate-950 font-medium leading-normal">
                            {t('sandbox.clickAgain', 'Click again for a new version, feel free to edit.')}
                          </span>

                          {showAiCopiedBanner && (
                            <p className="text-[15.5px] font-bold text-slate-900 mt-2 border-l-2 border-yellow-400 pl-2 leading-normal" id="ai-copied-banner">
                              {t('sandbox.copiedBanner', "Copied! Make any final edits, click 'Submit Feedback,' then paste.")}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleSubmitClick}
                      disabled={isAutoSubmitting}
                      className={`group flex items-center gap-2.5 p-0 bg-transparent border-0 text-[21px] font-bold cursor-pointer outline-none select-none transition-all ${
                        (!getEffectiveComments() || !getEffectiveComments().trim())
                          ? 'text-black hover:text-slate-800'
                          : 'text-[#dc2626] hover:text-[#b91c1c]'
                      } disabled:text-slate-400`}
                      id="run-sim-btn"
                    >
                      {isAutoSubmitting && (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0"></div>
                      )}
                      <span className={`flex items-center justify-center w-6 h-6 rounded-full text-white text-[12px] font-bold shrink-0 transition-all duration-200 ${
                        (!getEffectiveComments() || !getEffectiveComments().trim())
                          ? 'bg-black group-hover:bg-slate-800'
                          : 'bg-[#dc2626] group-hover:bg-[#b91c1c]'
                      }`}>3</span>
                      <span className="group-hover:underline transition-all duration-200">
                        {formData.rating <= (routingConfig.starThreshold ?? 3) ? t('sandbox.submit', 'Submit') : t('sandbox.submitAndPaste', 'Submit & Paste')}
                      </span>
                    </button>

                    {formData.rating > (routingConfig.starThreshold ?? 3) && (
                      <div className="mt-3.5 space-y-2.5" id="maps-ugc-policy-notice">
                        <button
                          type="button"
                          onClick={() => setShowUgcNotice(!showUgcNotice)}
                          className="flex items-center gap-1.5 text-[13.5px] text-slate-500 hover:text-slate-750 font-medium transition-all cursor-pointer outline-none"
                          id="toggle-ugc-notice-btn"
                        >
                          <Info className="w-4 h-4 text-slate-400 hover:text-slate-600 shrink-0" />
                          <span className="hover:underline text-left">
                            {isSpanish ? 'Cumple con Políticas UGC de Google Maps' : 'Google Maps UGC Policy Safe'}
                          </span>
                        </button>
                        
                        {showUgcNotice && (
                          <div className="mt-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[13.5px] text-slate-600 leading-relaxed transition-all duration-250 animate-fade-in">
                            {isSpanish
                              ? 'Para cumplir con las políticas de Contenido Generado por el Usuario (UGC) de Google, esta función de IA opera estrictamente como un asistente de redacción para dar formato y mejorar tu experiencia real. Las reseñas falsas o no verificadas violan la política de Google. Por favor, revisa y verifica la sugerencia antes de publicarla.'
                              : 'To comply with Google’s User Generated Content (UGC) policy, this AI feature operates strictly as a helpful writing aid to format and polish your real-world experience. Deliberately fake, synthetic, or unverified reviews violate Google’s policy and can lead to review deletion or account suspension. Please review, personalize, and verify the drafted suggestion before posting to ensure it is completely honest and authentic.'}
                          </div>
                        )}

                        <div className="pt-1 w-full" id="polish-draft-info-panel">
                          <button
                            type="button"
                            onClick={() => setShowPolishInfo(!showPolishInfo)}
                            className="flex items-center gap-1.5 text-[13.5px] text-slate-500 hover:text-slate-750 font-medium transition-all cursor-pointer outline-none"
                            id="toggle-polish-info-btn"
                          >
                            <Info className="w-4 h-4 text-slate-400 hover:text-slate-600 shrink-0" />
                            <span className="hover:underline text-left">{t('sandbox.howPolishWorks', 'How "Polish Draft" works')}</span>
                          </button>
                          
                          {showPolishInfo && (
                            <div className="mt-2.5 p-4 bg-yellow-50/50 border border-yellow-200 rounded-xl text-[12.5px] text-slate-700 leading-relaxed space-y-3.5 animate-fade-in text-left">
                              <div>
                                <h4 className="font-extrabold text-slate-900 uppercase text-[10.5px] tracking-wide flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-yellow-650" />
                                  <span>{t('sandbox.whatPolishDoesTitle', 'What "Polish Draft" Does')}</span>
                                </h4>
                                <p className="mt-1 text-slate-650 font-medium">
                                  {t('sandbox.whatPolishDoesDesc', 'Transforms your simple rating or brief comment into a well-structured, detailed, authentic review in seconds — creating a polished testimonial that is longer and richer.')}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        );

            if (isCurrentlyPublished) {
              return (
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-6 w-full max-w-2xl mx-auto text-left animate-fade-in">
                  {renderPublishedHeader()}
                  {innerContent}
                </div>
              );
            }

            return innerContent;
          })()}

          {feedbackError && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs space-y-2">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4.5 h-4.5 shrink-0 text-red-600" />
                <span className="font-semibold">{feedbackError}</span>
              </div>
              {(feedbackError.toLowerCase().includes('authorization') || 
                feedbackError.toLowerCase().includes('credential') || 
                feedbackError.toLowerCase().includes('oauth') || 
                feedbackError.toLowerCase().includes('unauthorized') || 
                feedbackError.toLowerCase().includes('token') || 
                feedbackError.includes('401')) && onLogin && (
                <div className="pt-1.5 pl-6">
                  <button
                    type="button"
                    onClick={onLogin}
                    disabled={isLoggingIn}
                    className="text-[11px] font-bold px-3 py-1.5 bg-red-650 hover:bg-red-750 text-white rounded-lg transition-all duration-150 cursor-pointer flex items-center gap-1.5 shadow-3xs"
                    id="sandbox-error-auth-fix-btn"
                  >
                    {isLoggingIn && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                    <span>Connect/Re-authorize Google Account</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dynamic Inbox Preview & Live execution details */}
        {showRightColumn && (
          <div className="lg:col-span-7 flex flex-col">
            {!isCurrentlyPublished && (
              <div className="text-xl sm:text-[22px] font-bold text-white mb-3 select-none">
                Simulated Mail Dispatch Inbox
              </div>
            )}
            {processedRoute ? (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                
              {/* Simulated Mailbox Client */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex-1 flex flex-col">
                <div className="px-4.5 py-3 bg-slate-50 text-black">
                  {!isCurrentlyPublished && (
                    <div className="flex items-center gap-2 flex-wrap justify-start">
                      {/* Connect Google Option */}
                      <button
                        onClick={() => {
                          if (!token) {
                            if (onLogin) onLogin();
                          } else {
                            if (onLogout) onLogout();
                          }
                        }}
                        disabled={isLoggingIn}
                        className="flex items-center justify-center gap-2 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer hover:bg-slate-200/60 text-black border-0"
                        id="connect-google-sandbox-btn"
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="text-black font-bold">Connect Google</span>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!token) {
                                if (onLogin) onLogin();
                              } else {
                                if (onLogout) onLogout();
                              }
                            }}
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-extrabold rounded-md shadow-2xs ml-0.5 transition-colors cursor-pointer select-none ${
                              token
                                ? 'bg-amber-400 text-black hover:bg-amber-300'
                                : 'bg-yellow-400/50 text-black hover:bg-yellow-400/70 border border-yellow-400/60'
                            }`}
                            title={token ? "Click to Disconnect" : "Click to Connect Google"}
                          >
                            <span className={`w-1 h-1 rounded-full ${token ? 'bg-black animate-pulse' : 'bg-black/60'}`}></span>
                            {token ? 'ON' : 'OFF'}
                          </span>
                        </span>
                      </button>

                      {/* Append Sheet Action */}
                      <button
                        onClick={() => {
                          if (!token || !sheetEnabled) {
                            if (onLogin) onLogin();
                            setSheetEnabled(true);
                            return;
                          }
                          triggerAppendToRealSheet();
                        }}
                        disabled={sheetLoading || (!!token && sheetEnabled && !resources.spreadsheetId)}
                        className={`flex items-center justify-center gap-2 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                          !token || !sheetEnabled
                            ? 'bg-transparent hover:bg-slate-200/60 text-black border-0'
                            : 'bg-transparent hover:bg-emerald-50 text-black border-0'
                        }`}
                        id="append-sheet-btn"
                      >
                        {sheetLoading ? (
                          <span>Running pipeline...</span>
                        ) : sheetSuccess ? (
                          <span className="text-emerald-700 inline-flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Checked in!
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <span className="text-black font-bold">Record to Sheet</span>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                if (token && sheetEnabled) {
                                  setSheetEnabled(false);
                                } else {
                                  if (!token && onLogin) onLogin();
                                  setSheetEnabled(true);
                                }
                              }}
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-extrabold rounded-md shadow-2xs ml-0.5 transition-colors cursor-pointer select-none ${
                                token && sheetEnabled
                                  ? 'bg-amber-400 text-black hover:bg-amber-300'
                                  : 'bg-yellow-400/50 text-black hover:bg-yellow-400/70 border border-yellow-400/60'
                              }`}
                              title={token && sheetEnabled ? "Click to turn OFF" : "Click to Connect & turn ON"}
                            >
                              <span className={`w-1 h-1 rounded-full ${token && sheetEnabled ? 'bg-black animate-pulse' : 'bg-black/60'}`}></span>
                              {token && sheetEnabled ? 'ON' : 'OFF'}
                            </span>
                          </span>
                        )}
                      </button>

                      {/* Mail sending via custom API */}
                      <button
                        onClick={() => {
                          if (!token || !emailEnabled) {
                            if (onLogin) onLogin();
                            setEmailEnabled(true);
                            return;
                          }
                          triggerSendTestGmail();
                        }}
                        disabled={emailLoading}
                        className={`flex items-center justify-center gap-2 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                          !token || !emailEnabled
                            ? 'bg-transparent hover:bg-slate-200/60 text-black border-0'
                            : 'bg-transparent hover:bg-red-50 text-black border-0'
                        }`}
                        id="send-gmail-btn"
                      >
                        {emailLoading ? (
                          <span>Sending message...</span>
                        ) : emailSuccess ? (
                          <span className="text-black inline-flex items-center gap-1 font-bold">
                            <CheckCircle className="w-3.5 h-3.5" /> Email Sent!
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <span className="text-black font-bold">Send Real Test Email</span>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                if (token && emailEnabled) {
                                  setEmailEnabled(false);
                                } else {
                                  if (!token && onLogin) onLogin();
                                  setEmailEnabled(true);
                                }
                              }}
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-extrabold rounded-md shadow-2xs ml-0.5 transition-colors cursor-pointer select-none ${
                                token && emailEnabled
                                  ? 'bg-amber-400 text-black hover:bg-amber-300'
                                  : 'bg-yellow-400/50 text-black hover:bg-yellow-400/70 border border-yellow-400/60'
                              }`}
                              title={token && emailEnabled ? "Click to turn OFF" : "Click to Connect & turn ON"}
                            >
                              <span className={`w-1 h-1 rounded-full ${token && emailEnabled ? 'bg-black animate-pulse' : 'bg-black/60'}`}></span>
                              {token && emailEnabled ? 'ON' : 'OFF'}
                            </span>
                          </span>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {!isCurrentlyPublished && !token && (
                  <div className="p-3 border-b border-slate-200 bg-amber-50 text-amber-800 flex items-start gap-2 text-[11px] leading-relaxed text-left">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      {user ? (
                        <>
                          <strong>Google API Session Expired:</strong> Your Google integration session has expired. Click either button above to re-authorize sheets and email delivery!
                        </>
                      ) : (
                        <>
                          <strong>Google Authorization Pending:</strong> Click either option above to sign in with Google and automatically run these real-world integrations!
                        </>
                      )}
                    </span>
                  </div>
                )}

                <div className="p-4.5 space-y-2 flex-1 overflow-y-auto">
                  <div className="grid grid-cols-12 gap-2 text-xs py-1">
                    <span className="col-span-2 font-bold text-black">Subject:</span>
                    <span className="col-span-10 font-bold text-black">{renderSubjectWithYellowStars(emailPreviewSubject)}</span>
                  </div>

                  <div className="grid grid-cols-12 gap-2 text-xs py-1">
                    <span className="col-span-2 font-bold text-black">To:</span>
                    <span className="col-span-10 font-mono text-black font-bold">{formData.email}</span>
                  </div>

                  {/* Rendered HTML Container */}
                  <div 
                    className="p-3 border-0 rounded-xl bg-white max-h-[300px] overflow-y-auto text-slate-800 text-[17px] leading-[25px] text-left [&_p]:mb-4 [&_h2]:mb-4"
                    style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '17px', lineHeight: '25px' }}
                  >
                    <div 
                      className="[&_p]:mb-4 [&_h2]:mb-4"
                      style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '17px', lineHeight: '25px' }}
                      dangerouslySetInnerHTML={{ __html: emailPreviewBody }}
                    ></div>
                  </div>
                </div>

                {/* Actions Section */}
                {isCurrentlyPublished && (
                  <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] uppercase font-bold tracking-wider text-slate-500">Automated Pipeline Execution Logs</span>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">Active</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-700 space-y-1.5 max-h-[140px] overflow-y-auto bg-white border border-slate-200 p-2.5 rounded-xl">
                      {autoSubmitLogs.length > 0 ? (
                        autoSubmitLogs.map((log, idx) => (
                          <div key={idx} className="leading-normal">{log}</div>
                        ))
                      ) : (
                        <div className="text-slate-500 italic text-xs">Waiting for feedback submission...</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {!isCurrentlyPublished && !resources.spreadsheetId && (
                <div className="p-3.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-xl flex items-start gap-2 text-[11px] leading-relaxed">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                     <strong>Spreadsheet offline:</strong> Deployed resource records are only unlocked once you deploy the Google Sheet from the first tab! Standard sandbox mail simulation will work immediately.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-start justify-center border border-dashed border-slate-200 bg-slate-50/50 rounded-2xl p-8 text-left min-h-[300px]">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-3">
                <Inbox className="w-6 h-6 text-red-400" />
              </div>
              <h4 className="font-semibold text-slate-800 text-sm text-left">
                {isCurrentlyPublished ? "Feedback Transmission Desk" : "Visual Sandboxed Sandbox"}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4 text-left">
                {isCurrentlyPublished 
                  ? "Configure the customer details on the left, then click 'Submit Feedback' to trigger database recording and live email dispatch routes instantly."
                  : 'Configure your mock customer details on the left, then click "Simulate" to trace email routing.'}
              </p>
            </div>
          )}
        </div>
        )}
      </div>

      {/* Modal sheet confirmation */}
      {showSheetConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto" id="sheet-confirm-modal">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={() => setShowSheetConfirm(false)}></div>
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md border border-slate-100">
              <div className="bg-white p-6">
                <div className="text-center sm:text-left">
                  <h3 className="text-base font-bold leading-6 text-slate-900 flex items-center gap-2">
                    <Table className="w-5 h-5 text-emerald-600" />
                    Append Feedback Record?
                  </h3>
                  <div className="mt-3 text-xs text-slate-500 space-y-2.5 leading-relaxed">
                    <p>
                      This will write a new live row into the <strong>"Form Responses 1"</strong> sheet of your deployed Google Spreadsheet:
                    </p>
                    <div className="p-2 border border-slate-100 bg-slate-50 rounded-lg text-[11px] font-mono select-all">
                      ID: {resources.spreadsheetId}
                    </div>
                    <p>
                      The payload matches your current simulator values:
                    </p>
                    <div className="border border-slate-100 rounded-xl overflow-hidden text-[11px]">
                      <div className="grid grid-cols-3 border-b border-slate-100 bg-slate-50 px-3 py-1 font-semibold text-slate-600">
                        <span>Param</span>
                        <span className="col-span-2">Value</span>
                      </div>
                      <div className="px-3 py-1.5 space-y-1 bg-white">
                        <div className="grid grid-cols-3 text-slate-600"><span className="font-medium">Name:</span><span className="col-span-2 font-mono">{formData.name}</span></div>
                        <div className="grid grid-cols-3 text-slate-600"><span className="font-medium">Email:</span><span className="col-span-2 font-mono">{formData.email}</span></div>
                        <div className="grid grid-cols-3 text-slate-600"><span className="font-medium">Rating:</span><span className="col-span-2 text-red-600 font-bold">{formData.rating} Stars</span></div>
                        <div className="grid grid-cols-3 text-slate-600"><span className="font-medium">Comments:</span><span className="col-span-2 italic text-slate-500 truncate">{getEffectiveComments() || '(No comments)'}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 px-6 py-4 sm:flex sm:flex-row-reverse sm:gap-3 rounded-b-2xl">
                <button
                  type="button"
                  onClick={handleAppendToRealSheet}
                  className="inline-flex w-full justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 sm:w-auto cursor-pointer"
                  id="execute-sheet-btn"
                >
                  Write to Sheet
                </button>
                <button
                  type="button"
                  onClick={() => setShowSheetConfirm(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs ring-1 ring-inset ring-slate-200 hover:bg-slate-50 sm:mt-0 sm:w-auto cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal gmail config */}
      {showGmailModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" id="gmail-confirm-modal">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={() => !emailLoading && setShowGmailModal(false)}></div>
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md border border-slate-100">
              <div className="bg-white p-6">
                <div>
                  <h3 className="text-base font-bold leading-6 text-slate-900 flex items-center gap-2 mb-3">
                    <Mail className="w-5 h-5 text-red-600" />
                    Test Gmail Workspace Dispatch
                  </h3>
                  
                  {gmailModalError && (
                    <div className="mb-4 p-3 bg-rose-50 border border-rose-100/80 rounded-xl text-rose-800 text-xs space-y-1.5">
                      <div className="font-bold flex items-center gap-1.5 text-rose-950">
                        <AlertOctagon className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>Dispatch Error Occurred</span>
                      </div>
                      <p className="leading-relaxed break-words font-mono text-[10.5px] bg-white/50 p-2 rounded-md border border-rose-100/50 max-h-[120px] overflow-y-auto">{gmailModalError}</p>
                      
                      {(gmailModalError.toLowerCase().includes('authorization') || 
                        gmailModalError.toLowerCase().includes('credential') || 
                        gmailModalError.toLowerCase().includes('oauth') || 
                        gmailModalError.toLowerCase().includes('unauthorized') || 
                        gmailModalError.toLowerCase().includes('token') || 
                        gmailModalError.includes('401')) && onLogin && (
                        <div className="pt-1.5">
                          <button
                            type="button"
                            onClick={onLogin}
                            disabled={isLoggingIn}
                            className="w-full text-[10px] sm:text-[11px] font-bold px-3 py-1.5 bg-red-650 hover:bg-red-750 text-white rounded-lg transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 shadow-3xs"
                            id="modal-error-auth-fix-btn"
                          >
                            {isLoggingIn && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                            <span>Connect/Re-authorize Google Account</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Recipient Address *
                      </label>
                      <input
                        type="email"
                        value={testEmailRecipient}
                        onChange={(e) => setTestEmailRecipient(e.target.value)}
                        disabled={emailLoading}
                        className="w-full text-xs px-3.5 py-2.5 border border-slate-400 rounded-xl focus:ring-2 focus:ring-red-100 focus:outline-hidden font-medium text-slate-800 disabled:bg-slate-50 disabled:text-slate-400"
                        required
                        id="test-recipient-input"
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Specify the test destination. This will send a standard email using your authenticated credentials.
                      </span>
                    </div>

                    {supportAlertTriggered && (
                      <div className="p-3 border border-yellow-100 bg-yellow-50/50 rounded-xl space-y-2">
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            id="send-escalation-check"
                            checked={sendEscalationAlert}
                            disabled={emailLoading}
                            onChange={(e) => setSendEscalationAlert(e.target.checked)}
                            className="mt-1 shrink-0 rounded-sm accent-amber-600"
                          />
                          <label htmlFor="send-escalation-check" className="text-[11px] text-amber-900 font-semibold leading-normal cursor-pointer select-none">
                            Escalate poor response alert to Support Team
                          </label>
                        </div>
                        <p className="text-[10px] text-amber-700 leading-normal pl-5">
                          If selected, we will also route the critical alert email immediately to your support mailbox: <strong className="font-mono">{routingConfig.supportEmail}</strong>.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 px-6 py-4 sm:flex sm:flex-row-reverse sm:gap-3 rounded-b-2xl">
                <button
                  type="button"
                  onClick={handleSendTestGmail}
                  disabled={!testEmailRecipient || emailLoading}
                  className="inline-flex w-full justify-center rounded-xl bg-red-650 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-red-750 disabled:bg-slate-200 disabled:text-slate-400 sm:w-auto cursor-pointer flex items-center justify-center gap-2"
                  id="execute-gmail-btn"
                >
                  {emailLoading && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span>{emailLoading ? 'Sending Now...' : 'Send Live Email(s)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowGmailModal(false)}
                  disabled={emailLoading}
                  className="mt-3 inline-flex w-full justify-center rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs ring-1 ring-inset ring-slate-200 hover:bg-slate-50 sm:mt-0 sm:w-auto cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Header & Branding Modal */}
      {(isEditingHeaderModal || isEditingLogo) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 max-w-md w-full p-6 text-left relative overflow-hidden">
            <button
              onClick={() => {
                setIsEditingHeaderModal(false);
                setIsEditingLogo(false);
              }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-red-50 dark:bg-red-950/50 rounded-xl text-[#dc2626]">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Edit Header & Branding</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Customize header title, subtitle & logo for {client.name}</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {/* Header Title */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Header Title
                </label>
                <input
                  type="text"
                  value={modalTitleInput}
                  onChange={(e) => setModalTitleInput(e.target.value)}
                  placeholder="e.g. Customer Feedback"
                  className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                />
              </div>

              {/* Header Subtitle */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Header Subtitle
                </label>
                <input
                  type="text"
                  value={modalSubtitleInput}
                  onChange={(e) => setModalSubtitleInput(e.target.value)}
                  placeholder="e.g. We value your experience!"
                  className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                />
              </div>

              {/* Image URL Field */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Brand Logo Image URL (PNG, JPG, SVG, WebP)
                </label>
                <div className="relative flex items-center">
                  <LinkIcon className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
                  <input
                    type="url"
                    value={logoUrlInput}
                    onChange={(e) => {
                      setLogoUrlInput(e.target.value);
                      setLogoImageError(false);
                    }}
                    placeholder="https://example.com/logo.png"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                  />
                </div>
              </div>

              {/* Live Preview Box */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Logo Live Preview
                </label>
                <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 h-24 flex items-center justify-center p-3 relative overflow-hidden">
                  {logoUrlInput.trim() ? (
                    !logoImageError ? (
                      <img
                        src={logoUrlInput.trim()}
                        alt="Logo preview"
                        className="max-h-full max-w-full object-contain"
                        referrerPolicy="no-referrer"
                        onError={() => setLogoImageError(true)}
                      />
                    ) : (
                      <div className="text-center p-2">
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">⚠️ Failed to load image from URL</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">Check if the link is direct & publicly accessible</p>
                      </div>
                    )
                  ) : (
                    <div className="text-center p-2 text-zinc-400">
                      <p className="text-xs font-medium">No URL entered — Fallback initials will be displayed</p>
                      <div className="mt-1.5 inline-flex items-center justify-center h-9 w-9 bg-red-650 text-white font-black text-xs rounded-lg">
                        {client.name.substring(0, 2).toUpperCase()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {client.id === 'mandk' && (
                  <button
                    type="button"
                    onClick={() => {
                      setLogoUrlInput(mkLogo);
                      setLogoImageError(false);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    M&K Default Logo
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setModalTitleInput('Customer Feedback');
                    setModalSubtitleInput('We value your experience!');
                  }}
                  className="px-2.5 py-1 text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors cursor-pointer"
                >
                  Reset Defaults
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLogoUrlInput('');
                    setLogoImageError(false);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors cursor-pointer"
                >
                  Clear Logo
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 border-t border-zinc-200 dark:border-zinc-800 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsEditingHeaderModal(false);
                  setIsEditingLogo(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSaveHeaderModal();
                  setIsEditingLogo(false);
                }}
                className="px-5 py-2 text-xs font-bold bg-[#dc2626] hover:bg-red-700 text-white rounded-xl shadow-xs transition-all duration-150 cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Check className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
