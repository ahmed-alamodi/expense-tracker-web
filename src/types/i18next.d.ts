import 'i18next';
import ar from '@/locales/ar';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof ar;
    };
  }
}
