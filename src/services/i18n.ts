import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ja from '../locales/ja.json';
import ko from '../locales/ko.json';

const LANGUAGE_KEY = '@app_language';

// 多言語リソースの登録
const resources = {
  ja: { translation: ja },
  ko: { translation: ko },
};

/**
 * 端末の設定言語またはローカルストレージの保存値から言語を判定
 */
const detectInitialLanguage = async (): Promise<string> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (savedLanguage && (savedLanguage === 'ja' || savedLanguage === 'ko')) {
      return savedLanguage;
    }
  } catch {
    // 取得失敗時は端末ロケール判定にフォールバック
  }

  const deviceLocales = Localization.getLocales();
  const deviceLanguageCode = deviceLocales[0]?.languageCode;
  return deviceLanguageCode === 'ko' ? 'ko' : 'ja';
};

// i18next 初期化設定
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ja',
    fallbackLng: 'ja',
    interpolation: {
      escapeValue: false,
    },
  });

/**
 * アプリ起動時の非同期言語ロード処理
 */
export const initializeLanguage = async (): Promise<void> => {
  const initialLang = await detectInitialLanguage();
  await i18n.changeLanguage(initialLang);
};

/**
 * 言語切り替えおよび端末ローカルストレージへの永続化
 * @param lang 'ja' | 'ko'
 */
export const changeLanguage = async (lang: 'ja' | 'ko'): Promise<void> => {
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
};

export default i18n;