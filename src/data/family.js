export const FAMILY_USERS = [
  'Juan',
  'Raul',
  'Samuel',
  'Rosalina',
  'Claudia',
  'Luis',
  'Lisette',
  'Mafe',
  'Alejo',
  'Jeremy',
  'Eliana',
  'Orlando',
  'Arias',
  'Luke',
  'Opium',
];

// If a user is listed here, they only see the specified users on the leaderboard.
// Users not listed here see everyone.
export const LEADERBOARD_VISIBILITY = {
  luke: ['Luke', 'Juan'],
  opium: ['Juan'],
};

export function getUserKey(name) {
  return (name || 'guest').trim().toLowerCase().replace(/\s+/g, '_');
}

export function resolveFamilyUser(name) {
  const normalized = name.trim().toLowerCase();
  return FAMILY_USERS.find((user) => user.toLowerCase() === normalized) || null;
}

export const FAMILY_AVATARS = {
  alejo: require('../../assets/avatars/alejo.png'),
  claudia: require('../../assets/avatars/claudia.png'),
  eliana: require('../../assets/avatars/eliana.png'),
  jeremy: require('../../assets/avatars/jeremy.png'),
  lisette: require('../../assets/avatars/lisette.png'),
  luis: require('../../assets/avatars/luis.png'),
  mafe: require('../../assets/avatars/mafe.png'),
  orlando: require('../../assets/avatars/orlando.png'),
  raul: require('../../assets/avatars/raul.png'),
  rosalina: require('../../assets/avatars/rosalina.png'),
  samuel: require('../../assets/avatars/sam.png'),
  arias: require('../../assets/avatars/arias.png'),
};
