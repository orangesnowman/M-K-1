import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface LanguageSelectorProps {
  className?: string;
  size?: 'sm' | 'md';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className = '', size = 'md' }) => {
  const { language, setLanguage } = useLanguage();

  const isSm = size === 'sm';

  return (
    <div
      className={`inline-flex items-center gap-1 bg-zinc-100/90 hover:bg-zinc-100 p-1 rounded-full border border-zinc-200/80 shadow-xs select-none ${className}`}
      id="app-language-selector"
    >
      <div className="flex items-center gap-1.5 px-2 py-0.5 text-zinc-500" title={language === 'es' ? 'Idioma del portal (Español)' : 'Portal Language (English)'}>
        <Globe className={`${isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} shrink-0 text-zinc-600`} />
        <span className={`font-bold uppercase tracking-wider ${isSm ? 'text-[10px]' : 'text-xs'} hidden sm:inline`}>
          {language === 'es' ? 'ES' : 'EN'}
        </span>
      </div>

      <div className="flex items-center gap-0.5 bg-white/60 p-0.5 rounded-full border border-zinc-200/50">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setLanguage('en');
          }}
          className={`px-2.5 py-1 rounded-full font-extrabold transition-all duration-150 cursor-pointer ${
            isSm ? 'text-[10px]' : 'text-xs'
          } ${
            language === 'en'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80'
          }`}
          title="English Language"
          id="lang-btn-en"
        >
          EN
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setLanguage('es');
          }}
          className={`px-2.5 py-1 rounded-full font-extrabold transition-all duration-150 cursor-pointer ${
            isSm ? 'text-[10px]' : 'text-xs'
          } ${
            language === 'es'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80'
          }`}
          title="Idioma Español"
          id="lang-btn-es"
        >
          ES
        </button>
      </div>
    </div>
  );
};

export default LanguageSelector;
