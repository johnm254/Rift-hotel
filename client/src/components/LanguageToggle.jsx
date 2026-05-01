import { useTranslation } from 'react-i18next';

export default function LanguageToggle({ className = '' }) {
  const { i18n } = useTranslation();
  const current = i18n.language;

  const toggle = () => {
    const next = current === 'en' ? 'sw' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('language', next);
  };

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${className || 'border-cream/20 text-cream/70 hover:text-cream hover:border-cream/40'}`}
      title={current === 'en' ? 'Switch to Kiswahili' : 'Switch to English'}
    >
      <span className="text-base">{current === 'en' ? '🇰🇪' : '🇬🇧'}</span>
      <span>{current === 'en' ? 'SW' : 'EN'}</span>
    </button>
  );
}
