import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassButton } from '@/components/GlassButton';
import { TabSwipeShell } from '@/components/TabSwipeShell';
import { getScenePaddingBottom } from '@/constants/floatingTabBar';
import { GlassCard } from '@/components/GlassSurface';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import {
  getActiveAccount,
  loginWithEmail,
  loginWithName,
  logoutLocalSession,
  registerLocalAccount,
  sendRegisterVerificationCode,
} from '@/lib/profileStorage';
import { useI18n } from '@/lib/useI18n';

type ScreenMode = 'register' | 'login' | 'session';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export default function ProfileScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { t } = useI18n();
  const [mode, setMode] = useState<ScreenMode | null>(null);

  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regName, setRegName] = useState('');
  const [regOtp, setRegOtp] = useState('');
  const [regOtpCooldown, setRegOtpCooldown] = useState(0);

  const [loginMethod, setLoginMethod] = useState<'email' | 'name'>('email');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [sessionEmail, setSessionEmail] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [sessionAvatar, setSessionAvatar] = useState('');
  const [sessionVip, setSessionVip] = useState(false);
  const [sessionCoin, setSessionCoin] = useState(0);
  const [sessionQq, setSessionQq] = useState('');
  const [sessionBilibili, setSessionBilibili] = useState('');

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const acc = await getActiveAccount();
    if (acc) {
      setMode('session');
      setSessionEmail(acc.email);
      setSessionName(acc.name);
      setSessionAvatar(acc.avatar ?? '');
      setSessionVip((acc.isVip === true) || acc.name.trim() === 'JinRui_MaoMao');
      setSessionCoin(acc.furCoin ?? 0);
      setSessionQq(acc.qq ?? '');
      setSessionBilibili(acc.bilibili ?? '');
    } else {
      setMode('login');
      setLoginPassword('');
      setRegOtp('');
      setRegOtpCooldown(0);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    if (regOtpCooldown <= 0) return;
    const id = setInterval(() => {
      setRegOtpCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [regOtpCooldown]);

  useLayoutEffect(() => {
    if (mode === null) return;
    const title =
      mode === 'register' ? t('titleRegister') : mode === 'login' ? t('titleLogin') : t('titleAccount');
    navigation.setOptions({ title });
  }, [mode, navigation, t]);

  const goToRegister = () => {
    setMode('register');
    setLoginPassword('');
  };

  const goToLogin = () => {
    setMode('login');
    setRegEmail('');
    setRegPassword('');
    setRegConfirm('');
    setRegName('');
    setRegOtp('');
    setRegOtpCooldown(0);
  };

  const inputColors =
    colorScheme === 'dark'
      ? {
          bg: 'rgba(28,28,30,0.55)',
          border: 'rgba(255,255,255,0.12)',
          color: '#fff',
          placeholder: '#8e8e93',
        }
      : {
          bg: 'rgba(255,255,255,0.45)',
          border: 'rgba(60,60,67,0.12)',
          color: '#000',
          placeholder: '#8e8e93',
        };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: inputColors.bg,
      borderColor: inputColors.border,
      color: inputColors.color,
    },
  ];

  const onSendRegisterCode = async () => {
    const email = regEmail.trim();
    if (!validateEmail(email)) {
      Alert.alert(t('alertTip'), t('profileEmailInvalid'));
      return;
    }
    setBusy(true);
    try {
      const res = await sendRegisterVerificationCode(email);
      if (!res.ok) {
        Alert.alert(t('alertSendFail'), res.error);
        return;
      }
      setRegOtpCooldown(60);
      if (res.demoCode != null && res.demoCode !== '') {
        Alert.alert(
          t('profileOtpDemoTitle'),
          t('profileOtpDemoBody').replace('{code}', res.demoCode),
        );
      } else {
        Alert.alert(t('profileSentTitle'), t('profileSentBody'));
      }
    } finally {
      setBusy(false);
    }
  };

  const onRegister = async () => {
    const email = regEmail.trim();
    const name = regName.trim();
    if (!validateEmail(email)) {
      Alert.alert(t('alertTip'), t('profileEmailInvalid'));
      return;
    }
    if (regPassword.length < 6) {
      Alert.alert(t('alertTip'), t('profilePwdShort'));
      return;
    }
    if (regPassword !== regConfirm) {
      Alert.alert(t('alertTip'), t('profilePwdMismatch'));
      return;
    }
    if (!name) {
      Alert.alert(t('alertTip'), t('profileNameEmpty'));
      return;
    }
    if (name.length > 20) {
      Alert.alert(t('alertTip'), t('profileNameLong'));
      return;
    }
    if (regOtp.length !== 6) {
      Alert.alert(t('alertTip'), t('profileOtpLen'));
      return;
    }
    setBusy(true);
    try {
      const res = await registerLocalAccount({
        email,
        password: regPassword,
        name,
        verificationCode: regOtp,
      });
      if (!res.ok) {
        Alert.alert(t('alertRegisterFail'), res.error);
        return;
      }
      const savedEmail = email.toLowerCase();
      setRegEmail('');
      setRegPassword('');
      setRegConfirm('');
      setRegName('');
      setRegOtp('');
      setRegOtpCooldown(0);
      setLoginMethod('email');
      setLoginEmail(savedEmail);
      setLoginName('');
      setLoginPassword('');
      setMode('login');
      Keyboard.dismiss();
    } finally {
      setBusy(false);
    }
  };

  const onLogin = async () => {
    setBusy(true);
    try {
      if (loginMethod === 'email') {
        const res = await loginWithEmail(loginEmail, loginPassword);
        if (!res.ok) {
          Alert.alert(t('alertLoginFail'), res.error);
          return;
        }
      } else {
        const res = await loginWithName(loginName, loginPassword);
        if (!res.ok) {
          Alert.alert(t('alertLoginFail'), res.error);
          return;
        }
      }
      setLoginPassword('');
      await load();
      Keyboard.dismiss();
    } finally {
      setBusy(false);
    }
  };

  const onLogout = async () => {
    setBusy(true);
    try {
      await logoutLocalSession();
      setLoginPassword('');
      setRegOtp('');
      setRegOtpCooldown(0);
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (loading || mode === null) {
    return (
      <TabSwipeShell variant="standard">
        <View style={[styles.container, { paddingBottom: getScenePaddingBottom(insets.bottom) }]}>
          <ActivityIndicator style={styles.loader} />
        </View>
      </TabSwipeShell>
    );
  }

  const scrollBottom = getScenePaddingBottom(insets.bottom) + 24;

  if (mode === 'register') {
    return (
      <TabSwipeShell variant="standard">
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottom }]}>
          <GlassCard borderRadius={20} intensity={54} vibe="neutral" contentStyle={styles.cardInner}>
            <Text style={styles.headline}>{t('titleRegister')}</Text>
            <Text style={styles.sub}>{t('profileRegisterSub')}</Text>

            <Text style={styles.label}>{t('profileLabelEmail')}</Text>
            <TextInput
              value={regEmail}
              onChangeText={setRegEmail}
              placeholder="you@example.com"
              placeholderTextColor={inputColors.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={inputStyle}
            />
            <GlassButton
              compact
              variant="neutral"
              label={
                regOtpCooldown > 0
                  ? t('profileResendWait').replace('{n}', String(regOtpCooldown))
                  : busy
                    ? t('profileSending')
                    : t('profileSendCode')
              }
              onPress={() => void onSendRegisterCode()}
              disabled={busy || regOtpCooldown > 0}
              style={styles.sendCodeBtn}
            />

            <Text style={styles.label}>{t('profileLabelOtp')}</Text>
            <TextInput
              value={regOtp}
              onChangeText={(x) => setRegOtp(x.replace(/[^A-Za-z0-9]/g, '').slice(0, 6))}
              placeholder={t('profilePlaceholderOtp')}
              placeholderTextColor={inputColors.placeholder}
              maxLength={6}
              autoCapitalize="none"
              autoCorrect={false}
              style={inputStyle}
            />

            <Text style={styles.label}>{t('profileLabelName')}</Text>
            <TextInput
              value={regName}
              onChangeText={setRegName}
              placeholder={t('profilePlaceholderName')}
              placeholderTextColor={inputColors.placeholder}
              maxLength={20}
              autoCapitalize="none"
              autoCorrect={false}
              style={inputStyle}
            />

            <Text style={styles.label}>{t('profileLabelPassword')}</Text>
            <TextInput
              value={regPassword}
              onChangeText={setRegPassword}
              placeholder={t('profilePlaceholderPwd')}
              placeholderTextColor={inputColors.placeholder}
              secureTextEntry
              autoCapitalize="none"
              style={inputStyle}
            />

            <Text style={styles.label}>{t('profileLabelConfirm')}</Text>
            <TextInput
              value={regConfirm}
              onChangeText={setRegConfirm}
              placeholder={t('profilePlaceholderConfirm')}
              placeholderTextColor={inputColors.placeholder}
              secureTextEntry
              autoCapitalize="none"
              style={inputStyle}
            />

            <GlassButton
              variant="prominent"
              label={busy ? t('profileRegistering') : t('profileRegisterBtn')}
              onPress={() => void onRegister()}
              disabled={busy}
              style={styles.primaryBtn}
            />
          </GlassCard>

          <Pressable onPress={goToLogin} style={styles.linkWrap}>
            <Text style={styles.linkMuted}>{t('profileLinkHasAccount')}</Text>
          </Pressable>

          <Text style={styles.hint}>{t('profileHintAfterReg')}</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </TabSwipeShell>
    );
  }

  if (mode === 'login') {
    return (
      <TabSwipeShell variant="standard">
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottom }]}>
          <GlassCard borderRadius={20} intensity={54} vibe="neutral" contentStyle={styles.cardInner}>
            <Text style={styles.headline}>{t('titleLogin')}</Text>
            <Text style={styles.sub}>{t('profileLoginSub')}</Text>

            <View style={styles.methodRow}>
              <Pressable
                onPress={() => setLoginMethod('email')}
                style={[styles.methodChip, loginMethod === 'email' && styles.methodChipOn]}>
                <Text style={[styles.methodChipText, loginMethod === 'email' && styles.methodChipTextOn]}>
                  {t('profileMethodEmail')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setLoginMethod('name')}
                style={[styles.methodChip, loginMethod === 'name' && styles.methodChipOn]}>
                <Text style={[styles.methodChipText, loginMethod === 'name' && styles.methodChipTextOn]}>
                  {t('profileMethodName')}
                </Text>
              </Pressable>
            </View>

            {loginMethod === 'email' ? (
              <>
                <Text style={styles.label}>{t('profileLabelEmail')}</Text>
                <TextInput
                  value={loginEmail}
                  onChangeText={setLoginEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={inputColors.placeholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={inputStyle}
                />
              </>
            ) : (
              <>
                <Text style={styles.label}>{t('profileLabelName')}</Text>
                <TextInput
                  value={loginName}
                  onChangeText={setLoginName}
                  placeholder={t('profilePlaceholderLoginName')}
                  placeholderTextColor={inputColors.placeholder}
                  maxLength={20}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={inputStyle}
                />
              </>
            )}

            <Text style={styles.label}>{t('profileLabelPassword')}</Text>
            <TextInput
              value={loginPassword}
              onChangeText={setLoginPassword}
              placeholder={t('profilePlaceholderPwdLogin')}
              placeholderTextColor={inputColors.placeholder}
              secureTextEntry
              autoCapitalize="none"
              style={inputStyle}
            />

            <GlassButton
              variant="prominent"
              label={busy ? t('profileLoggingIn') : t('profileLoginBtn')}
              onPress={() => void onLogin()}
              disabled={busy}
              style={styles.primaryBtn}
            />
          </GlassCard>

          <Pressable onPress={goToRegister} style={styles.linkWrap}>
            <Text style={styles.link}>{t('profileLinkNewUser')}</Text>
          </Pressable>

          <Text style={styles.hint}>{t('profileHintLogin')}</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </TabSwipeShell>
    );
  }

  const displayName = sessionName.trim() || t('profileNameUnset');
  const avatarRaw = sessionAvatar.trim();
  const avatarLabel = (avatarRaw || displayName.slice(0, 1)).toUpperCase();
  const avatarIsImage = /^file:|^content:|^https?:/i.test(avatarRaw);
  const openAppOrWeb = async (appUrl: string, webUrl: string) => {
    try {
      await Linking.openURL(appUrl);
      return;
    } catch {
      await Linking.openURL(webUrl);
    }
  };
  const openQqProfile = async () => {
    const uin = sessionQq.trim();
    if (!uin) return;
    const appUrl = `mqqapi://card/show_pslcard?src_type=internal&version=1&uin=${encodeURIComponent(uin)}&card_type=person`;
    const webUrl = `https://wpa.qq.com/msgrd?v=3&uin=${encodeURIComponent(uin)}&site=qq&menu=yes`;
    await openAppOrWeb(appUrl, webUrl);
  };
  const openBilibili = async () => {
    const url = sessionBilibili.trim();
    if (!url) return;
    const uidMatch = url.match(/space\.bilibili\.com\/(\d+)/i);
    const appUrl = uidMatch ? `bilibili://space/${uidMatch[1]}` : 'bilibili://';
    await openAppOrWeb(appUrl, url);
  };

  return (
    <TabSwipeShell variant="standard">
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottom }]}>
        <Text style={styles.coinText}>
          {t('profileFurCoinPrefix')}
          {sessionCoin}
        </Text>
        <View style={styles.avatar}>
          {avatarIsImage ? (
            <Image source={{ uri: avatarRaw }} style={[styles.avatarImage, sessionVip && styles.avatarVip]} />
          ) : (
            <Text style={[styles.avatarTextWrap, styles.avatarText, sessionVip && styles.avatarVip]}>{avatarLabel}</Text>
          )}
        </View>
        {sessionVip ? <Text style={styles.vipTag}>{t('vipUserTag')}</Text> : null}
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.emailLine}>
          {t('profileEmailPrefix')}
          {sessionEmail}
        </Text>

        {sessionQq.trim() ? (
          <GlassButton
            variant="neutral"
            label="QQ"
            onPress={() => void openQqProfile()}
            style={styles.contactButton}
          />
        ) : null}
        {sessionBilibili.trim() ? (
          <GlassButton
            variant="neutral"
            label={t('contactBilibiliLabel')}
            onPress={() => void openBilibili()}
            style={styles.contactButton}
          />
        ) : null}

        <GlassButton
          variant="neutral"
          label={busy ? t('profileWait') : t('profileLogout')}
          onPress={() => void onLogout()}
          disabled={busy}
          style={styles.logoutButton}
        />

        <Text style={styles.hint}>{t('profileSessionHint')}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </TabSwipeShell>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  headline: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.75,
    marginBottom: 16,
  },
  avatar: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  avatarTextWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 88,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#6366f1',
  },
  avatarVip: {
    borderWidth: 3,
    borderColor: '#f59e0b',
    shadowColor: '#f59e0b',
    shadowOpacity: 0.32,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  vipTag: {
    marginTop: -8,
    marginBottom: 10,
    fontSize: 12,
    color: '#d97706',
    fontWeight: '700',
    textAlign: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  emailLine: {
    fontSize: 14,
    opacity: 0.72,
    marginBottom: 18,
    textAlign: 'center',
  },
  cardInner: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 4,
  },
  primaryBtn: {
    alignSelf: 'stretch',
    marginTop: 18,
  },
  logoutButton: {
    alignSelf: 'stretch',
    marginTop: 14,
  },
  contactButton: {
    alignSelf: 'stretch',
    marginTop: 8,
  },
  loader: {
    marginTop: 48,
  },
  hint: {
    marginTop: 20,
    fontSize: 13,
    lineHeight: 19,
    opacity: 0.72,
  },
  coinText: {
    alignSelf: 'flex-start',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    color: '#f59e0b',
  },
  methodRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  methodChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(120,120,128,0.12)',
  },
  methodChipOn: {
    backgroundColor: 'rgba(99,102,241,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.45)',
  },
  methodChipText: {
    fontSize: 14,
    opacity: 0.75,
    fontWeight: '600',
  },
  methodChipTextOn: {
    opacity: 1,
  },
  sendCodeBtn: {
    alignSelf: 'stretch',
    marginTop: 10,
  },
  linkWrap: {
    alignSelf: 'center',
    marginTop: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  link: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6366f1',
    textDecorationLine: 'underline',
  },
  linkMuted: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    opacity: 0.9,
    textDecorationLine: 'underline',
  },
});
