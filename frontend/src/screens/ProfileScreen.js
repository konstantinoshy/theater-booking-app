import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { C } from '../theme/colors';

// ─── Animated reservation card with staggered entrance ──────────────────────────

function AnimatedCard({
  item,
  index,
  isConfirmedCheck,
  isFuture,
  cancelReservation,
  deleteReservation,
  onPressCard,
  editReservation,
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isConfirmed = isConfirmedCheck(item);

  useEffect(() => {
    const delay = (index || 0) * 80;
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 360,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 360,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 28 }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 28 }).start();

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}
    >
      <Pressable 
        style={[s.card, !isConfirmed && { opacity: 0.45, backgroundColor: 'rgba(255,255,255,0.02)' }]}
        onPress={onPressCard}
        onPressIn={!isConfirmed ? null : handlePressIn}
        onPressOut={!isConfirmed ? null : handlePressOut}
      >
        {/* Card header */}
        <View style={s.cardInner}>
          <View style={s.cardHeaderRow}>
            <View style={s.cardTitleBlock}>
              <Text style={s.showTitle}>{item.show_title}</Text>
              <View style={s.rowGapSm}>
                <MaterialIcons name="theater-comedy" size={16} color={C.muted} />
                <Text style={s.theatreName}>{item.theatre_name}</Text>
              </View>
            </View>
            <View style={[s.badge, isConfirmed ? s.badgeSuccess : s.badgeError]}>
              <MaterialIcons
                name={isConfirmed ? 'check-circle' : 'cancel'}
                size={14}
                color={isConfirmed ? C.success : C.error}
              />
              <Text style={[s.badgeText, isConfirmed ? s.badgeTextSuccess : s.badgeTextError]}>
                {isConfirmed ? 'Επιβεβαιωμένη' : 'Ακυρωμένη'}
              </Text>
            </View>
          </View>

          {/* Details */}
          <View style={s.detailsBlock}>
            <View style={s.rowGapMd}>
              <MaterialIcons name="calendar-today" size={16} color={C.accent} />
              <Text style={s.detailText}>
                {new Date(item.start_time).toLocaleString('el-GR', {
                  dateStyle: 'long',
                  timeStyle: 'short',
                })}
              </Text>
            </View>
            {item.seats.map((seat, i) => (
              <View key={i} style={s.rowGapMd}>
                <MaterialIcons name="event-seat" size={16} color={C.accent} />
                <Text style={s.detailText}>
                  {seat.category_name}: {seat.quantity} εισ. x {seat.price}€
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        {isConfirmed && isFuture(item.start_time) ? (
          <View style={s.cardFooter}>
            <View style={s.cardFooterRow}>
              <TouchableOpacity
                onPress={() => editReservation(item)}
                style={s.editBtn}
                accessibilityLabel="Τροποποίηση κράτησης"
                activeOpacity={0.7}
              >
                <MaterialIcons name="edit" size={16} color={C.accent} style={{ marginRight: 6 }} />
                <Text style={s.editBtnText}>Τροποποίηση</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => cancelReservation(item.reservation_id)}
                style={[s.cancelBtn, s.cancelBtnFlex]}
                accessibilityLabel="Ακύρωση κράτησης"
                activeOpacity={0.7}
              >
                <MaterialIcons name="cancel" size={16} color={C.error} style={{ marginRight: 6 }} />
                <Text style={s.cancelBtnText}>Ακύρωση</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : !isConfirmed ? (
          <View style={[s.cardFooter, s.cardFooterCancelledRow]}>
            <Text style={[s.cancelledNote, { flex: 1 }]}>
              Η κράτηση ακυρώθηκε
            </Text>
            <TouchableOpacity
              onPress={() => deleteReservation(item.reservation_id)}
              style={[s.cancelBtn, { borderColor: C.border, paddingHorizontal: 12 }]}
              accessibilityLabel="Διαγραφή από ιστορικό"
              activeOpacity={0.7}
            >
              <MaterialIcons name="delete-outline" size={16} color={C.textSoft} style={{ marginRight: 6 }} />
              <Text style={[s.cancelBtnText, { color: C.textSoft }]}>Διαγραφή</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

// ─── Animated quick action button with tactile press ─────────────────────────────

function AnimatedQuickAction({ icon, label, onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 28 }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 28 }).start();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ flex: 1 }}
    >
      <Animated.View style={[s.quickActionCard, { transform: [{ scale: scaleAnim }] }]}>
        <MaterialIcons name={icon} size={28} color={C.accentSoft} />
        <Text style={s.quickActionTitle}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const { addNotification } = useNotifications();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchReservations();
    }, []),
  );

  const fetchReservations = async () => {
    try {
      const { data } = await api.get('/user/reservations');
      setReservations(data);
    } catch {
      Alert.alert('Σφάλμα', 'Αδυναμία φόρτωσης κρατήσεων.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const deleteReservation = async (id) => {
    // Optimistic UI — remove the card immediately for snappy feedback
    const previousReservations = reservations;
    setReservations((prev) => prev.filter((r) => r.reservation_id !== id));

    try {
      await api.delete(`/reservations/${id}`);
    } catch (err) {
      // Revert on failure
      setReservations(previousReservations);
      Alert.alert('Σφάλμα', err.response?.data?.error || 'Αποτυχία διαγραφής κράτησης.');
    }
  };

  const editReservationFromProfile = async (item) => {
    let showtimeId = item.showtime_id ?? item.showtimeId;
    let show_title = item.show_title;
    let start_time = item.start_time;
    let theatre_name = item.theatre_name;

    if (showtimeId == null || showtimeId === '') {
      try {
        const { data } = await api.get(`/reservations/${item.reservation_id}`);
        showtimeId = data.showtime_id ?? data.showtimeId ?? showtimeId;
        show_title = show_title ?? data.show_title;
        start_time = start_time ?? data.start_time;
        theatre_name = theatre_name ?? data.theatre_name;
        const sid = showtimeId;
        if (sid != null && sid !== '')
          setReservations((prev) =>
            prev.map((r) =>
              r.reservation_id === item.reservation_id ? { ...r, showtime_id: sid } : r,
            ),
          );
      } catch (err) {
        Alert.alert(
          'Σφάλμα',
          err.response?.data?.error ||
            'Δεν ήταν δυνατή η φόρτωση της κράτησης. Επανεκκίνησε τον διακομιστή (backend) αν μόλις ενημέρωσες τον κώδικα και ξανάδοκιμασε.',
        );
        return;
      }
    }

    if (showtimeId == null || showtimeId === '') {
      Alert.alert(
        'Σφάλμα',
        'Η κράτηση δεν περιλαμβάνει αναγνωριστικό προβολής. Κάνε ανανέωση της λίστας ή δοκίμασε ξανά.',
      );
      return;
    }

    navigation.navigate('Θέατρα', {
      screen: 'Booking',
      params: {
        editReservationId: item.reservation_id,
        showtimeId: Number(showtimeId),
        showTitle: show_title,
        startTime: start_time,
        theatreName: theatre_name,
      },
    });
  };

  const cancelReservation = (id) => {
    Alert.alert('Ακύρωση Κράτησης', 'Είσαι σίγουρος/η ότι θέλεις να ακυρώσεις;', [
      { text: 'Επιστροφή', style: 'cancel' },
      {
        text: 'Ακύρωση',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.put(`/reservations/${id}/cancel`);
            addNotification(
              'Ακύρωση Κράτησης',
              `Η κράτησή σας ακυρώθηκε επιτυχώς.`,
              'cancel',
            );
            // Prompt user to either keep the record or delete it immediately
            Alert.alert(
              'Επιτυχία',
              'Η κράτηση ακυρώθηκε. Θέλεις να διαγράψεις την εγγραφή από το ιστορικό σου ή να τη διατηρήσεις;',
              [
                { text: 'Διατήρηση', onPress: () => fetchReservations() },
                { text: 'Διαγραφή', style: 'destructive', onPress: () => deleteReservation(id) }
              ]
            );
          } catch (err) {
            Alert.alert('Σφάλμα', err.response?.data?.error || 'Αποτυχία ακύρωσης.');
          }
        },
      },
    ]);
  };

  const initial = user?.name?.charAt(0).toUpperCase() || '?';
  const isFuture = (t) => new Date(t) > new Date();

  const renderItem = ({ item, index }) => {
    return (
      <AnimatedCard 
        item={item} 
        index={index} 
        isConfirmedCheck={(i) => i.status === 'COMPLETED'} 
        isFuture={isFuture} 
        cancelReservation={cancelReservation} 
        editReservation={editReservationFromProfile}
        deleteReservation={deleteReservation}
        onPressCard={() => {
          if (item.status === 'CANCELLED') {
            Alert.alert('Ακυρωμένο', 'Αυτή η κράτηση έχει ακυρωθεί και το εισιτήριο δεν είναι πλέον έγκυρο.');
            return;
          }
          navigation.navigate('Θέατρα', {
            screen: 'Ticket',
            params: {
              showTitle: item.show_title,
              theatreName: item.theatre_name,
              dateStr: new Date(item.start_time).toLocaleString('el-GR', {
                dateStyle: 'long',
                timeStyle: 'short',
              }),
              seats: (item.seats || []).map(s => ({
                name: s.category_name,
                qty: s.quantity,
                price: Number.parseFloat(s.price),
                seat_details: s.seat_details || null,
              })),
              reservationId: item.reservation_id,
            }
          });
        }}
      />
    );
  };

  return (
    <View style={s.screen}>
      {/* Header */}
      <View
        style={[s.header, { paddingTop: insets.top + 12 }]}
      >
        <Text style={s.headerTitle}>Προφίλ</Text>
        <TouchableOpacity
          style={s.settingsBtn}
          accessibilityLabel="Ρυθμίσεις Προφίλ"
          onPress={() => navigation.navigate('ProfileSettingsScreen')}
        >
          <MaterialIcons name="settings" size={20} color={C.muted} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={reservations.slice(0, 2)}
        keyExtractor={(item) => String(item.reservation_id)}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchReservations();
            }}
            tintColor={C.accent}
          />
        }
        ListHeaderComponent={
          <>
            {/* Profile card */}
            <View style={s.profileCard}>
              <View style={s.profileCardOverlay} />
              <View style={s.profileRow}>
                <View style={s.avatar}>
                  <Text style={s.avatarInitial}>{initial}</Text>
                </View>
                <View style={s.profileTextBlock}>
                  <Text style={s.profileName}>{user?.name}</Text>
                  <Text style={s.profileEmail}>{user?.email}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={logout}
                style={s.logoutBtn}
                accessibilityLabel="Αποσύνδεση"
                activeOpacity={0.85}
              >
                <Text style={s.logoutBtnText}>Αποσύνδεση</Text>
              </TouchableOpacity>
            </View>

            {/* Section title */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={[s.sectionTitle, { marginBottom: 0 }]}>
                Ιστορικό Κρατήσεων
              </Text>
              {reservations.length > 2 && (
                <TouchableOpacity onPress={() => navigation.navigate('FullHistoryScreen', { initialReservations: reservations })}>
                  <Text style={{ color: C.accent, fontSize: 13, fontWeight: '700' }}>Δείτε όλες</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        }
        renderItem={renderItem}
        ListFooterComponent={
          <>
            {/* Quick actions */}
            <View style={s.quickActionsRow}>
              <AnimatedQuickAction
                icon="payment"
                label="Πληρωμές"
                onPress={() => navigation.navigate('PaymentHistory')}
              />
              <AnimatedQuickAction
                icon="favorite"
                label="Αγαπημένα"
                onPress={() => navigation.navigate('FavoritesScreen')}
              />
            </View>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={C.accent} style={{ marginTop: 24 }} />
          ) : (
            <Text style={s.emptyText}>
              Δεν υπάρχουν κρατήσεις ακόμα.
            </Text>
          )
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: {
    color: C.accent,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  settingsBtn: {
    height: 40,
    width: 40,
    borderRadius: 9999,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 48,
  },
  profileCard: {
    borderRadius: 12,
    backgroundColor: C.primary,
    padding: 18,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  profileCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.primaryDark,
    opacity: 0.5,
  },
  profileRow: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 9999,
    backgroundColor: C.onPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: C.primary,
    fontSize: 24,
    fontWeight: '800',
  },
  profileTextBlock: {
    flex: 1,
  },
  profileName: {
    color: C.onPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  profileEmail: {
    color: 'rgba(15,17,21,0.75)',
    fontSize: 14,
    fontWeight: '500',
  },
  logoutBtn: {
    position: 'relative',
    width: '100%',
    backgroundColor: 'rgba(15,17,21,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(15,17,21,0.28)',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: C.onPrimary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  sectionTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  card: {
    borderRadius: 14,
    backgroundColor: C.surface,
    overflow: 'hidden',
    marginBottom: 16,
    // Subtle shadow for depth separation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  cardInner: {
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitleBlock: {
    flex: 1,
    marginRight: 12,
  },
  showTitle: {
    color: C.text,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  rowGapSm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  theatreName: {
    color: C.muted,
    fontSize: 14,
    fontWeight: '500',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  badgeSuccess: {
    backgroundColor: C.successSoft,
  },
  badgeError: {
    backgroundColor: C.errorSoft,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  badgeTextSuccess: {
    color: C.success,
  },
  badgeTextError: {
    color: C.error,
  },
  detailsBlock: {
    gap: 8,
    paddingTop: 8,
  },
  rowGapMd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    color: C.muted,
    fontSize: 14,
  },
  cardFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  cardFooterCancelledRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.primary,
    backgroundColor: 'transparent',
  },
  editBtnText: {
    color: C.accent,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.1,
  },
  cancelBtnFlex: {
    flex: 1,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.errorSoft,
    backgroundColor: 'transparent',
  },
  cancelBtnText: {
    color: C.error,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.1,
  },
  cancelledNote: {
    color: C.muted,
    opacity: 0.75,
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 28,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 22,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 10,
  },
  quickActionTitle: {
    color: C.textSoft,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  emptyText: {
    color: C.muted,
    textAlign: 'center',
    marginTop: 24,
    fontSize: 16,
  },
});
