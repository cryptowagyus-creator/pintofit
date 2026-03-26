import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  Modal,
  Pressable,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { workoutProgram } from '../data/workouts';
import { FAMILY_AVATARS, getUserKey } from '../data/family';
import { awardWeeklyPoints, getUserWeeklyPoints, getWeeklyPoints } from '../utils/points';
import { isSpanishUser, t } from '../utils/i18n';

// Use device locale so Spanish users get proper names (e.g. "mié." not "casarse")
// Oct 3 2021 was a Sunday, so index 0=Sun through 6=Sat
const DAY_LABELS = [...Array(7)].map((_, i) => {
  const d = new Date(2021, 9, 3 + i);
  return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(d);
});
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

const cardMeta = {
  chest_triceps:  { bg: colors.yellowCard,   tag: 'Push', tagColor: colors.green },
  back_biceps:    { bg: colors.blueCard,     tag: 'Pull', tagColor: colors.blue },
  legs_shoulders: { bg: colors.lavenderCard, tag: 'Legs', tagColor: colors.lavender },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  return 'Good evening,';
}

export default function HomeScreen({ currentUser, onLogout }) {
  const spanish = isSpanishUser(currentUser);
  const navigation = useNavigation();
  const { todaysMeals } = useMeals();
  const todayIndex = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState(todayIndex);
  const [loggedWorkouts, setLoggedWorkouts] = useState({});
  const [pickerVisible, setPickerVisible] = useState(false);
  const [customWorkoutName, setCustomWorkoutName] = useState('');
  const [mealModalVisible, setMealModalVisible] = useState(false);
  const [mealLog, setMealLog] = useState({});
  const [mealType, setMealType] = useState(MEAL_TYPES[0]);
  const [mealName, setMealName] = useState('');
  const [mealCalories, setMealCalories] = useState('');
  const [weeklyPoints, setWeeklyPoints] = useState(0);

  const days = workoutProgram.days;
  const userKey = getUserKey(currentUser);
  const storageKey = `pintofit_logged_workouts_${userKey}`;
  const mealStorageKey = `pintofit_meals_${userKey}`;
  const defaultAvatarSource = FAMILY_AVATARS[userKey] || null;

  useEffect(() => {
    AsyncStorage.getItem(storageKey).then((raw) => {
      if (raw) setLoggedWorkouts(JSON.parse(raw));
      else setLoggedWorkouts({});
    });
    AsyncStorage.getItem(mealStorageKey).then((raw) => {
      if (raw) setMealLog(JSON.parse(raw));
      else setMealLog({});
    });
    getWeeklyPoints().then((state) => {
      setWeeklyPoints(getUserWeeklyPoints(state.scores, currentUser));
    });
  }, [mealStorageKey, storageKey]);

  async function logWorkout(dayIndex, workoutId) {
    const shouldAwardPoints = !loggedWorkouts[dayIndex];
    const updated = { ...loggedWorkouts, [dayIndex]: workoutId };
    setLoggedWorkouts(updated);
    await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
    if (shouldAwardPoints) {
      const pointsState = await awardWeeklyPoints(currentUser, 5);
      setWeeklyPoints(getUserWeeklyPoints(pointsState.scores, currentUser));
    }
    setPickerVisible(false);
  }

  async function logCustomWorkout(dayIndex) {
    const trimmedName = customWorkoutName.trim();
    if (!trimmedName) return;

    const updated = {
      ...loggedWorkouts,
      [dayIndex]: {
        type: 'custom',
        name: trimmedName,
      },
    };
    const shouldAwardPoints = !loggedWorkouts[dayIndex];

    setLoggedWorkouts(updated);
    await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
    if (shouldAwardPoints) {
      const pointsState = await awardWeeklyPoints(currentUser, 5);
      setWeeklyPoints(getUserWeeklyPoints(pointsState.scores, currentUser));
    }
    setCustomWorkoutName('');
    setPickerVisible(false);
  }

  async function clearWorkout(dayIndex) {
    const updated = { ...loggedWorkouts };
    delete updated[dayIndex];
    setLoggedWorkouts(updated);
    await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
    setPickerVisible(false);
  }

  async function addMeal() {
    const trimmedName = mealName.trim();
    if (!trimmedName) return;

    const parsedCalories = mealCalories.trim() ? parseInt(mealCalories.trim(), 10) : null;
    const entry = {
      id: `${Date.now()}`,
      type: mealType,
      name: trimmedName,
      calories: Number.isNaN(parsedCalories) ? null : parsedCalories,
    };

    const updated = {
      ...mealLog,
      [selectedDay]: [...(mealLog[selectedDay] || []), entry],
    };

    setMealLog(updated);
    await AsyncStorage.setItem(mealStorageKey, JSON.stringify(updated));
    const pointsState = await awardWeeklyPoints(currentUser, 1);
    setWeeklyPoints(getUserWeeklyPoints(pointsState.scores, currentUser));
    setMealName('');
    setMealCalories('');
    setMealType(MEAL_TYPES[0]);
    setMealModalVisible(false);
  }

  async function removeMeal(mealId) {
    const updatedDayMeals = (mealLog[selectedDay] || []).filter((meal) => meal.id !== mealId);
    const updated = { ...mealLog };

    if (updatedDayMeals.length) updated[selectedDay] = updatedDayMeals;
    else delete updated[selectedDay];

    setMealLog(updated);
    await AsyncStorage.setItem(mealStorageKey, JSON.stringify(updated));
  }

  const selectedDayWorkoutId = loggedWorkouts[selectedDay];
  const selectedDayWorkout = typeof selectedDayWorkoutId === 'string'
    ? days.find((d) => d.id === selectedDayWorkoutId)
    : null;
  const selectedCustomWorkout = selectedDayWorkoutId && typeof selectedDayWorkoutId === 'object'
    ? selectedDayWorkoutId
    : null;
  const selectedDayMeals = mealLog[selectedDay] || [];
  const totalCalories = selectedDayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoBlock}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        </View>

        {/* Greeting */}
        <View style={styles.greetingBlock}>
          <View style={styles.greetingHeaderRow}>
            <View style={styles.greetingRow}>
              <View style={styles.avatarWrapper}>
                {defaultAvatarSource ? (
                  <Image source={defaultAvatarSource} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={36} color="#fff" />
                  </View>
                )}
                <TouchableOpacity onPress={onLogout} style={styles.logoutBadge} activeOpacity={0.85}>
                  <Ionicons name="log-out-outline" size={12} color="#fff" />
                </TouchableOpacity>
              </View>
              <View>
                <Text style={styles.greeting}>{spanish ? getGreeting().replace('Good morning,', 'Buenos dias,').replace('Good afternoon,', 'Buenas tardes,').replace('Good evening,', 'Buenas noches,') : getGreeting()}</Text>
                <Text style={styles.greetingName}>{currentUser}</Text>
              </View>
            </View>
            <View style={styles.pointsBadge}>
              <Ionicons name="trophy" size={18} color={colors.green} />
              <Text style={styles.pointsCount}>{weeklyPoints}</Text>
              <Text style={styles.pointsLabel}>{t(currentUser, 'week', 'semana')}</Text>
            </View>
          </View>
        </View>

        {/* Week Strip */}
        <View style={styles.weekStrip}>
          {DAY_LABELS.map((label, i) => {
            const isSelected = i === selectedDay;
            const isToday = i === todayIndex;
            const hasWorkout = !!loggedWorkouts[i];
            return (
              <TouchableOpacity
                key={label}
                style={styles.dayItem}
                onPress={() => setSelectedDay(i)}
                activeOpacity={0.7}
              >
                <View style={[styles.dayCircle, isSelected && styles.dayCircleActive]}>
                  <Text style={[styles.dayNum, isSelected && styles.dayNumActive]}>
                    {label}
                  </Text>
                </View>
                <View style={[
                  styles.dot,
                  hasWorkout ? styles.dotWorkout : styles.dotRest,
                  isSelected && hasWorkout && styles.dotSelected,
                ]} />
                {isToday && !isSelected && <View style={styles.todayTick} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected Day Focus Card */}
        <View style={styles.focusWrapper}>
          {selectedDayWorkout ? (
            <TouchableOpacity
              style={[styles.focusCard, { backgroundColor: cardMeta[selectedDayWorkout.id].bg }]}
              onPress={() => navigation.navigate('WorkoutDetail', { day: selectedDayWorkout, currentUser })}
              activeOpacity={0.85}
            >
              <View style={styles.focusTop}>
                <View style={[styles.focusPill, { backgroundColor: 'rgba(255,255,255,0.55)' }]}>
                  <Text style={[styles.focusPillText, { color: cardMeta[selectedDayWorkout.id].tagColor }]}>
                    {selectedDay === todayIndex ? "Today's Workout" : DAY_LABELS[selectedDay]}
                    {' · '}{selectedDayWorkout.label}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setPickerVisible(true)} hitSlop={8}>
                  <Ionicons name="create-outline" size={18} color="rgba(0,0,0,0.35)" />
                </TouchableOpacity>
              </View>
              <Text style={styles.focusName}>{selectedDayWorkout.name}</Text>
              <View style={styles.focusMeta}>
                <View style={[styles.tagPill, { backgroundColor: 'rgba(255,255,255,0.5)' }]}>
                  <Text style={[styles.tagText, { color: cardMeta[selectedDayWorkout.id].tagColor }]}>
                    {cardMeta[selectedDayWorkout.id].tag}
                  </Text>
                </View>
                <Text style={styles.focusExCount}>
                  {selectedDayWorkout.groups.reduce((s, g) => s + g.exercises.length, 0)} exercises
                </Text>
              </View>
            </TouchableOpacity>
          ) : selectedCustomWorkout ? (
            <View style={[styles.focusCard, styles.customWorkoutCard]}>
              <View style={styles.focusTop}>
                <View style={[styles.focusPill, styles.customWorkoutPill]}>
                  <Text style={[styles.focusPillText, styles.customWorkoutPillText]}>
                    {selectedDay === todayIndex ? t(currentUser, "Today's Workout", 'Entrenamiento de hoy') : DAY_LABELS[selectedDay]}
                    {' · '}Custom
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setPickerVisible(true)} hitSlop={8}>
                  <Ionicons name="create-outline" size={18} color="rgba(255,255,255,0.75)" />
                </TouchableOpacity>
              </View>
              <Text style={[styles.focusName, styles.customWorkoutName]}>{selectedCustomWorkout.name}</Text>
              <Text style={styles.customWorkoutSub}>{t(currentUser, 'Custom workout logged for this day.', 'Entrenamiento personalizado guardado para este dia.')}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.restCard}
              onPress={() => setPickerVisible(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle-outline" size={32} color={colors.blue} />
              <View>
                <Text style={styles.restTitle}>
                  {selectedDay === todayIndex ? t(currentUser, "Log Today's Workout", 'Registrar entrenamiento de hoy') : t(currentUser, `Log ${DAY_LABELS[selectedDay]}'s Workout`, `Registrar entrenamiento de ${DAY_LABELS[selectedDay]}`)}
                </Text>
                <Text style={styles.restSub}>{t(currentUser, 'Tap to choose Day A, B, C, or custom workout', 'Toca para elegir Dia A, B, C o entrenamiento personalizado')}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.calorieSection}>
          <View style={styles.calorieHeader}>
            <View>
              <Text style={styles.sectionTitleCompact}>{t(currentUser, 'Calories', 'Calorias')}</Text>
              <Text style={styles.calorieSubtitle}>
                {selectedDay === todayIndex ? t(currentUser, 'Today', 'Hoy') : DAY_LABELS[selectedDay]}
              </Text>
            </View>
            <TouchableOpacity style={styles.mealAddBtn} onPress={() => setMealModalVisible(true)} activeOpacity={0.85}>
              <Ionicons name="add" size={18} color={colors.white} />
              <Text style={styles.mealAddText}>{t(currentUser, 'Log meal', 'Registrar comida')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.calorieCard}>
            <Text style={styles.calorieCount}>{totalCalories}</Text>
            <Text style={styles.calorieLabel}>{t(currentUser, 'calories logged', 'calorias registradas')}</Text>

            {selectedDayMeals.length ? (
              <View style={styles.mealList}>
                {selectedDayMeals.map((meal) => (
                  <View key={meal.id} style={styles.mealRow}>
                    <View style={styles.mealRowMain}>
                      <Text style={styles.mealType}>{meal.type}</Text>
                      <Text style={styles.mealNameText}>{meal.name}</Text>
                    </View>
                    <View style={styles.mealRowMeta}>
                      <Text style={styles.mealCaloriesText}>
                        {meal.calories != null ? `${meal.calories} cal` : t(currentUser, 'No calories', 'Sin calorias')}
                      </Text>
                      <TouchableOpacity onPress={() => removeMeal(meal.id)} hitSlop={8}>
                        <Ionicons name="close" size={18} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyMeals}>{t(currentUser, 'No meals logged for this day yet.', 'Todavia no hay comidas registradas para este dia.')}</Text>
            )}
          </View>
        </View>

        {/* Full Plan */}
        <Text style={styles.sectionTitle}>{t(currentUser, 'Your Plan', 'Tu plan')}</Text>
        <View style={styles.cardsContainer}>
          {days[0] && (
            <WorkoutCard
              day={days[0]}
              meta={cardMeta[days[0].id]}
              tall
              onPress={() => navigation.navigate('WorkoutDetail', { day: days[0], currentUser })}
            />
          )}
          {(days[1] || days[2]) && (
            <View style={styles.rowCards}>
              {days[1] && (
                <WorkoutCard
                  day={days[1]}
                  meta={cardMeta[days[1].id]}
                  half
                  onPress={() => navigation.navigate('WorkoutDetail', { day: days[1], currentUser })}
                />
              )}
              {days[2] && (
                <WorkoutCard
                  day={days[2]}
                  meta={cardMeta[days[2].id]}
                  half
                  onPress={() => navigation.navigate('WorkoutDetail', { day: days[2], currentUser })}
                />
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Workout Picker Modal */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setPickerVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {selectedDay === todayIndex ? t(currentUser, "Log Today's Workout", 'Registrar entrenamiento de hoy') : t(currentUser, `Log ${DAY_LABELS[selectedDay]}'s Workout`, `Registrar entrenamiento de ${DAY_LABELS[selectedDay]}`)}
            </Text>
            {days.map((day) => (
              <TouchableOpacity
                key={day.id}
                style={[styles.pickerRow, { backgroundColor: cardMeta[day.id].bg }]}
                onPress={() => logWorkout(selectedDay, day.id)}
                activeOpacity={0.85}
              >
                <View>
                  <Text style={styles.pickerLabel}>{day.label}</Text>
                  <Text style={styles.pickerName}>{day.name}</Text>
                </View>
                <View style={[styles.tagPill, { backgroundColor: 'rgba(255,255,255,0.55)' }]}>
                  <Text style={[styles.tagText, { color: cardMeta[day.id].tagColor }]}>
                    {cardMeta[day.id].tag}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            <View style={styles.customWorkoutBox}>
              <Text style={styles.customWorkoutLabel}>{t(currentUser, 'Custom Workout', 'Entrenamiento personalizado')}</Text>
              <TextInput
                value={customWorkoutName}
                onChangeText={setCustomWorkoutName}
                placeholder={t(currentUser, 'What did you work on?', 'Que trabajaste?')}
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
              <TouchableOpacity
                style={styles.saveMealBtn}
                onPress={() => logCustomWorkout(selectedDay)}
                activeOpacity={0.85}
              >
                <Text style={styles.saveMealText}>{t(currentUser, 'Save custom workout', 'Guardar entrenamiento personalizado')}</Text>
              </TouchableOpacity>
            </View>
            {loggedWorkouts[selectedDay] && (
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => clearWorkout(selectedDay)}
              >
                <Text style={styles.clearText}>{t(currentUser, 'Clear this day', 'Borrar este dia')}</Text>
              </TouchableOpacity>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={mealModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMealModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setMealModalVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {selectedDay === todayIndex ? t(currentUser, "Log Today's Meal", 'Registrar comida de hoy') : t(currentUser, `Log ${DAY_LABELS[selectedDay]}'s Meal`, `Registrar comida de ${DAY_LABELS[selectedDay]}`)}
            </Text>

            <View style={styles.mealTypeRow}>
              {MEAL_TYPES.map((type) => {
                const isActive = mealType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.mealTypePill, isActive && styles.mealTypePillActive]}
                    onPress={() => setMealType(type)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.mealTypePillText, isActive && styles.mealTypePillTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              value={mealName}
              onChangeText={setMealName}
                placeholder={t(currentUser, 'Food name', 'Nombre de la comida')}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
            <TextInput
              value={mealCalories}
              onChangeText={setMealCalories}
                placeholder={t(currentUser, 'Calories (optional)', 'Calorias (opcional)')}
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              style={styles.input}
            />

            <TouchableOpacity style={styles.saveMealBtn} onPress={addMeal} activeOpacity={0.85}>
              <Text style={styles.saveMealText}>{t(currentUser, 'Save meal', 'Guardar comida')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function WorkoutCard({ day, meta, tall, half, onPress }) {
  const totalEx = day.groups.reduce((s, g) => s + g.exercises.length, 0);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, { backgroundColor: meta.bg }, tall && styles.cardTall, half && styles.cardHalf]}
    >
      <View style={[styles.dayLabelPill, { backgroundColor: 'rgba(255,255,255,0.5)' }]}>
        <Text style={[styles.dayLabelPillText, { color: meta.tagColor }]}>{day.label}</Text>
      </View>
      <View style={styles.cardBottom}>
        <Text style={styles.cardName} numberOfLines={2}>{day.name}</Text>
        <View style={styles.cardMeta}>
          <View style={[styles.tagPill, { backgroundColor: 'rgba(255,255,255,0.55)' }]}>
            <Text style={[styles.tagText, { color: meta.tagColor }]}>{meta.tag}</Text>
          </View>
          <Text style={styles.exCount}>{totalEx} exercises</Text>
        </View>
      </View>
      <View style={styles.chevronWrapper}>
        <Ionicons name="chevron-forward" size={16} color="rgba(0,0,0,0.35)" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 120 },

  logoBlock: { alignItems: 'center', paddingTop: 0, paddingBottom: 0, marginTop: -6 },
  logo: { width: 240, height: 92 },

  greetingBlock: { paddingHorizontal: 24, paddingBottom: 18 },
  greetingHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  greetingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 16 },
  greeting: { fontSize: 15, color: colors.textSecondary, fontWeight: '400' },
  greetingName: { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: -0.5, marginTop: 2 },
  avatarWrapper: { position: 'relative', width: 73, height: 73 },
  avatarImg: { width: 73, height: 73, borderRadius: 36.5, borderWidth: 2, borderColor: colors.blue },
  avatarPlaceholder: { width: 73, height: 73, borderRadius: 36.5, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  logoutBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  pointsBadge: {
    minWidth: 78,
    backgroundColor: colors.text,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  pointsCount: { fontSize: 22, fontWeight: '800', color: colors.white, letterSpacing: -0.6 },
  pointsLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 },

  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  dayItem: { alignItems: 'center', gap: 4 },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleActive: { backgroundColor: colors.text },
  dayNum: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  dayNumActive: { color: colors.white, fontWeight: '700' },
  dot: { width: 5, height: 5, borderRadius: 3 },
  dotWorkout: { backgroundColor: colors.textMuted },
  dotRest: { backgroundColor: 'transparent' },
  dotSelected: { backgroundColor: colors.text },
  todayTick: {
    position: 'absolute',
    bottom: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.blue,
  },

  focusWrapper: { paddingHorizontal: 16, marginBottom: 28 },
  focusCard: { borderRadius: 20, padding: 20, gap: 10 },
  focusTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  focusPill: { borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10 },
  focusPillText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  focusName: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  focusMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  focusExCount: { fontSize: 13, color: 'rgba(0,0,0,0.45)', fontWeight: '500' },
  customWorkoutCard: { backgroundColor: colors.text },
  customWorkoutPill: { backgroundColor: 'rgba(255,255,255,0.14)' },
  customWorkoutPillText: { color: colors.green },
  customWorkoutName: { color: colors.white },
  customWorkoutSub: { fontSize: 14, color: 'rgba(255,255,255,0.72)', fontWeight: '500' },

  calorieSection: { paddingHorizontal: 16, marginBottom: 28 },
  calorieHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitleCompact: { fontSize: 20, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  calorieSubtitle: { marginTop: 2, fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  mealAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.text,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  mealAddText: { fontSize: 13, fontWeight: '700', color: colors.white },
  calorieCard: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  calorieCount: { fontSize: 36, fontWeight: '800', color: colors.text, letterSpacing: -1 },
  calorieLabel: { marginTop: 2, fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  mealList: { marginTop: 18, gap: 12 },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  mealRowMain: { flex: 1, paddingRight: 12 },
  mealType: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.4, marginBottom: 3 },
  mealNameText: { fontSize: 15, fontWeight: '700', color: colors.text },
  mealRowMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mealCaloriesText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  emptyMeals: { marginTop: 18, fontSize: 14, color: colors.textSecondary, fontWeight: '500' },

  restCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  restTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  restSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },

  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.text, paddingHorizontal: 24, marginBottom: 14, letterSpacing: -0.3 },

  mealsContainer: { paddingHorizontal: 16, gap: 10, marginBottom: 28 },
  mealCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  mealThumb: { width: '100%', height: 140 },
  mealText: { fontSize: 13, color: colors.text, lineHeight: 20, padding: 14 },

  cardsContainer: { paddingHorizontal: 16, gap: 12 },
  rowCards: { flexDirection: 'row', gap: 12 },

  card: { borderRadius: 20, padding: 18, position: 'relative', overflow: 'hidden' },
  cardTall: { height: 200, justifyContent: 'space-between' },
  cardHalf: { flex: 1, height: 150, justifyContent: 'space-between' },

  dayLabelPill: { alignSelf: 'flex-start', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, marginBottom: 8 },
  dayLabelPillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  cardBottom: { gap: 8 },
  cardName: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.3, lineHeight: 22 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tagPill: { borderRadius: 8, paddingVertical: 3, paddingHorizontal: 9 },
  tagText: { fontSize: 12, fontWeight: '600' },
  exCount: { fontSize: 12, color: 'rgba(0,0,0,0.5)', fontWeight: '500' },
  chevronWrapper: { position: 'absolute', top: 18, right: 18 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
  },
  pickerLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(0,0,0,0.4)', letterSpacing: 0.5, marginBottom: 2 },
  pickerName: { fontSize: 16, fontWeight: '700', color: colors.text },
  customWorkoutBox: {
    marginTop: 4,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  customWorkoutLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  clearBtn: { alignItems: 'center', paddingTop: 8 },
  clearText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  mealTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 6 },
  mealTypePill: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.card,
  },
  mealTypePillActive: { backgroundColor: colors.text },
  mealTypePillText: { fontSize: 13, fontWeight: '700', color: colors.text },
  mealTypePillTextActive: { color: colors.white },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    color: colors.text,
  },
  saveMealBtn: {
    marginTop: 4,
    borderRadius: 16,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  saveMealText: { fontSize: 15, fontWeight: '700', color: colors.white },
});
