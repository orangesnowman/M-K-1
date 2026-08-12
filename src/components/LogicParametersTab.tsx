import React, { useState } from 'react';
import { Settings, Sliders, Mail, Link as LinkIcon, Star, CheckSquare, Sparkles, Building2, HelpCircle, Save, Check, FileCode, Play, AlertTriangle } from 'lucide-react';
import { RoutingConfiguration } from '../types';

interface LogicParametersTabProps {
  routingConfig: RoutingConfiguration;
  onConfigChange: (config: RoutingConfiguration) => void;
  onNavigateToScript?: () => void;
  onNavigateToSandbox?: () => void;
}

export default function LogicParametersTab({
  routingConfig,
  onConfigChange,
  onNavigateToScript,
  onNavigateToSandbox
}: LogicParametersTabProps) {
  const [savedNotice, setSavedNotice] = useState(false);

  const handleInputChange = (field: keyof RoutingConfiguration, value: any) => {
    onConfigChange({
      ...routingConfig,
      [field]: value
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8" id="logic-parameters-tab">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-zinc-900 rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-xl text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30">
              <Settings className="w-5 h-5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-red-400 bg-red-950/60 px-2.5 py-1 rounded-full border border-red-800/40">
              Automation Configuration
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Logic Parameters</h2>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Configure the default routing rules, email notification addresses, business signatures, review URLs, and threshold limits embedded in your feedback pipeline.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {onNavigateToSandbox && (
            <button
              onClick={onNavigateToSandbox}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border border-zinc-700 active:scale-95"
            >
              <Play className="w-3.5 h-3.5 text-yellow-400" />
              <span>Test in Simulator</span>
            </button>
          )}

          {onNavigateToScript && (
            <button
              onClick={onNavigateToScript}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer active:scale-95"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>View Apps Script Code</span>
            </button>
          )}
        </div>
      </div>

      {savedNotice && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs font-semibold animate-fade-in shadow-2xs">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Logic parameters updated and saved across all dispatch channels.</span>
        </div>
      )}

      {/* Main Grid Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Brand & Communication Settings */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Card 1: Brand & Contact Info */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Brand & Dispatch Identity</h3>
                <p className="text-xs text-slate-500">Set support recipient email, brand logo, and email sign-off.</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Company Logo Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Company Logo Resource Location (URL / Asset)</span>
                  <span className="text-[10px] font-normal text-slate-400">(Optional)</span>
                </label>
                <input
                  type="url"
                  value={routingConfig.companyLogoUrl || ''}
                  onChange={(e) => handleInputChange('companyLogoUrl', e.target.value)}
                  placeholder="e.g. https://yourcompany.com/assets/logo.png"
                  className="w-full text-sm px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-red-100 focus:border-red-500 transition-all font-mono"
                  id="tab-company-logo-url-input"
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  Hosted logo asset URL embedded into automated customer email headers.
                </span>
              </div>

              {/* Support Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Support Team Notification Email (Internal Alert for 1-3 Stars)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={routingConfig.supportEmail}
                    onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                    placeholder="e.g. support@yourcompany.com"
                    className="w-full text-sm pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-red-100 focus:border-red-500 transition-all font-mono"
                    id="tab-support-email-input"
                  />
                </div>
                <span className="text-[11px] text-slate-400 block mt-1">
                  Receives carbon copies and urgent escalation alerts when negative ratings (1-3 stars) occur.
                </span>
              </div>

              {/* Business Signature Area */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Business Signature Area</span>
                  <span className="text-[10px] text-slate-400 font-normal">(Included in email sign-off)</span>
                </label>
                <textarea
                  rows={3}
                  value={routingConfig.businessSignature ?? 'Warmest regards,\nThe M&K Customer Team'}
                  onChange={(e) => handleInputChange('businessSignature', e.target.value)}
                  placeholder="e.g. Warmest regards,&#10;The M&K Customer Team&#10;support@yourcompany.com"
                  className="w-full text-sm px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-red-100 focus:border-red-500 transition-all font-sans leading-relaxed"
                  id="tab-business-signature-input"
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  Appended dynamically as the sign-off block at the end of outbound follow-up emails.
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Threshold & Routing Rules */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Feedback Threshold & Gateways</h3>
                <p className="text-xs text-slate-500">Define rating cutoffs between public review links vs internal feedback.</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Star Threshold */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Direct Feedback Star Threshold
                </label>
                <select
                  value={routingConfig.starThreshold}
                  onChange={(e) => handleInputChange('starThreshold', parseInt(e.target.value, 10))}
                  className="w-full text-sm px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-red-100 focus:border-red-500 transition-all font-sans bg-white font-medium"
                  id="tab-star-threshold-select"
                >
                  <option value="1">1 Star or fewer (Bypass public reviews for 1 Star)</option>
                  <option value="2">2 Stars or fewer (Bypass public reviews for 1-2 Stars)</option>
                  <option value="3">3 Stars or fewer (Default: Bypass public reviews for 1-3 Stars)</option>
                  <option value="4">4 Stars or fewer (Bypass public reviews for 1-4 Stars)</option>
                  <option value="5">5 Stars or fewer (Bypass public reviews for all ratings)</option>
                </select>
                <span className="text-[11px] text-slate-400 block mt-1">
                  Ratings equal to or below this threshold trigger direct management escalation instead of Google Reviews link.
                </span>
              </div>

              {/* Google Reviews Directory URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Google Reviews Directory URL (Public Reviews)</span>
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                </label>
                <input
                  type="url"
                  value={routingConfig.googleReviewsUrl || ''}
                  onChange={(e) => handleInputChange('googleReviewsUrl', e.target.value)}
                  placeholder="e.g. https://g.page/r/..."
                  className="w-full text-sm px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-red-100 focus:border-red-500 transition-all font-mono"
                  id="tab-google-reviews-url-input"
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  Included in 4 & 5-Star email templates to encourage public Google reviews.
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Additional Review Platforms & Subject Lines */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Card 3: Additional Review Platforms */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <LinkIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Additional Review Platforms</h3>
                <p className="text-xs text-slate-500">Enable secondary platforms (Facebook, Yelp, BBB) for sequential sharing.</p>
              </div>
            </div>

            <div className="space-y-3.5">
              {/* Facebook */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={routingConfig.facebookEnabled}
                      onChange={(e) => handleInputChange('facebookEnabled', e.target.checked)}
                      className="rounded border-slate-300 text-red-600 focus:ring-red-500 w-4 h-4"
                    />
                    <span>Facebook Review Link</span>
                  </label>
                </div>
                {routingConfig.facebookEnabled && (
                  <input
                    type="url"
                    value={routingConfig.facebookUrl || ''}
                    onChange={(e) => handleInputChange('facebookUrl', e.target.value)}
                    placeholder="e.g. https://www.facebook.com/yourpage/reviews"
                    className="w-full text-xs px-3.5 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-100 font-mono bg-white"
                  />
                )}
              </div>

              {/* Yelp */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={routingConfig.yelpEnabled}
                      onChange={(e) => handleInputChange('yelpEnabled', e.target.checked)}
                      className="rounded border-slate-300 text-red-600 focus:ring-red-500 w-4 h-4"
                    />
                    <span>Yelp Review Link</span>
                  </label>
                </div>
                {routingConfig.yelpEnabled && (
                  <input
                    type="url"
                    value={routingConfig.yelpUrl || ''}
                    onChange={(e) => handleInputChange('yelpUrl', e.target.value)}
                    placeholder="e.g. https://www.yelp.com/biz/yourbusiness"
                    className="w-full text-xs px-3.5 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-100 font-mono bg-white"
                  />
                )}
              </div>

              {/* BBB */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={routingConfig.bbbEnabled}
                      onChange={(e) => handleInputChange('bbbEnabled', e.target.checked)}
                      className="rounded border-slate-300 text-red-600 focus:ring-red-500 w-4 h-4"
                    />
                    <span>Better Business Bureau (BBB) Link</span>
                  </label>
                </div>
                {routingConfig.bbbEnabled && (
                  <input
                    type="url"
                    value={routingConfig.bbbUrl || ''}
                    onChange={(e) => handleInputChange('bbbUrl', e.target.value)}
                    placeholder="e.g. https://www.bbb.org/us/..."
                    className="w-full text-xs px-3.5 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-100 font-mono bg-white"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Card 4: Email Subject Line Configurations */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Outbound Email Subject Templates</h3>
                <p className="text-xs text-slate-500">Customize the subject lines dispatched to customers based on rating level.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Excellent Rating (5 Stars)</span>
                  <span className="text-[10px] text-amber-500 font-bold">⭐⭐⭐⭐⭐</span>
                </label>
                <input
                  type="text"
                  value={routingConfig.excellentSubject}
                  onChange={(e) => handleInputChange('excellentSubject', e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-100 font-medium"
                  id="tab-excellent-subject-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Good Rating (4 Stars)</span>
                  <span className="text-[10px] text-amber-500 font-bold">⭐⭐⭐⭐</span>
                </label>
                <input
                  type="text"
                  value={routingConfig.goodSubject}
                  onChange={(e) => handleInputChange('goodSubject', e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-100 font-medium"
                  id="tab-good-subject-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Poor Rating (1-3 Stars Escalation)</span>
                  <span className="text-[10px] text-red-500 font-bold">⚠️ Urgent Alert</span>
                </label>
                <input
                  type="text"
                  value={routingConfig.poorSubject}
                  onChange={(e) => handleInputChange('poorSubject', e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-100 font-medium"
                  id="tab-poor-subject-input"
                />
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
