import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { C } from '../theme/colors';

const POSTER_W = 128;
const POSTER_H = Math.round((POSTER_W * 4) / 3);

const styles = StyleSheet.create({
  wrap: {
    width: POSTER_W,
    overflow: 'visible',
  },
  imageCard: {
    width: POSTER_W,
    height: POSTER_H,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  labels: {
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 4,
    paddingBottom: 6,
    width: '100%',
    minHeight: 52,
  },
  role: {
    color: C.accent,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    lineHeight: 14,
    marginBottom: 6,
  },
  name: {
    color: C.text,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 18,
    width: '100%',
  },
  namePending: {
    color: C.muted,
    fontWeight: '600',
    fontStyle: 'italic',
  },
});

/**
 * Κάρτα συντελεστή με poster dimensions (4:3) και stagger animation για gallery.
 * Fallback σε «Προς ανακοίνωση» για pending ονόματα.
 */
export default function CastMemberCard({ role, name, imageSource, stagger }) {
  const hasName = Boolean(name && String(name).trim());
  return (
    <View style={[styles.wrap, stagger && { transform: [{ translateY: 16 }] }]}>
      <View style={styles.imageCard}>
        <Image source={imageSource} style={styles.image} resizeMode="contain" accessibilityIgnoresInvertColors />
      </View>
      <View style={styles.labels}>
        <Text style={styles.role} numberOfLines={2}>
          {role}
        </Text>
        <Text
          style={[styles.name, !hasName && styles.namePending]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {hasName ? name.trim() : 'Προς ανακοίνωση'}
        </Text>
      </View>
    </View>
  );
}
