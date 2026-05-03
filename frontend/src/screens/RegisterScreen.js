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

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Σφάλμα', 'Συμπλήρωσε όλα τα πεδία.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Σφάλμα', 'Ο κωδικός πρέπει να είναι τουλάχιστον 6 χαρακτήρες.');
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
    } catch (err) {
      Alert.alert('Σφάλμα', err?.response?.data?.error || 'Αποτυχία εγγραφής.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView style={s.scroll} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={s.pagePad}>
          <View style={s.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={s.backBtn}
              accessibilityRole="button"
              accessibilityLabel="Πίσω"
            >
              <MaterialIcons name="arrow-back" size={20} color={C.accentSoft} />
            </TouchableOpacity>
            <Text style={s.title}>Δημιουργία Λογαριασμού</Text>
          </View>

          <View style={s.card}>
            <View style={s.fieldBlock}>
              <Text style={s.label}>
                Ονοματεπώνυμο
              </Text>
              <View style={s.inputShell}>
                <TextInput
                  style={s.input}
                  placeholder="π.χ. Μαρία Παπαδοπούλου"
                  placeholderTextColor={C.muted}
                  value={name}
                  onChangeText={setName}
                  accessibilityLabel="Ονοματεπώνυμο"
                />
              </View>
            </View>

            <View style={s.fieldBlock}>
              <Text style={s.label}>
                Email
              </Text>
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

            <View style={s.fieldBlockLast}>
              <Text style={s.label}>
                Κωδικός
              </Text>
              <View style={s.inputShellRow}>
                <TextInput
                  style={s.inputFlex}
                  placeholder="Τουλάχιστον 6 χαρακτήρες"
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
                    color={C.muted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[s.submitBtn, loading && s.submitBtnLoading]}
              onPress={handleRegister}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Δημιουργία λογαριασμού"
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={C.onPrimary} />
              ) : (
                <View style={s.submitRow}>
                  <Text style={s.submitText}>Δημιουργία</Text>
                  <MaterialIcons name="arrow-forward" size={20} color={C.onPrimary} />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={s.secondaryBtn}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Μετάβαση στη σύνδεση"
            >
              <Text style={s.secondaryText}>
                Έχεις ήδη λογαριασμό; <Text style={s.secondaryAccent}>Σύνδεση</Text>
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
  pagePad: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 56,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  backBtn: {
    height: 40,
    width: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: C.surface,
  },
  title: {
    color: C.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  card: {
    borderRadius: 24,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    padding: 24,
  },
  fieldBlock: {
    marginBottom: 20,
  },
  fieldBlockLast: {
    marginBottom: 24,
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
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  inputShellRow: {
    height: 56,
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
  submitBtn: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primary,
  },
  submitBtnLoading: {
    backgroundColor: C.primaryDark,
    opacity: 0.85,
  },
  submitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitText: {
    color: C.onPrimary,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginRight: 8,
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
  secondaryText: {
    color: C.text,
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryAccent: {
    color: C.accent,
  },
});
