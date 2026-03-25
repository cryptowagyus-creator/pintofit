import AsyncStorage from '@react-native-async-storage/async-storage';
import { FAMILY_USERS, getUserKey } from '../data/family';

const POINTS_KEY = 'pintofit_weekly_points';

function getWeekStart(date = new Date()) {
  const current = new Date(date);
  const start = new Date(current);
  start.setHours(22, 0, 0, 0);
  start.setDate(current.getDate() - current.getDay());

  if (current < start) {
    start.setDate(start.getDate() - 7);
  }

  return start;
}

export function getCurrentWeekKey(date = new Date()) {
  return getWeekStart(date).toISOString();
}

async function readPointsState() {
  const raw = await AsyncStorage.getItem(POINTS_KEY);
  if (!raw) {
    return { weekKey: getCurrentWeekKey(), scores: {} };
  }

  const parsed = JSON.parse(raw);
  const currentWeekKey = getCurrentWeekKey();

  if (parsed.weekKey !== currentWeekKey) {
    return { weekKey: currentWeekKey, scores: {} };
  }

  return parsed;
}

export async function getWeeklyPoints() {
  return readPointsState();
}

export async function awardWeeklyPoints(userName, amount) {
  const state = await readPointsState();
  const userKey = getUserKey(userName);
  const nextState = {
    weekKey: state.weekKey,
    scores: {
      ...state.scores,
      [userKey]: (state.scores[userKey] || 0) + amount,
    },
  };

  await AsyncStorage.setItem(POINTS_KEY, JSON.stringify(nextState));
  return nextState;
}

export function getUserWeeklyPoints(scores, userName) {
  return scores[getUserKey(userName)] || 0;
}

export function buildLeaderboardRows(scores) {
  return FAMILY_USERS.map((name) => ({
    name,
    userKey: getUserKey(name),
    points: getUserWeeklyPoints(scores, name),
  })).sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
}
