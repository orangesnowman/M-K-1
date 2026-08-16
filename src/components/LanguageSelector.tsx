import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface LanguageSelectorProps {
  className?: string;
  size?: 'sm' | 'md';
  variant?: 'dark' | 'light';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className = '', size = 'md', variant = 'light' }) => {
  const { language, setLanguage } = useLanguage();

  const isSm = size === 'sm';
  const isDark = variant === 'dark';

  return (
    <div
      className={`inline-flex items-center gap-1.5 p-1 rounded-full select-none ${
        isDark
          ? 'bg-zinc-800/90 hover:bg-zinc-800 border border-zinc-700/80 shadow-sm'
          : 'bg-zinc-100/90 hover:bg-zinc-100 border border-zinc-200/80 shadow-xs'
      } ${className}`}
      id="app-language-selector"
    >
      <div
        className={`flex items-center gap-1 px-1.5 py-0.5 ${
          isDark ? 'text-zinc-300' : 'text-zinc-500'
        }`}
        title={language === 'es' ? 'Idioma del portal (Español)' : 'Portal Language (English)'}
      >
        <Globe className={`${isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} shrink-0 ${isDark ? 'text-amber-400' : 'text-zinc-600'}`} />
      </div>

      <div
        className={`flex items-center gap-0.5 p-0.5 rounded-full ${
          isDark
            ? 'bg-zinc-900/80 border border-zinc-700/60'
            : 'bg-white/60 border border-zinc-200/50'
        }`}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setLanguage('en');
          }}
          className={`px-2.5 py-0.5 rounded-full font-extrabold transition-all duration-150 cursor-pointer ${
            isSm ? 'text-[10px]' : 'text-xs'
          } ${
            language === 'en'
              ? isDark
                ? 'bg-amber-400 text-zinc-950 font-black shadow-xs scale-105'
                : 'bg-zinc-900 text-white shadow-xs'
              : isDark
                ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
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
          className={`px-2.5 py-0.5 rounded-full font-extrabold transition-all duration-150 cursor-pointer ${
            isSm ? 'text-[10px]' : 'text-xs'
          } ${
            language === 'es'
              ? isDark
                ? 'bg-amber-400 text-zinc-950 font-black shadow-xs scale-105'
                : 'bg-zinc-900 text-white shadow-xs'
              : isDark
                ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
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
