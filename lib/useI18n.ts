import { useAppPreferences } from '@/context/AppPreferences';
import { type I18nKey, tr } from '@/lib/i18n';

export function useI18n() {
  const { prefs } = useAppPreferences();
  const lang = prefs.language;
  /** 不用 useCallback，避免导航栏等依赖 `t` 引用的 effect 在换语言时不触发 */
  const t = (key: I18nKey) => tr(lang, key);
  return { t, lang };
}
