import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Pressable,
  Image,
  ActivityIndicator,
  Modal,
  Dimensions,
  StyleSheet,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { C } from '../theme/colors';
import { resolveShowHeroImageSource } from '../utils/localImageMap';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - 40;       // 20 px margin on each side
const CAROUSEL_H = Math.round(CARD_W * 0.6); // proportional to width, not screen height

// ─── Helper: navigate to ShowDetail directly through TheatresStack ──────────────
function useShowNavigation() {
  const navigation = useNavigation();

  const goToShowDetail = useCallback(
    (show) => {
      navigation.navigate('Θέατρα', {
        state: {
          index: 1,
          routes: [
            { name: 'TheatresList' },
            { name: 'ShowDetail', params: { showId: show.show_id, title: show.title } },
          ],
        },
      });
    },
    [navigation],
  );

  const goToAllTheatres = useCallback(() => {
    navigation.navigate('Θέατρα', { screen: 'TheatresList' });
  }, [navigation]);

  const goToProfile = useCallback(() => {
    navigation.navigate('Προφίλ');
  }, [navigation]);

  return { goToShowDetail, goToAllTheatres, goToProfile };
}

// ─── Dot indicator ─────────────────────────────────────────────────────────────

function CarouselDots({ total, activeIndex }) {
  return (
    <View style={s.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[s.dot, i === activeIndex && s.dotActive]} />
      ))}
    </View>
  );
}

// ─── Featured show card ────────────────────────────────────────────────────────

function FeaturedCard({ item, onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 28 }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 28 }).start();

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      accessibilityLabel={`Παράσταση ${item.title}`}
      accessibilityRole="button"
    >
      <Animated.View
        style={[s.featuredCard, { transform: [{ scale: scaleAnim }] }]}
      >
        {/* Hero image — explicit width/height + cover to prevent distortion */}
        <Image
          source={resolveShowHeroImageSource(item.title)}
          style={s.featuredImage}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />

        {/* Scrim overlays — top and bottom, no border */}
        <View style={s.featuredOverlayTop} />
        <View style={s.featuredOverlayBottom} />

        {/* NOW PLAYING badge */}
        <View style={s.featuredBadge}>
          <MaterialIcons name="play-circle-outline" size={12} color={C.accent} />
          <Text style={s.featuredBadgeText}>ΤΩΡΑ ΣΤΗ ΣΚΗΝΗ</Text>
        </View>

        {/* Bottom text block */}
        <View style={s.featuredTextBlock}>
          {/* Meta row: duration + age rating */}
          <View style={s.featuredMetaRow}>
            {item.duration ? (
              <View style={s.featuredMetaPill}>
                <MaterialIcons name="schedule" size={12} color={C.accentSoft} />
                <Text style={s.featuredMetaText}>{item.duration} λεπτά</Text>
              </View>
            ) : null}
            {item.age_rating ? (
              <View style={s.featuredMetaPill}>
                <Text style={s.featuredMetaText}>{item.age_rating}</Text>
              </View>
            ) : null}
          </View>

          {/* Title */}
          <Text style={s.featuredTitle} numberOfLines={2}>
            {item.title}
          </Text>

          {/* Theatre name */}
          {item.theatre_name ? (
            <View style={s.featuredTheatreRow}>
              <MaterialIcons name="theater-comedy" size={13} color={C.accentSoft} />
              <Text style={s.featuredTheatreName} numberOfLines={1}>
                {item.theatre_name}
              </Text>
            </View>
          ) : null}

          {/* CTA */}
          <View style={s.featuredCta}>
            <Text style={s.featuredCtaText}>Κράτηση θέσης</Text>
            <MaterialIcons name="arrow-forward" size={14} color={C.bg} />
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Recently Added card ───────────────────────────────────────────────────────

// ─── Animated pill with tactile press ──────────────────────────────────────────

