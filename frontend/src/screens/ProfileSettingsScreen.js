import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import { C } from '../theme/colors';

// ─── Sub-components ────────────────────────────────────────────────────────────

/** Section heading with a tonal background band */
function SectionLabel({ icon, title }) {
  return (
    <View style={s.sectionLabel}>
      <View style={s.sectionLabelIcon}>
        <MaterialIcons name={icon} size={16} color={C.accent} />
      </View>
      <Text style={s.sectionLabelText}>{title}</Text>
    </View>
  );
}

/** Tonal input field — no border line, depth via background contrast */
function Field({ label, value, onChangeText, placeholder, secureTextEntry = false, autoCapitalize = 'none', keyboardType = 'default', editable = true }) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={[s.input, !editable && s.inputDisabled]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        editable={editable}
        selectionColor={C.accent}
      />
    </View>
  );
}

/** Toggle row — uses tonal depth to visually separate from card */
function ToggleRow({ icon, title, subtitle, value, onValueChange }) {
  return (
    <View style={s.toggleRow}>
      <View style={s.toggleRowIcon}>
        <MaterialIcons name={icon} size={18} color={C.accent} />
      </View>
      <View style={s.toggleRowText}>
        <Text style={s.toggleRowTitle}>{title}</Text>
        {subtitle ? <Text style={s.toggleRowSub}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        thumbColor={value ? C.accent : C.muted}
        trackColor={{ false: C.card, true: C.primaryDark }}
        ios_backgroundColor={C.card}
        accessibilityLabel={title}
      />
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function ProfileSettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logout, notificationsEnabled, toggleNotifications } = useAuth();

  // ── Account state ────────────────────────────────────────────────────────────
  const [name, setName]   = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);

  // ── Password modal state ─────────────────────────────────────────────────────
  const [pwdModal, setPwdModal]         = useState(false);
  const [currentPwd, setCurrentPwd]     = useState('');
  const [newPwd, setNewPwd]             = useState('');
  const [confirmPwd, setConfirmPwd]     = useState('');
  const [changingPwd, setChangingPwd]   = useState(false);

  // ── Preferences state ────────────────────────────────────────────────────────
  const [emailNewsletter, setEmailNewsletter] = useState(false);

  // ─── Handlers ─────────────────────────────────────────────────────────────────

  const handleUpdateProfile = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Ελλιπή στοιχεία', 'Το όνομα δεν μπορεί να είναι κενό.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Μη έγκυρο email', 'Εισάγετε έγκυρη διεύθυνση email.');
      return;
    }
    setSaving(true);
    try {
      await api.put('/user/profile', { name: name.trim(), email: email.trim() });
      Alert.alert('Επιτυχία', 'Το προφίλ σας ενημερώθηκε.');
    } catch (err) {
      Alert.alert('Σφάλμα', err.response?.data?.error || 'Αποτυχία ενημέρωσης προφίλ.');
    } finally {
      setSaving(false);
    }
  }, [name, email]);

  const handleChangePassword = useCallback(async () => {
    if (!currentPwd || !newPwd || !confirmPwd) {
      Alert.alert('Ελλιπή στοιχεία', 'Συμπληρώστε όλα τα πεδία.');
      return;
    }
    if (newPwd !== confirmPwd) {
      Alert.alert('Σφάλμα', 'Ο νέος κωδικός δεν ταιριάζει.');
      return;
    }
    if (newPwd.length < 8) {
      Alert.alert('Σφάλμα', 'Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες.');
      return;
    }
    setChangingPwd(true);
    try {
      await api.put('/user/password', { currentPassword: currentPwd, newPassword: newPwd });
      Alert.alert('Επιτυχία', 'Ο κωδικός πρόσβασής σας άλλαξε.');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setPwdModal(false);
    } catch (err) {
      Alert.alert('Σφάλμα', err.response?.data?.error || 'Ο τρέχων κωδικός δεν είναι σωστός.');
    } finally {
      setChangingPwd(false);
    }
  }, [currentPwd, newPwd, confirmPwd]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Διαγραφή Λογαριασμού',
      'Αυτή η ενέργεια είναι μόνιμη και δεν μπορεί να αναιρεθεί. Θέλεις να συνεχίσεις;',
      [
        { text: 'Ακύρωση', style: 'cancel' },
        {
          text: 'Διαγραφή',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/user/account');
              await logout();
            } catch (err) {
              Alert.alert('Σφάλμα', err.response?.data?.error || 'Αποτυχία διαγραφής λογαριασμού.');
            }
          },
        },
      ],
    );
  }, [logout]);

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={s.root}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={s.backBtn}
          accessibilityLabel="Πίσω"
          activeOpacity={0.75}
        >
          <MaterialIcons name="arrow-back" size={18} color={C.accentSoft} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Ρυθμίσεις Προφίλ</Text>
        <View style={s.headerSpacer} />
      </View>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Avatar banner ──────────────────────────────────────────────── */}
          <View style={s.avatarBanner}>
            <View style={s.avatarRing}>
              <View style={s.avatar}>
                <Text style={s.avatarInitial}>
                  {user?.name?.charAt(0).toUpperCase() ?? '?'}
                </Text>
              </View>
            </View>
            <Text style={s.bannerName}>{user?.name}</Text>
            <Text style={s.bannerEmail}>{user?.email}</Text>
          </View>

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION: Λογαριασμός
          ═══════════════════════════════════════════════════════════════════ */}
          <SectionLabel icon="person-outline" title="Λογαριασμός" />
          <View style={s.card}>
            <Field
              label="Ονοματεπώνυμο"
              value={name}
              onChangeText={setName}
              placeholder="Το ονοματεπώνυμό σας"
              autoCapitalize="words"
              keyboardType="default"
            />
            <View style={s.fieldDivider} />
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Update profile button */}
          <TouchableOpacity
            style={s.primaryBtn}
            onPress={handleUpdateProfile}
            disabled={saving}
            accessibilityLabel="Ενημέρωση Προφίλ"
            activeOpacity={0.82}
          >
            {saving ? (
              <ActivityIndicator size="small" color={C.bg} />
            ) : (
              <>
                <MaterialIcons name="check" size={18} color={C.bg} />
                <Text style={s.primaryBtnText}>Ενημέρωση Προφίλ</Text>
              </>
            )}
          </TouchableOpacity>

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION: Ασφάλεια
          ═══════════════════════════════════════════════════════════════════ */}
          <SectionLabel icon="lock-outline" title="Ασφάλεια" />
          <View style={s.card}>
            <TouchableOpacity
              style={s.actionRow}
              onPress={() => setPwdModal(true)}
              accessibilityLabel="Αλλαγή Κωδικού"
              activeOpacity={0.75}
            >
              <View style={s.actionRowLeft}>
                <View style={[s.actionRowIcon, { backgroundColor: C.surface3 }]}>
                  <MaterialIcons name="vpn-key" size={18} color={C.accent} />
                </View>
                <View>
                  <Text style={s.actionRowTitle}>Αλλαγή Κωδικού</Text>
                  <Text style={s.actionRowSub}>Ενημερώστε τον κωδικό πρόσβασής σας</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={C.muted} />
            </TouchableOpacity>
          </View>

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION: Προτιμήσεις
          ═══════════════════════════════════════════════════════════════════ */}
          <SectionLabel icon="tune" title="Προτιμήσεις" />
          <View style={s.card}>
            <ToggleRow
              icon="notifications-none"
              title="Push Ειδοποιήσεις"
              subtitle="Νέες παραστάσεις & κρατήσεις"
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
            />
            <View style={s.fieldDivider} />
            <ToggleRow
              icon="mail-outline"
              title="Email Newsletter"
              subtitle="Ειδικές προσφορές & νέα"
              value={emailNewsletter}
              onValueChange={setEmailNewsletter}
            />
          </View>

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION: Ζώνη Κινδύνου
          ═══════════════════════════════════════════════════════════════════ */}
          <SectionLabel icon="warning-amber" title="Ζώνη Κινδύνου" />
          <View style={[s.card, s.dangerCard]}>
            <Text style={s.dangerCardText}>
              Η διαγραφή του λογαριασμού σας είναι μόνιμη. Όλα τα δεδομένα και οι κρατήσεις σας θα διαγραφούν οριστικά.
            </Text>
            <TouchableOpacity
              style={s.deleteBtn}
              onPress={handleDeleteAccount}
              accessibilityLabel="Διαγραφή Λογαριασμού"
              activeOpacity={0.8}
            >
              <MaterialIcons name="delete-forever" size={18} color={C.error} />
              <Text style={s.deleteBtnText}>Διαγραφή Λογαριασμού</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ─── Change Password Modal ─────────────────────────────────────────── */}
      <Modal
        visible={pwdModal}
        transparent
        animationType="slide"
        onRequestClose={() => setPwdModal(false)}
      >
        <KeyboardAvoidingView
          style={s.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[s.modalSheet, { paddingBottom: insets.bottom + 24 }]}>

            {/* Modal header */}
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Αλλαγή Κωδικού</Text>
              <TouchableOpacity
                onPress={() => setPwdModal(false)}
                style={s.modalCloseBtn}
                accessibilityLabel="Κλείσιμο"
              >
                <MaterialIcons name="close" size={20} color={C.muted} />
              </TouchableOpacity>
            </View>

            {/* Drag pill */}
            <View style={s.dragPill} />

            <Field
              label="Τρέχων Κωδικός"
              value={currentPwd}
              onChangeText={setCurrentPwd}
              placeholder="••••••••"
              secureTextEntry
            />
            <View style={{ height: 12 }} />
            <Field
              label="Νέος Κωδικός"
              value={newPwd}
              onChangeText={setNewPwd}
              placeholder="Τουλάχιστον 8 χαρακτήρες"
              secureTextEntry
            />
            <View style={{ height: 12 }} />
            <Field
              label="Επιβεβαίωση Νέου Κωδικού"
              value={confirmPwd}
              onChangeText={setConfirmPwd}
              placeholder="Επαναλάβετε τον νέο κωδικό"
              secureTextEntry
            />

            <TouchableOpacity
              style={[s.primaryBtn, { marginTop: 24, marginHorizontal: 0 }]}
              onPress={handleChangePassword}
              disabled={changingPwd}
              accessibilityLabel="Αποθήκευση νέου κωδικού"
              activeOpacity={0.82}
            >
              {changingPwd ? (
                <ActivityIndicator size="small" color={C.bg} />
              ) : (
                <>
                  <MaterialIcons name="lock-reset" size={18} color={C.bg} />
                  <Text style={s.primaryBtnText}>Αλλαγή Κωδικού</Text>
                </>
              )}
            </TouchableOpacity>

          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── StyleSheet ────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: C.surface,
  },
  backBtn: {
    height: 40,
    width: 40,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.card,
  },
  headerTitle: {
    color: C.text,
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 40,
  },

  // ── Content ─────────────────────────────────────────────────────────────────
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  // ── Avatar banner ────────────────────────────────────────────────────────────
  avatarBanner: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarRing: {
    width: 84,
    height: 84,
    borderRadius: 9999,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 9999,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: C.onPrimary,
    fontSize: 28,
    fontWeight: '800',
  },
  bannerName: {
    color: C.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  bannerEmail: {
    color: C.muted,
    fontSize: 14,
  },

  // ── Section label ────────────────────────────────────────────────────────────
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    marginTop: 8,
  },
  sectionLabelIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabelText: {
    color: C.textSoft,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },

  // ── Card ─────────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: C.surface,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
    // Subtle shadow for premium elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  dangerCard: {
    padding: 16,
  },

  // ── Field (flushed / bottom-border style) ─────────────────────────────────────
  field: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  fieldLabel: {
    color: C.muted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    color: C.text,
    fontSize: 16,
    fontWeight: '500',
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 10,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  fieldDivider: {
    height: 1,
    backgroundColor: C.bg,
    marginHorizontal: 0,
  },

  // ── Toggle row ─────────────────────────────────────────────────────────────
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  toggleRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleRowText: {
    flex: 1,
  },
  toggleRowTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: '600',
  },
  toggleRowSub: {
    color: C.muted,
    fontSize: 12,
    marginTop: 2,
  },

  // ── Action row (chevron) ────────────────────────────────────────────────────
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  actionRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRowTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: '600',
  },
  actionRowSub: {
    color: C.muted,
    fontSize: 12,
    marginTop: 2,
  },

  // ── Primary button ──────────────────────────────────────────────────────────
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.accent,
    borderRadius: 14,
    paddingVertical: 15,
    marginBottom: 20,
  },
  primaryBtnText: {
    color: C.bg,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  // ── Danger Zone ─────────────────────────────────────────────────────────────
  dangerCardText: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.errorSoft,
    borderRadius: 12,
    paddingVertical: 13,
  },
  deleteBtnText: {
    color: C.error,
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Modal ────────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  dragPill: {
    width: 40,
    height: 4,
    borderRadius: 9999,
    backgroundColor: C.card,
    alignSelf: 'center',
    marginBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modalTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 9999,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
