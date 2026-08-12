import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Firebase Firestore for durable custom thumbnail storage across Cloud Run instances
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  let db: any = null;
  if (fs.existsSync(configPath)) {
    try {
      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const firebaseApp = initializeApp(firebaseConfig);
      db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
      console.log('[SERVER] Firebase Firestore initialized successfully with databaseId:', firebaseConfig.firestoreDatabaseId);
    } catch (err) {
      console.error('[SERVER] Failed to initialize Firebase:', err);
    }
  }

  enum OperationType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LIST = 'list',
    GET = 'get',
    WRITE = 'write',
  }

  interface FirestoreErrorInfo {
    error: string;
    operationType: OperationType;
    path: string | null;
    authInfo: {
      userId?: string | null;
      email?: string | null;
      emailVerified?: boolean | null;
      isAnonymous?: boolean | null;
      tenantId?: string | null;
      providerInfo?: {
        providerId?: string | null;
        email?: string | null;
      }[];
    }
  }

  function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: null,
        email: null,
        emailVerified: null,
        isAnonymous: null,
        tenantId: null,
        providerInfo: []
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  }

  // Middlewares to parse JSON content with a generous limit for base64 thumbnails
  app.use(express.json({ limit: '10mb' }));

  // Google APIs CORS proxy endpoint
  app.all('/api/google-proxy', async (req, res) => {
    const targetUrl = req.headers['x-target-url'] as string;
    const method = req.method;
    console.log(`[PROXY START] ${method} -> ${targetUrl}`);

    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        console.error('[PROXY ERROR] Missing Authorization header');
        return res.status(401).json({ error: 'Missing Authorization header.' });
      }

      if (!targetUrl) {
        console.error('[PROXY ERROR] Missing target URL');
        return res.status(400).json({ error: 'Missing target URL in X-Target-URL header.' });
      }

      // Enforce security by allowing only requests destined for Google APIs
      try {
        const parsedUrl = new URL(targetUrl);
        if (!parsedUrl.hostname.endsWith('.googleapis.com')) {
          console.error(`[PROXY ERROR] Restrict target host: ${parsedUrl.hostname}`);
          return res.status(400).json({ error: 'Proxying restricted to *.googleapis.com endpoints for security.' });
        }
      } catch (err) {
        console.error(`[PROXY ERROR] Invalid target URL: ${targetUrl}`);
        return res.status(400).json({ error: 'Invalid Google API target URL.' });
      }

      // Forward request to Google APIs
      const fetchHeaders: Record<string, string> = {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      };

      const fetchOptions: RequestInit = {
        method: req.method,
        headers: fetchHeaders,
        signal: AbortSignal.timeout(25000)
      };

      // Include body if not GET/HEAD
      if (method !== 'GET' && method !== 'HEAD') {
        fetchOptions.body = JSON.stringify(req.body);
      }

      const response = await fetch(targetUrl, fetchOptions);
      const responseStatus = response.status;
      const contentType = response.headers.get('content-type') || '';

      console.log(`[PROXY END] ${method} -> ${targetUrl} | Status: ${responseStatus} | Type: ${contentType}`);

      res.status(responseStatus);

      if (contentType.includes('application/json')) {
        const data = await response.json();
        return res.json(data);
      } else {
        const textData = await response.text();
        return res.send(textData);
      }
    } catch (error: any) {
      console.error(`[PROXY EXCEPTION] ${method} -> ${targetUrl}:`, error);
      return res.status(500).json({ error: error.message || 'Internal proxy routing exception.' });
    }
  });

  // API endpoint for generating or improving customer reviews using Gemini with robust offline fallbacks
  app.post('/api/suggest-seo-review', async (req, res) => {
    const { rating, currentComments, language } = req.body;
    const targetRating = rating || 5;
    const inputComments = currentComments ? currentComments.trim() : "";
    const isEs = language === 'es';

    const getOfflineImprovedText = (text: string): string => {
      const cleanComments = text ? text.replace(/["']/g, "").trim() : "";
      if (isEs) {
        if (!cleanComments) {
          return "Excelente experiencia con M&K Used Auto Parts. Su equipo ofreció una atención rápida en mecánica y repuestos de calidad a excelentes precios.";
        }
        const lower = cleanComments.toLowerCase();
        if (lower.includes("vender") || lower.includes("chatarra") || lower.includes("auto viejo") || lower.includes("carro") || lower.includes("grúa") || lower.includes("tow")) {
          return `${cleanComments}. Nos dieron un precio excelente por nuestro auto usado y se encargaron del remolque gratis sin complicaciones.`;
        }
        if (lower.includes("llanta") || lower.includes("neumático") || lower.includes("alineación") || lower.includes("freno") || lower.includes("aceite") || lower.includes("mecánico")) {
          return `${cleanComments}. El taller nos hizo la instalación y reparación mecánica muy rápido y con un servicio confiable.`;
        }
        if (lower.includes("batería") || lower.includes("repuesto") || lower.includes("motor") || lower.includes("transmisión") || lower.includes("espejo") || lower.includes("faro") || lower.includes("puerta")) {
          return `${cleanComments}. En M&K conseguimos exactamente los repuestos que necesitábamos a muy buen precio.`;
        }
        return `${cleanComments}. M&K Used Auto Parts ofreció una atención excelente y un servicio muy confiable.`;
      }

      if (!cleanComments) {
        return "Great experience with M&K Used Auto Parts. Their team provided fast auto repair and quality auto parts at very competitive pricing.";
      }
      
      const lower = cleanComments.toLowerCase();
      
      // Check specific service keywords to stay strictly on subject
      if (lower.includes("sell") || lower.includes("junk") || lower.includes("scrap") || lower.includes("old car") || lower.includes("tow")) {
        return `${cleanComments}. We got competitive pricing for our junk car removal with fast, hassle-free towing from M&K.`;
      }
      
      if (lower.includes("tire") || lower.includes("align") || lower.includes("wheel") || lower.includes("mechanic") || lower.includes("brake") || lower.includes("oil")) {
        return `${cleanComments}. The shop provided quick tire installation and dependable auto repair service.`;
      }
      
      if (lower.includes("battery") || lower.includes("part") || lower.includes("engine") || lower.includes("transmission") || lower.includes("alternator") || lower.includes("mirror") || lower.includes("light") || lower.includes("door")) {
        return `${cleanComments}. M&K supplied exactly the quality used auto parts we needed at a great price.`;
      }
      
      // Default concise fallback staying close to subject
      return `${cleanComments}. M&K Used Auto Parts provided excellent customer service and reliable auto repair.`;
    };

    try {
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        console.warn('[GEMINI WARNING] GEMINI_API_KEY is missing. Using contextual M&K backup suggestions.');
        const backup = getOfflineImprovedText(inputComments);
        return res.json({ suggestion: backup, isOfflineFallback: true });
      }

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const languagePrompt = isEs
        ? "\n\nCRITICAL LANGUAGE REQUIREMENT: You MUST write the entire review in natural, colloquial SPANISH (Español). Do not use English."
        : "\n\nCRITICAL LANGUAGE REQUIREMENT: Write the review in natural English.";

      const prompt = `When enriching customer reviews for M&K Used Auto Parts, keep them to 1-3 sentences. Identify the relevant service or product mentioned in the original feedback. Incorporate keywords naturally—such as 'used auto parts,' 'junk car removal,' 'tire installation,' or 'auto repair.' 

For example, if someone mentions selling a car, enrich it by adding that they got competitive pricing for their junk car. If the client got a battery replaced, stay strictly close to the subject—you don't have to mention ASE certified mechanics or junk cars, it is just a battery. Stay strictly close to the subject and don't get too imaginative. Keep it concise, relevant, and tied directly to the key service the customer actually used.

Original Customer Draft Input: "${inputComments || (isEs ? "Excelente servicio mecánico y repuestos de auto." : "Great auto repair and used auto parts service.")}"

CRITICAL CONSTRAINTS FOR HUMAN-LIKE WRITING & GOOGLE ANTI-DETECTION:
- Keep the exact first-person perspective ("I", "my", "we" / "Yo", "mi", "nosotros").
- Length MUST be 1 to 3 concise sentences.
- Use a natural, conversational, spontaneous human voice. Avoid overly formal or corporate tones.
- Do NOT use typical "AI marketing signatures" or cliches like "Look no further," "From the moment I walked in," "A breath of fresh air," "Top-notch," "Highly recommend," or ending with an enthusiastic exclamation point on every sentence.
- Feel free to use simple, everyday phrasing. Do not make the grammar too "perfect" or academic; keep it relaxed and realistic, as if quickly typed on a mobile phone.
- Do NOT mention star ratings or phrases like "5 stars" in the review text.
- Do NOT invent or hallucinate unrelated services (e.g., do not talk about junk cars or engine overhauls if they only bought a battery, tire, or simple part).
- Return ONLY the final polished review text without quotes, markdown, bullet points, or introductory commentary.${languagePrompt}`;

      // Array of allowed, non-deprecated modern models to try sequentially
      const modelsToTry = ['gemini-3.5-flash', 'gemini-3.1-flash-lite'];
      let lastError: any = null;
      let text = '';

      const sysInst = isEs
        ? 'Eres un asistente conversacional realista que perfecciona borradores de texto en reseñas de clientes simples, naturales y casuales EN ESPAÑOL (1-3 oraciones). Escribe exactamente como una persona normal escribiendo una reseña rápida en su teléfono: de forma coloquial, relajada, directa, con un vocabulario sencillo, sin jerga de marketing ni estructuras formales. Mantente estrictamente fiel al servicio específico mencionado y responde ÚNICAMENTE EN ESPAÑOL.'
        : 'You are a realistic, conversational helper who refines draft text into simple, natural, casual customer reviews (1-3 sentences). Write exactly like a regular person typing a quick review on their phone: relaxed, direct, using straightforward vocabulary, avoiding marketing jargon, formal structures, or repetitive AI patterns (e.g., never say "top-notch", "highly recommend", "look no further"). Stay strictly close to the specific services mentioned.';

      for (const model of modelsToTry) {
        try {
          console.log(`[GEMINI API] Attempting generation with model: ${model}`);
          const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
              systemInstruction: sysInst,
              temperature: 0.7,
            }
          });
          if (response.text) {
            text = response.text.trim();
            // strip surrounding quotes if the model outputted them
            if (text.startsWith('"') && text.endsWith('"')) {
              text = text.substring(1, text.length - 1);
            }
            if (text.startsWith("'") && text.endsWith("'")) {
              text = text.substring(1, text.length - 1);
            }
            console.log(`[GEMINI API] Successfully generated suggestion using ${model}`);
            break;
          }
        } catch (err: any) {
          console.warn(`[GEMINI API] Model ${model} failed:`, err.message || err);
          lastError = err;
        }
      }

      if (text) {
        return res.json({ suggestion: text });
      }

      // If all models failed, fallback to contextual offline template
      console.warn('[GEMINI API] All Gemini models failed or returned empty content. Proceeding with offline M&K template.', lastError);
      const selectedFallback = getOfflineImprovedText(inputComments);
      return res.json({ suggestion: selectedFallback, isOfflineFallback: true });

    } catch (globalError: any) {
      console.error('[GEMINI GLOBAL CAPTURE]', globalError);
      const selectedFallback = getOfflineImprovedText(inputComments);
      return res.json({ suggestion: selectedFallback, isOfflineFallback: true });
    }
  });

  // Healthcheck endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // API endpoints to save, load, and delete custom thumbnails for individual clients
  app.post('/api/custom-thumbnail', async (req, res) => {
    try {
      const { clientId, image, posX, posY } = req.body;
      if (!clientId) {
        return res.status(400).json({ error: 'Missing clientId' });
      }
      if (!image) {
        return res.status(400).json({ error: 'Missing image data' });
      }

      const thumbnailData = {
        clientId,
        image,
        posX: typeof posX === 'number' ? posX : 50,
        posY: typeof posY === 'number' ? posY : 50,
        updatedAt: new Date().toISOString()
      };

      // 1. Save locally (for super-fast filesystem cache reads)
      const configPath = path.join(process.cwd(), `custom_thumbnail_${clientId}.json`);
      fs.writeFileSync(configPath, JSON.stringify(thumbnailData, null, 2));

      // 2. Save durably to Firestore (survives Cloud Run restarts/scaling)
      if (db) {
        try {
          const docRef = doc(db, 'custom_thumbnails', clientId);
          await setDoc(docRef, thumbnailData);
          console.log(`[SERVER] Custom thumbnail durably saved to Firestore for client: ${clientId}`);
        } catch (fErr) {
          handleFirestoreError(fErr, OperationType.WRITE, `custom_thumbnails/${clientId}`);
        }
      }

      console.log(`[SERVER] Custom thumbnail saved for client: ${clientId} (${image.length} bytes, X:${posX}%, Y:${posY}%)`);
      return res.json({ success: true });
    } catch (err: any) {
      console.error('[SERVER] Failed to save custom thumbnail:', err);
      return res.status(500).json({ error: 'Failed to save thumbnail on the server.' });
    }
  });

  app.get('/api/custom-thumbnail', async (req, res) => {
    try {
      const clientId = (req.query.client as string) || 'mandk';
      const configPath = path.join(process.cwd(), `custom_thumbnail_${clientId}.json`);

      let config: any = null;

      // 1. Try reading from local filesystem first (fast cache path)
      if (fs.existsSync(configPath)) {
        try {
          const fileContent = fs.readFileSync(configPath, 'utf-8');
          config = JSON.parse(fileContent);
        } catch (e) {
          console.error('[SERVER] Error reading local config file, falling back to Firestore...', e);
        }
      }

      // 2. If not found locally (cold start, redeployment, or scale down), fetch from Firestore and cache locally
      if (!config && db) {
        try {
          const docRef = doc(db, 'custom_thumbnails', clientId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            config = docSnap.data();
            console.log(`[SERVER] Restored custom thumbnail from Firestore for client: ${clientId}`);
            // Cache locally so subsequent requests avoid DB calls and read near-instantly from disk
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
          }
        } catch (fErr) {
          handleFirestoreError(fErr, OperationType.GET, `custom_thumbnails/${clientId}`);
        }
      }

      // 3. Serve the custom image if we have it
      if (config && config.image && typeof config.image === 'string') {
        const base64Match = config.image.match(/^data:([^;]+);base64,(.*)$/);
        if (base64Match) {
          const mimeType = base64Match[1];
          const base64Data = base64Match[2];
          const buffer = Buffer.from(base64Data, 'base64');
          
          res.setHeader('Content-Type', mimeType);
          res.setHeader('Cache-Control', 'public, max-age=86400');
          return res.send(buffer);
        }
      }

      // Fallback: serve the default cover image from the src assets
      const fallbackPath = path.join(process.cwd(), 'src', 'assets', 'images', 'social_thumbnail_1784151879380.jpg');
      if (fs.existsSync(fallbackPath)) {
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.sendFile(fallbackPath);
      }

      return res.status(404).send('Not Found');
    } catch (err: any) {
      console.error('[SERVER] Failed to serve custom thumbnail:', err);
      return res.status(500).send('Internal Server Error');
    }
  });

  app.delete('/api/custom-thumbnail', async (req, res) => {
    try {
      const { clientId } = req.body;
      if (!clientId) {
        return res.status(400).json({ error: 'Missing clientId' });
      }

      // 1. Delete locally
      const configPath = path.join(process.cwd(), `custom_thumbnail_${clientId}.json`);
      if (fs.existsSync(configPath)) {
        fs.unlinkSync(configPath);
      }

      // 2. Delete from Firestore
      if (db) {
        try {
          const docRef = doc(db, 'custom_thumbnails', clientId);
          await deleteDoc(docRef);
          console.log(`[SERVER] Custom thumbnail deleted from Firestore for client: ${clientId}`);
        } catch (fErr) {
          handleFirestoreError(fErr, OperationType.DELETE, `custom_thumbnails/${clientId}`);
        }
      }

      console.log(`[SERVER] Custom thumbnail deleted for client: ${clientId}`);
      return res.json({ success: true });
    } catch (err: any) {
      console.error('[SERVER] Failed to delete custom thumbnail:', err);
      return res.status(500).json({ error: 'Failed to delete thumbnail.' });
    }
  });

  // Vite development or production serving
  let vite: any = null;
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await (Function('return import("vite")')() as Promise<typeof import('vite')>);
    vite = await createServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Disable serving index.html automatically so root requests '/' hit our custom wildcard route instead
    app.use(express.static(distPath, { index: false }));
  }

  // Register the wildcard route for both development and production modes
  app.get('*', async (req, res, next) => {
    // Only serve HTML for document/page requests (e.g. requests with text/html in accept headers or no file extension)
    const url = req.originalUrl;
    const isHtml = req.headers.accept?.includes('text/html') || !path.extname(url.split('?')[0]);
    if (!isHtml) {
      return next();
    }

    let indexHtml = '';
    if (process.env.NODE_ENV !== 'production') {
      try {
        const rawHtml = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf-8');
        // Let Vite transform the HTML (injecting HMR scripts and resolving paths correctly)
        indexHtml = await vite.transformIndexHtml(url, rawHtml);
      } catch (err) {
        console.error('[SERVER] Failed to load/transform index.html in dev:', err);
        return next(err);
      }
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      try {
        indexHtml = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');
      } catch (err) {
        console.error('[SERVER] Failed to read dist/index.html:', err);
        return res.sendFile(path.join(distPath, 'index.html'));
      }
    }

    const host = req.get('host') || '';
    // Support both local secure connections and standard HTTP
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;

    // Extract client query parameter
    let client = (req.query.client as string) || '';
    if (!client) {
      const match = req.originalUrl.match(/[?&]client=([^&]+)/i);
      if (match) {
        client = match[1];
      }
    }
    if (!client) {
      client = 'mandk';
    }

    // Point imageUrl to our custom-thumbnail endpoint which dynamically resolves either the custom image (from local cache/Firestore) or the default fallback image
    // Also fetch custom image config metadata to append a real-time/mtime cache-buster so social crawlers bypass cache on updates
    let t = Date.now();
    const configPath = path.join(process.cwd(), `custom_thumbnail_${client}.json`);
    if (fs.existsSync(configPath)) {
      try {
        const stats = fs.statSync(configPath);
        t = Math.floor(stats.mtimeMs);
      } catch (e) {
        // ignore
      }
    }
    const imageUrl = `${baseUrl}/api/custom-thumbnail?client=${client}&t=${t}`;

    // Determine client branding details and descriptions to precisely align server meta outputs with the frontend's visual sharing hub layout
    let clientName = 'M&K';
    let clientFullDescriptionName = 'M&K Auto Parts';
    if (client === 'mandk') {
      clientName = 'M&K';
      clientFullDescriptionName = 'M&K Auto Parts';
    } else {
      clientName = client.charAt(0).toUpperCase() + client.slice(1).replace(/[-_]/g, ' ') + ' App';
      clientFullDescriptionName = clientName;
    }

    const displayTitle = `${clientName} Customer Feedback Portal`;
    const displayDesc = `An intelligent feedback collection and automated review drafting portal for ${clientFullDescriptionName}. Features real-time Google Sheets tracking and direct Gmail delivery.`;

    let processedHtml = indexHtml;

    // Helper function to update or insert meta tags with complete resilience to attribute ordering and quote types
    const setMetaTag = (html: string, tagKey: string, value: string): string => {
      const regex = new RegExp(
        `<meta\\s+[^>]*(?:property|name)=["']${tagKey}["'][^>]*>`,
        'i'
      );
      const isProperty = tagKey.startsWith('og:') || tagKey.startsWith('fb:');
      const attrName = isProperty ? 'property' : 'name';
      const escapedValue = value.replace(/"/g, '&quot;');
      const newTag = `<meta ${attrName}="${tagKey}" content="${escapedValue}" />`;
      
      if (regex.test(html)) {
        return html.replace(regex, newTag);
      } else {
        return html.replace('</head>', `  ${newTag}\n</head>`);
      }
    };

    // 1. Dynamic Titles
    processedHtml = processedHtml.replace(/<title>[^<]*<\/title>/gi, `<title>${displayTitle}</title>`);
    processedHtml = setMetaTag(processedHtml, 'og:title', displayTitle);
    processedHtml = setMetaTag(processedHtml, 'twitter:title', displayTitle);

    // 2. Dynamic Descriptions
    processedHtml = setMetaTag(processedHtml, 'og:description', displayDesc);
    processedHtml = setMetaTag(processedHtml, 'twitter:description', displayDesc);

    // 3. Dynamic Images (Supporting both custom and default absolute urls)
    processedHtml = setMetaTag(processedHtml, 'og:image', imageUrl);
    processedHtml = setMetaTag(processedHtml, 'twitter:image', imageUrl);

    // Explicitly provide Open Graph image properties to prevent cropping and delayed indexing across platforms
    let imageWidth = '1376';
    let imageHeight = '768';
    let imageType = 'image/jpeg';

    if (fs.existsSync(configPath)) {
      try {
        const fileContent = fs.readFileSync(configPath, 'utf-8');
        const configObj = JSON.parse(fileContent);
        if (configObj && configObj.image && typeof configObj.image === 'string') {
          const base64Match = configObj.image.match(/^data:([^;]+);base64,(.*)$/);
          if (base64Match) {
            imageType = base64Match[1];
            // Custom images uploaded in the UI (e.g. 960x720) are 4:3
            imageWidth = '960';
            imageHeight = '720';
          }
        }
      } catch (e) {
        // ignore
      }
    }

    processedHtml = setMetaTag(processedHtml, 'og:image:width', imageWidth);
    processedHtml = setMetaTag(processedHtml, 'og:image:height', imageHeight);
    processedHtml = setMetaTag(processedHtml, 'og:image:type', imageType);
    if (imageUrl.startsWith('https')) {
      processedHtml = setMetaTag(processedHtml, 'og:image:secure_url', imageUrl);
    }

    // 4. Dynamic URL
    processedHtml = setMetaTag(processedHtml, 'og:url', `${baseUrl}/${req.originalUrl.replace(/^\//, '')}`);

    // 5. Facebook App ID (to resolve Facebook sharing validator warnings)
    const fbAppId = process.env.FB_APP_ID || process.env.FACEBOOK_APP_ID || '966242223397117';
    processedHtml = setMetaTag(processedHtml, 'fb:app_id', fbAppId);

    res.setHeader('Content-Type', 'text/html');
    res.send(processedHtml);
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OK] Server running in full-stack mode on http://localhost:${PORT}`);
  });
}

startServer();
