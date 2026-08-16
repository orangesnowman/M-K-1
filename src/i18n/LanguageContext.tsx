import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations } from './translations';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language, clientId?: string) => void;
  syncClientLanguage: (clientId: string) => void;
  t: (
    key: string,
    defaultTextOrParams?: string | Record<string, string | number>,
    maybeParams?: Record<string, string | number>
  ) => string;
  isSpanish: boolean;
  getRatingSuggestions: (rating: number, clientId?: string) => string[];
}

const MANDK_SUGGESTIONS_EN: Record<number, string[]> = {
  5: [
    "🚗 Excellent service and great prices on auto parts! Found the exact part I needed for my car right away.",
    "🔧 Great junkyard with well-organized inventory. The parts counter staff was knowledgeable and super helpful.",
    "⚙️ Quality used auto parts in great condition. Saved a lot of money compared to buying brand new OEM parts.",
    "⭐ Fast counter service, fair pricing, and huge selection of vehicle parts. Will definitely be back for future car repairs!"
  ],
  4: [
    "🚘 Good selection of auto parts and friendly customer service. Found what I needed quickly at a fair price.",
    "🛠️ Helpful staff and good prices on used car parts. Quick pickup process at the parts counter.",
    "📦 Well-organized junkyard with lots of vehicle parts available. Great overall experience."
  ],
  3: [
    "📦 Found the auto part I needed, though the wait time at the parts counter was a bit long.",
    "🔩 Decent selection of parts, but pricing was slightly higher than expected on certain items."
  ],
  2: [
    "⚠️ Staff was polite, but the auto part I called ahead for was out of stock when I arrived.",
    "🚘 Had trouble finding the specific car model part in stock today."
  ],
  1: [
    "⚠️ Long wait times at the counter and the part turned out to be incompatible. Hope service improves.",
    "❗ Disappointed with the part availability and customer service speed today."
  ]
};

const MANDK_SUGGESTIONS_ES: Record<number, string[]> = {
  5: [
    "🚗 ¡Excelente servicio y excelentes precios en repuestos de autos! Encontré la pieza exacta que necesitaba para mi vehículo.",
    "🔧 Gran inventario de autopartes usadas y nuevas. El personal en mostrador fue muy atento y conocedor.",
    "⚙️ Piezas de auto de excelente calidad a un precio increíble. Ahorré mucho dinero en mi reparación.",
    "⭐ Atención rápida, precios justos y gran variedad de partes para automóviles. ¡Totalmente recomendado!"
  ],
  4: [
    "🚘 Buena variedad de autopartes y atención amable. Conseguí lo que buscaba a un precio razonable.",
    "🛠️ Personal servicial y buenas piezas usadas. El proceso de atención en mostrador fue muy rápido.",
    "📦 Depósito muy bien organizado y excelente surtido de partes para automóviles."
  ],
  3: [
    "📦 Conseguí el repuesto para mi auto, aunque el tiempo de espera en el mostrador fue algo largo.",
    "🔩 Buen surtido de partes, aunque algunos precios estaban un poco más altos de lo esperado."
  ],
  2: [
    "⚠️ El personal fue amable, pero la pieza por la que pregunté no estaba disponible al llegar.",
    "🚘 Tuve dificultades para encontrar la pieza específica para mi modelo de auto hoy."
  ],
  1: [
    "⚠️ Largas esperas en atención y la pieza no era la adecuada. Espero mejoren el control de stock.",
    "❗ Mala experiencia con la disponibilidad de partes y la rapidez de atención hoy."
  ]
};

const WARTS_SUGGESTIONS_EN: Record<number, string[]> = {
  5: [
    "🎵 A truly unforgettable musical show! The live music, powerful vocals, and stage production were absolutely outstanding.",
    "✨ Incredible musical performance from start to finish. The acoustics, lighting, and stage energy made it a magical night.",
    "👏 Extraordinary talent on stage! The dedication and passion in every song was palpable. Would definitely see it again!",
    "🌟 Flawless sound quality and amazing ensemble. Moved us deeply throughout the entire show. Highly recommended!"
  ],
  4: [
    "🎶 Fantastic musical show with great songs and costumes. Really enjoyed the live musical arrangements.",
    "🎭 Wonderful vocals and stage presence. A very polished production and great entertainment.",
    "🎤 Great acoustic quality and talented live musicians. A wonderful musical evening."
  ],
  3: [
    "🎟️ Enjoyable musical performance with talented artists, though seating organization could be improved.",
    "🎼 Good live music and vocals, although some show segments felt a bit stretched."
  ],
  2: [
    "⚠️ Great performer talent, but the sound volume was a bit too loud and drowned out some vocals.",
    "🎭 Good artists, but intermission delays affected the show pacing."
  ],
  1: [
    "⚠️ Venue audio issues disrupted the musical performance. Hope management improves sound balancing.",
    "❗ Organization delays at entry affected our show experience."
  ]
};

