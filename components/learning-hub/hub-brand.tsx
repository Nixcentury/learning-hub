import { BookOpen } from 'lucide-react';

import { copy, type Language } from '@/lib/i18n';

export function HubBrand({
  language,
  compact = false,
}: {
  language: Language;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="relative grid size-11 shrink-0 place-items-center rounded-[14px] bg-[#17264b] text-white shadow-[0_8px_22px_rgba(23,38,75,0.18)]">
        <BookOpen aria-hidden="true" className="size-5" strokeWidth={2.2} />
        <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-[#f6f2e9] bg-[#f2c94c]" />
      </span>
      <span className={compact ? 'leading-tight' : 'leading-[1.15]'}>
        <span className="block text-[15px] font-bold tracking-[-0.02em] text-[#17264b]">
          Learning Hub
        </span>
        {!compact && (
          <span className="mt-1 block text-xs font-medium text-[#6b7280]">
            {copy.brand.subtitle[language]}
          </span>
        )}
      </span>
    </div>
  );
}