function AnimatedPill({ icon, label, action }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 28 }).start();
  const onPressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 28 }).start();

  return (
    <Pressable
      onPress={action}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityLabel={label}
      style={{ flex: 1 }}
    >
      <Animated.View style={[s.pill, { transform: [{ scale: scaleAnim }] }]}>
        <View style={s.pillIcon}>
          <MaterialIcons name={icon} size={24} color={C.accentSoft} />
        </View>
        <Text style={s.pillLabel}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── Recently Added card with entrance animation ──────────────────────────────

function RecentCard({ item, onPress, index }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    const delay = (index || 0) * 80; // stagger 80ms per card
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

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
    >
      <TouchableOpacity
        style={s.recentCard}
        activeOpacity={0.82}
        onPress={onPress}
        accessibilityLabel={`Παράσταση ${item.title}`}
      >
        {/* Poster */}
        <View style={s.recentPoster}>
          <Image
            source={resolveShowHeroImageSource(item.title)}
            style={s.recentPosterImage}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        </View>

        {/* Info */}
        <View style={s.recentBody}>
          <Text style={s.recentTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={s.recentMeta}>
            {item.theatre_name ? (
              <>
                <MaterialIcons name="theater-comedy" size={13} color={C.accent} />
                <Text style={s.recentMetaText} numberOfLines={1}>
                  {item.theatre_name}
                </Text>
              </>
            ) : null}
          </View>
          <View style={s.recentMeta}>
            {item.duration ? (
              <>
                <MaterialIcons name="schedule" size={13} color={C.muted} />
                <Text style={s.recentMetaText}>{item.duration} λεπτά</Text>
              </>
            ) : null}
            {item.age_rating ? (
              <>
                <View style={s.recentDot} />
                <Text style={s.recentMetaText}>{item.age_rating}</Text>
              </>
            ) : null}
          </View>
        </View>

        <MaterialIcons name="chevron-right" size={22} color={C.card} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Section heading ───────────────────────────────────────────────────────────

function SectionHeading({ title, subtitle }) {
  return (
    <View style={s.sectionHeading}>
      <Text style={s.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={s.sectionSub}>{subtitle}</Text> : null}
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { goToShowDetail, goToAllTheatres, goToProfile } = useShowNavigation();
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications();

  const [shows, setShows]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [notifModal, setNotifModal]     = useState(false);

  const carouselRef = useRef(null);

  // ── Fetch shows on focus ─────────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const { data } = await api.get('/shows');
          if (active) setShows(data);
        } catch {
          // silent — keep whatever was loaded
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => { active = false; };
    }, []),
  );

  // ── First 4 shows → carousel; rest → "Recently Added" list ──────────────────
  const featured = shows.slice(0, 4);
  const recent   = shows.slice(4);

  // ── Auto-scroll carousel every 4 s ──────────────────────────────────────────
  useEffect(() => {
    if (featured.length < 2) return;
    const timer = setInterval(() => {
      setCarouselIndex(prev => {
        const next = (prev + 1) % featured.length;
        try {
          carouselRef.current?.scrollToIndex({ index: next, animated: true });
        } catch {
          // ignore if list isn't ready
        }
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [featured.length]);

  // ── Greeting ─────────────────────────────────────────────────────────────────
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Καλημέρα';
    if (h < 18) return 'Καλησπέρα';
    return 'Καλό βράδυ';
  };

  const rawFirst = user?.name?.trim()?.split(/\s+/)[0] ?? '';
  /** Όνομα «Auth0» εμφανιζόταν όταν το επώνυμο placeholder ήταν «Auth0 χρήστης» / split. */
  const firstName =
    rawFirst && rawFirst !== 'Auth0' && user?.name !== 'Auth0 χρήστης'
      ? rawFirst
      : (user?.email && !user.email.includes('@auth0.placeholder')
          ? user.email.split('@')[0]
          : '');

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <FlatList
        showsVerticalScrollIndicator={false}
        data={recent}
        keyExtractor={(item, i) => `recent-${item.show_id ?? i}`}
        contentContainerStyle={[s.listContent, { paddingBottom: insets.bottom + 36 }]}

        ListHeaderComponent={
          <>
            {/* ── App header ─────────────────────────────────────────────── */}
            <View style={s.appHeader}>
              <View>
                <Text style={s.greetingLabel}>{greeting()}</Text>
                <Text style={s.greetingName}>
                  {firstName ? `${firstName} 👋` : 'The Digital Stage'}
                </Text>
              </View>
              <TouchableOpacity
                style={s.notifBtn}
                activeOpacity={0.75}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Ειδοποιήσεις"
                onPress={() => {
                  setNotifModal(true);
                  markAllAsRead();
                }}
              >
                <MaterialIcons
                  name={unreadCount > 0 ? 'notifications' : 'notifications-none'}
                  size={22}
                  color={unreadCount > 0 ? C.accent : C.muted}
                />
                {unreadCount > 0 && (
                  <View style={s.notifBadge}>
                    <Text style={s.notifBadgeText}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* ── Featured carousel ───────────────────────────────────────── */}
            {loading ? (
              <View style={s.carouselPlaceholder}>
                <ActivityIndicator size="large" color={C.accent} />
              </View>
            ) : featured.length > 0 ? (
              <View style={s.carouselSection}>
                <FlatList
                  ref={carouselRef}
                  data={featured}
                  keyExtractor={(item) => `featured-${item.show_id}`}
                  horizontal
                  snapToInterval={CARD_W + 12}
                  snapToAlignment="start"
                  decelerationRate="fast"
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.carouselList}
                  onMomentumScrollEnd={(e) => {
                    const idx = Math.round(
                      e.nativeEvent.contentOffset.x / (CARD_W + 12),
                    );
                    setCarouselIndex(Math.min(idx, featured.length - 1));
                  }}
                  renderItem={({ item }) => (
                    <FeaturedCard item={item} onPress={() => goToShowDetail(item)} />
                  )}
                />
                <CarouselDots total={featured.length} activeIndex={carouselIndex} />
              </View>
            ) : null}

            {/* ── Quick-access pills ──────────────────────────────────────── */}
            <View style={s.pillStrip}>
              {[
                { icon: 'theater-comedy', label: 'Θέατρα',    action: goToAllTheatres },
                { icon: 'local-activity',  label: 'Κρατήσεις', action: goToProfile },
                { icon: 'star-outline',    label: 'Κορυφαία',  action: goToAllTheatres },
              ].map(({ icon, label, action }) => (
                <AnimatedPill
                  key={label}
                  icon={icon}
                  label={label}
                  action={action}
                />
              ))}
            </View>

            {/* ── Recently Added heading ──────────────────────────────────── */}
            {recent.length > 0 && (
              <SectionHeading
                title="Πρόσφατες Προσθήκες"
                subtitle="Ανακαλύψτε νέες παραστάσεις"
              />
            )}
          </>
        }

        renderItem={({ item, index }) => (
          <RecentCard item={item} index={index} onPress={() => goToShowDetail(item)} />
        )}

        ListEmptyComponent={
          !loading && recent.length === 0 ? (
            <Text style={s.emptyText}>
              Δεν υπάρχουν επιπλέον παραστάσεις αυτή τη στιγμή.
            </Text>
          ) : null
        }
      />

      {/* ── Notification Center Modal ────────────────────────────────────── */}
      <Modal
        visible={notifModal}
        transparent
        animationType="slide"
        onRequestClose={() => setNotifModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            {/* Header */}
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Ειδοποιήσεις</Text>
              <TouchableOpacity
                onPress={() => setNotifModal(false)}
                style={s.modalCloseBtn}
                accessibilityLabel="Κλείσιμο"
              >
                <MaterialIcons name="close" size={20} color={C.muted} />
              </TouchableOpacity>
            </View>
            <View style={s.modalDragPill} />

            {/* List */}
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
              renderItem={({ item }) => {
                const iconName =
                  item.type === 'booking'
                    ? 'check-circle'
                    : item.type === 'cancel'
                    ? 'cancel'
                    : 'info';
                const iconColor =
                  item.type === 'booking'
                    ? C.success
                    : item.type === 'cancel'
                    ? C.error
                    : C.accent;
                const iconBg =
                  item.type === 'booking'
                    ? C.successSoft
                    : item.type === 'cancel'
                    ? C.errorSoft
                    : C.card;

                const time = new Date(item.timestamp);
                const timeStr = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;

                return (
                  <TouchableOpacity
                    style={[
                      s.notifItem,
                      item.isRead && s.notifItemRead,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => markAsRead(item.id)}
                  >
                    <View style={[s.notifItemIcon, { backgroundColor: iconBg }]}>
                      <MaterialIcons name={iconName} size={18} color={iconColor} />
                    </View>
                    <View style={s.notifItemBody}>
                      <Text style={s.notifItemTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={s.notifItemDesc} numberOfLines={2}>
                        {item.body}
                      </Text>
                      <Text style={s.notifItemTime}>{timeStr}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={s.notifEmpty}>
                  <MaterialIcons name="notifications-none" size={48} color={C.card} />
                  <Text style={s.notifEmptyText}>
                    Δεν έχετε ειδοποιήσεις ακόμα.
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  listContent: {
    // no horizontal padding here — cards handle their own margins
  },

  // ── App header ───────────────────────────────────────────────────────────────
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  greetingLabel: {
    color: C.muted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  greetingName: {
    color: C.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 9999,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: C.bg,
  },
  notifBadgeText: {
    color: C.text,
    fontSize: 9,
    fontWeight: '800',
  },

  // ── Carousel ─────────────────────────────────────────────────────────────────
  carouselSection: {
    marginBottom: 8,
  },
  carouselPlaceholder: {
    marginHorizontal: 20,
    height: CAROUSEL_H,
    borderRadius: 16,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  carouselList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  featuredCard: {
    width: CARD_W,
    height: CAROUSEL_H,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: C.surface,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredOverlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: 'rgba(15,17,21,0.5)',
  },
  featuredOverlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '65%',
    backgroundColor: 'rgba(15,17,21,0.82)',
  },

  // Badge
  featuredBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15,17,21,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  featuredBadgeText: {
    color: C.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // Text block
  featuredTextBlock: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    gap: 6,
  },
  featuredMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  featuredMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  featuredMetaText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '600',
  },
  featuredTitle: {
    color: C.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  featuredTheatreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  featuredTheatreName: {
    color: C.accentSoft,
    fontSize: 13,
    fontWeight: '600',
  },
  featuredCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.accent,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 9999,
    marginTop: 4,
  },
  featuredCtaText: {
    color: C.bg,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.1,
  },

  // ── Carousel dots ─────────────────────────────────────────────────────────────
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    marginBottom: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.card,
  },
  dotActive: {
    width: 22,
    borderRadius: 3,
    backgroundColor: C.accent,
  },

  // ── Quick-access pills ────────────────────────────────────────────────────────
  pillStrip: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 14,
    marginTop: 8,
    marginBottom: 32,
  },
  pill: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 10,
  },
  pillIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(229,193,143,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillLabel: {
    color: C.textSoft,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // ── Section heading ───────────────────────────────────────────────────────────
  sectionHeading: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  sectionSub: {
    color: C.muted,
    fontSize: 12,
    marginTop: 3,
  },

  // ── Recently Added card ───────────────────────────────────────────────────────
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: C.surface,
    borderRadius: 14,
    overflow: 'hidden',
    paddingRight: 12,
    // Subtle shadow for depth separation from C.bg
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  recentPoster: {
    width: 80,
    height: 100,
    backgroundColor: C.card,
  },
  recentPosterImage: {
    width: '100%',
    height: '100%',
  },
  recentBody: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 5,
  },
  recentTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  recentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  recentMetaText: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  recentDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: C.muted,
  },

  emptyText: {
    color: C.muted,
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
    paddingHorizontal: 20,
  },

  // ── Notification modal ──────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  modalSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
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
  modalDragPill: {
    width: 40,
    height: 4,
    borderRadius: 9999,
    backgroundColor: C.card,
    alignSelf: 'center',
    marginBottom: 16,
  },

  // Notification items
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    backgroundColor: C.surface,
  },
  notifItemRead: {
    backgroundColor: C.bg,
  },
  notifItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  notifItemBody: {
    flex: 1,
    gap: 3,
  },
  notifItemTitle: {
    color: C.text,
    fontSize: 14,
    fontWeight: '700',
  },
  notifItemDesc: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  notifItemTime: {
    color: C.muted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    opacity: 0.6,
  },
  notifEmpty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  notifEmptyText: {
    color: C.muted,
    fontSize: 14,
  },
});
