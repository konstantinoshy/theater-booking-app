import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../config/api';
import { C } from '../theme/colors';

export default function PaymentHistoryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data } = await api.get('/user/payments');
      setPayments(data);
    } catch (error) {
      console.log('Failed to load payments:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const isCancelled = item.status === 'CANCELLED' || item.status === 'REFUNDED';
    
    return (
      <View style={[s.card, isCancelled && s.cardDimmed]}>
        <View style={s.cardHeader}>
          <Text style={[s.showTitle, isCancelled && s.textDimmed]} numberOfLines={1}>
            {item.showTitle}
          </Text>
          {isCancelled && (
            <View style={s.badge}>
              <Text style={s.badgeText}>ΕΠΙΣΤΡΑΦΗΚΕ</Text>
            </View>
          )}
        </View>

        <View style={s.cardBody}>
          <View style={s.detailRow}>
            <MaterialIcons name="event" size={14} color={C.muted} />
            <Text style={s.detailText}>{item.date}</Text>
          </View>
          <View style={s.detailRow}>
            <MaterialIcons name="confirmation-num" size={14} color={C.muted} />
            <Text style={s.detailText}>{item.quantity} Εισιτήρια</Text>
          </View>
        </View>

        <View style={s.divider} />

        <View style={s.cardFooter}>
          <Text style={s.footerLabel}>Σύνολο</Text>
          <Text style={[
            s.price, 
            isCancelled ? s.priceCancelled : s.priceCompleted
          ]}>
            {item.totalPrice}€
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={s.backBtn}
          accessibilityLabel="Επιστροφή"
        >
          <MaterialIcons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Ιστορικό Πληρωμών</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={payments}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[s.listContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={C.accent} style={{ marginTop: 40 }} />
          ) : (
            <Text style={s.emptyText}>Δεν βρέθηκαν πληρωμές.</Text>
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
    padding: 16,
  },
  cardDimmed: {
    opacity: 0.65,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  showTitle: {
    color: C.text,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Manrope',
    flex: 1,
    marginRight: 8,
  },
  textDimmed: {
    color: C.muted,
  },
  badge: {
    backgroundColor: C.errorSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: C.error,
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'Inter',
  },
  cardBody: {
    gap: 6,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    color: C.muted,
    fontSize: 13,
    fontFamily: 'Inter',
  },
  divider: {
    height: 1,
    backgroundColor: C.bg, // using bg color makes an inverted line due to tonal depth
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    color: C.textSoft,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Inter',
  },
  priceCompleted: {
    color: C.success,
  },
  priceCancelled: {
    color: C.muted,
    textDecorationLine: 'line-through',
  },
  emptyText: {
    color: C.muted,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
    fontFamily: 'Inter',
  },
});
