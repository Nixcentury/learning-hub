import { useState } from 'react';
import { ArrowRight, Check, Cloud, ShieldCheck } from 'lucide-react';

import { HubBrand } from '@/components/learning-hub/hub-brand';
import { LanguageSwitcher } from '@/components/learning-hub/language-switcher';
import { Button } from '@/components/ui/button';
import { copy, type Language } from '@/lib/i18n';

export function LoginScreen({
  language,
  onLanguageChange,
  onContinue,
}: {
  language: Language;
  onLanguageChange: (language: Language) => void;
  onContinue: () => void;
}) {
  const [authNotice, setAuthNotice] = useState(false);

  return (
    <main className="login-canvas relative min-h-svh overflow-hidden px-5 py-6 text-[#17213b] sm:px-8 sm:py-8">
      <div className="pointer-events-none absolute left-[8%] top-[14%] size-52 rounded-full bg-[#dce7ff]/65 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[5%] right-[7%] size-64 rounded-full bg-[#f7e8a7]/55 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100svh-3rem)] max-w-6xl flex-col sm:min-h-[calc(100svh-4rem)]">
        <header className="flex items-center justify-between gap-3">
          <HubBrand language={language} compact />
          <div className="flex items-center gap-2">
            <LanguageSwitcher language={language} onChange={onLanguageChange} />
            <span className="hidden rounded-full border border-[#d9dfe9] bg-white/70 px-3 py-1.5 text-[11px] font-bold tracking-[0.08em] text-[#586174] backdrop-blur-sm sm:inline-flex">
              HUB V0
            </span>
          </div>
        </header>

        <section className="grid flex-1 place-items-center py-10">
          <div className="w-full max-w-[440px]">
            <div className="mb-7 text-center">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[#63719a]">
                {copy.login.welcome[language]}
              </p>
              <h1 className="text-balance text-[clamp(2rem,7vw,2.75rem)] font-black leading-[1.08] tracking-[-0.045em] text-[#17264b]">
                {copy.login.headingLine1[language]}
                <br />
                {copy.login.headingLine2[language]}
              </h1>
              <p className="mx-auto mt-4 max-w-sm text-[15px] leading-7 text-[#697184]">
                {copy.login.tagline[language]}
              </p>
            </div>

            <div className="rounded-[24px] border border-white/90 bg-white/88 p-5 shadow-[0_22px_70px_rgba(24,37,70,0.13)] backdrop-blur-xl sm:p-7">
              <div className="mb-5 flex gap-3 rounded-2xl bg-[#f4f6fb] p-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-[#36548d] shadow-sm">
                  <Cloud aria-hidden="true" className="size-[18px]" />
                </span>
                <div>
                  <p className="text-sm font-bold text-[#263352]">
                    {copy.login.cloudTitle[language]}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#737b8d]">
                    {copy.login.cloudDescription[language]}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="h-12 w-full rounded-xl border-[#d8dde7] bg-white text-sm font-bold text-[#28344f] shadow-none hover:bg-[#f7f8fb]"
                onClick={() => setAuthNotice(true)}
              >
                <span className="grid size-6 place-items-center rounded-full border border-[#dfe3ea] bg-white text-xs font-black text-[#4285f4]">
                  G
                </span>
                {copy.login.continueWithGoogle[language]}
              </Button>

              <div className="my-5 flex items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1 bg-[#e5e7ec]" />
                <span className="text-[11px] font-semibold text-[#9aa0ad]">
                  {copy.login.divider[language]}
                </span>
                <span className="h-px flex-1 bg-[#e5e7ec]" />
              </div>

              <Button
                type="button"
                className="h-12 w-full rounded-xl bg-[#17264b] text-sm font-bold text-white shadow-[0_10px_24px_rgba(23,38,75,0.18)] hover:bg-[#22365f]"
                onClick={onContinue}
              >
                {copy.login.continueAsGuest[language]}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Button>

              {authNotice && (
                <output
                  className="mt-4 flex items-start gap-2 rounded-xl border border-[#d9e3f7] bg-[#f3f7ff] px-3.5 py-3 text-xs leading-5 text-[#405679]"
                  aria-live="polite"
                >
                  <Check
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-[#4770ba]"
                  />
                  {copy.login.authNotice[language]}
                </output>
              )}

              <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] leading-5 text-[#8a91a0]">
                <ShieldCheck aria-hidden="true" className="size-3.5" />
                {copy.login.guestCloudWarning[language]}
              </p>
            </div>
          </div>
        </section>

        <footer className="text-center text-[11px] font-medium text-[#8a91a0]">
          Learning Hub · {copy.login.footer[language]}
        </footer>
      </div>
    </main>
  );
}
