import { Button } from '@/components/ui/button';
import { copy, type Language } from '@/lib/i18n';

export function LanguageSwitcher({
  language,
  onChange,
}: {
  language: Language;
  onChange: (language: Language) => void;
}) {
  return (
    <fieldset className="flex h-9 items-center rounded-xl border border-[#d9dfe9] bg-white/75 p-1 shadow-sm backdrop-blur-sm">
      <legend className="sr-only">
        {copy.common.languagePicker[language]}
      </legend>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={`h-7 rounded-lg px-2.5 text-[11px] font-extrabold ${
          language === 'th'
            ? 'bg-[#17264b] text-white hover:bg-[#17264b] hover:text-white'
            : 'text-[#687187] hover:bg-[#eef0f5]'
        }`}
        onClick={() => onChange('th')}
        aria-pressed={language === 'th'}
        aria-label={copy.common.switchToThai[language]}
        title={copy.common.switchToThai[language]}
        lang="th"
      >
        ไทย
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={`h-7 rounded-lg px-2.5 text-[11px] font-extrabold ${
          language === 'en'
            ? 'bg-[#17264b] text-white hover:bg-[#17264b] hover:text-white'
            : 'text-[#687187] hover:bg-[#eef0f5]'
        }`}
        onClick={() => onChange('en')}
        aria-pressed={language === 'en'}
        aria-label={copy.common.switchToEnglish[language]}
        title={copy.common.switchToEnglish[language]}
        lang="en"
      >
        EN
      </Button>
    </fieldset>
  );
}
