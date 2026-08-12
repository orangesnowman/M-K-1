import { WorkspaceResources } from '../types';

// Helper for Base64URL encoding to construct RFC 2822 emails for Gmail API
function base64urlEncode(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  const b64 = window.btoa(binary);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Helper to execute Google API calls via our backend server-side CORS proxy.
 * This completely guarantees reliability by bypassing browser preflight blockages.
 */
async function fetchViaProxy(url: string, token: string, method: string, body?: any): Promise<Response> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'x-target-url': url
  };

  return fetch('/api/google-proxy', {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
}

/**
 * Robustly parses a response's JSON body. If the response failed or returned HTML/Text instead of JSON,
 * formats and throws an incredibly precise error description containing the HTML title if available.
 */
async function handleResponse(response: Response, errorContext: string): Promise<any> {
  const text = await response.text();
  
  if (!response.ok) {
    let errorDetail = `Status ${response.status}`;
    
    // Try to parse error as JSON
    try {
      const errJson = JSON.parse(text);
      errorDetail = errJson.error?.message || errJson.error || JSON.stringify(errJson);
    } catch (e) {
      // Fallback: Check if it's HTML
      if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
        const titleMatch = text.match(/<title>(.*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : 'HTML Error Page';
        errorDetail = `Server returned HTML page (${title}). This usually happens on 404 Route Not Found, auth redirects, or proxy issues.`;
      } else {
        errorDetail = text.substring(0, 150) || `Non-JSON response with status ${response.status}`;
      }
    }
    throw new Error(`${errorContext}: ${errorDetail}`);
  }

  // If ok, try parsing as JSON
  try {
    return JSON.parse(text);
  } catch (e: any) {
    if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
      const titleMatch = text.match(/<title>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : 'HTML Page';
      throw new Error(`${errorContext}: Expected JSON response but received HTML page (${title}).`);
    }
    throw new Error(`${errorContext}: Failed to parse JSON response: ${e.message}. Raw text: ${text.substring(0, 100)}...`);
  }
}

/**
 * Creates a brand new Google Spreadsheet with structured headers
 */
export async function createGoogleSheet(token: string, title: string): Promise<{ id: string; url: string }> {
  const response = await fetchViaProxy('https://sheets.googleapis.com/v4/spreadsheets', token, 'POST', {
    properties: {
      title: title
    },
    sheets: [
      {
        properties: {
          title: 'Form Responses 1',
          gridProperties: {
            frozenRowCount: 1
          }
        }
      }
    ]
  });

  const data = await handleResponse(response, 'Google Sheet Creation failed');
  console.log('Successfully created Google Sheet, parsing spreadsheet metadata...', data);
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  console.log(`Writing column headers to Google Sheet: ${spreadsheetId}...`);
  // Write structural headers: Timestamp, Name, Email, Star Rating, Comments
  const writeResponse = await fetchViaProxy(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Form Responses 1'!A1:E1?valueInputOption=USER_ENTERED`,
    token,
    'PUT',
    {
      values: [
        ['Timestamp', 'Customer Name', 'Email Address', 'Star Rating', 'Comments']
      ]
    }
  );

  await handleResponse(writeResponse, 'Populating Google Sheet table column headers failed');
  console.log('Successfully wrote column headers to Google Sheet.');
  return { id: spreadsheetId, url: spreadsheetUrl };
}

/**
 * Creates a beautiful Google Form with Star Rating choice and paragraph comment block
 */
export async function createGoogleForm(token: string, title: string): Promise<{ id: string; url: string }> {
  console.log('[FORM CLIENT] Sending request to create empty Google Form with title:', title);
  // Step 1: Create an empty form (Only info.title can be set on initial creation)
  const response = await fetchViaProxy('https://forms.googleapis.com/v1/forms', token, 'POST', {
    info: {
      title: title
    }
  });

  const formData = await handleResponse(response, 'Form creation failed');
  const formId = formData.formId;
  const formUrl = formData.responderUri || `https://docs.google.com/forms/d/${formId}/viewform`;
  console.log(`[FORM CLIENT] Created Form successfully. ID: ${formId}, URL: ${formUrl}. Running batchUpdate to configure fields...`);

  // Step 2: Add specific feedback questions & set form description (Omit location so they append sequentially automatically)
  console.log('[FORM CLIENT] Calling batchUpdate with questions...');
  const updateResponse = await fetchViaProxy(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, token, 'POST', {
    requests: [
      {
        updateFormInfo: {
          info: {
            description: 'Thank you for your business! Please help us improve by answering our short 4-question feedback form.'
          },
          updateMask: 'description'
        }
      },
      {
        createItem: {
          item: {
            title: 'Customer Name',
            questionItem: {
              question: {
                required: true,
                textQuestion: {}
              }
            }
          },
          location: { index: 0 }
        }
      },
      {
        createItem: {
          item: {
            title: 'Email Address',
            questionItem: {
              question: {
                required: true,
                textQuestion: {}
              }
            }
          },
          location: { index: 1 }
        }
      },
      {
        createItem: {
          item: {
            title: 'Star Rating',
            description: 'Select your level of satisfaction. (1-5 Stars)',
            questionItem: {
              question: {
                required: true,
                choiceQuestion: {
                  type: 'RADIO',
                  options: [
                    { value: '5 Stars - Excellent' },
                    { value: '4 Stars - Very Good' },
                    { value: '3 Stars - Satisfactory' },
                    { value: '2 Stars - Disappointing' },
                    { value: '1 Star - Unacceptable' }
                  ]
                }
              }
            }
          },
          location: { index: 2 }
        }
      },
      {
        createItem: {
          item: {
            title: 'Comments',
            description: 'Please share details of your experience.',
            questionItem: {
              question: {
                required: false,
                textQuestion: {
                  paragraph: true
                }
              }
            }
          },
          location: { index: 3 }
        }
      }
    ]
  });

  await handleResponse(updateResponse, 'Configuring Google Form fields failed');
  console.log('[FORM CLIENT] Successfully configured 4 questions and description via batchUpdate.');
  return { id: formId, url: formUrl };
}

/**
 * Sends a real email using Gmail API on behalf of the authorized user.
 * Confirms with user before performing.
 */
export async function sendGmailEmail(
  token: string,
  to: string,
  subject: string,
  htmlBody: string,
  cc?: string
): Promise<boolean> {
  const cleanTo = to.trim();
  const cleanSubject = subject.trim();

  // Helper to base64 encode UTF-8 safely
  const safeBase64 = (s: string) => {
    const bytes = new TextEncoder().encode(s);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) {
      bin += String.fromCharCode(bytes[i]);
    }
    return window.btoa(bin);
  };

  // Safe RFC 2047 encoding for Subject if it contains non-ASCII characters
  const encodedSubject = /[^\x00-\x7F]/.test(cleanSubject)
    ? `=?utf-8?B?${safeBase64(cleanSubject)}?=`
    : cleanSubject;

  const headersList = [
    `To: ${cleanTo}`
  ];

  if (cc && cc.trim()) {
    headersList.push(`Cc: ${cc.trim()}`);
  }

  headersList.push(
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    htmlBody
  );

  const headers = headersList.join('\r\n');

  const rawMessage = base64urlEncode(headers);

  const response = await fetchViaProxy('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', token, 'POST', {
    raw: rawMessage
  });

  await handleResponse(response, 'Gmail dispatch failed');
  return true;
}

/**
 * Appends a simulated response row to a Google Sheet
 */
export async function appendFeedbackToSheet(
  token: string,
  spreadsheetId: string,
  name: string,
  email: string,
  rating: number,
  comments: string
): Promise<boolean> {
  const timestamp = new Date().toLocaleString();
  const ratingText = `${rating} Star${rating > 1 ? 's' : ''}`;

  const rangesToTry = [
    "'Form Responses 1'!A:E",
    "Sheet1!A:E",
    "A:E"
  ];

  let lastError: any = null;

  for (const range of rangesToTry) {
    try {
      const encodedRange = encodeURIComponent(range);
      const response = await fetchViaProxy(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}:append?valueInputOption=USER_ENTERED`,
        token,
        'POST',
        {
          values: [[timestamp, name, email, ratingText, comments]]
        }
      );
      
      if (response.ok) {
        await handleResponse(response, 'Recording feedback to Sheet failed');
        return true;
      } else {
        const text = await response.text();
        let errorDetail = `Status ${response.status}`;
        try {
          const errJson = JSON.parse(text);
          errorDetail = errJson.error?.message || errJson.error || JSON.stringify(errJson);
        } catch {
          errorDetail = text.substring(0, 150) || `Non-JSON response with status ${response.status}`;
        }
        lastError = new Error(errorDetail);
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error('Recording feedback to Sheet failed on all tried ranges.');
}

/**
 * Lists Google Business Profile (formerly Google My Business) accounts associated with the authenticated Google user.
 */
export async function listGmbAccounts(token: string): Promise<any[]> {
  const response = await fetchViaProxy(
    'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
    token,
    'GET'
  );
  const data = await handleResponse(response, 'Failed to fetch Google My Business accounts');
  return data.accounts || [];
}

/**
 * Lists locations within a specific Google Business Profile account.
 */
export async function listGmbLocations(token: string, accountName: string): Promise<any[]> {
  // accountName is in the format "accounts/{accountId}"
  const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,storefrontAddress`;
  const response = await fetchViaProxy(url, token, 'GET');
  const data = await handleResponse(response, 'Failed to fetch Google My Business locations');
  return data.locations || [];
}

/**
 * Lists reviews for a specific Google Business Profile location.
 */
export async function listGmbReviews(token: string, accountName: string, locationName: string): Promise<any[]> {
  // locationName can be "locations/{locationId}" or already "accounts/{accountId}/locations/{locationId}"
  let fullPath = locationName;
  if (!locationName.startsWith('accounts/')) {
    fullPath = `${accountName}/${locationName}`;
  }
  const url = `https://mybusiness.googleapis.com/v4/${fullPath}/reviews`;
  const response = await fetchViaProxy(url, token, 'GET');
  const data = await handleResponse(response, 'Failed to fetch Google My Business reviews');
  return data.reviews || [];
}

