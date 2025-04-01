import { translations } from './i18n/fr';

// Simple i18n implementation
const i18n = {
  // Get a translation by key
  t: (key: string): string => {
    return getNestedTranslation(translations, key) || key;
  }
};

// Helper function to get nested translations using dot notation
function getNestedTranslation(obj: any, path: string): string | undefined {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current === undefined || current[key] === undefined) {
      return undefined;
    }
    current = current[key];
  }
  
  return typeof current === 'string' ? current : undefined;
}

export default i18n;
