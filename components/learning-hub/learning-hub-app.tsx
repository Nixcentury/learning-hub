import { useEffect, useState } from 'react';

import { HubShell } from '@/components/learning-hub/hub-shell';
import { LoginScreen } from '@/components/learning-hub/login-screen';
import { copy, type Language } from '@/lib/i18n';

const languageStorageKey = 'learning-hub-language';

function getInitialLanguage(): Language {
  try {
    const storedLanguage = window.localStorage.getItem(languageStorageKey);
    return storedLanguage === 'en' ? 'en' : 'th';
  } catch {
    return 'th';
  }
}

export function LearningHubApp() {
  const [isGuest, setIsGuest] = useState(false);
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = 'Learning Hub';
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', copy.metaDescription[language]);

    try {
      window.localStorage.setItem(languageStorageKey, language);
    } catch {
      // Language preference remains active for the current visit.
    }
  }, [language]);

  if (!isGuest) {
    return (
      <LoginScreen
        language={language}
        onLanguageChange={setLanguage}
        onContinue={() => setIsGuest(true)}
      />
    );
  }

  return (
    <HubShell
      language={language}
      onLanguageChange={setLanguage}
      onSignOut={() => setIsGuest(false)}
    />
  );
}
