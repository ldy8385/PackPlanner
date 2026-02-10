import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { storage } from '../utils/storage';
import ko from './ko';
import en from './en';

i18n.use(initReactI18next).init({
  resources: {
    ko: { translation: ko },
    en: { translation: en },
  },
  lng: 'ko',
  fallbackLng: 'ko',
  interpolation: {
    escapeValue: false,
  },
});

// 저장된 언어 설정 로드
storage.loadLanguage().then(lang => {
  if (lang) {
    i18n.changeLanguage(lang);
  }
});

export default i18n;
