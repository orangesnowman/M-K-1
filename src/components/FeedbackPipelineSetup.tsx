import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { createGoogleSheet } from '../services/googleWorkspace';
import { WorkspaceResources, ReviewRecord } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Sparkles,
  Sheet,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  User as UserIcon,
  LogOut,
  Layers,
  ArrowUpRight,
  Info,
  Star,
  Trash2,
  Zap,
  Search,
  Copy
} from 'lucide-react';

interface FeedbackPipelineSetupProps {
  user: User | null;
  token: string | null;
  resources: WorkspaceResources;
  onResourcesChange: (resources: WorkspaceResources | ((prev: WorkspaceResources) => WorkspaceResources)) => void;
  onLogin: () => void;
  onLogout: () => void;
  isLoggingIn: boolean;
  authError?: string | null;
  reviews?: ReviewRecord[];
  onClearReviews?: () => void;
  activeClientId?: string;
}

export default function FeedbackPipelineSetup({
  user,
  token,
  resources,
  onResourcesChange,
  onLogin,
  onLogout,
  isLoggingIn,
  authError = null,
  reviews = [],
  onClearReviews,
  activeClientId
}: FeedbackPipelineSetupProps) {
  const [pipelineName, setPipelineName] = useState('Customer Feedback Center');
  const [isDeploying, setIsDeploying] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deploymentLog, setDeploymentLog] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      return `${msg}. 💡 Help: Google Authorization is expired, missing, or needs fresh permissions! Click "Re-authorize Google" or "Connect Google Account" at the very top right of the page to refresh your token and accept permissions.`;
    }
    if (
      lower.includes('403') ||
      lower.includes('permission') ||
      lower.includes('forbidden')
    ) {
      return `${msg}. 💡 Help: You do not have edit permissions for this spreadsheet. If you are using the default template sheet, please click the "Deploy Workflow" or "Re-authorize & Setup" button on this tab to automatically provision a brand-new personal spreadsheet inside your own Google Drive!`;
    }
    return msg;
  };

  const handleDeployPipeline = async () => {
    setShowConfirm(false);
    setIsDeploying(true);
    setErrorMessage(null);
    setDeploymentLog([]);

    try {
      // Step 1
      setDeploymentLog((prev) => [...prev, 'Creating Google Sheet in Google Drive...']);
      const sheetTitle = `${pipelineName} (Automated Sheet)`;
      const sheetResult = await createGoogleSheet(token, sheetTitle);
      
      setDeploymentLog((prev) => [
        ...prev,
        `✓ Created Spreadsheet with ID: ${sheetResult.id.substring(0, 10)}...`,
        '✓ Populated standard header schema (Timestamp, Name, Email, Star Rating, Comments)...',
        'Pipeline deployment successfully finalized!'
      ]);

      onResourcesChange({
        spreadsheetId: sheetResult.id,
        spreadsheetUrl: sheetResult.url,
        formId: null,
        formUrl: null
      });
    } catch (err: any) {
      console.error('Core Pipeline Deployment Error:', err);
      const msg = formatExceptionMessage(err);
      setErrorMessage(msg);
      setDeploymentLog((prev) => [...prev, `✕ Error Details: ${msg}`, '✕ Deployment failed.']);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 lg:p-8" id="pipeline-setup-section">
      <div className="max-w-3xl mx-auto">
        
        {/* Welcome Auth Panel */}
        {!user ? (
          <div className="text-left py-10 px-6 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
            <div className="w-14 h-14 bg-red-50 text-red-650 rounded-2xl flex items-center justify-center mb-4 border border-red-100">
              <Sparkles className="w-6 h-6 text-red-650" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Authenticate with Google</h3>
            <p className="text-sm text-slate-500 max-w-md mt-2 mb-6">
              Grant permissions to setup, generate, and test Google Forms, Sheets, and branching Gmail integrations directly associated with your business ecosystem.
            </p>

            <div className="space-y-4">
              <button
                onClick={onLogin}
                disabled={isLoggingIn}
                className="gsi-material-button cursor-pointer flex items-center justify-center"
                id="google-signin-btn"
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents">Sign in with Google Account</span>
                </div>
              </button>

              <div className="max-w-md bg-red-50/50 rounded-2xl p-4 border border-red-100/40 text-left mt-2">
                <p className="text-xs text-slate-600 leading-normal flex gap-1.5">
                  <Info className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Sandbox Iframe Notice:</strong> Inside the sandboxed coding environment, Google's Sign-In window might be blocked or restricted by cross-origin security rules.
                  </span>
                </p>
                <div className="mt-3 flex items-center justify-between gap-3 bg-white/80 p-2.5 rounded-xl border border-red-50">
                  <span className="text-[11px] font-medium text-slate-500">Need a workaround?</span>
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-650 hover:bg-red-700 font-bold text-[11px] text-white rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Open in New Tab</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {authError && (
                <div className="mt-4 max-w-md text-sm text-rose-600 bg-rose-50 border border-rose-100 p-4 rounded-2xl text-left">
                  <div className="flex items-center gap-2 font-bold text-rose-800">
                    <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
                    <span>Popup Blocked or Auth Failed</span>
                  </div>
                  <p className="text-xs text-rose-600/90 leading-relaxed mt-2.5">
                    {authError}
                  </p>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Please make sure to click "Open in New Tab" above or authorize popups in your browser's address bar to successfully receive your authorization token.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Header with authenticated user             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                    <UserIcon className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="block text-xs text-slate-400">Authenticated Google User</span>
                    {!token && (
                      <span className="text-[9.5px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-sm border border-amber-200 animate-pulse">Session Expired</span>
                    )}
                  </div>
                  <span className="block text-sm font-semibold text-slate-800">{user.displayName || user.email}</span>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3.5 py-1.5 hover:bg-slate-200/60 active:bg-slate-200 text-xs font-semibold text-slate-600 rounded-lg transition-colors border border-slate-200/50"
                id="signout-button"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Change Account</span>
              </button>
            </div>

            {/* Config & Action */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-red-600 inline-block" />
                  Sheet Feedback
                </h3>
                <p className="text-xs text-slate-500 mt-1 mb-5">
                  Creates an individual synchronized Google Sheet blueprint ready for deployment to capture customer feedback instantly.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      File Names Prefix
                    </label>
                    <input
                      type="text"
                      value={pipelineName}
                      disabled={isDeploying}
                      onChange={(e) => setPipelineName(e.target.value)}
                      placeholder="e.g. Customer Satisfaction"
                      className="w-full text-sm px-4 py-2.5 border border-slate-400 rounded-xl focus:ring-2 focus:ring-red-100 focus:outline-hidden disabled:bg-slate-50 font-medium"
                      id="pipeline-name-input"
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (!token) {
                        if (onLogin) {
                          onLogin();
                        } else {
                          setErrorMessage('Please sign in to your Google Account first.');
                        }
                      } else {
                        setShowConfirm(true);
                      }
                    }}
                    disabled={isDeploying || !pipelineName}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 active:bg-red-850 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm rounded-xl shadow-md cursor-pointer transition-colors"
                    id="deploy-button"
                  >
                    {isDeploying ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Provisioning Ecosystem...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>{(!token && user) ? 'Re-authorize & Deploy' : 'Deploy'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Progress log */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 h-52 flex flex-col justify-between shadow-xs">
                <div>
                  <span className="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Automation Provisioning Logs
                  </span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {deploymentLog.length === 0 ? (
                      <span className="text-slate-500 text-xs font-mono italic">Waiting for deployment trigger...</span>
                    ) : (
                      deploymentLog.map((log, index) => (
                        <div key={index} className="text-xs font-mono text-slate-300 leading-normal">
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {errorMessage && (
                  <div className="mt-2 text-xs font-mono text-rose-400 border border-rose-950 bg-rose-500/10 p-2.5 rounded-lg flex flex-col gap-2 shadow-2xs">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 animate-pulse text-red-500" />
                      <span>{errorMessage}</span>
                    </div>
                    {(errorMessage.toLowerCase().includes('authorization') || 
                      errorMessage.toLowerCase().includes('credential') || 
                      errorMessage.toLowerCase().includes('oauth') || 
                      errorMessage.toLowerCase().includes('unauthorized') || 
                      errorMessage.toLowerCase().includes('token') || 
                      errorMessage.includes('401')) && onLogin && (
                      <div className="pt-1 select-none">
                        <button
                          type="button"
                          onClick={onLogin}
                          disabled={isLoggingIn}
                          className="text-[10px] sm:text-[11px] font-sans font-bold px-3 py-1.5 bg-red-650 hover:bg-red-750 text-white rounded-lg transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 shadow-3xs"
                          id="setup-error-auth-fix-btn"
                        >
                          {isLoggingIn && <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                          <span>Connect/Re-authorize Google Account</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Generated results cards */}
            {resources.spreadsheetId && (
              <div className="border border-slate-100 rounded-2xl bg-red-50/10 overflow-hidden shadow-2xs">
                <div className="px-5 py-3 bg-red-50/40 border-b border-red-50 flex items-center gap-2">
                  <CheckCircle2 className="w-4.5 h-4.5 text-red-600" />
                  <span className="text-xs font-bold text-red-900">Provisioned Resource Ecosystem Links</span>
                </div>

                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 gap-4">
                    {/* Sheet Card */}
                    <div className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col justify-between relative hover:border-slate-200 transition-all">
                      <div>
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center mb-3">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-800">Linked Responses Sheet</h4>
                        <p className="text-[10.5px] text-slate-500 mt-1 font-mono break-all leading-normal">
                          Spreadsheet ID: {resources.spreadsheetId}
                        </p>
                      </div>

                      <a
                        href={resources.spreadsheetUrl || ''}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-750"
                        id="view-sheet-link"
                      >
                        <span>Open Spreadsheet</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}



        {/* Visual Feedback Submissions Center */}
        <div className="mt-8 border border-slate-200 rounded-3xl bg-white shadow-2xs overflow-hidden">
          <div className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Sheet Feedback Center Logs</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Real-time monitoring log of all feedback and rating submissions routed to Google Sheets or captured locally.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
              {reviews.length > 0 && (
                <button
                  onClick={onClearReviews}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-rose-100 cursor-pointer"
                  id="clear-reviews-btn"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Logs</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {reviews.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-100">
                  <FileSpreadsheet className="w-5 h-5 text-slate-400" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">No submissions recorded yet</h4>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                  Once customers submit their feedback using the simulator or the active client forms, they will get populated here in real-time.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Quick stats panel */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Total Submissions</span>
                    <span className="block text-xl font-extrabold text-slate-800 mt-0.5">{reviews.length}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Positive (4-5 ★)</span>
                    <span className="block text-xl font-extrabold text-emerald-600 mt-0.5">
                      {reviews.filter(r => r.rating >= 4).length}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Critical (1-3 ★)</span>
                    <span className="block text-xl font-extrabold text-amber-600 mt-0.5">
                      {reviews.filter(r => r.rating <= 3).length}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Google Synced</span>
                    <span className="block text-xl font-extrabold text-blue-600 mt-0.5">
                      {reviews.filter(r => r.status === 'synced').length}
                    </span>
                  </div>
                </div>

                {/* List of submissions */}
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {reviews.map((review) => {
                    const isPositive = review.rating >= 4;
                    return (
                      <div 
                        key={review.id} 
                        className={`p-4 rounded-2xl border transition-all ${
                          isPositive 
                            ? 'bg-emerald-50/10 border-emerald-50 hover:border-emerald-100' 
                            : 'bg-amber-50/10 border-amber-50 hover:border-amber-100'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3.5 h-3.5 ${
                                    star <= review.rating
                                      ? 'text-amber-500 fill-amber-500'
                                      : 'text-slate-200 fill-slate-100'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {review.timestamp}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold font-mono">
                              Client: {review.clientName || review.clientId}
                            </span>
                            {review.status === 'synced' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Synced to Sheet</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                                <span>Local Sandbox Log</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 font-medium mt-3 leading-relaxed whitespace-pre-wrap">
                          "{review.comments}"
                        </p>

                        <div className="mt-3.5 pt-3 border-t border-slate-100/60 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px] uppercase">
                              {review.name.slice(0, 2)}
                            </div>
                            <div>
                              <span className="block text-xs font-bold text-slate-700">{review.name}</span>
                              <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{review.email}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Beautiful State-Driven Overlay Modal Dialog (Avoids Iframe blocks on window.confirm) */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto" id="confirmation-dialog">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={() => setShowConfirm(false)}></div>

          {/* Modal Container */}
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-slate-100">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 sm:mx-0 sm:h-10 sm:w-10">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-base font-bold leading-6 text-slate-900">
                      Set Up Google Feedback Pipeline?
                    </h3>
                    <div className="mt-2.5">
                      <p className="text-xs text-slate-500 leading-relaxed">
                        This workflow automates Google Sheets provisioning. It will generate a specific database spreadsheet in your linked Google Account:
                      </p>
                      <ul className="mt-3 space-y-2 text-xs font-medium text-slate-700 pl-1.5 list-disc list-inside">
                        <li>
                          Spreadsheet: <span className="font-mono text-emerald-600">"{pipelineName} (Automated Sheet)"</span>
                        </li>
                      </ul>
                      <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                        The columns are automatically mapped and structure-hardened to receive live submissions from your Live App instantly. Click "Authorize & Setup" to continue.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-slate-50 px-6 py-4 sm:flex sm:flex-row-reverse sm:gap-3 rounded-b-2xl">
                <button
                  type="button"
                  onClick={handleDeployPipeline}
                  className="inline-flex w-full justify-center rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-red-700 sm:w-auto cursor-pointer"
                  id="confirm-setup-btn"
                >
                  Authorize & Setup
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs ring-1 ring-inset ring-slate-200 hover:bg-slate-50 sm:mt-0 sm:w-auto cursor-pointer"
                  id="cancel-setup-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
