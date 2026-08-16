import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Check, RefreshCw, Save, Share2, Layers, AlignCenter, ArrowUp, ArrowDown, Sparkles, Copy, ExternalLink, Globe, Link2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface SocialShareTabProps {
  activeClientName?: string;
  defaultDestinationUrl?: string;
  activeClientId?: string;
  activeClientAppUrl?: string;
}

const REVIEW_BENEFIT_VARIATIONS_EN = [
  {
    title: 'Help Local Drivers & Save on Quality Auto Parts',
    description: 'Your 5-star review helps fellow vehicle owners find trusted, affordable used auto parts and fast local service in Vero Beach!'
  },
  {
    title: 'Why Reviews Matter: Trusted Local Auto Repair',
    description: 'Leaving a review supports local mechanics and helps drivers discover reliable, warrantied used engines and transmissions at M&K.'
  },
  {
    title: 'Share Your M&K Experience & Support Quality Service',
    description: 'Customer reviews help us maintain high quality standards, fair scrap car payouts, and fast 24/7 parts sourcing for our community.'
  },
  {
    title: 'Empower Local Vehicle Owners with Honest Feedback',
    description: 'Good reviews empower local drivers to save money on car repairs and make confident decisions with trusted auto parts.'
  },
  {
    title: 'Rate Your Experience with M&K Auto Parts',
    description: 'Your feedback helps us continuously improve our service and ensures drivers always get top value and friendly local care.'
  },
  {
    title: 'M&K Customer Reviews & Community Trust',
    description: 'Positive customer reviews build community trust, helping drivers find tested auto components at a fraction of dealership prices.'
  }
];

const REVIEW_BENEFIT_VARIATIONS_ES = [
  {
    title: 'Ayuda a conductores locales y ahorra en repuestos de calidad',
    description: '¡Tu reseña de 5 estrellas ayuda a otros conductores a encontrar repuestos usados confiables y económicos con atención rápida en Vero Beach!'
  },
  {
    title: 'Por qué importan las opiniones: Reparación local confiable',
    description: 'Dejar una opinión apoya a los mecánicos locales y ayuda a los conductores a descubrir motores y transmisiones usadas con garantía.'
  },
  {
    title: 'Comparte tu experiencia M&K y apoya un servicio de calidad',
    description: 'Las reseñas de clientes nos ayudan a mantener altos estándares de calidad, pagos justos por autos chatarra y entrega rápida 24/7.'
  },
  {
    title: 'Impulsa a conductores locales con opiniones honestas',
    description: 'Las opiniones positivas ayudan a los conductores locales a ahorrar en reparaciones y tomar decisiones con repuestos automotrices de confianza.'
  },
  {
    title: 'Califica tu experiencia con M&K Auto Parts',
    description: 'Tus comentarios nos ayudan a mejorar continuamente nuestro servicio y aseguran que los conductores reciban la mejor atención.'
  },
  {
    title: 'Reseñas de clientes M&K y confianza en la comunidad',
    description: 'Las reseñas construyen confianza comunitaria, ayudando a conductores a conseguir componentes garantizados a una fracción del precio de concesionario.'
  }
];

