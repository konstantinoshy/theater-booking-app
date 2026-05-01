import 'react-native-url-polyfill/auto';
import React from 'react';
import { View, StatusBar } from 'react-native';
import { configureNotifications } from './src/utils/notifications';

// Register foreground notification handler once at module load
configureNotifications();
import { NavigationContainer, DarkTheme, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { FavoritesProvider } from './src/context/FavoritesContext';

import { MaterialIcons } from '@expo/vector-icons';
import { C } from './src/theme/colors';

// Dark navigation theme — extends the built-in DarkTheme (which supplies fonts)
// and overrides colors with our obsidian + champagne gold palette.
const DarkNavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary:      C.primary,
    background:   C.bg,
    card:         C.surface,
    text:         C.text,
    border:       C.border,
    notification: C.accent,
  },
};

import LoginScreen      from './src/screens/LoginScreen';
import RegisterScreen   from './src/screens/RegisterScreen';
import TheatresScreen   from './src/screens/TheatresScreen';
import ShowsScreen      from './src/screens/ShowsScreen';
import ShowDetailScreen from './src/screens/ShowDetailScreen';
import BookingScreen    from './src/screens/BookingScreen';
import TicketScreen     from './src/screens/TicketScreen';
import HomeScreen            from './src/screens/HomeScreen';
import ProfileScreen         from './src/screens/ProfileScreen';
import ProfileSettingsScreen from './src/screens/ProfileSettingsScreen';
import PaymentHistoryScreen  from './src/screens/PaymentHistoryScreen';
import FavoritesScreen       from './src/screens/FavoritesScreen';
import FullHistoryScreen     from './src/screens/FullHistoryScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const DEFAULT_TAB_BAR_STYLE = {
  backgroundColor: C.surface,
  borderTopWidth: 0,
  paddingTop: 8,
  paddingBottom: 22,
  height: 76,
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.textSoft,
        tabBarStyle: DEFAULT_TAB_BAR_STYLE,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 2, textTransform: 'uppercase' },
      }}
    >
      <Tab.Screen
        name="Αρχική"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color }) => <MaterialIcons name="home" size={26} color={color} /> }}
      />
      <Tab.Screen
        name="Θέατρα"
        component={TheatresStack}
        options={({ route }) => {
          // Hide the bottom tab bar while the user is inside the Booking/Checkout flow
          // to eliminate alternative exit points and keep focus on the CTA.
          const focused = getFocusedRouteNameFromRoute(route) ?? 'TheatresList';
          const hideTabBar = focused === 'Booking' || focused === 'Ticket';
          return {
            tabBarIcon: ({ color }) => <MaterialIcons name="theater-comedy" size={26} color={color} />,
            tabBarStyle: hideTabBar ? { display: 'none' } : DEFAULT_TAB_BAR_STYLE,
          };
        }}
      />
      <Tab.Screen 
        name="Προφίλ" 
        component={ProfileScreen} 
        options={{ tabBarIcon: ({ color }) => <MaterialIcons name="person" size={26} color={color} /> }} 
      />
    </Tab.Navigator>
  );
}

function TheatresStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="TheatresList"  component={TheatresScreen}   options={{ headerShown: false }} />
      <Stack.Screen name="Shows"         component={ShowsScreen}       options={{ headerShown: false }} />
      <Stack.Screen name="ShowDetail"    component={ShowDetailScreen}  options={{ headerShown: false }} />
      <Stack.Screen name="Booking"       component={BookingScreen}     options={{ headerShown: false }} />
      <Stack.Screen name="Ticket"        component={TicketScreen}      options={{ headerShown: false, gestureEnabled: false }} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="ProfileSettingsScreen" component={ProfileSettingsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} options={{ headerShown: false }} />
          <Stack.Screen name="FavoritesScreen" component={FavoritesScreen} options={{ headerShown: false }} />
          <Stack.Screen name="FullHistoryScreen" component={FullHistoryScreen} options={{ headerShown: false }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login"    component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <AuthProvider>
        <NotificationProvider>
          <FavoritesProvider>
            <NavigationContainer theme={DarkNavTheme}>
              <RootNavigator />
            </NavigationContainer>
          </FavoritesProvider>
        </NotificationProvider>
      </AuthProvider>
    </View>
  );
}