const WARTS_SUGGESTIONS_ES: Record<number, string[]> = {
  5: [
    "🎵 ¡Un espectáculo musical verdaderamente inolvidable! La música en vivo, las voces de los artistas y la puesta en escena fueron espectaculares.",
    "✨ Una producción musical increíble de principio a fin. El sonido, las luces y la energía del elenco hicieron de esta una noche mágica.",
    "👏 ¡Extraordinario talento en el escenario! Se nota la dedicación y pasión en cada canción e interpretación. Volvería a verlo sin dudarlo.",
    "🌟 Excelente organización y una acústica impecable. Nos emocionamos muchísimo durante todo el show. ¡Totalmente recomendado!"
  ],
  4: [
    "🎶 Gran espectáculo musical con excelentes canciones y vestuario. Disfrutamos muchísimo de toda la presentación en vivo.",
    "🎭 La actuación y las voces fueron maravillosas. Un show muy bien producido y muy entretenido para toda la familia.",
    "🎤 Muy buena acústica y grandes músicos en escena. Una experiencia artística hermosa."
  ],
  3: [
    "🎟️ El espectáculo musical estuvo muy bonito y los artistas demostraron gran talento, aunque el inicio tuvo un pequeño retraso.",
    "🎼 Buena música y buenas interpretaciones, aunque algunas secciones del show se sintieron algo largas."
  ],
  2: [
    "⚠️ Los artistas tienen mucho talento, pero el volumen del sonido estuvo demasiado alto y dificultaba escuchar las voces claramente.",
    "🎭 Buenos cantantes y músicos, aunque la pausa intermedia del show se extendió más de lo esperado."
  ],
  1: [
    "⚠️ Problemas con el sonido y la acústica que afectaron la experiencia del show. Espero puedan ajustarlo.",
    "❗ Demoras en el ingreso y la organización del recinto afectaron la experiencia del espectáculo."
  ]
};

const getClientStoredLanguage = (clientId: string): Language => {
  const norm = clientId.trim().toLowerCase();
  try {
    const saved = localStorage.getItem(`g_app_language_${norm}`);
    if (saved === 'es' || saved === 'en') {
      return saved as Language;
    }
  } catch {}

  if (norm.includes('w-arts') || norm.includes('warts')) {
    return 'es';
  }
  return 'en';
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const urlClientId = urlParams ? (urlParams.get('client') || urlParams.get('clientId')) : null;
      const hostname = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
      
      let activeId = 'mandk';
      if (urlClientId) {
        activeId = urlClientId;
      } else if (hostname.includes('mandk-app') || hostname.includes('mandk') || hostname.includes('-pre-') || (!hostname.includes('-dev-') && hostname !== 'localhost' && hostname !== '127.0.0.1')) {
        activeId = 'mandk';
      } else {
        activeId = localStorage.getItem('g_active_client_id') || 'mandk';
      }
      return getClientStoredLanguage(activeId);
    } catch {
      return 'en';
    }
  });

  const setLanguage = (lang: Language, clientId?: string) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('g_app_language', lang);
      document.documentElement.lang = lang;

      const targetId = clientId || localStorage.getItem('g_active_client_id') || 'mandk';
      const norm = targetId.trim().toLowerCase();
      localStorage.setItem(`g_app_language_${norm}`, lang);
    } catch (e) {
      console.warn('Could not save language preference:', e);
    }
  };

  const syncClientLanguage = (clientId: string) => {
    const lang = getClientStoredLanguage(clientId);
    setLanguageState(lang);
    try {
      localStorage.setItem('g_app_language', lang);
      document.documentElement.lang = lang;
    } catch {}
  };

  useEffect(() => {
    try {
      document.documentElement.lang = language;
    } catch (e) {
      // ignore in SSR
    }
  }, [language]);

  const t = (
    key: string,
    defaultTextOrParams?: string | Record<string, string | number>,
    maybeParams?: Record<string, string | number>
  ): string => {
    let defaultText = '';
    let params: Record<string, string | number> | undefined = maybeParams;

    if (typeof defaultTextOrParams === 'string') {
      defaultText = defaultTextOrParams;
    } else if (typeof defaultTextOrParams === 'object' && defaultTextOrParams !== null) {
      params = defaultTextOrParams;
    }

    const dict = translations[language] || translations.en;
    let text = dict[key] || translations.en[key] || defaultText || key;

    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value));
        text = text.replace(new RegExp(`\\$\\${paramKey}\\}`, 'g'), String(value));
      });
    }

    return text;
  };

  const getRatingSuggestions = (rating: number, clientId?: string): string[] => {
    const normId = (clientId || localStorage.getItem('g_active_client_id') || 'mandk').toLowerCase();
    const isWArts = normId.includes('w-arts') || normId.includes('warts');
    
    if (isWArts) {
      const map = language === 'es' ? WARTS_SUGGESTIONS_ES : WARTS_SUGGESTIONS_EN;
      return map[rating] || map[5];
    } else {
      const map = language === 'es' ? MANDK_SUGGESTIONS_ES : MANDK_SUGGESTIONS_EN;
      return map[rating] || map[5];
    }
  };

  const isSpanish = language === 'es';

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        syncClientLanguage,
        t,
        isSpanish,
        getRatingSuggestions,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
