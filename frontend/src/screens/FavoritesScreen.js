import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../config/api';
import { C } from '../theme/colors';

export default function FavoritesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavorites = async () => {
    try {
      const { data } = await api.get('/user/favorites');
      setFavorites(data);
    } catch (error) {
      console.log('Error fetching favorites:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFavorites();
  };

  const removeFavorite = async (showId) => {
    try {
      await api.delete(`/user/favorites/${showId}`);
      setFavorites((prev) => prev.filter((f) => f.show_id !== showId));
    } catch (error) {
      console.log('Failed to remove favorite:', error.message);
    }
  };

  const handleShowPress = (show) => {
    navigation.navigate('Main', {
      screen: 'Θέατρα',
      params: {
        state: {
          index: 1,
          routes: [
            { name: 'TheatresList' },
            { name: 'ShowDetail', params: { showId: show.show_id, title: show.title } },
          ],
        },
      },
    });
  };

  const renderFavItem = ({ item }) => {
    // If we have an image, we use it; else a generic fallback
    const imageUrl = item.image 
      ? { uri: item.image } 
      : { uri: 'https://images.unsplash.com/photo-1507676184212-d0330a15233c?q=80&w=600&auto=format&fit=crop' };

    return (
      <View style={s.card}>
        <TouchableOpacity
          style={s.cardContent}
          activeOpacity={0.8}
          onPress={() => handleShowPress(item)}
        >
          <Image source={imageUrl} style={s.cardImage} />
          
          <View style={s.cardInfo}>
            <Text style={s.showTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={s.theatreRow}>
              <MaterialIcons name="theater-comedy" size={14} color={C.muted} />
              <Text style={s.theatreText} numberOfLines={1}>
                {item.theatre_name || 'Θέατρο'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={s.unfavBtn} 
          onPress={() => removeFavorite(item.show_id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="favorite" size={24} color={C.accent} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={s.backBtn}
          accessibilityLabel="Επιστροφή"
        >
          <MaterialIcons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Αγαπημένα</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => String(item.show_id)}
        contentContainerStyle={[s.listContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={C.accent}
          />
        }
        renderItem={renderFavItem}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={C.accent} style={{ marginTop: 40 }} />
          ) : (
            <View style={s.emptyState}>
              <MaterialIcons name="heart-broken" size={64} color={C.surface} style={{ marginBottom: 16 }} />
              <Text style={s.emptyText}>Δεν έχετε προσθέσει παραστάσεις στα αγαπημένα σας.</Text>
              <Text style={s.emptySubText}>Περιηγηθείτε στις παραστάσεις και πατήστε την καρδιά για να τις αποθηκεύσετε εδώ.</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: C.surface,
    marginBottom: 8,
  },
  headerTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'Manrope',
  },
  backBtn: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 16,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  showTitle: {
    color: C.text,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Manrope',
    marginBottom: 4,
  },
  theatreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  theatreText: {
    color: C.muted,
    fontSize: 13,
    fontFamily: 'Inter',
  },
  unfavBtn: {
    padding: 8,
    backgroundColor: C.bg,
    borderRadius: 24,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    paddingHorizontal: 20,
  },
  emptyText: {
    color: C.textSoft,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Manrope',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    color: C.muted,
    fontSize: 14,
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 22,
  },
});
