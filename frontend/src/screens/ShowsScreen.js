import React, { useEffect, useState } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../config/api';
import { C } from '../theme/colors';
import { resolveShowHeroImageSource } from '../utils/localImageMap';
import { descriptionWithoutEmbeddedPhotoFilename } from '../utils/descriptionForDisplay';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
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
    backgroundColor: C.card,
  },
  headerTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 48,
  },
  card: {
    borderRadius: 14,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  posterThumb: {
    width: 72,
    height: 96,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 14,
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  cardTextCol: {
    flex: 1,
  },
  cardTitle: {
    color: C.text,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  metaText: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  metaDot: {
    color: C.border,
    fontSize: 12,
    fontWeight: '700',
    marginHorizontal: 4,
  },
  description: {
    color: C.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyText: {
    color: C.muted,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
});

export default function ShowsScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { theatreId, theatreName } = route.params;
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchShows(); }, []);

  const fetchShows = async () => {
    try {
      const { data } = await api.get('/shows', { params: { theatreId } });
      setShows(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityLabel="Πίσω"
        >
          <MaterialIcons name="arrow-back" size={18} color={C.accentSoft} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {theatreName}
        </Text>
      </View>

      <FlatList
        data={shows}
        keyExtractor={(item) => String(item.show_id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const desc = descriptionWithoutEmbeddedPhotoFilename(item.description);
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('ShowDetail', { showId: item.show_id, title: item.title })}
              accessibilityLabel={`Παράσταση ${item.title}`}
            >
              <View style={styles.cardRow}>
                <View style={styles.posterThumb}>
                  <Image
                    source={resolveShowHeroImageSource(item.title)}
                    style={styles.posterImage}
                    resizeMode="cover"
                    accessibilityIgnoresInvertColors
                  />
                </View>
                <View style={styles.cardTextCol}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View style={styles.metaRow}>
                    <MaterialIcons name="schedule" size={13} color={C.muted} />
                    <Text style={styles.metaText}>{item.duration} λεπτά</Text>
                    <Text style={styles.metaDot}>•</Text>
                    <Text style={styles.metaText}>{item.age_rating}</Text>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={C.border} />
              </View>
              {desc ? (
                <Text style={styles.description} numberOfLines={2}>
                  {desc}
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={C.accent} style={{ marginTop: 48 }} />
          ) : (
            <Text style={styles.emptyText}>Δεν βρέθηκαν παραστάσεις.</Text>
          )
        }
      />
    </View>
  );
}
