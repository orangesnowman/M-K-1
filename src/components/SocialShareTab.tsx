import React, { useState, useEffect, useRef } from 'react';
import { 
  Share2, 
  Globe, 
  Info, 
  Copy, 
  Check, 
  Sparkles, 
  Smartphone, 
  ExternalLink,
  Facebook,
  Twitter,
  Linkedin,
  Upload,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import socialThumbnail from '../assets/images/social_thumbnail_1784151879380.jpg';

interface SocialShareTabProps {
  activeClientName: string;
  activeClientId: string;
}

type Platform = 'facebook' | 'twitter' | 'linkedin';

export default function SocialShareTab({ activeClientName, activeClientId }: SocialShareTabProps) {
  const [activePlatform, setActivePlatform] = useState<Platform>('facebook');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [customThumbnail, setCustomThumbnail] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [posX, setPosX] = useState<number>(50);
  const [posY, setPosY] = useState<number>(50);

  // Load custom thumbnail for this client if it exists
  useEffect(() => {
    const saved = localStorage.getItem(`mk_custom_thumbnail_${activeClientId}`);
    const savedX = localStorage.getItem(`mk_custom_thumbnail_pos_x_${activeClientId}`);
    const savedY = localStorage.getItem(`mk_custom_thumbnail_pos_y_${activeClientId}`);
    const px = savedX ? parseInt(savedX, 10) : 50;
    const py = savedY ? parseInt(savedY, 10) : 50;

    if (saved) {
      setCustomThumbnail(saved);
      // Proactively sync existing browser thumbnail to server on mount to ensure server has it
      saveThumbnailToServer(saved, px, py);
    } else {
      setCustomThumbnail(null);
    }

    setPosX(px);
    setPosY(py);
    setUploadError(null);
  }, [activeClientId]);

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveThumbnailToServer = async (img: string | null, px: number, py: number) => {
    try {
      if (img) {
        const response = await fetch('/api/custom-thumbnail', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId: activeClientId,
            image: img,
            posX: px,
            posY: py,
          }),
        });
        if (!response.ok) {
          console.error('[SocialShareTab] Failed to save custom thumbnail to server:', response.statusText);
        } else {
          console.log('[SocialShareTab] Custom thumbnail synced to server successfully');
        }
      } else {
        const response = await fetch('/api/custom-thumbnail', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId: activeClientId,
          }),
        });
        if (!response.ok) {
          console.error('[SocialShareTab] Failed to delete custom thumbnail from server:', response.statusText);
        } else {
          console.log('[SocialShareTab] Custom thumbnail deleted from server successfully');
        }
      }
    } catch (err) {
      console.error('[SocialShareTab] Network error saving custom thumbnail to server:', err);
    }
  };

  const syncCoordinatesToServer = (img: string | null, px: number, py: number) => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    syncTimeoutRef.current = setTimeout(() => {
      saveThumbnailToServer(img, px, py);
    }, 500);
  };

  const updatePosX = (val: number) => {
    setPosX(val);
    localStorage.setItem(`mk_custom_thumbnail_pos_x_${activeClientId}`, val.toString());
    if (customThumbnail) {
      syncCoordinatesToServer(customThumbnail, val, posY);
    }
  };

  const updatePosY = (val: number) => {
    setPosY(val);
    localStorage.setItem(`mk_custom_thumbnail_pos_y_${activeClientId}`, val.toString());
    if (customThumbnail) {
      syncCoordinatesToServer(customThumbnail, posX, val);
    }
  };

  const shareUrl = `https://mandk-app-394492155492.us-west1.run.app/?client=${activeClientId}`;
  const shareText = `Check out our brand new customer feedback and review portal for ${activeClientName}! Scan our QR code or tap the link to share your experience with us! 🚀🔧🌟`;

  const copyToClipboard = (text: string, type: 'link' | 'text') => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  const handleFile = (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file (PNG, JPG, WEBP, or GIF).');
      return;
    }
    
    // Check file size (limit to 4.5MB for browser storage efficiency)
    if (file.size > 4.5 * 1024 * 1024) {
      setUploadError('File size is too large (maximum 4.5MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      if (base64Data) {
        try {
          setCustomThumbnail(base64Data);
          localStorage.setItem(`mk_custom_thumbnail_${activeClientId}`, base64Data);
          saveThumbnailToServer(base64Data, posX, posY);
        } catch (error) {
          setUploadError('Browser storage is full. Please try a smaller image.');
        }
      }
    };
    reader.onerror = () => {
      setUploadError('Error reading file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleReset = () => {
    setCustomThumbnail(null);
    localStorage.removeItem(`mk_custom_thumbnail_${activeClientId}`);
    localStorage.removeItem(`mk_custom_thumbnail_pos_x_${activeClientId}`);
    localStorage.removeItem(`mk_custom_thumbnail_pos_y_${activeClientId}`);
    setPosX(50);
    setPosY(50);
    setUploadError(null);
    saveThumbnailToServer(null, 50, 50);
  };

  const currentThumbnail = customThumbnail || socialThumbnail;

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 relative overflow-hidden border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-650/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-slate-800/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 text-left">
            <span className="px-2.5 py-1 text-[10px] font-extrabold bg-red-500/10 border border-red-500/20 text-red-400 rounded-md uppercase tracking-wider">
              Social Presence
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
              Social Media & Sharing Hub
            </h2>
            <p className="text-xs sm:text-sm text-slate-350 max-w-2xl leading-relaxed">
              Ensure high-fidelity visuals whenever customers or team members share the <strong>{activeClientName}</strong> portal online. Beautiful Open Graph metadata is baked-in.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              onClick={() => copyToClipboard(shareUrl, 'link')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold rounded-xl transition-all border border-slate-700/60 flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied Link!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Portal Link</span>
                </>
              )}
            </button>
            <a
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-lg shadow-red-900/10"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Launch Live Portal</span>
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: sharing controls and copying */}
        <div className="lg:col-span-1 space-y-6">
          {/* Custom Social Thumbnail Uploader */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs text-left space-y-5">
            <div>
              <h3 className="font-extrabold text-slate-950 text-sm">Portal Thumbnail Image</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Customize the preview image displayed when sharing the link online.</p>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-red-500 bg-red-50/30 shadow-inner' 
                  : 'border-slate-200 hover:border-red-500 hover:bg-slate-50/50'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className={`p-3 rounded-xl transition-colors ${isDragging ? 'bg-red-100 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
                  <Upload className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-700">Drag & drop thumbnail</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">or click to browse local files</span>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-[11px] text-red-700 leading-normal">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-600" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Image Preview & Controls */}
            <div className="space-y-4">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Active Image Source
              </label>
              
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0 relative animate-fade-in">
                  <img 
                    src={currentThumbnail} 
                    alt="Active Thumbnail" 
                    className="w-full h-full object-cover transition-all"
                    style={{ objectPosition: `${posX}% ${posY}%` }}
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <span className="block text-xs font-bold text-slate-800 truncate">
                    {customThumbnail ? 'Custom Image' : 'Default Cover'}
                  </span>
                  <span className="text-[10px] text-slate-450 block truncate">
                    {customThumbnail ? 'Stored locally in browser' : 'Default template cover'}
                  </span>
                </div>

                {customThumbnail && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                    title="Reset to Default"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Image Repositioning Controls */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Reposition Image</span>
                  </span>
                  <button
                    onClick={() => {
                      updatePosX(50);
                      updatePosY(50);
                    }}
                    className="text-[10px] font-bold text-red-650 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset Position</span>
                  </button>
                </div>

                {/* Slider for Horizontal Position */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-700">
                    <span>Horizontal (X)</span>
                    <span className="font-mono text-slate-400">{posX}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={posX}
                    onChange={(e) => updatePosX(parseInt(e.target.value, 10))}
                    className="w-full accent-red-600 bg-slate-100 rounded-lg appearance-none h-1.5 cursor-ew-resize"
                  />
                </div>

                {/* Slider for Vertical Position */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-700">
                    <span>Vertical (Y)</span>
                    <span className="font-mono text-slate-400">{posY}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={posY}
                    onChange={(e) => updatePosY(parseInt(e.target.value, 10))}
                    className="w-full accent-red-600 bg-slate-100 rounded-lg appearance-none h-1.5 cursor-ns-resize"
                  />
                </div>

                {/* Quick Alignment Presets Grid */}
                <div className="space-y-2">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick Snap Presets</span>
                  <div className="grid grid-cols-3 gap-1 max-w-[150px]">
                    {[
                      { label: '↖', x: 0, y: 0, title: 'Top Left' },
                      { label: '↑', x: 50, y: 0, title: 'Top Center' },
                      { label: '↗', x: 100, y: 0, title: 'Top Right' },
                      { label: '←', x: 0, y: 50, title: 'Middle Left' },
                      { label: '•', x: 50, y: 50, title: 'Center' },
                      { label: '→', x: 100, y: 50, title: 'Middle Right' },
                      { label: '↙', x: 0, y: 100, title: 'Bottom Left' },
                      { label: '↓', x: 50, y: 100, title: 'Bottom Center' },
                      { label: '↘', x: 100, y: 100, title: 'Bottom Right' }
                    ].map((preset, idx) => {
                      const isSelected = posX === preset.x && posY === preset.y;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            updatePosX(preset.x);
                            updatePosY(preset.y);
                          }}
                          title={preset.title}
                          className={`h-7 rounded text-xs font-bold transition-all flex items-center justify-center border cursor-pointer ${
                            isSelected
                              ? 'bg-red-550 border-red-550 text-white shadow-xs'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs text-left space-y-5">
            <div>
              <h3 className="font-extrabold text-slate-950 text-sm">Quick Share Composer</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Use this pre-generated copy to announce your portal on social channels.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  Pre-crafted Post Content
                </label>
                <div className="relative">
                  <textarea
                    readOnly
                    value={shareText}
                    className="w-full h-32 bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs text-slate-700 focus:outline-none resize-none font-medium leading-relaxed"
                  />
                  <button
                    onClick={() => copyToClipboard(shareText, 'text')}
                    className="absolute bottom-2.5 right-2.5 p-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg hover:text-slate-900 transition-colors shadow-xs"
                    title="Copy Text"
                  >
                    {copiedText ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  Direct Share Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 text-xs text-slate-500 font-mono overflow-ellipsis"
                  />
                  <button
                    onClick={() => copyToClipboard(shareUrl, 'link')}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex flex-col gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Useful tips</span>
              <ul className="space-y-2">
                <li className="flex gap-2 text-[11px] text-slate-600 leading-normal">
                  <span className="text-red-500">🔧</span>
                  <span><strong>Pin to Bio:</strong> Place your direct portal link on your Instagram, Facebook, and Twitter business bios.</span>
                </li>
                <li className="flex gap-2 text-[11px] text-slate-600 leading-normal">
                  <span className="text-red-500">🌟</span>
                  <span><strong>Email Footers:</strong> Embed the link in automated invoice and shipment notification emails to collect review signals.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right column: Interactive mockup previews */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-950 text-base">Interactive Feed Preview</h3>
                <p className="text-xs text-slate-500 mt-0.5">Toggle platforms to preview how major social crawlers render the link card.</p>
              </div>

              {/* Platform Switcher Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-xl gap-0.5 self-start sm:self-auto shrink-0">
                <button
                  onClick={() => setActivePlatform('facebook')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activePlatform === 'facebook'
                      ? 'bg-white text-blue-650 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Facebook className="w-3.5 h-3.5 shrink-0" />
                  <span>Facebook</span>
                </button>
                <button
                  onClick={() => setActivePlatform('twitter')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activePlatform === 'twitter'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Twitter className="w-3.5 h-3.5 shrink-0" />
                  <span>Twitter / X</span>
                </button>
                <button
                  onClick={() => setActivePlatform('linkedin')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activePlatform === 'linkedin'
                      ? 'bg-white text-blue-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Linkedin className="w-3.5 h-3.5 shrink-0" />
                  <span>LinkedIn</span>
                </button>
              </div>
            </div>

            {/* Simulated Feed Posts based on Platform */}
            <div className="space-y-4">
              {activePlatform === 'facebook' && (
                <div className="p-4 bg-white rounded-2xl border border-slate-200 max-w-xl mx-auto shadow-2xs">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-black text-white text-sm">
                      M
                    </div>
                    <div>
                      <span className="block text-xs font-black text-slate-900 leading-none">{activeClientName}</span>
                      <span className="text-[10px] text-slate-450 mt-1 block">Sponsored · Paid Announcement</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-750 mb-3 text-left leading-relaxed">
                    We appreciate our clients so much! Scan our QR counter standee or visit the link below to share your rating with us instantly. 🚀🔧🌟
                  </p>

                  {/* Facebook OG Card */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-[#f2f3f5] shadow-2xs cursor-pointer hover:bg-slate-50 transition-colors">
                    <div className="aspect-square w-full relative bg-slate-100 animate-fade-in">
                      <img
                        src={currentThumbnail}
                        alt="Facebook Social Share"
                        className="w-full h-full object-cover transition-all"
                        style={{ objectPosition: `${posX}% ${posY}%` }}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-3 text-left">
                      <span className="text-[9px] text-slate-450 uppercase font-bold tracking-wider">
                        mandk-app-394492155492.us-west1.run.app
                      </span>
                      <h4 className="text-xs font-extrabold text-slate-900 mt-0.5 line-clamp-1">
                        M&K Customer Feedback Portal
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        An intelligent feedback collection and automated review drafting portal for M&K Auto Parts. Features real-time Google Sheets tracking and direct Gmail delivery.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activePlatform === 'twitter' && (
                <div className="p-4 bg-white rounded-2xl border border-slate-200 max-w-xl mx-auto shadow-2xs">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center font-black text-white text-sm shrink-0">
                      𝕏
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-black text-slate-900 leading-none">{activeClientName}</span>
                        <span className="text-[10px] text-slate-450">@MandKParts · Just now</span>
                      </div>
                      <p className="text-xs text-slate-800 mt-2 mb-3 text-left leading-relaxed">
                        To serve you better, we've launched our new automated feedback and review workflow. Share your rating with us in seconds! 👇⚙️
                      </p>

                      {/* Twitter Card */}
                      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs cursor-pointer hover:border-slate-300 transition-all">
                        <div className="aspect-square w-full relative bg-slate-100 animate-fade-in">
                          <img
                            src={currentThumbnail}
                            alt="Twitter Card"
                            className="w-full h-full object-cover transition-all"
                            style={{ objectPosition: `${posX}% ${posY}%` }}
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="p-3 text-left">
                          <div className="flex items-center gap-1 text-[9px] text-slate-400 font-medium">
                            <Globe className="w-2.5 h-2.5" />
                            <span>mandk-app-394492155492.us-west1.run.app</span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 mt-0.5 line-clamp-1">
                            M&K Customer Feedback Portal
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                            Live workflow automation and intelligent feedback triggers.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activePlatform === 'linkedin' && (
                <div className="p-4 bg-white rounded-2xl border border-slate-200 max-w-xl mx-auto shadow-2xs">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-9 h-9 rounded-md bg-blue-850 flex items-center justify-center font-black text-white text-sm">
                      in
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 leading-none">{activeClientName}</span>
                        <span className="text-[10px] text-slate-400 font-medium">• 1st</span>
                      </div>
                      <span className="text-[10px] text-slate-450 mt-1 block">Automotive Logistics & Remanufacturing</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-750 mb-3 text-left leading-relaxed">
                    We are excited to share our latest technology milestone! An automated custom feedback and review portal utilizing live Google integrations and real-time review dispatching.
                  </p>

                  {/* LinkedIn Share Card */}
                  <div className="border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/50 transition-colors text-left">
                    <div className="aspect-square w-full relative bg-slate-100 animate-fade-in">
                      <img
                        src={currentThumbnail}
                        alt="LinkedIn Social Share"
                        className="w-full h-full object-cover transition-all"
                        style={{ objectPosition: `${posX}% ${posY}%` }}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-3 border-t border-slate-150">
                      <h4 className="text-xs font-extrabold text-slate-800 line-clamp-1">
                        M&K Customer Feedback Portal
                      </h4>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        mandk-app-394492155492.us-west1.run.app
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-amber-50/70 border border-amber-200/50 rounded-2xl text-left text-xs text-slate-700 flex items-start gap-3 mt-6 leading-relaxed">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Automated Crawl Synchronization:</strong> The application includes fully standard <code>&lt;meta&gt;</code> elements in the header of <code>index.html</code>. When social media scrapers request your portal's URL, the platforms automatically extract the high-resolution graphics, correct title, and portal descriptions perfectly.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
