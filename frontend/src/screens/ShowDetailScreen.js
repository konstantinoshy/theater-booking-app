import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Image, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../config/api';
import { C } from '../theme/colors';
import { resolveShowHeroImageSource } from '../utils/localImageMap';
import { descriptionWithoutEmbeddedPhotoFilename } from '../utils/descriptionForDisplay';
import { resolveCastPortrait } from '../utils/localCastImageMap';
import { getContributorsForShow } from '../Data/localContributors';
import CastMemberCard from '../components/CastMemberCard';
import { useFavorites } from '../context/FavoritesContext';

const MONTHS = ['Ιαν','Φεβ','Μαρ','Απρ','Μαϊ','Ιουν','Ιουλ','Αυγ','Σεπ','Οκτ','Νοε','Δεκ'];
const DAYS = ['Κυριακή','Δευτέρα','Τρίτη','Τετάρτη','Πέμπτη','Παρασκευή','Σάββατο'];

const s = StyleSheet.create({
  loadingRoot: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screen: { flex: 1, backgroundColor: C.bg },
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
  headerBtn: {
    height: 40,
    width: 40,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.card,
  },
  headerBtnGhost: {
    height: 40,
    width: 40,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: C.text, fontSize: 18, fontWeight: '700' },
  scrollContent: { paddingBottom: 64 },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: C.primary,
    minHeight: 220,
  },
  heroInner: { padding: 22, justifyContent: 'flex-end', flex: 1 },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  ageBadge: {
    backgroundColor: 'rgba(15,17,21,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  ageBadgeText: {
    color: C.onPrimary,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroMetaText: { color: 'rgba(15,17,21,0.78)', fontSize: 14, fontWeight: '600' },
  heroTitle: {
    color: C.onPrimary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 32,
    marginBottom: 6,
  },
  heroDesc: {
    color: 'rgba(15,17,21,0.72)',
    fontSize: 14,
    lineHeight: 20,
    maxWidth: '85%',
    marginBottom: 20,
    fontWeight: '500',
  },
  heroFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(15,17,21,0.15)',
    paddingTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 24,
    rowGap: 8,
  },
  heroFooterItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroFooterText: { color: C.onPrimary, fontSize: 14, fontWeight: '700' },
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  sectionTitle: { color: C.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  sectionMonth: {
    color: C.accent,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  emptyShowtimes: { color: C.muted, textAlign: 'center', marginTop: 20 },
  showtimeRow: {
    borderRadius: 12,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateBox: {
    width: 56,
    height: 64,
    borderRadius: 8,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  dateBoxMonth: { color: C.muted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  dateBoxDay: { color: C.text, fontSize: 20, fontWeight: '900' },
  showtimeInfo: { flex: 1 },
  showtimeLine1: { color: C.text, fontWeight: '700', fontSize: 15 },
  showtimeHallRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, opacity: 0.6 },
  showtimeHallText: { color: C.muted, fontSize: 12, fontWeight: '500' },
  statusCol: { alignItems: 'flex-end' },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusPillSuccess: { backgroundColor: C.successSoft },
  statusPillError: { backgroundColor: C.errorSoft },
  statusTextSuccess: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: C.success },
  statusTextError: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: C.error },
  chevron: { marginTop: 4 },
  castSection: { marginTop: 24, paddingHorizontal: 16, marginBottom: 8 },
  castSectionTitle: {
    color: C.muted,
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 16,
  },
  castScrollContent: {
    flexDirection: 'row',
    columnGap: 16,
    paddingBottom: 28,
    paddingRight: 8,
    alignItems: 'flex-start',
  },
  castFallback: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
    paddingVertical: 4,
    paddingRight: 8,
  },
});

