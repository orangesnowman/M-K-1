import React, { useState } from 'react';
import { Copy, Check, Info, ArrowRight, Settings, Code, FileCode, CheckSquare } from 'lucide-react';
import { RoutingConfiguration } from '../types';

interface AppsScriptViewerProps {
  routingConfig: RoutingConfiguration;
  onConfigChange: (config: RoutingConfiguration) => void;
}

export default function AppsScriptViewer({ routingConfig, onConfigChange }: AppsScriptViewerProps) {
  const [copied, setCopied] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  const scriptCode = `/**
 * Google Apps Script to automate customer feedback email routing.
 * Attached to the Google Sheet receiving Google Form submissions.
 *
 * Designed by MandK App Workspace Expert.
 * 
 * @param {Object} e - The form submission trigger event object.
 */
function onFormSubmit(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var name, email, rating, comments, timestamp;

  // 1. Unpack Form submission parameters safely
  if (e && e.values) {
    // Standard trigger submission event array
    timestamp = e.values[0];
    name = e.values[1];
    email = e.values[2];
    rating = e.values[3];
    comments = e.values[4] || "";
  } else {
    // Fallback: If executed manually or test run from Apps Script editor
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      Logger.log("No data available in the spreadsheet to process.");
      return;
    }
    var range = sheet.getRange(lastRow, 1, 1, 5);
    var rowValues = range.getValues()[0];
    timestamp = rowValues[0];
    name = rowValues[1];
    email = rowValues[2];
    rating = rowValues[3];
    comments = rowValues[4] || "";
  }

  Logger.log("Processing submission: Name=" + name + ", Email=" + email + ", Rating=" + rating);

  // 2. Extract numeric rating digit (handles "5 Stars", "5 Stars - Excellent", "5", etc.)
  var ratingNumber = 0;
  if (rating) {
    var match = rating.toString().match(/\\d+/);
    if (match) {
      ratingNumber = parseInt(match[0], 10);
    } else {
      ratingNumber = parseInt(rating, 10) || 0;
    }
  }

  // 3. Define target routing email addresses and resource locations
  var COMPANY_LOGO_URL = "${routingConfig.companyLogoUrl || ''}";
  var SUPPORT_EMAIL = "${routingConfig.supportEmail}";
  var BUSINESS_SIGNATURE = \`${(routingConfig.businessSignature || 'Warmest regards,\nThe M&K Customer Team').replace(/`/g, '\\`').replace(/\n/g, '<br/>')}\`;
  var subject = "";
  var body = "";

  // 4. Branching routing logic based on the numeric rating
  if (ratingNumber === 5) {
    subject = \`${routingConfig.excellentSubject.replace(/`/g, '\\`').replace(/\${name}/g, '` + name + `')}\`;
    body = \`${routingConfig.excellentBody.replace(/`/g, '\\`').replace(/\${name}/g, '` + name + `').replace(/\${comments}/g, '` + comments + `').replace(/\${googleReviewsUrl}/g, routingConfig.googleReviewsUrl || 'https://g.page/r/CajrrF4R_V20EAI/review').replace(/\${signature}/g, '` + BUSINESS_SIGNATURE + `')}\`;
  } else if (ratingNumber === 4) {
    subject = \`${routingConfig.goodSubject.replace(/`/g, '\\`').replace(/\${name}/g, '` + name + `')}\`;
    body = \`${routingConfig.goodBody.replace(/`/g, '\\`').replace(/\${name}/g, '` + name + `').replace(/\${comments}/g, '` + (comments || "(No suggestions shared)") + `').replace(/\${googleReviewsUrl}/g, routingConfig.googleReviewsUrl || 'https://g.page/r/CajrrF4R_V20EAI/review').replace(/\${signature}/g, '` + BUSINESS_SIGNATURE + `')}\`;
  } else {
    // 1-3 Stars (Poor Feedback Escalation)
    subject = \`${routingConfig.poorSubject.replace(/`/g, '\\`').replace(/\${name}/g, '` + name + `')}\`;
    body = \`${routingConfig.poorBody.replace(/`/g, '\\`').replace(/\${name}/g, '` + name + `').replace(/\${comments}/g, '` + (comments || "(No feedback recorded)") + `').replace(/\${rating}/g, '` + rating + `').replace(/\${signature}/g, '` + BUSINESS_SIGNATURE + `')}\`;

    // Alert support/management team urgently about poor rating (1-3 Stars)
    try {
      GmailApp.sendEmail(
        SUPPORT_EMAIL,
        "⚠️ URGENT ESCALATION: Negative Feedback Received",
        "A critical customer feedback rating (" + rating + ") has been submitted by " + name + " (" + email + ")." +
        "\\n\\nComments:\\n" + comments +
        "\\n\\nPlease review the connected Sheet immediately."
      );
      Logger.log("Internal alert escalation email sent to: " + SUPPORT_EMAIL);
    } catch (err) {
      Logger.log("Failed to send internal alert email: " + err.toString());
    }
  }

  // 5. Send automated response email to the customer with carbon copy to support
  try {
    MailApp.sendEmail({
      to: email,
      cc: SUPPORT_EMAIL,
      subject: subject,
      htmlBody: body
    });
    Logger.log("Automated customer follow-up email dispatched successfully to: " + email + " (CC: " + SUPPORT_EMAIL + ")");
  } catch (error) {
    Logger.log("Error dispatching external email: " + error.toString());
  }
}`;

  const copyToClipboard = () => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = scriptCode;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("execCommand copy failed, falling back to navigator.clipboard:", err);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(scriptCode)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          })
          .catch(e => console.warn(e));
      }
    }
  };

  const steps = [
    {
      id: 1,
      title: 'Open Apps Script Editor',
      desc: 'In your Google Sheet, click Extensions on the top menu bar, then click Apps Script.'
    },
    {
      id: 2,
      title: 'Paste the Script',
      desc: 'Delete any pre-written code in the editor (like myFunction) and paste the feedback script on the right.'
    },
    {
      id: 3,
      title: 'Save Project',
      desc: 'Click the floppy disk icon or press Ctrl+S (Cmd+S on Mac) to save your code. You can rename the script to "FeedbackAutomator".'
    },
    {
      id: 4,
      title: 'Configure triggers',
      desc: 'In Apps Script, click Triggers (the alarm clock icon ⏰ on left rail), then click "+ Add Trigger" bottom-right.'
    },
    {
      id: 5,
      title: 'Set Submission Event',
      desc: 'Assign "onFormSubmit" as execution target. Set Event Source to "From spreadsheet" and Event Type to "On form submit". Click Save and approve the script permissions!'
    }
  ];

  const handleInputChange = (field: keyof RoutingConfiguration, value: string) => {
    onConfigChange({
      ...routingConfig,
      [field]: value
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="apps-script-section">
      {/* Left Column: Installation Steps */}
      <div className="lg:col-span-5 space-y-6">
        {/* Quick Logic Parameters Link Banner */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 text-white flex items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5" />
              <span>Logic Parameters</span>
            </h4>
            <p className="text-xs text-slate-300">
              Configure support emails, review links, and business signatures in the <strong>Logic Parameters</strong> tab.
            </p>
          </div>
        </div>

        {/* User Manual Guidelines */}
        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-1.5 bg-slate-200 text-slate-700 rounded-lg mt-0.5">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm">Installation Steps</h4>
              <p className="text-xs text-slate-500">Check off steps as you proceed with Google Sheets.</p>
            </div>
          </div>

          <div className="space-y-3.5">
            {steps.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveStep(s.id)}
                className={`w-full text-left p-3 rounded-xl border flex gap-3 transition-all ${
                  activeStep === s.id
                    ? 'bg-red-50/70 border-red-200 shadow-2xs'
                    : 'bg-white border-slate-100 hover:border-slate-200'
                }`}
                id={`step-btn-${s.id}`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  activeStep === s.id
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {s.id}
                </div>
                <div className="flex-1">
                  <span className="block text-xs font-semibold text-slate-800">{s.title}</span>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{s.desc}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 p-3.5 bg-yellow-50 text-yellow-800 border border-yellow-100 rounded-xl flex items-start gap-2.5 text-xs">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="leading-relaxed">
              <strong>Security Auth Note:</strong> When saving and configuring the trigger for the first time, Google will display a "Permissions Required" prompt. Click "Advanced" and proceed to authorize the script's email and sheet permissions.
            </p>
          </div>
        </div>
      </div>

      {/* Code Viewer Panel */}
      <div className="lg:col-span-7 flex flex-col h-full">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-md overflow-hidden flex-1 flex flex-col min-h-[500px]">
          {/* Editor Header */}
          <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              </div>
              <span className="h-4 w-[1px] bg-slate-800"></span>
              <div className="flex items-center gap-1.5 text-slate-400">
                <FileCode className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-mono font-medium">Code.gs</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-sans">JavaScript / Apps Script</span>
              </div>
            </div>

            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 rounded-lg text-xs font-medium text-slate-200 transition-colors"
              id="copy-script-button"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Script</span>
                </>
              )}
            </button>
          </div>

          {/* Script Content */}
          <div className="p-5 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto overflow-y-auto max-h-[600px] flex-1">
            <pre className="whitespace-pre">{scriptCode}</pre>
          </div>

          <div className="px-5 py-3 bg-slate-950 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center gap-2">
            <Code className="w-3.5 h-3.5 text-slate-600 font-mono" />
            <span>Parameters are generated dynamically based on your settings in the Logic Parameters tab.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
