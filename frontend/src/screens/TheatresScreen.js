import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../config/api';
import { C } from '../theme/colors';
import { resolveTheatreImageSource } from '../utils/localImageMap';
import { descriptionWithoutEmbeddedPhotoFilename } from '../utils/descriptionForDisplay';

export default function TheatresScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [theatres, setTheatres] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Auto-navigate from Home featured cards ───────────────────────────────
  // HomeScreen navigates here first (TheatresList) to keep back-stack intact,
  // then passes autoNavigate so we push the real target inside OUR stack.
  useEffect(() => {
    const autoNav = route.params?.autoNavigate;
    if (!autoNav) return;
    // Clear the param immediately so re-focusing this screen doesn't re-fire.
    navigation.setParams({ autoNavigate: undefined });
    // Small delay ensures the TheatresList is fully mounted before pushing.
    const t = setTimeout(() => {
      navigation.navigate(autoNav.target, autoNav.params);
    }, 50);
    return () => clearTimeout(t);
  }, [route.params?.autoNavigate]);

  const fetchTheatres = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const params = search ? { name: search } : {};
      const { data } = await api.get('/theatres', { params });
      setTheatres(data);
    } catch {
      setError('Δεν ήταν δυνατή η φόρτωση. Ελέγξτε τη σύνδεσή σας.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchTheatres(); }, [fetchTheatres]);

  return (
    <View style={s.root}>
      {/* Header */}
      <View
        style={[s.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={s.headerLeft}>
          <MaterialIcons name="theater-comedy" size={24} color={C.accent} />
          <Text style={s.headerTitle}>
            Θέατρα
          </Text>
        </View>
      </View>

      <FlatList
        data={theatres}
        keyExtractor={(item) => String(item.theatre_id)}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Search */}
            <View style={s.searchRow}>
              <MaterialIcons name="search" size={20} color={C.accent} style={{ marginRight: 10 }} />
              <TextInput
                style={s.searchInput}
                placeholder="Αναζήτηση θεάτρου..."
                placeholderTextColor={C.muted}
                value={search}
                onChangeText={setSearch}
                accessibilityLabel="Αναζήτηση θεάτρου"
              />
            </View>

            {/* Section heading */}
            <View style={s.sectionHeadingRow}>
              <Text style={s.sectionTitle}>
                Προτεινόμενες Σκηνές
              </Text>
              <Text style={s.sectionLink}>
                Δείτε Όλα
              </Text>
            </View>
          </>
        }
        renderItem={({ item }) => {
          const desc = descriptionWithoutEmbeddedPhotoFilename(item.description);
          return (
            <TouchableOpacity
              style={s.card}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Shows', { theatreId: item.theatre_id, theatreName: item.name })}
              accessibilityRole="button"
              accessibilityLabel={`Θέατρο ${item.name}`}
            >
              <Image
                source={resolveTheatreImageSource(item.name)}
                style={s.cardImage}
                accessibilityIgnoresInvertColors
              />
              <View style={s.cardBody}>
                <Text style={s.cardTitle} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={s.cardLocationRow}>
                  <MaterialIcons name="location-on" size={14} color={C.accent} />
                  <Text style={s.cardLocation}>
                    {item.location}
                  </Text>
                </View>
                {desc ? (
                  <Text style={s.cardDesc} numberOfLines={2}>
                    {desc}
                  </Text>
                ) : null}
              </View>
              <MaterialIcons name="chevron-right" size={22} color={C.border} />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={C.accent} style={{ marginTop: 48 }} />
          ) : error ? (
            <View style={s.errorContainer}>
              <Text style={s.errorText}>{error}</Text>
              <TouchableOpacity style={s.retryBtn} onPress={fetchTheatres}>
                <Text style={s.retryBtnText}>Δοκιμάστε ξανά</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={s.emptyText}>
              Δεν βρέθηκαν θεάτρα.
            </Text>
          )
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: C.accent,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 48,
  },
  searchRow: {
    height: 48,
    borderRadius: 12,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    color: C.text,
    fontSize: 16,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionLink: {
    color: C.accent,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  card: {
    borderRadius: 12,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardImage: {
    width: 68,
    height: 68,
    borderRadius: 8,
    backgroundColor: C.card,
  },
  cardBody: {
    flex: 1,
    marginLeft: 16,
  },
  cardTitle: {
    color: C.text,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  cardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  cardLocation: {
    color: C.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  cardDesc: {
    color: C.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  emptyText: {
    color: C.muted,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    marginTop: 48,
  },
  errorText: {
    color: C.text,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryBtn: {
    backgroundColor: C.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  retryBtnText: {
    color: C.bg,
    fontSize: 15,
    fontWeight: '700',
  },
});
