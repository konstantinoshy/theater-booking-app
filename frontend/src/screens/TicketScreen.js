import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../theme/colors';

const { width: SCREEN_W } = Dimensions.get('window');
const TICKET_W = SCREEN_W - 48; // 24px margin each side
const CUTOUT_R = 16;            // semi-circle radius

// ─── Perforated dashed line ─────────────────────────────────────────────────────

function DashedLine() {
  const dashes = Math.floor((TICKET_W - CUTOUT_R * 2 - 24) / 10);
  return (
    <View style={sty.dashedRow}>
      {Array.from({ length: dashes }).map((_, i) => (
        <View key={i} style={sty.dash} />
      ))}
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────────

export default function TicketScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { showTitle, theatreName, dateStr, seats, reservationId } = route.params;

  // ── Entrance animation ────────────────────────────────────────────────────────
  const slideAnim = useRef(new Animated.Value(120)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 18,
        stiffness: 120,
        mass: 1,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ── Build seat summary string ─────────────────────────────────────────────────
  const hasSeatDetails = seats && seats.length > 0 && seats.some((s) => s.seat_details);

  const seatSummary =
    seats && seats.length > 0
      ? seats.map((s) => `${s.name} × ${s.qty}`).join(' • ')
      : 'Γενική Είσοδος';

  const totalPrice =
    seats && seats.length > 0
      ? seats.reduce((sum, s) => sum + s.qty * s.price, 0).toFixed(2) + '€'
      : '—';

  const ticketId = reservationId
    ? `TDS-${String(reservationId).padStart(6, '0')}`
    : 'TDS-000000';

  return (
    <View style={[sty.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={sty.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('TheatresList')}
          style={sty.headerBtn}
          accessibilityLabel="Κλείσιμο"
        >
          <MaterialIcons name="close" size={20} color={C.textSoft} />
        </TouchableOpacity>
        <Text style={sty.headerTitle}>Το Εισιτήριό σας</Text>
        <View style={sty.headerSpacer} />
      </View>

      {/* Success badge */}
      <View style={sty.successBadge}>
        <View style={sty.successIcon}>
          <MaterialIcons name="check" size={20} color={C.bg} />
        </View>
        <Text style={sty.successText}>Η κράτηση επιβεβαιώθηκε!</Text>
      </View>

      <ScrollView
        contentContainerStyle={[sty.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Animated Ticket Card ──────────────────────────────────────────── */}
        <Animated.View
          style={[
            sty.ticketWrap,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* ── TOP SECTION — Show info on gold background ──────────────────── */}
          <View style={sty.ticketTop}>
            {/* Decorative corner accent */}
            <View style={sty.topCornerAccent} />

            <View style={sty.topBadgeRow}>
              <MaterialIcons name="confirmation-number" size={14} color="rgba(15,17,21,0.6)" />
              <Text style={sty.topBadgeText}>DIGITAL TICKET</Text>
            </View>

            <Text style={sty.showTitle}>{showTitle || 'Παράσταση'}</Text>

            <View style={sty.infoRow}>
              <MaterialIcons name="theater-comedy" size={15} color="rgba(15,17,21,0.7)" />
              <Text style={sty.infoText}>{theatreName || 'Θέατρο'}</Text>
            </View>

            <View style={sty.infoRow}>
              <MaterialIcons name="calendar-today" size={15} color="rgba(15,17,21,0.7)" />
              <Text style={sty.infoText}>{dateStr || '—'}</Text>
            </View>

            {/* Seat info — prominent */}
            {hasSeatDetails ? (
              <View style={{ marginTop: 12, gap: 6 }}>
                {seats.map((s, idx) => (
                  <View key={idx} style={sty.seatBlock}>
                    <MaterialIcons name="event-seat" size={16} color={C.onPrimary} />
                    <Text style={sty.seatText}>
                      {s.name} • {s.seat_details}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={sty.seatBlock}>
                <MaterialIcons name="event-seat" size={16} color={C.onPrimary} />
                <Text style={sty.seatText}>{seatSummary}</Text>
              </View>
            )}

            {/* Price tag */}
            <View style={sty.priceTag}>
              <Text style={sty.priceLabel}>Σύνολο</Text>
              <Text style={sty.priceValue}>{totalPrice}</Text>
            </View>
          </View>

          {/* ── PERFORATION — cutouts + dashed line ──────────────────────────── */}
          <View style={sty.perforationRow}>
            {/* Left cutout */}
            <View style={[sty.cutout, sty.cutoutLeft]} />
            <DashedLine />
            {/* Right cutout */}
            <View style={[sty.cutout, sty.cutoutRight]} />
          </View>

          {/* ── BOTTOM SECTION — QR + reservation ID on white ───────────────── */}
          <View style={sty.ticketBottom}>
            <Image 
              source={require('../../assets/image_0.png')} 
              style={{ width: 160, height: 160, resizeMode: 'contain', marginTop: 4, marginBottom: 12 }} 
            />
            <Text style={sty.ticketIdLabel}>Κωδικός Κράτησης</Text>
            <Text style={sty.ticketIdValue}>{ticketId}</Text>
            <Text style={sty.scanHint}>Σαρώστε στην είσοδο του θεάτρου</Text>
          </View>
        </Animated.View>

        {/* ── Action Buttons ────────────────────────────────────────────────── */}
        <View style={sty.actionsRow}>
          <TouchableOpacity
            style={sty.actionBtn}
            activeOpacity={0.7}
            onPress={() => Alert.alert('Wallet', 'Η λειτουργία θα είναι σύντομα διαθέσιμη.')}
            accessibilityLabel="Προσθήκη στο Wallet"
          >
            <MaterialIcons name="account-balance-wallet" size={20} color={C.accentSoft} />
            <Text style={sty.actionBtnText}>Προσθήκη στο Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={sty.actionBtn}
            activeOpacity={0.7}
            onPress={() => Alert.alert('Αποθήκευση', 'Το εισιτήριο αποθηκεύτηκε.')}
            accessibilityLabel="Αποθήκευση"
          >
            <MaterialIcons name="save-alt" size={20} color={C.accentSoft} />
            <Text style={sty.actionBtnText}>Αποθήκευση</Text>
          </TouchableOpacity>
        </View>

        {/* Done CTA */}
        <TouchableOpacity
          style={sty.doneBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('TheatresList')}
          accessibilityLabel="Τέλος"
        >
          <Text style={sty.doneBtnText}>Συνέχεια</Text>
          <MaterialIcons name="arrow-forward" size={16} color={C.bg} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const sty = StyleSheet.create({
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
    paddingBottom: 8,
    paddingTop: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: C.text,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSpacer: { width: 40 },

  // ── Success badge ───────────────────────────────────────────────────────────
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  successIcon: {
    width: 28,
    height: 28,
    borderRadius: 9999,
    backgroundColor: C.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: {
    color: C.success,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  // ── Scroll ──────────────────────────────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },

  // ── Ticket wrapper ──────────────────────────────────────────────────────────
  ticketWrap: {
    width: TICKET_W,
    alignSelf: 'center',
    // Subtle shadow for floating effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },

  // ── TOP section ─────────────────────────────────────────────────────────────
  ticketTop: {
    backgroundColor: C.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  topCornerAccent: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 9999,
    backgroundColor: 'rgba(15,17,21,0.06)',
  },
  topBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  topBadgeText: {
    color: 'rgba(15,17,21,0.6)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.5,
  },
  showTitle: {
    color: C.onPrimary,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 30,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoText: {
    color: 'rgba(15,17,21,0.75)',
    fontSize: 14,
    fontWeight: '600',
  },
  seatBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15,17,21,0.15)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 14,
  },
  seatText: {
    color: C.onPrimary,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  priceLabel: {
    color: 'rgba(15,17,21,0.55)',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  priceValue: {
    color: C.onPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  // ── Perforation row ─────────────────────────────────────────────────────────
  perforationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: CUTOUT_R * 2,
    backgroundColor: C.bg, // transparent zone = background shows through
    position: 'relative',
    zIndex: 10,
    marginTop: -CUTOUT_R,
    marginBottom: -CUTOUT_R,
  },
  cutout: {
    width: CUTOUT_R * 2,
    height: CUTOUT_R * 2,
    borderRadius: CUTOUT_R,
    backgroundColor: C.bg,
    position: 'absolute',
  },
  cutoutLeft: {
    left: -CUTOUT_R,
  },
  cutoutRight: {
    right: -CUTOUT_R,
  },
  dashedRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: CUTOUT_R + 4,
  },
  dash: {
    width: 6,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: 'rgba(150,150,150,0.35)',
  },

  // ── BOTTOM section ──────────────────────────────────────────────────────────
  ticketBottom: {
    backgroundColor: '#F8F8FA',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  ticketIdLabel: {
    color: '#888',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 14,
  },
  ticketIdValue: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 4,
  },
  scanHint: {
    color: '#aaa',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 10,
  },

  // ── Action buttons ──────────────────────────────────────────────────────────
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: C.border,
  },
  actionBtnText: {
    color: C.textSoft,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.1,
  },

  // ── Done button ─────────────────────────────────────────────────────────────
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.accent,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 16,
  },
  doneBtnText: {
    color: C.bg,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
