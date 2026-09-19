import { useMemo, useState } from 'react';
import {
  Atom,
  BookOpenCheck,
  ChevronRight,
  Construction,
  Dna,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Sigma,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { HubBrand } from '@/components/learning-hub/hub-brand';
import { LanguageSwitcher } from '@/components/learning-hub/language-switcher';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  hubSections,
  type HubIconName,
  type HubSection,
} from '@/lib/hub-config';
import {
  copy,
  localized,
  subjectContentTitle,
  type Language,
} from '@/lib/i18n';

const iconMap: Record<HubIconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  classroom: Users,
  physics: Atom,
  chemistry: FlaskConical,
  biology: Dna,
  science: Sparkles,
  math: Sigma,
};

const accentMap: Record<HubIconName, string> = {
  dashboard: 'bg-[#e4eaff] text-[#344f9a]',
  classroom: 'bg-[#fff0cf] text-[#a46a0a]',
  physics: 'bg-[#e4ecff] text-[#3258a8]',
  chemistry: 'bg-[#e3f4ee] text-[#28765e]',
  biology: 'bg-[#e9f4df] text-[#4d7d2a]',
  science: 'bg-[#f2e8ff] text-[#7550a7]',
  math: 'bg-[#ffe9e4] text-[#a14c3c]',
};

