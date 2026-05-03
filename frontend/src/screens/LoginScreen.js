import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { C } from '../theme/colors';

export default function LoginScreen({ navigation }) {
  const { login, loginWithAuth0 } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [auth0Loading, setAuth0Loading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Σφάλμα', 'Συμπλήρωσε email και κωδικό.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      Alert.alert('Σφάλμα', err?.response?.data?.error || 'Αποτυχία σύνδεσης.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth0Login = async () => {
    setAuth0Loading(true);
    try {
      await loginWithAuth0();
    } catch (err) {
      Alert.alert('Σφάλμα', err?.message || 'Αποτυχία σύνδεσης με Google.');
    } finally {
      setAuth0Loading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.outer}>
          <View style={s.headerBlock}>
            <View style={s.logoWrap}>
              <MaterialIcons name="theater-comedy" size={42} color={C.primary} />
            </View>
            <Text style={s.title}>Theatre Booking</Text>
            <Text style={s.subtitle}>
              Ζήσε τη βραδιά. Συνδέσου για κρατήσεις παραστάσεων.
            </Text>
          </View>

          <View style={s.card}>
            <View style={s.fieldBlock}>
              <Text style={s.label}>Email</Text>
              <View style={s.inputShell}>
                <TextInput
                  style={s.input}
                  placeholder="example@theatre.gr"
                  placeholderTextColor={C.muted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  accessibilityLabel="Email"
                />
              </View>
            </View>

            <View style={s.fieldBlockTight}>
              <Text style={s.label}>Κωδικός</Text>
              <View style={s.inputShellRow}>
                <TextInput
                  style={s.inputFlex}
                  placeholder="••••••••"
                  placeholderTextColor={C.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                  accessibilityLabel="Κωδικός"
                />
                <TouchableOpacity
                  onPress={() => setShowPass((v) => !v)}
                  accessibilityRole="button"
                  accessibilityLabel={showPass ? 'Απόκρυψη κωδικού' : 'Εμφάνιση κωδικού'}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons
                    name={showPass ? 'visibility-off' : 'visibility'}
                    size={22}
                    color={C.textSoft}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={s.forgotWrap} activeOpacity={0.8}>
              <Text style={s.forgotText}>Ξέχασες τον κωδικό;</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.primaryBtn, loading && s.primaryBtnLoading]}
              onPress={handleLogin}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Σύνδεση"
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={C.onPrimary} />
              ) : (
                <View style={s.primaryBtnInner}>
                  <Text style={s.primaryBtnText}>Σύνδεση</Text>
                  <MaterialIcons name="arrow-forward" size={20} color={C.onPrimary} />
                </View>
              )}
            </TouchableOpacity>

            {/* ── Divider ── */}
            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>ή</Text>
              <View style={s.dividerLine} />
            </View>

            {/* ── Auth0 Button ── */}
            <TouchableOpacity
              style={[s.auth0Btn, auth0Loading && s.primaryBtnLoading]}
              onPress={handleAuth0Login}
              disabled={auth0Loading || loading}
              accessibilityRole="button"
              accessibilityLabel="Σύνδεση με Google"
              activeOpacity={0.85}
            >
              {auth0Loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={s.primaryBtnInner}>
                  <MaterialIcons name="security" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={s.auth0BtnText}>Σύνδεση με Google</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={s.secondaryBtn}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Μετάβαση σε εγγραφή"
            >
              <Text style={s.secondaryBtnText}>
                Δεν έχεις λογαριασμό; <Text style={s.secondaryBtnAccent}>Εγγραφή</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: C.bg,
  },
  outer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 80,
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoWrap: {
    width: 76,
    height: 76,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 20,
  },
  title: {
    color: C.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    color: C.muted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  card: {
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
  },
  fieldBlock: {
    marginBottom: 20,
  },
  fieldBlockTight: {
    marginBottom: 8,
  },
  label: {
    color: C.muted,
    textTransform: 'uppercase',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  inputShell: {
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  inputShellRow: {
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    color: C.text,
    fontSize: 16,
  },
  inputFlex: {
    flex: 1,
    color: C.text,
    fontSize: 16,
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    marginTop: 12,
    marginBottom: 20,
  },
  forgotText: {
    color: C.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  primaryBtn: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primary,
  },
  primaryBtnLoading: {
    backgroundColor: C.primaryDark,
    opacity: 0.85,
  },
  primaryBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: C.onPrimary,
    fontSize: 17,
    fontWeight: '800',
    marginRight: 8,
    letterSpacing: -0.2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
  },
  dividerText: {
    color: C.muted,
    fontSize: 12,
    marginHorizontal: 10,
    fontWeight: '600',
  },
  auth0Btn: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eb5424',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eb5424',
    marginBottom: 4,
  },
  auth0BtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  secondaryBtnText: {
    color: C.text,
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryBtnAccent: {
    color: C.accent,
  },
});
