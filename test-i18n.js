const i18n = require('i18next');
const ar = require('./src/locales/ar').default || require('./src/locales/ar');

i18n.init({
  resources: { ar: { translation: ar } },
  lng: 'ar',
  fallbackLng: 'ar',
  interpolation: { escapeValue: false }
});

console.log(i18n.t('home.totalExpenses'));
console.log(i18n.t('common.save'));
