import React from 'react';
import { User } from 'firebase/auth';
import { FileSpreadsheet, FileCode, CheckCircle2, ArrowRight } from 'lucide-react';
import { WorkspaceResources, ReviewRecord, RoutingConfiguration } from '../types';
import FeedbackPipelineSetup from './FeedbackPipelineSetup';
import AppsScriptViewer from './AppsScriptViewer';
import { useLanguage } from '../i18n/LanguageContext';

interface SheetAndScriptTabProps {
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
  routingConfig: RoutingConfiguration;
  onConfigChange: (config: RoutingConfiguration) => void;
}

export default function SheetAndScriptTab({
  user,
  token,
  resources,
  onResourcesChange,
  onLogin,
  onLogout,
  isLoggingIn,
  authError,
  reviews,
  onClearReviews,
  activeClientId,
  routingConfig,
  onConfigChange
}: SheetAndScriptTabProps) {
  const { t } = useLanguage();

  return (
    <div className="max-w-6xl mx-auto space-y-10" id="sheet-and-script-unified-tab">
      
      {/* Hero Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-zinc-900 rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-xl text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/40">
              {t('setup.pipelineTag', 'Complete Google Workspace Pipeline')}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{t('setup.pipelineTitle', 'Google Sheet')}</h2>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            {t('setup.pipelineDesc', 'Provision your Google Sheet database, manage live feedback records, and deploy the Google Apps Script automation trigger all in one unified workspace.')}
          </p>
        </div>

        {/* Status Pills */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
          <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-semibold text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{t('setup.syncedStatus', 'Sheet & Script Synchronized')}</span>
          </div>
        </div>
      </div>

      {/* Part 1: Google Sheet Provisioning & Feedback Storage */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl font-extrabold text-sm border border-emerald-100 flex items-center justify-center w-9 h-9">
            1
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>{t('setup.part1Title', 'Google Sheet Database & Feedback Logs')}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {t('setup.part1Desc', 'Provision or link your Google Sheet spreadsheet to automatically record customer submissions.')}
            </p>
          </div>
        </div>

        <FeedbackPipelineSetup
          user={user}
          token={token}
          resources={resources}
          onResourcesChange={onResourcesChange}
          onLogin={onLogin}
          onLogout={onLogout}
          isLoggingIn={isLoggingIn}
          authError={authError}
          reviews={reviews}
          onClearReviews={onClearReviews}
          activeClientId={activeClientId}
        />
      </div>

      {/* Part 2: Google Apps Script Automation Code */}
      <div className="space-y-4 pt-6">
        <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
          <div className="p-2 bg-red-50 text-red-600 rounded-xl font-extrabold text-sm border border-red-100 flex items-center justify-center w-9 h-9">
            2
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileCode className="w-5 h-5 text-red-600" />
              <span>Google Apps Script Code & Setup Steps</span>
            </h3>
            <p className="text-xs text-slate-500">
              Copy your dynamically configured Google Apps Script (`Code.gs`) into Extensions &gt; Apps Script in your spreadsheet.
            </p>
          </div>
        </div>

        <AppsScriptViewer
          routingConfig={routingConfig}
          onConfigChange={onConfigChange}
        />
      </div>

    </div>
  );
}