export default function ShowDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { showId, title } = route.params;
  const [show, setShow] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);

  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(showId);

  useEffect(() => { fetchData(); }, [showId]);

  const fetchData = async () => {
    try {
      const [showRes, stRes] = await Promise.all([
        api.get(`/shows/${showId}`),
        api.get('/showtimes', { params: { showId } }),
      ]);
      setShow(showRes.data);
      setShowtimes(stRes.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={s.loadingRoot}>
        <ActivityIndicator size="large" color={C.accent} />
      </View>
    );
  }

  const castList = getContributorsForShow(show?.show_id ?? showId);
  const heroDesc = descriptionWithoutEmbeddedPhotoFilename(show?.description);

  return (
    <View style={s.screen}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={s.headerBtn}
          accessibilityLabel="Πίσω"
        >
          <MaterialIcons name="arrow-back" size={18} color={C.accentSoft} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Λεπτομέρειες</Text>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <TouchableOpacity 
            style={s.headerBtnGhost} 
            accessibilityLabel="Αγαπημένα"
            onPress={() => {
              if (show) {
                toggleFavorite(show);
                Alert.alert(isFav ? 'Αφαιρέθηκε' : 'Προστέθηκε', isFav ? 'Η παράσταση αφαιρέθηκε από τα αγαπημένα σας.' : 'Η παράσταση προστέθηκε στα αγαπημένα σας.');
              }
            }}
          >
            <MaterialIcons name={isFav ? "favorite" : "favorite-border"} size={22} color={isFav ? C.accent : C.textSoft} />
          </TouchableOpacity>
          <TouchableOpacity style={s.headerBtnGhost} accessibilityLabel="Κοινοποίηση">
            <MaterialIcons name="share" size={22} color={C.accent} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        {show && (
          <View style={s.heroCard}>
            <Image
              source={resolveShowHeroImageSource(show.title)}
              style={[StyleSheet.absoluteFillObject, { opacity: 0.2 }]}
              resizeMode="cover"
            />
            <View style={s.heroInner}>
              <View style={s.heroTopRow}>
                <View style={s.ageBadge}>
                  <Text style={s.ageBadgeText}>{show.age_rating}</Text>
                </View>
                <View style={s.heroMetaRow}>
                  <MaterialIcons name="schedule" size={14} color="rgba(15,17,21,0.78)" />
                  <Text style={s.heroMetaText}>{show.duration} λεπτά</Text>
                </View>
              </View>

              <Text style={s.heroTitle}>
                {show.title}
              </Text>
              {heroDesc ? (
                <Text style={s.heroDesc} numberOfLines={3}>
                  {heroDesc}
                </Text>
              ) : null}

              <View style={s.heroFooter}>
                <View style={s.heroFooterItem}>
                  <MaterialIcons name="theater-comedy" size={18} color={C.onPrimary} />
                  <Text style={s.heroFooterText}>{show.theatre_name}</Text>
                </View>
                <View style={s.heroFooterItem}>
                  <MaterialIcons name="location-on" size={18} color={C.onPrimary} />
                  <Text style={s.heroFooterText}>{show.location}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Showtimes */}
        <View style={s.section}>
          <View style={s.sectionHeaderRow}>
            <Text style={s.sectionTitle}>Διαθέσιμες Παραστάσεις</Text>
            {showtimes.length > 0 && (
              <Text style={s.sectionMonth}>
                {MONTHS[new Date(showtimes[0].start_time).getMonth()]} {new Date(showtimes[0].start_time).getFullYear()}
              </Text>
            )}
          </View>

          {showtimes.length === 0 ? (
            <Text style={s.emptyShowtimes}>Δεν υπάρχουν διαθέσιμες ημερομηνίες.</Text>
          ) : (
            showtimes.map((st) => {
              const d = new Date(st.start_time);
              const isFull = st.available_seats === 0;
              const h = String(d.getHours()).padStart(2, '0');
              const m = String(d.getMinutes()).padStart(2, '0');

              return (
                <TouchableOpacity
                  key={st.showtime_id}
                  style={[s.showtimeRow, isFull && { opacity: 0.5 }]}
                  disabled={isFull}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('Booking', { showtimeId: st.showtime_id, showTitle: show?.title ?? title, startTime: st.start_time })}
                >
                  {/* Date box */}
                  <View style={s.dateBox}>
                    <Text style={s.dateBoxMonth}>{MONTHS[d.getMonth()]}</Text>
                    <Text style={s.dateBoxDay}>{d.getDate()}</Text>
                  </View>

                  {/* Info */}
                  <View style={s.showtimeInfo}>
                    <Text style={s.showtimeLine1}>{DAYS[d.getDay()]}, {h}:{m}</Text>
                    <View style={s.showtimeHallRow}>
                      <MaterialIcons name="account-balance" size={13} color={C.muted} />
                      <Text style={s.showtimeHallText}>{st.hall}</Text>
                    </View>
                  </View>

                  {/* Status pill */}
                  <View style={s.statusCol}>
                    <View style={[s.statusPill, isFull ? s.statusPillError : s.statusPillSuccess]}>
                      <MaterialIcons name={isFull ? 'cancel' : 'check-circle'} size={14} color={isFull ? C.error : C.success} />
                      <Text style={isFull ? s.statusTextError : s.statusTextSuccess}>
                        {isFull ? 'Πλήρης' : `${st.available_seats} διαθ.`}
                      </Text>
                    </View>
                    {!isFull && (
                      <MaterialIcons name="chevron-right" size={20} color={C.accent} style={s.chevron} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={s.castSection}>
          <Text style={s.castSectionTitle}>Συντελεστές</Text>
          {castList.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.castScrollContent}
            >
              {castList.map((c, i) => (
                <CastMemberCard
                  key={`${show?.show_id ?? showId}-${c.role}-${i}`}
                  role={c.role}
                  name={c.name}
                  imageSource={resolveCastPortrait(c.imageKey)}
                  stagger={castList.length > 1 && i === 1}
                />
              ))}
            </ScrollView>
          ) : (
            <Text style={s.castFallback}>
              Δεν έχουν καταχωρηθεί συντελεστές για αυτή την παραγωγή. Οι λεπτομέρειες θα ενημερωθούν σύντομα.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
