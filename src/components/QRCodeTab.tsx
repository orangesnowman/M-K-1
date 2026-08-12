import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink, 
  Download, 
  Share2, 
  Smartphone, 
  Printer, 
  Info,
  Layers,
  Sparkles,
  Palette,
  Layout,
  Eye,
  EyeOff,
  Save,
  Globe
} from 'lucide-react';
import qrMockup from '../assets/images/feedback_portal_qrcode_1783873611840.jpg';
import socialThumbnail from '../assets/images/social_thumbnail_1784151879380.jpg';

interface QRCodeTabProps {
  activeClientName: string;
  activeClientId: string;
}

type QRTheme = 'classic-light' | 'cyber-dark';
type QRColor = 'pure-bw' | 'slate-grey';
type LogoStyle = 'monochromatic' | 'crimson';

export default function QRCodeTab({ activeClientName, activeClientId }: QRCodeTabProps) {
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  
  // Customization states - Default strictly to Cyber Dark with Pure Black & White (B&W) and Monochromatic logo!
  const [qrTheme, setQrTheme] = useState<QRTheme>('cyber-dark');
  const [qrColor, setQrColor] = useState<QRColor>('pure-bw');
  const [logoStyle, setLogoStyle] = useState<LogoStyle>('monochromatic');
  const [showLogo, setShowLogo] = useState(true);
  const [customUrl, setCustomUrl] = useState(() => {
    try {
      return localStorage.getItem(`g_qr_custom_url_${activeClientId}`) || '';
    } catch {
      return '';
    }
  });
  const [saveFeedback, setSaveFeedback] = useState(false);

  // Sync custom URL when active client changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`g_qr_custom_url_${activeClientId}`) || '';
      setCustomUrl(saved);
    } catch (e) {
      console.error('Failed to load custom URL:', e);
    }
  }, [activeClientId]);

  const handleSaveUrl = () => {
    try {
      localStorage.setItem(`g_qr_custom_url_${activeClientId}`, customUrl);
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 2000);
    } catch (e) {
      console.error('Failed to save custom URL:', e);
    }
  };

  const handleClearUrl = () => {
    try {
      setCustomUrl('');
      localStorage.setItem(`g_qr_custom_url_${activeClientId}`, '');
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 2000);
    } catch (e) {
      console.error('Failed to clear custom URL:', e);
    }
  };

  // Get exact live application URL for this client
  const getLiveUrl = () => {
    return `https://mandk-app-394492155492.us-west1.run.app/?mode=live&client=${activeClientId}`;
  };

  const liveUrl = getLiveUrl();
  const targetUrl = customUrl.trim() !== '' ? customUrl.trim() : liveUrl;
  
  // Resolve QR colors based on choices
  const getQrColors = () => {
    if (qrTheme === 'cyber-dark') {
      return {
        fg: qrColor === 'pure-bw' ? 'ffffff' : '55575e', // Solid clean white or a matte slate-grey exactly like the example
        bg: '000000', // Solid pitch black background
        bgClass: 'bg-black',
        textClass: 'text-white'
      };
    } else {
      return {
        fg: qrColor === 'pure-bw' ? '000000' : '475569', // Solid classic black or sharp slate-grey
        bg: 'ffffff', // Crisp white background
        bgClass: 'bg-white',
        textClass: 'text-slate-900'
      };
    }
  };

  const colors = getQrColors();
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&color=${colors.fg}&bgcolor=${colors.bg}&data=${encodeURIComponent(targetUrl)}`;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(targetUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error('Failed to copy text: ', err));
  };

  const clientInitials = activeClientId === 'mandk' ? 'MK' : activeClientName.substring(0, 2).toUpperCase();

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const isCyber = qrTheme === 'cyber-dark';
      const printBg = isCyber ? '#000000' : '#ffffff';
      const printFg = isCyber ? '#ffffff' : '#0f172a';
      const printLogoBg = isCyber ? '#000000' : '#ffffff';
      const printLogoColor = logoStyle === 'crimson' 
        ? '#dc2626' 
        : isCyber ? '#ffffff' : '#000000';
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Code - ${activeClientName}</title>
            <style>
              body {
                font-family: 'Inter', system-ui, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                text-align: center;
                background-color: ${isCyber ? '#090d16' : '#f8fafc'};
                color: ${printFg};
              }
              .container {
                border: 2px solid ${isCyber ? '#1e293b' : '#e2e8f0'};
                background-color: ${printBg};
                border-radius: 32px;
                padding: 48px;
                max-width: 450px;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                display: flex;
                flex-direction: column;
                align-items: center;
              }
              .logo {
                font-weight: 900;
                font-size: 28px;
                color: ${printLogoColor};
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 2px;
                font-family: 'Space Grotesk', sans-serif;
              }
              .subtitle {
                font-size: 14px;
                color: ${isCyber ? '#94a3b8' : '#64748b'};
                margin-bottom: 32px;
                font-weight: 500;
              }
              .qr-container {
                position: relative;
                width: 250px;
                height: 250px;
                margin-bottom: 32px;
                background-color: ${printBg};
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .qr-image {
                width: 100%;
                height: 100%;
              }
              .center-logo {
                position: absolute;
                width: 52px;
                height: 52px;
                background-color: ${printLogoBg};
                border: 3px solid ${printLogoBg};
                display: ${showLogo ? 'flex' : 'none'};
                align-items: center;
                justify-content: center;
                font-weight: 900;
                font-size: 18px;
                letter-spacing: -0.5px;
                color: ${printLogoColor};
                border-radius: 0px;
              }
              .instruction {
                font-size: 18px;
                font-weight: 800;
                margin-bottom: 8px;
                color: ${printFg};
              }
              .footer {
                font-size: 12px;
                color: ${isCyber ? '#475569' : '#94a3b8'};
                margin-top: 24px;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-weight: bold;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">${activeClientName}</div>
              <div class="subtitle">We value your experience!</div>
              <div class="qr-container">
                <img src="${qrApiUrl}" class="qr-image" alt="QR Code" />
                <div class="center-logo">
                  ${clientInitials}
                </div>
              </div>
              <div class="instruction">Scan to Share Your Feedback</div>
              <div class="subtitle">Thank you for helping us grow!</div>
              <div class="footer">Powered by M&K Feedback System</div>
            </div>
            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in" id="qr-code-section">
      {/* QR Code Presentation Panel */}
      <div className="lg:col-span-5 flex flex-col h-full space-y-6">
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex-1 flex flex-col items-start text-left justify-between">
          <div className="w-full">
            <div className="flex items-center justify-start gap-2 mb-2">
              <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-650 rounded-full">
                Step 4 Deliverable
              </span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg">Custom Branded QR Code</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6 max-w-sm">
              Scan this dynamic QR code to access the active, live customer feedback portal configured for <span className="font-bold text-red-650">{activeClientName}</span>.
            </p>
          </div>

          {/* Styled QR Container with customizable Theme */}
          <div className={`relative flex items-center justify-center group transition-all duration-300 ${colors.bgClass}`}>
            <div className="relative w-56 h-56 flex items-center justify-center">
              <img 
                src={qrApiUrl} 
                alt="Live App QR Code" 
                className="w-full h-full object-contain relative transition-transform duration-300 group-hover:scale-102"
                referrerPolicy="no-referrer"
              />
              {showLogo && (
                <div 
                  className="absolute z-20 w-14 h-14 flex items-center justify-center select-none font-sans font-black tracking-tight border-2"
                  style={{ 
                    backgroundColor: qrTheme === 'cyber-dark' ? '#000000' : '#ffffff',
                    borderColor: qrTheme === 'cyber-dark' ? '#000000' : '#ffffff',
                    borderRadius: '0px' // Perfect sharp square! Matching the user's uploaded image style!
                  }}
                >
                  {activeClientId === 'mandk' ? (
                    <span className={`text-base font-black tracking-tighter scale-110 ${
                      logoStyle === 'crimson' 
                        ? 'text-red-600' 
                        : qrTheme === 'cyber-dark' 
                          ? 'text-white' 
                          : 'text-black'
                    }`}>
                      MK
                    </span>
                  ) : (
                    <span className={`text-xs font-black tracking-tighter ${
                      logoStyle === 'crimson' 
                        ? 'text-red-500' 
                        : qrTheme === 'cyber-dark' 
                          ? 'text-white' 
                          : 'text-slate-900'
                    }`}>
                      {clientInitials}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="w-full mt-6 space-y-3">
            {/* Quick URL Box */}
            <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-100 flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono text-slate-500 truncate text-left flex-1 pl-1.5 select-all">
                {targetUrl}
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200/60 active:scale-95 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Print Standee</span>
              </button>

              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold transition-all border border-slate-200 active:scale-95"
              >
                <span>Launch Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Deployment, Customization & Marketing Info Panel */}
      <div className="lg:col-span-7 space-y-6">
        {/* QR Customizer Interface */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-red-50 text-red-650 rounded-xl">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">QR Code Designer</h3>
              <p className="text-xs text-slate-500">Fine-tune colors, logo cutouts, and visual styling.</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Destination URL Override */}
            <div className="pb-4 border-b border-slate-100">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">QR Code Destination Address</label>
                <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-red-50 text-red-650 font-mono">
                  {customUrl.trim() !== '' ? 'Short Override Active' : 'Default Application Address'}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder={`Auto-configured: ${liveUrl}`}
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-600 focus:bg-white focus:ring-1 focus:ring-red-600 transition-all shadow-2xs"
                  />
                  <button
                    onClick={handleSaveUrl}
                    className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
                  >
                    {saveFeedback ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Saved!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Address</span>
                      </>
                    )}
                  </button>
                  {customUrl.trim() !== '' && (
                    <button
                      onClick={handleClearUrl}
                      className="px-3 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-700 font-semibold text-xs rounded-xl transition-all active:scale-95 flex items-center justify-center shrink-0"
                      title="Reset to default URL"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  By default, the QR targets the live app URL with correct routing keys. If you use custom redirect URLs or short links (e.g., <span className="font-mono text-slate-750 font-bold bg-slate-100 px-1.5 py-0.5 rounded">bit.ly/mk-review</span>), paste it above and click **Save Address** to persistently compile a high-contrast QR pointing to your short address.
                </p>
              </div>
            </div>

            {/* 1. Theme Picker */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">QR Visual Theme</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setQrTheme('classic-light')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    qrTheme === 'classic-light'
                      ? 'bg-slate-50 border-slate-900 text-slate-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-white border border-slate-300 inline-block"></span>
                  <span>Classic Light Theme</span>
                </button>
                <button
                  onClick={() => setQrTheme('cyber-dark')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    qrTheme === 'cyber-dark'
                      ? 'bg-slate-950 border-slate-900 text-white shadow-md'
                      : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-black border border-slate-800 inline-block"></span>
                  <span>Cyber Dark Theme</span>
                </button>
              </div>
            </div>

            {/* 2. Pixel Color Picker */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Pixel Base Color</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setQrColor('pure-bw')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                    qrColor === 'pure-bw'
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Strict B&W (High Contrast)
                </button>
                <button
                  onClick={() => setQrColor('slate-grey')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                    qrColor === 'slate-grey'
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Sleek Matte Slate (Muted Grey)
                </button>
              </div>
            </div>

            {/* 3. Center Logo Text Color Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Center Logo Accent Color</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setLogoStyle('monochromatic')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                    logoStyle === 'monochromatic'
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Strict Monochromatic (B&W)
                </button>
                <button
                  onClick={() => setLogoStyle('crimson')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                    logoStyle === 'crimson'
                      ? 'bg-red-600 border-red-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Brand Crimson Red
                </button>
              </div>
            </div>

            {/* 4. Center Logo Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Center Logo Mask Square</span>
                <span className="text-[11px] text-slate-500">Places custom initials or brand text in a stylized center cutout.</span>
              </div>
              <button
                onClick={() => setShowLogo(!showLogo)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                  showLogo 
                    ? 'bg-red-50 border-red-200 text-red-650'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                {showLogo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span>{showLogo ? 'Visible' : 'Hidden'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-red-50 text-red-650 rounded-xl">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Ecosystem Marketing Deck</h3>
              <p className="text-xs text-slate-500">Engage customers directly where operations occur.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Table Tent Option */}
            <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <Printer className="w-4 h-4 text-red-650" />
                  Printable Table Stand
                </h4>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  Generate an elegant 4"x6" table tent to place on front desks, customer waiting lobbies, or cash registers. Give users a seamless route to submit thoughts.
                </p>
              </div>
              <button
                onClick={handlePrint}
                className="mt-4 text-xs font-bold text-red-650 hover:text-red-750 flex items-center gap-1 self-start"
              >
                <span>Preview Print Template</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Offline Mockup Card */}
            <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-red-650" />
                  Pre-compiled QR Asset
                </h4>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  Use the bundled offline asset compiled directly in your assets folder. Designed for permanent, legacy print materials.
                </p>
              </div>
              <a
                href={qrMockup}
                download={`feedback_portal_qrcode_${activeClientId}.jpg`}
                className="mt-4 text-xs font-bold text-red-650 hover:text-red-750 flex items-center gap-1 self-start"
              >
                <span>Download Asset</span>
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="mt-5 p-4 bg-red-50/20 text-red-900 border border-red-50/40 rounded-2xl text-xs flex gap-3">
            <Info className="w-4 h-4 mt-0.5 text-red-650 shrink-0" />
            <div>
              <p className="font-bold">Automated Client Scoping</p>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                The QR code automatically embeds the <span className="font-semibold text-slate-900">client={activeClientId}</span> routing key. When scanned, it instantly boots up the feedback portal with the active brand name, review platforms, and Sheets integration configured specifically for this client!
              </p>
            </div>
          </div>
        </div>

        {/* Visual Mockup Display */}
        <div className="bg-[#0c101d] rounded-3xl border border-slate-900 p-6 text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
          <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 text-red-400">
              <Smartphone className="w-4 h-4 animate-bounce" />
              <span className="text-[10px] font-black uppercase tracking-widest">Mobile Layout Preview</span>
            </div>
            <h4 className="text-base font-black tracking-tight text-white leading-tight">
              Fully Responsive Customer Portal
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              The feedback collector is carefully optimized for iOS & Android devices. Scanning takes customers straight to the star-selection slider without requiring app downloads.
            </p>
          </div>

          {/* Smart Phone Container Mockup */}
          <div className="w-56 bg-slate-950 rounded-3xl border-4 border-slate-800 p-2.5 relative shadow-xl shrink-0">
            {/* Dynamic Clock bar */}
            <div className="flex justify-between items-center px-2 pb-2 text-[8px] font-mono text-slate-400">
              <span>{currentTime || '12:00'}</span>
              <div className="w-12 h-3.5 bg-slate-800 rounded-full absolute top-1 left-1/2 -translate-x-1/2 flex items-center justify-center">
                <div className="w-2.5 h-1.5 bg-black rounded-full"></div>
              </div>
              <div className="flex gap-1 items-center">
                <span>5G</span>
                <span className="w-2.5 h-1.5 bg-emerald-500 rounded-2xs"></span>
              </div>
            </div>

            {/* Simulated Live View */}
            <div className="bg-white rounded-2xl p-3 text-[#0f172a] font-sans h-56 overflow-hidden flex flex-col justify-between relative select-none">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                  <div className="w-5 h-5 rounded bg-red-650 flex items-center justify-center text-[8px] text-white font-black">
                    {activeClientName.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-[9px] font-black text-slate-800 truncate max-w-[120px]">{activeClientName}</span>
                </div>
                
                <p className="text-[9px] font-bold text-left text-slate-800 pt-1">
                  How was your experience with us?
                </p>

                {/* 5 Star Stars Mockup */}
                <div className="flex justify-start gap-1 pt-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <span key={s} className="text-sm text-amber-400">★</span>
                  ))}
                </div>
                
                <div className="bg-slate-50 border border-slate-150 rounded-lg p-1.5 text-[8px] text-slate-500 leading-normal text-left">
                  <p className="font-semibold text-slate-700">Automated Split Routing Active</p>
                  Excellent ratings suggest public review sites. Direct feedback routes to Gmail Alerts.
                </div>
              </div>

              <div className="text-[7px] text-slate-400 text-left border-t border-slate-100 pt-1.5 flex items-center justify-start gap-1">
                <Sparkles className="w-2.5 h-2.5 text-red-500" />
                <span>Verified Feedback Portal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