export function HubShell({
  language,
  onLanguageChange,
  onSignOut,
}: {
  language: Language;
  onLanguageChange: (language: Language) => void;
  onSignOut: () => void;
}) {
  const [activeId, setActiveId] = useState('dashboard');
  const activeSection = useMemo(
    () =>
      hubSections.find((section) => section.id === activeId) ?? hubSections[0],
    [activeId],
  );

  return (
    <main className="min-h-svh bg-[#f5f2eb] text-[#1f2942]">
      <header className="sticky top-0 z-20 border-b border-[#dfe1e5] bg-[#fbfaf7]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-7 lg:px-10">
          <HubBrand language={language} compact />
          <div className="flex items-center gap-1.5 sm:gap-2">
            <LanguageSwitcher language={language} onChange={onLanguageChange} />
            <Badge
              variant="outline"
              className="hidden h-7 border-[#d9dce3] bg-white px-2.5 text-[11px] font-bold text-[#667085] sm:inline-flex"
            >
              {copy.hub.visitor[language]}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 rounded-xl text-[#6f7788] hover:bg-[#ebeef4] hover:text-[#253252]"
              onClick={onSignOut}
              aria-label={copy.hub.signOut[language]}
              title={copy.hub.signOut[language]}
            >
              <LogOut aria-hidden="true" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] min-w-0 lg:grid-cols-[270px_minmax(0,1fr)]">
        <nav
          className="min-w-0 border-b border-[#dfe1e5] bg-[#fbfaf7] px-4 py-3 lg:min-h-[calc(100svh-74px)] lg:border-b-0 lg:border-r lg:px-5 lg:py-7"
          aria-label={copy.hub.navigationLabel[language]}
        >
          <div className="hub-tabs flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
            {hubSections.map((section, index) => {
              const Icon = iconMap[section.icon];
              const isActive = section.id === activeId;
              const startsSubjects = index === 2;

              return (
                <div
                  key={section.id}
                  className={startsSubjects ? 'lg:pt-6' : ''}
                >
                  {startsSubjects && (
                    <p className="mb-2 hidden px-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#9a9fac] lg:block">
                      {copy.hub.subjects[language]}
                    </p>
                  )}
                  <button
                    type="button"
                    className={`group flex h-11 shrink-0 items-center gap-2.5 rounded-xl px-3 text-left text-sm font-bold transition lg:w-full ${
                      isActive
                        ? 'bg-[#17264b] text-white shadow-[0_8px_18px_rgba(23,38,75,0.16)]'
                        : 'text-[#626b7d] hover:bg-[#eeece6] hover:text-[#253252]'
                    }`}
                    onClick={() => setActiveId(section.id)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon aria-hidden="true" className="size-[17px] shrink-0" />
                    <span className="whitespace-nowrap">
                      {localized(section.label, language)}
                    </span>
                    <ChevronRight
                      aria-hidden="true"
                      className={`ml-auto hidden size-4 lg:block ${isActive ? 'opacity-70' : 'opacity-0 group-hover:opacity-50'}`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </nav>

        <section className="min-w-0 px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
          <div className="mx-auto max-w-5xl">
            <PageHeading language={language} section={activeSection} />
            <SectionContent language={language} section={activeSection} />
          </div>
        </section>
      </div>
    </main>
  );
}

function PageHeading({
  language,
  section,
}: {
  language: Language;
  section: HubSection;
}) {
  const Icon = iconMap[section.icon];

  return (
    <header className="mb-8 flex items-start gap-4 sm:mb-10">
      <span
        className={`grid size-12 shrink-0 place-items-center rounded-2xl ${accentMap[section.icon]}`}
      >
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#848b99]">
          {localized(section.eyebrow, language)}
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-[-0.035em] text-[#17264b] sm:text-4xl">
          {localized(section.label, language)}
        </h1>
      </div>
    </header>
  );
}

function SectionContent({
  language,
  section,
}: {
  language: Language;
  section: HubSection;
}) {
  if (section.id === 'dashboard') {
    return <DashboardEmptyState language={language} />;
  }

  if (section.id === 'classroom') {
    return (
      <EmptyState
        icon={Users}
        label={copy.hub.classroomLabel[language]}
        title={copy.hub.classroomTitle[language]}
        description={copy.hub.classroomDescription[language]}
        comingSoon={copy.hub.comingSoon[language]}
      />
    );
  }

  const subjectLabel = localized(section.label, language);

  return (
    <EmptyState
      icon={iconMap[section.icon]}
      label={copy.hub.newContentOnly[language]}
      title={subjectContentTitle(subjectLabel, language)}
      description={copy.hub.subjectDescription[language]}
      comingSoon={copy.hub.comingSoon[language]}
    />
  );
}

function DashboardEmptyState({ language }: { language: Language }) {
  return (
    <div className="overflow-hidden rounded-[26px] border border-[#dfe1e6] bg-[#fbfaf7] shadow-[0_18px_45px_rgba(27,38,69,0.07)]">
      <div className="grid gap-8 p-6 sm:p-9 md:grid-cols-[1fr_auto] md:items-center lg:p-11">
        <div className="max-w-2xl">
          <Badge className="mb-5 h-7 bg-[#f7e9aa] px-3 text-[11px] font-extrabold text-[#735d12]">
            {copy.hub.dashboardBadge[language]}
          </Badge>
          <h2 className="text-balance text-2xl font-black leading-tight tracking-[-0.035em] text-[#17264b] sm:text-3xl">
            {copy.hub.dashboardHeadingLine1[language]}
            <br />
            {copy.hub.dashboardHeadingLine2[language]}
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[#6e7687] sm:text-[15px]">
            {copy.hub.dashboardDescription[language]}
          </p>
        </div>
        <div className="relative mx-auto grid size-36 place-items-center md:mx-4 sm:size-44">
          <div className="absolute inset-0 rounded-full border border-dashed border-[#bbc5d8]" />
          <div className="absolute inset-4 rounded-full bg-[#e9eef9]" />
          <BookOpenCheck
            aria-hidden="true"
            className="relative size-12 text-[#3c5f9c]"
          />
          <span className="absolute right-1 top-4 grid size-10 place-items-center rounded-full bg-[#f2c94c] text-[#584607] shadow-md">
            <Sparkles aria-hidden="true" className="size-4" />
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#e4e4e2] bg-white/70 px-6 py-4 text-xs font-semibold text-[#737b8d] sm:px-9 lg:px-11">
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#59a985]" />
          {copy.hub.statusLogin[language]}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#6f89c9]" />
          {copy.hub.statusTabs[language]}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#c4a74a]" />
          {copy.hub.statusAuth[language]}
        </span>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  label,
  title,
  description,
  comingSoon,
}: {
  icon: LucideIcon;
  label: string;
  title: string;
  description: string;
  comingSoon: string;
}) {
  return (
    <div className="grid min-h-[390px] place-items-center rounded-[26px] border border-dashed border-[#cfd3dc] bg-[#fbfaf7]/70 px-6 py-12 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid size-16 place-items-center rounded-[20px] bg-[#e9edf6] text-[#455e92]">
          <Icon aria-hidden="true" className="size-7" />
        </span>
        <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8a91a0]">
          {label}
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#263352]">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-7 text-[#747c8c]">{description}</p>
        <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#efede7] px-3.5 py-2 text-xs font-bold text-[#777d89]">
          <Construction aria-hidden="true" className="size-3.5" />
          {comingSoon}
        </div>
      </div>
    </div>
  );
}
