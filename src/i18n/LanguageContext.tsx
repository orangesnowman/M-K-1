import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations } from './translations';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (
    key: string,
    defaultTextOrParams?: string | Record<string, string | number>,
    maybeParams?: Record<string, string | number>
  ) => string;
  isSpanish: boolean;
  getRatingSuggestions: (rating: number) => string[];
}

const RATING_SUGGESTIONS_EN: Record<number, string[]> = {
  5: [
    "🛠️ M&K Auto Parts saved me lots of money by sourcing a premium used transmission from their yard and installing it for a fraction of what the dealership quoted.",
    "⚡ They fixed my car for literally half the price my regular mechanic quoted because they have all the parts right on-site.",
    "🔍 Their ASE-certified mechanics quickly diagnosed an electrical issue that two other local shops completely missed.",
    "🌍 They tracked down a rare engine component for me in less than 24 hours using their incredible nationwide parts-locating service."
  ],
  4: [
    "📦 After checking yards all over Florida, M&K was the only place that had the exact matching truck door panel I needed in stock.",
    "🤝 The mechanics here are incredibly trustworthy, explaining my brake issue clearly without trying to upsell me on unnecessary repairs.",
    "🚗 They hooked me up with a used tire that looked brand new and had me safely back on the road in under 45 minutes.",
    "⏱️ I dropped my car off in the morning and they sourced the rotors and finished my brake repair before lunch."
  ],
  3: [
    "💰 They gave me a fair cash offer over the phone for my old sedan and picked it up with a free tow truck the same afternoon.",
    "🚛 M&K made getting rid of my scrap car completely hassle-free by handling all the paperwork and providing fast, free towing.",
    "🔧 Found the part I needed, though it took a little longer to locate in the inventory tracker than expected."
  ],
  2: [
    "⚠️ Sourced the brake calipers okay, but the service queue was backed up and it took much longer than initially promised.",
    "🔧 Yard carries a huge collection, but the website's listed inventory status wasn't fully up-to-date with actual stock."
  ],
  1: [
    "⚠️ Service delay experienced while locating inventory. Would appreciate faster communication from the counter staff.",
    "❗ Part condition didn't match what was listed online. Hoping management can resolve check-in accuracy."
  ]
};

const RATING_SUGGESTIONS_ES: Record<number, string[]> = {
  5: [
    "🛠️ M&K Auto Parts me ahorró muchísimo dinero al conseguir una transmisión usada de excelente calidad e instalarla por una fracción de lo que cotizaba la agencia.",
    "⚡ Repararon mi auto por casi la mitad de precio que mi taller habitual porque tienen todos los repuestos ahí mismo.",
    "🔍 Sus mecánicos certificados detectaron rápidamente un problema eléctrico que otros dos talleres locales no pudieron encontrar.",
    "🌍 Me consiguieron una pieza de motor muy difícil de encontrar en menos de 24 horas."
  ],
  4: [
    "📦 Después de buscar por toda Florida, M&K fue el único lugar con la puerta de camioneta exacta que necesitaba en inventario.",
    "🤝 Los mecánicos son sumamente confiables, me explicaron claramente el problema con mis frenos sin cobrarme reparaciones innecesarias.",
    "🚗 Me pusieron una llanta usada que se veía como nueva y regresé a la carretera de forma segura en menos de 45 minutos.",
    "⏱️ Dejé el carro por la mañana y terminaron el servicio de frenos antes del almuerzo."
  ],
  3: [
    "💰 Me dieron una oferta en efectivo justa por teléfono por mi viejo auto y lo pasaron a buscar con grúa gratis esa misma tarde.",
    "🚛 M&K hizo que retirar mi auto chatarra fuera súper sencillo, encargándose de todo el papeleo y el remolque gratis.",
    "🔧 Encontré el repuesto que necesitaba, aunque tardó un poco más de lo esperado en el mostrador."
  ],
  2: [
    "⚠️ Conseguí los frenos bien, pero había bastante fila en el mostrador y tardó más de lo prometido inicialmente.",
    "🔧 Tienen un inventario enorme, pero la información de stock en la web tardó en actualizarse."
  ],
  1: [
    "⚠️ Hubo demora en la atención al buscar la pieza. Sería excelente una comunicación más rápida del personal.",
    "❗ La condición del repuesto no coincidía exactamente con la web. Espero que gerencia mejore la precisión del sistema."
  ]
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('g_app_language');
      if (saved === 'es' || saved === 'en') {
        return saved;
      }
      if (navigator.language && navigator.language.toLowerCase().startsWith('es')) {
        return 'es';
      }
      return 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('g_app_language', lang);
      document.documentElement.lang = lang;
    } catch (e) {
      console.warn('Could not save language preference:', e);
    }
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

  const getRatingSuggestions = (rating: number): string[] => {
    const map = language === 'es' ? RATING_SUGGESTIONS_ES : RATING_SUGGESTIONS_EN;
    return map[rating] || map[5];
  };

  const isSpanish = language === 'es';

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
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