export function formatDriveUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();

  // Match /file/d/FILE_ID
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${fileDMatch[1]}`;
  }

  // Match id=FILE_ID in drive or docs link
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1] && (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com'))) {
    return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
  }

  return trimmed;
}

export default function SocialShareTab({
  activeClientName = 'M&K Used Auto Parts',
  activeClientId = 'mandk',
  activeClientAppUrl = ''
}: SocialShareTabProps) {
  const { t, isSpanish } = useLanguage();
  const isWArts = activeClientId.toLowerCase().includes('w-arts') || activeClientId === 'client_1786751504755';

  const [copiedLink, setCopiedLink] = useState(false);

  const getShareableUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const baseUrl = origin.includes('-dev-') ? origin.replace('-dev-', '-pre-') : origin;

    if (activeClientId.toLowerCase().includes('w-arts') || activeClientId === 'client_1786751504755') {
      if (activeClientAppUrl && activeClientAppUrl.trim() !== '' && !activeClientAppUrl.includes('mandk') && !activeClientAppUrl.includes('mandk-app') && !activeClientAppUrl.includes('.ai.studio')) {
        return activeClientAppUrl.trim();
      }
      return `${baseUrl}/w-arts`;
    }

    if (activeClientId.toLowerCase().includes('mandk') || activeClientId === 'mandk') {
      if (activeClientAppUrl && activeClientAppUrl.trim() !== '' && !activeClientAppUrl.includes('w-arts') && !activeClientAppUrl.includes('mandk-app') && !activeClientAppUrl.includes('.ai.studio')) {
        return activeClientAppUrl.trim();
      }
      return `${baseUrl}/mandk`;
    }

    if (activeClientAppUrl && activeClientAppUrl.trim() !== '' && !activeClientAppUrl.includes('mandk-app') && !activeClientAppUrl.includes('.ai.studio')) {
      return activeClientAppUrl.trim();
    }

    return `${baseUrl}/${encodeURIComponent(activeClientId)}`;
  };

  const handleCopyShareableUrl = () => {
    const url = getShareableUrl();
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const DEFAULT_IMAGE = isWArts 
    ? `/api/custom-thumbnail?client=w-arts`
    : 'https://lh3.googleusercontent.com/d/19E4sOfw2iI6VXsijt6jHKZ0cZzdZ4pB2';
  const DEFAULT_TITLE = isWArts
    ? 'W-Arts - ¿Qué le pareció nuestro espectáculo?'
    : (isSpanish ? 'Portal de Opiniones de Clientes M&K' : 'M&K Customer Feedback Portal');
  const DEFAULT_DESC = isWArts
    ? 'Déjanos tu opinión y comentarios sobre nuestro espectáculo. ¡Tu valoración ayuda a mejorar cada presentación de W-Arts!'
    : (isSpanish ? 'Una breve descripción de la experiencia de opinión de clientes M&K.' : 'A short description of the M&K customer feedback experience.');
  const DEFAULT_DOMAIN = isWArts ? 'WARTSPRODUCCIONES.COM' : 'MANDKUSEDAUTOPARTS.COM';

  const [imageUrlInput, setImageUrlInput] = useState(DEFAULT_IMAGE);
  const [posX, setPosX] = useState(50);
  const [posY, setPosY] = useState(20); // Default to 20% vertical to keep heads/faces framed
  const [shareTitle, setShareTitle] = useState(DEFAULT_TITLE);
  const [shareDescription, setShareDescription] = useState(DEFAULT_DESC);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [benefitIndex, setBenefitIndex] = useState(0);
  const [isImprovingText, setIsImprovingText] = useState(false);

  const variations = isSpanish ? REVIEW_BENEFIT_VARIATIONS_ES : REVIEW_BENEFIT_VARIATIONS_EN;

  const handleImproveText = async () => {
    setIsImprovingText(true);
    const nextIdx = (benefitIndex + 1) % variations.length;
    setBenefitIndex(nextIdx);
    const fallback = variations[nextIdx];

    // Instantly apply next curated benefit text
    setShareTitle(fallback.title);
    setShareDescription(fallback.description);

    try {
      const response = await fetch('/api/improve-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentTitle: shareTitle,
          currentDescription: shareDescription,
          clientName: activeClientName
        })
      });
      const data = await response.json();
      if (data && data.success && data.title && data.description) {
        setShareTitle(data.title);
        setShareDescription(data.description);
      }
    } catch (err) {
      console.warn('[handleImproveText] API call error:', err);
    } finally {
      setIsImprovingText(false);
    }
  };

  const formattedImageUrl = formatDriveUrl(imageUrlInput);

  // Load existing Open Graph settings on mount
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`/api/custom-thumbnail-info?client=${encodeURIComponent(activeClientId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data && data.exists) {
          if (data.imageUrl) setImageUrlInput(data.imageUrl);
          else setImageUrlInput(DEFAULT_IMAGE);
          
          if (typeof data.posX === 'number') setPosX(data.posX);
          if (typeof data.posY === 'number') setPosY(data.posY);
          if (data.ogTitle) setShareTitle(data.ogTitle);
          else setShareTitle(DEFAULT_TITLE);
          if (data.ogDescription) setShareDescription(data.ogDescription);
          else setShareDescription(DEFAULT_DESC);
        } else {
          setImageUrlInput(DEFAULT_IMAGE);
          setShareTitle(DEFAULT_TITLE);
          setShareDescription(DEFAULT_DESC);
        }
      })
      .catch((err) => {
        console.warn('[SocialShareTab] Error loading thumbnail info:', err);
        if (isMounted) {
          setImageUrlInput(DEFAULT_IMAGE);
          setShareTitle(DEFAULT_TITLE);
          setShareDescription(DEFAULT_DESC);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeClientId, isWArts, isSpanish]);

  // Handle URL input change with auto-formatting for Google Drive links
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatDriveUrl(raw);
    setImageUrlInput(formatted);
  };

  // Render 1200x630 canvas to generate exact base64 image for server storage
  const generateCanvasBase64 = (imgSrc: string, xPct: number, yPct: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 630;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('');
          return;
        }

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 1200, 630);

        const targetRatio = 1200 / 630;
        const imgRatio = img.naturalWidth / img.naturalHeight;

        let renderWidth = 1200;
        let renderHeight = 630;
        let offsetX = 0;
        let offsetY = 0;

        if (imgRatio > targetRatio) {
          renderHeight = 630;
          renderWidth = 630 * imgRatio;
          const extraX = renderWidth - 1200;
          offsetX = -(extraX * (xPct / 100));
        } else {
          renderWidth = 1200;
          renderHeight = 1200 / imgRatio;
          const extraY = renderHeight - 630;
          offsetY = -(extraY * (yPct / 100));
        }

        ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          resolve(dataUrl);
        } catch (e) {
          console.warn('[SocialShareTab] Canvas cross-origin export failed, proceeding with image URL:', e);
          resolve('');
        }
      };
      img.onerror = () => resolve('');

      // If imgSrc is a remote URL, pass through our server proxy to guarantee CORS permission
      if (imgSrc.startsWith('http://') || imgSrc.startsWith('https://')) {
        img.src = `/api/proxy-image?url=${encodeURIComponent(imgSrc)}`;
      } else {
        img.src = imgSrc;
      }
    });
  };

  // Save Open Graph Thumbnail and metadata to server
  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    const activeImage = formattedImageUrl || DEFAULT_IMAGE;
    
    // Attempt rendering 1200x630 canvas
    const canvasBase64 = await generateCanvasBase64(activeImage, posX, posY);

    try {
      const response = await fetch('/api/custom-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: activeClientId,
          image: canvasBase64 || activeImage,
          imageUrl: activeImage,
          posX,
          posY,
          ogTitle: shareTitle.trim() || DEFAULT_TITLE,
          ogDescription: shareDescription.trim() || DEFAULT_DESC
        })
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        const data = await response.json().catch(() => ({}));
        setSaveError(data.error || 'Failed to save Open Graph settings.');
      }
    } catch (err: any) {
      console.error('[SocialShareTab] Save error:', err);
      setSaveError('Network error while saving settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Integrated Page Header & Live Link Toolbar */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 text-xs font-semibold uppercase tracking-wider mb-2">
              <Share2 className="w-3.5 h-3.5" />
              <span>{t('social.controlTag', 'Open Graph Metadata Control')}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {t('social.title', 'Social Share Card & Thumbnail Generator')}
            </h1>
            <p className="text-slate-500 text-xs mt-1">
              {t('social.desc', 'Configure the Open Graph thumbnail, title, and description displayed automatically when pasting your app link into Facebook or social platforms.')}
            </p>
          </div>

          {saveSuccess && (
            <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs shrink-0 animate-fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{t('social.saved', 'Settings Saved!')}</span>
            </div>
          )}
        </div>

        {/* Integrated Live Link Bar inside Header */}
        <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="p-1.5 bg-red-50 text-red-600 rounded-lg border border-red-100 shrink-0">
              <Link2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-900 shrink-0">{t('social.shareableLinkLabel', 'Card Generation Link')}:</span>
              <p className="text-xs font-mono font-semibold text-red-600 truncate select-all bg-red-50/60 px-2.5 py-1 rounded-md border border-red-100/80">
                {getShareableUrl()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyShareableUrl}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
                copiedLink
                  ? 'bg-emerald-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{t('social.copied', 'Copied!')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t('social.copyLink', 'Copy Link')}</span>
                </>
              )}
            </button>

            <a
              href={getShareableUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-200 shrink-0"
              title="Open link in a new tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">{t('social.openLink', 'Open')}</span>
            </a>

            <a
              href={`https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(getShareableUrl())}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-blue-200 shrink-0"
              title="Test & scrape link in Facebook Sharing Debugger"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">{t('social.testFacebook', 'Facebook Debugger')}</span>
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form Column */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
            {/* Image URL Input */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5 flex items-center justify-between">
                <span>{t('social.imageUrlLabel', 'Image URL')}</span>
                <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
              </label>
              <input
                type="url"
                value={imageUrlInput}
                onChange={handleUrlChange}
                placeholder={t('social.imageUrlPlaceholder', 'Paste direct image URL or Google Drive link...')}
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-red-100 focus:border-red-500 transition-all font-mono"
              />
              <span className="text-[11px] text-slate-400 block mt-1">
                {t('social.imageUrlHint', 'Supports direct image URLs and Google Drive shared links.')}
              </span>
            </div>

            {/* Image Position Adjustment */}
            <div className="space-y-3 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900">{t('social.positionLabel', 'Image Position')}</label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => { setPosX(50); setPosY(15); }}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                    title={t('social.headFocusTitle', 'Focus on Top / Face Area')}
                  >
                    <ArrowUp className="w-3 h-3 text-red-600" />
                    <span>{t('social.headFocus', 'Head Focus')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPosX(50); setPosY(50); }}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                    title={t('social.centerTitle', 'Center Image')}
                  >
                    <AlignCenter className="w-3 h-3 text-slate-600" />
                    <span>{t('social.center', 'Center')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPosX(50); setPosY(85); }}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                    title={t('social.bottomTitle', 'Focus on Bottom Area')}
                  >
                    <ArrowDown className="w-3 h-3 text-slate-600" />
                    <span>{t('social.bottom', 'Bottom')}</span>
                  </button>
                </div>
              </div>

              {/* Vertical Y Slider */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-600 font-medium mb-1">
                  <span>{t('social.vertPos', 'Vertical Position (Y):')}</span>
                  <span className="font-mono text-slate-900 font-bold">{posY}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={posY}
                  onChange={(e) => setPosY(Number(e.target.value))}
                  className="w-full accent-red-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {t('social.vertPosHint', 'Adjust vertically to ensure heads and faces are completely visible.')}
                </span>
              </div>

              {/* Horizontal X Slider */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-600 font-medium mb-1">
                  <span>{t('social.horizPos', 'Horizontal Position (X):')}</span>
                  <span className="font-mono text-slate-900 font-bold">{posX}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={posX}
                  onChange={(e) => setPosX(Number(e.target.value))}
                  className="w-full accent-red-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
              </div>
            </div>

            {/* AI Improve Text Control (Review Benefits) */}
            <div className="pt-3 border-t border-slate-100 flex flex-col items-start gap-1.5">
              <button
                type="button"
                onClick={handleImproveText}
                disabled={isImprovingText}
                className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-500 active:scale-95 text-slate-900 font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer border border-amber-300 select-none disabled:opacity-50"
                id="improve-og-text-btn"
              >
                <Sparkles className="w-4 h-4 fill-slate-900 text-slate-900 shrink-0" />
                <span>{isImprovingText ? t('social.improving', 'Improving...') : t('social.improveText', 'Improve Text')}</span>
              </button>
              <span className="text-[11px] text-slate-500 font-medium">
                {t('social.improveHint', 'Click again for a new version, feel free to edit.')}
              </span>
            </div>

            {/* Share Title Input */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                {t('social.shareTitleLabel', 'Share Title')}
              </label>
              <input
                type="text"
                value={shareTitle}
                onChange={(e) => setShareTitle(e.target.value)}
                placeholder={DEFAULT_TITLE}
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-red-100 focus:border-red-500 transition-all font-semibold text-slate-900"
              />
            </div>

            {/* Description Input */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                {t('social.descriptionLabel', 'Description')}
              </label>
              <textarea
                value={shareDescription}
                onChange={(e) => setShareDescription(e.target.value)}
                placeholder={DEFAULT_DESC}
                rows={3}
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-red-100 focus:border-red-500 transition-all text-slate-700"
              />
            </div>

            {/* Save Button */}
            {saveError && (
              <p className="text-xs text-red-600 font-semibold bg-red-50 p-2.5 rounded-xl border border-red-200">
                {saveError}
              </p>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t('social.saving', 'Saving Open Graph Settings...')}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{t('social.saveBtn', 'SAVE OPEN GRAPH SETTINGS')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Preview Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-red-600" />
                <span>{t('social.simulatedPreview', 'Social Link Card Preview')}</span>
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                  1200 × 630 px
                </span>
                <button
                  type="button"
                  onClick={handleCopyShareableUrl}
                  className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedLink ? t('social.copied', 'Copied!') : t('social.copyCardLink', 'Copy Link')}</span>
                </button>
              </div>
            </div>

            {/* Facebook Share Card Simulation */}
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 shadow-xs">
                {/* Simulated Thumbnail */}
                <div className="w-full aspect-[1200/630] bg-slate-900 overflow-hidden relative">
                  <img
                    src={formattedImageUrl || DEFAULT_IMAGE}
                    alt="Simulated share thumbnail"
                    className="w-full h-full object-cover transition-all duration-150"
                    style={{
                      objectPosition: `${posX}% ${posY}%`
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                    }}
                  />
                  <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono px-2.5 py-1 rounded-md border border-white/10">
                    1200 × 630 px preview
                  </div>
                </div>

                {/* Simulated Text Block */}
                <div className="p-4 bg-[rgb(240,242,245)] border-t border-slate-200 space-y-1">
                  <p className="text-[10px] font-mono uppercase text-slate-500 truncate">
                    {DEFAULT_DOMAIN}
                  </p>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1">
                    {shareTitle || DEFAULT_TITLE}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {shareDescription || DEFAULT_DESC}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
