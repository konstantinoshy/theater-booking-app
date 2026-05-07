import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Image,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../config/api';
import { C } from '../theme/colors';
import ImagePreviewModal from '../components/ImagePreviewModal';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const HALL_IMAGE =
  'https://images.unsplash.com/photo-1507676184212-d0330a15233c?q=80&w=1280&auto=format&fit=crop';

export default function BookingScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { notificationsEnabled } = useAuth();
  const { addNotification } = useNotifications();
  const p = route.params ?? {};
  const editReservationId = p.editReservationId;
  const isEditMode = Boolean(editReservationId);
  const [displayTitle, setDisplayTitle] = useState(p.showTitle ?? '');
  const [displayStartTime, setDisplayStartTime] = useState(p.startTime);
  /** Χρησιμοποιείται μόνο από το effect (params) — επίλυση showtime μέσω API αν χρειάζεται. */
  const paramShowtimeId = p.showtimeId;
  /** Θέσεις που κρατά ήδη αυτή η κράτηση — προστίθενται στο available Seats API. */
  const heldByCategoryRef = useRef({});

  const [categories, setCategories] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      heldByCategoryRef.current = {};
      try {
        let effectiveShowtimeId = paramShowtimeId;
        let reservationDoc = null;

        if (editReservationId) {
          const { data } = await api.get(`/reservations/${editReservationId}`);
          if (cancelled) return;
          reservationDoc = data;
          if (effectiveShowtimeId == null || effectiveShowtimeId === '') {
            effectiveShowtimeId = data.showtime_id ?? data.showtimeId;
          }
          setDisplayTitle((prev) => prev || data.show_title || '');
          setDisplayStartTime((prev) => prev ?? data.start_time);
        }

        if (effectiveShowtimeId == null || effectiveShowtimeId === '') {
          Alert.alert(
            'Σφάλμα',
            'Λείπουν στοιχεία προβολής. Γύρνα πίσω και άνοιξε ξανά την κράτηση από το προφίλ.',
          );
          navigation.goBack();
          return;
        }

        const sid = Number(effectiveShowtimeId);
        const { data: seatRows } = await api.get('/seats', { params: { showtimeId: sid } });
        if (cancelled) return;

        const init = {};
        seatRows.forEach((c) => {
          init[c.seat_category_id] = 0;
        });

        if (reservationDoc) {
          for (const line of reservationDoc.seats || []) {
            const cid = line.seat_category_id;
            if (cid == null) continue;
            init[cid] = line.quantity;
            heldByCategoryRef.current[cid] = line.quantity;
          }
        }

        setCategories(seatRows);
        setQuantities(init);
      } catch {
        Alert.alert('Σφάλμα', 'Αδυναμία φόρτωσης θέσεων.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [paramShowtimeId, editReservationId]);

  const changeQty = (categoryId, delta) => {
    setQuantities((prev) => {
      const cat = categories.find((c) => c.seat_category_id === categoryId);
      if (!cat) return prev;
      const held = isEditMode ? heldByCategoryRef.current[categoryId] || 0 : 0;
      const maxForUser = cat.available_seats + held;
      const next = (prev[categoryId] || 0) + delta;
      if (next < 0 || next > maxForUser) return prev;
      return { ...prev, [categoryId]: next };
    });
  };

  const totalPrice = categories.reduce(
    (sum, c) => sum + (quantities[c.seat_category_id] || 0) * Number.parseFloat(c.price),
    0,
  );
  const totalSeats = Object.values(quantities).reduce((a, b) => a + b, 0);

  const handleBook = async () => {
    if (totalSeats === 0) {
      return Alert.alert('Προσοχή', 'Επίλεξε τουλάχιστον 1 θέση.');
    }

    // Only send what the backend needs: Category ID and Quantity
    const seatsPayload = categories
      .filter((c) => quantities[c.seat_category_id] > 0)
      .map((c) => ({
        seat_category_id: c.seat_category_id,
        quantity: quantities[c.seat_category_id]
      }));

    setSubmitting(true);
    try {
      let data;
      if (isEditMode) {
        const { data: putData } = await api.put(`/reservations/${editReservationId}`, {
          seats: seatsPayload,
        });
        data = putData;
        if (notificationsEnabled) {
          addNotification(
            'Κράτηση ενημερώθηκε',
            `Οι θέσεις για "${displayTitle}" άλλαξαν επιτυχώς.`,
            'info',
          );
        }
      } else {
        const { data: postData } = await api.post('/reservations', {
          showtime_id: Number(paramShowtimeId),
          seats: seatsPayload,
        });
        data = postData;
        if (notificationsEnabled) {
          addNotification(
            'Επιτυχής κράτηση! 🎭',
            `Η θέση σας για την παράσταση "${displayTitle}" επιβεβαιώθηκε.`,
            'booking',
          );
        }
      }

      const dateFormatted = displayStartTime
        ? new Date(displayStartTime).toLocaleString('el-GR', {
            dateStyle: 'long',
            timeStyle: 'short',
          })
        : '';

      const seatDetails = (data.seats || []).map((backendSeat) => {
        const cat = categories.find((c) => c.seat_category_id === backendSeat.seat_category_id);
        return {
          name: cat?.category_name || '',
          qty: backendSeat.quantity,
          price: Number.parseFloat(cat?.price || 0),
          seat_details: backendSeat.seat_details,
        };
      });

      navigation.replace('Ticket', {
        showTitle: displayTitle,
        theatreName: p.theatreName || '',
        dateStr: dateFormatted,
        seats: seatDetails,
        reservationId: data?.reservation_id || data?.id || editReservationId || '',
      });
    } catch (err) {
      Alert.alert(
        'Σφάλμα',
        err.response?.data?.error ||
          (isEditMode ? 'Αποτυχία τροποποίησης κράτησης.' : 'Αποτυχία κράτησης.'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={s.loadingRoot}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  const dateStr = displayStartTime
    ? new Date(displayStartTime).toLocaleString('el-GR', {
        dateStyle: 'long',
        timeStyle: 'short',
      })
    : '';

  return (
    <View style={s.screenRoot}>
      {/* Header — back arrow only; no alternative exit points during checkout */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={s.headerBackBtn}
          accessibilityLabel="Πίσω"
        >
          <MaterialIcons name="arrow-back" size={18} color={C.accentSoft} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>THE DIGITAL STAGE</Text>
        {/* Right-side spacer to keep the title visually centered */}
        <View style={s.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View style={[s.heroCard, { position: 'relative' }]}>
          <View
            style={[
              s.heroBlob,
              { width: 192, height: 192, top: -48, right: -48 },
            ]}
          />
          <View style={s.heroBadgeRow}>
            <MaterialIcons name="theater-comedy" size={16} color="rgba(15,17,21,0.75)" />
            <Text style={s.heroBadgeText}>{isEditMode ? 'Τροποποίηση' : 'Προσεχώς'}</Text>
          </View>
          <Text style={s.heroShowTitle}>{displayTitle}</Text>
          <View style={s.heroDateRow}>
            <MaterialIcons name="calendar-today" size={16} color="rgba(15,17,21,0.85)" />
            <Text style={s.heroDateText}>{dateStr}</Text>
          </View>
          <MaterialIcons
            name="theater-comedy"
            size={100}
            color="rgba(15,17,21,0.10)"
            style={{ position: 'absolute', bottom: -16, right: -8 }}
          />
        </View>

        {/* Section title */}
        <Text style={s.sectionTitle}>Επιλογή Θέσεων</Text>
        <View style={s.sectionUnderline} />

        {/* Category cards */}
        {categories.map((cat) => {
          const qty = quantities[cat.seat_category_id] || 0;
          const held = isEditMode ? heldByCategoryRef.current[cat.seat_category_id] || 0 : 0;
          const maxQty = cat.available_seats + held;
          const isVip = cat.category_name.toLowerCase().includes('vip');
          const canRemove = qty > 0;
          const canAdd = maxQty > 0 && qty < maxQty;

          return (
            <View key={cat.seat_category_id} style={s.categoryCard}>
              <View style={s.categoryLeft}>
                <View style={s.categoryNameRow}>
                  <Text style={s.categoryName}>{cat.category_name}</Text>
                  {isVip && (
                    <View style={s.vipPill}>
                      <Text style={s.vipPillText}>Premium</Text>
                    </View>
                  )}
                </View>
                <View style={s.priceRow}>
                  <Text style={s.priceValue}>{cat.price}€</Text>
                  <Text style={s.priceDot}>•</Text>
                  <Text style={s.priceAvail}>
                    {isEditMode
                      ? `${maxQty} διαθέσιμες για εσένα`
                      : `${cat.available_seats} διαθέσιμες`}
                  </Text>
                </View>
              </View>

              <View style={s.counterWrap}>
                <TouchableOpacity
                  style={[s.counterBtn, !canRemove && s.counterBtnDisabled]}
                  onPress={() => changeQty(cat.seat_category_id, -1)}
                  disabled={!canRemove}
                  accessibilityLabel={`Αφαίρεση ${cat.category_name}`}
                >
                  <MaterialIcons name="remove" size={20} color={canRemove ? C.textSoft : C.muted} />
                </TouchableOpacity>

                <Text style={s.counterQty}>{qty}</Text>

                <TouchableOpacity
                  style={[s.counterBtn, !canAdd && s.counterBtnDisabled]}
                  onPress={() => changeQty(cat.seat_category_id, 1)}
                  disabled={!canAdd}
                  accessibilityLabel={`Προσθήκη ${cat.category_name}`}
                >
                  <MaterialIcons name="add" size={20} color={canAdd ? C.textSoft : C.muted} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Hall preview */}
        <View style={[s.hallPreview, { aspectRatio: 16 / 9 }]}>
          <Image
            source={{ uri: HALL_IMAGE }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
          {/* Vignette: subtle dim across entire image */}
          <View style={[StyleSheet.absoluteFillObject, s.hallOverlayBase]} />
          {/* Vignette: bottom gradient band (strong) */}
          <View style={s.hallGradientBottom} />
          {/* Vignette: extra-dark bottom edge for seamless blend with C.bg */}
          <View style={s.hallGradientEdge} />

          <View style={s.hallCaptionRow}>
            <View>
              <Text style={s.hallCaptionLabel}>Προεπισκόπηση</Text>
              <Text style={s.hallCaptionTitle}>Κάτοψη Θεάτρου</Text>
            </View>
            {/* Glassmorphism zoom button */}
            <TouchableOpacity
              style={s.hallZoomBtn}
              accessibilityLabel="Μεγέθυνση κάτοψης"
              onPress={() => setMapVisible(true)}
              activeOpacity={0.7}
            >
              <View style={s.hallZoomBtnInner}>
                <MaterialIcons name="zoom-in" size={22} color={C.accentSoft} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <ImagePreviewModal
        visible={mapVisible}
        imageUri={HALL_IMAGE}
        title="Κάτοψη Θεάτρου"
        onClose={() => setMapVisible(false)}
      />

      {/* Sticky CTA bar — total on the left, prominent confirm button on the right.
          Fixed at the bottom regardless of scroll. */}
      <View
        style={[s.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        <View style={s.footerRow}>
          <View style={s.footerTotalBlock}>
            <Text style={s.footerTotalLabel}>
              {totalSeats > 0
                ? `Σύνολο · ${totalSeats} ${totalSeats === 1 ? 'θέση' : 'θέσεις'}`
                : 'Σύνολο'}
            </Text>
            <Text style={s.footerTotalValue}>{totalPrice.toFixed(2)}€</Text>
          </View>

          <TouchableOpacity
            style={[s.ctaBtn, (submitting || totalSeats === 0) && s.ctaBtnDisabled]}
            onPress={handleBook}
            disabled={submitting || totalSeats === 0}
            accessibilityRole="button"
            accessibilityLabel={isEditMode ? 'Αποθήκευση αλλαγών κράτησης' : 'Επιβεβαίωση κράτησης'}
            accessibilityState={{ disabled: submitting || totalSeats === 0 }}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color={C.onPrimary} />
            ) : (
              <Text style={[s.ctaText, totalSeats === 0 && s.ctaTextDisabled]}>
                {totalSeats === 0
                  ? 'Επίλεξε θέσεις'
                  : isEditMode
                    ? 'Αποθήκευση αλλαγών'
                    : 'Επιβεβαίωση Κράτησης'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  loadingRoot: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenRoot: {
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  headerBackBtn: {
    height: 40,
    width: 40,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.card,
  },
  headerTitle: {
    color: C.accent,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  // Invisible spacer that matches the back button footprint so the title sits centered.
  headerSpacer: {
    height: 40,
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 160,
  },
  heroCard: {
    borderRadius: 12,
    backgroundColor: C.primary,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  heroBlob: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: 'rgba(15,17,21,0.08)',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  heroBadgeText: {
    color: 'rgba(15,17,21,0.75)',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  heroShowTitle: {
    color: C.onPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 28,
    marginBottom: 6,
  },
  heroDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  heroDateText: {
    color: 'rgba(15,17,21,0.85)',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    color: C.text,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  sectionUnderline: {
    height: 3,
    width: 40,
    borderRadius: 9999,
    backgroundColor: C.accent,
    marginBottom: 16,
  },
  categoryCard: {
    borderRadius: 12,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryLeft: {
    flex: 1,
    marginRight: 16,
  },
  categoryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  categoryName: {
    color: C.text,
    fontSize: 17,
    fontWeight: '700',
  },
  vipPill: {
    backgroundColor: 'rgba(229,193,143,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  vipPillText: {
    color: C.accent,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceValue: {
    color: C.accent,
    fontSize: 15,
    fontWeight: '700',
  },
  priceDot: {
    color: C.muted,
    fontSize: 12,
    opacity: 0.6,
  },
  priceAvail: {
    color: C.muted,
    fontSize: 12,
  },
  // Subtle counter group — outlined buttons that don't compete with the sticky CTA.
  counterWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  counterBtn: {
    height: 34,
    width: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: C.border,
  },
  counterBtnDisabled: {
    borderColor: C.border,
    opacity: 0.4,
  },
  counterQty: {
    color: C.text,
    fontSize: 16,
    fontWeight: '700',
    width: 20,
    textAlign: 'center',
  },
  hallPreview: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 16,
  },
  // Vignette layer 1: subtle dim across entire image
  hallOverlayBase: {
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  // Vignette layer 2: strong bottom gradient band
  hallGradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: 'rgba(15,17,21,0.75)',
  },
  // Vignette layer 3: extra-dark bottom edge for seamless blend with bg
  hallGradientEdge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(15,17,21,0.92)',
  },
  hallCaptionRow: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  hallCaptionLabel: {
    color: C.accent,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  hallCaptionTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: '700',
  },
  // Glassmorphism zoom button — layered for frost-glass effect
  hallZoomBtn: {
    borderRadius: 9999,
    // Outer glass shell
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    // Subtle shadow for floating depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  hallZoomBtnInner: {
    padding: 12,
    borderRadius: 9999,
    // Inner highlight ring for glass depth
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  // Sticky CTA bar — fixed at the bottom regardless of scroll.
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  footerTotalBlock: {
    flexShrink: 1,
  },
  footerTotalLabel: {
    color: C.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  footerTotalValue: {
    color: C.accent,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  ctaBtn: {
    height: 50,
    minWidth: 180,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primary,
  },
  ctaBtnDisabled: {
    backgroundColor: C.surface3,
    opacity: 0.6,
  },
  ctaText: {
    color: C.onPrimary,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  ctaTextDisabled: {
    color: C.textSoft,
  },
});
