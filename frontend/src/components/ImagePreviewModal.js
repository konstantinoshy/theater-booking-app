import React from 'react';
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../theme/colors';

const { width: SCREEN_W } = Dimensions.get('window');

export default function ImagePreviewModal({ visible, imageUri, title, onClose }) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(15,17,21,0.96)" />
      <View style={s.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
          accessibilityLabel="Κλείσιμο"
        />

        <View style={[s.header, { paddingTop: insets.top + 8 }]}>
          {title ? <Text style={s.headerTitle}>{title}</Text> : <View />}
          <TouchableOpacity
            onPress={onClose}
            style={s.closeBtn}
            accessibilityLabel="Κλείσιμο"
            hitSlop={12}
          >
            <MaterialIcons name="close" size={24} color={C.text} />
          </TouchableOpacity>
        </View>

        <View style={s.imageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={s.image}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        </View>

        <View style={[s.hint, { paddingBottom: insets.bottom + 12 }]}>
          <MaterialIcons name="pinch" size={16} color={C.muted} />
          <Text style={s.hintText}>Ζούμ με δύο δάχτυλα</Text>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 17, 21, 0.96)',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    color: C.accent,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  image: {
    width: SCREEN_W - 16,
    height: SCREEN_W - 16,
    borderRadius: 16,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 8,
  },
  hintText: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '500',
  },
});
