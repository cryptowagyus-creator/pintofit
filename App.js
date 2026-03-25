import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import WorkoutsScreen from './src/screens/WorkoutsScreen';
import WorkoutDetailScreen from './src/screens/WorkoutDetailScreen';
import ExerciseDetailScreen from './src/screens/ExerciseDetailScreen';
import CalorieEstimatorScreen from './src/screens/CalorieEstimatorScreen';
import { colors } from './src/theme/colors';
import { FAMILY_USERS, resolveFamilyUser } from './src/data/family';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const SESSION_KEY = 'pintofit_active_user';

function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={tabStyles.wrapper}>
      <View style={tabStyles.pill}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const icons = { Home: 'home', Workouts: 'grid', CalorieEstimator: 'scan', Leaderboard: 'trophy' };
          const iconName = focused ? icons[route.name] : `${icons[route.name]}-outline`;
          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              style={tabStyles.tab}
              activeOpacity={0.7}
            >
              <Ionicons name={iconName} size={24} color={focused ? colors.white : '#6B6B6B'} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 28,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: colors.tabBar,
    borderRadius: 40,
    paddingVertical: 16,
    paddingHorizontal: 36,
    gap: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
  },
  tab: { alignItems: 'center', justifyContent: 'center' },
});

function Tabs({ activeUser, onLogout }) {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home">
        {() => <HomeScreen currentUser={activeUser} onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen name="Workouts" component={WorkoutsScreen} />
      <Tab.Screen name="CalorieEstimator">
        {() => <CalorieEstimatorScreen currentUser={activeUser} />}
      </Tab.Screen>
      <Tab.Screen name="Leaderboard">
        {() => <LeaderboardScreen currentUser={activeUser} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [activeUser, setActiveUser] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY).then((storedUser) => {
      if (storedUser) {
        const resolvedUser = resolveFamilyUser(storedUser);
        if (resolvedUser) setActiveUser(resolvedUser);
      }
      setSessionReady(true);
    });
  }, []);

  async function handleLogin(name) {
    const resolvedUser = resolveFamilyUser(name);
    if (!resolvedUser) return false;
    setActiveUser(resolvedUser);
    await AsyncStorage.setItem(SESSION_KEY, resolvedUser);
    return true;
  }

  async function handleLogout() {
    setActiveUser(null);
    await AsyncStorage.removeItem(SESSION_KEY);
  }

  if (!sessionReady) {
    return <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: colors.bg } }}>
          {activeUser ? (
            <Stack.Screen name="Tabs">
              {() => <Tabs activeUser={activeUser} onLogout={handleLogout} />}
            </Stack.Screen>
          ) : (
            <Stack.Screen name="Login">
              {() => <LoginScreen onLogin={handleLogin} />}
            </Stack.Screen>
          )}
          <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
          <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
