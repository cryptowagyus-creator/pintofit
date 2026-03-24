// ─────────────────────────────────────────────────────────────────────────────
// PintoFit — Pintico's Workout Program
// Split: Chest & Triceps / Back & Biceps / Legs & Shoulders
// ─────────────────────────────────────────────────────────────────────────────

const chest = {
  id: 'chest',
  name: 'Chest',
  emoji: '💪',
  color: '#e63946',
  exercises: [
    {
      id: 'incline_db_bench',
      name: 'Incline Dumbbell Bench',
      sets: '4 sets × 8–12 reps',
      video: require('../../assets/videos/incline_db_bench.mp4'),
      tip: 'Keep elbows at ~45°',
      explanation:
        'Lie back on a bench set to 30–45°. Hold a dumbbell in each hand at chest height with palms facing forward. Press the dumbbells up and slightly together until arms are fully extended, then lower with control. The incline angle shifts emphasis to the upper chest (clavicular head of the pectoralis major), helping build that full, rounded upper chest look. Keep your shoulder blades pinched together throughout the movement to protect your shoulder joints.',
    },
    {
      id: 'machine_press',
      name: 'Regular Machine Press',
      sets: '3 sets × 10–15 reps',
      video: require('../../assets/videos/machine_press.mp4'),
      tip: 'Pause 1 sec at full extension',
      explanation:
        'Sit at the chest press machine, adjust the seat so the handles align with your lower chest. Grip the handles, press forward until arms are extended, then slowly return. Machine presses allow you to overload the chest safely without a spotter, making them excellent for high-rep burnout work after free weights. The fixed path of motion lets you focus purely on squeezing the pecs at the peak of each rep.',
    },
    {
      id: 'pec_fly',
      name: 'Pec Fly',
      sets: '3 sets × 12–15 reps',
      video: require('../../assets/videos/pec_fly.mp4'),
      tip: 'Slight elbow bend, squeeze at center',
      explanation:
        'Set up at a pec deck machine or cable crossover station. Start with arms wide (like hugging a big barrel) and bring both hands together in front of your chest in a wide arc. This is an isolation movement — it targets the inner chest (sternal head) and the stretch at the open position engages the full pec. Keep a slight, fixed bend in your elbows and avoid letting your shoulders roll forward. The slow negative (opening phase) is where a lot of the growth stimulus happens.',
    },
  ],
};

const triceps = {
  id: 'triceps',
  name: 'Triceps',
  emoji: '🔥',
  color: '#ff9800',
  exercises: [
    {
      id: 'single_arm_pulldown',
      name: 'Single Arm Cable Extension',
      sets: '4 sets × 12–15 reps each arm',
      video: require('../../assets/videos/single_arm_pulldown.mp4'),
      tip: 'Lock upper arm to side, only elbow moves',
      explanation:
        'Attach a D-handle to the high pulley. Stand facing the machine, hold the handle with one hand, upper arm pressed against your side. Push the handle straight down until your arm is fully extended, then slowly let it rise back. Single-arm pushdowns isolate the triceps (particularly the lateral and medial heads) and make it easier to notice and fix any strength imbalance between arms. The key is keeping the elbow completely still — it acts as a hinge, nothing else moves.',
    },
    {
      id: 'skull_crushers',
      name: 'Skull Crushers (Dumbbells)',
      sets: '3 sets × 10–12 reps',
      video: require('../../assets/videos/skull_crushers.mp4'),
      tip: 'Lower to temples, elbows point at ceiling',
      explanation:
        'Lie flat on a bench holding two dumbbells directly above your chest with palms facing each other. Keeping your upper arms vertical and still, bend at the elbows to lower the dumbbells toward your temples (or just beside your head). Extend back up. Skull crushers are one of the best exercises for the long head of the triceps — the largest of the three tricep heads — because the overhead position stretches it fully. Go slow on the way down; this is a joint-intensive move, so do not rush weight.',
    },
  ],
};

const back = {
  id: 'back',
  name: 'Back',
  emoji: '🏋️',
  color: '#2196f3',
  exercises: [
    {
      id: 'pull_ups',
      name: 'Pull Ups',
      sets: '4 sets × max reps',
      video: require('../../assets/videos/pull_ups.mp4'),
      tip: 'Full dead hang, chin clears bar',
      explanation:
        'Grab the bar with an overhand grip slightly wider than shoulder-width. Start from a dead hang (arms fully extended), then pull your chest toward the bar by driving your elbows down toward your hips. Pull ups are king for back width — they hammer the latissimus dorsi, teres major, and rear delts all at once. The bodyweight nature also trains core stability. If you can do 12+ reps, add weight with a belt. If you cannot complete full reps yet, use a resistance band for assistance.',
    },
    {
      id: 'wide_grip_row',
      name: 'Wide Grip Row',
      sets: '4 sets × 8–12 reps',
      video: require('../../assets/videos/wide_grip_row.mp4'),
      tip: 'Drive elbows out wide, not back',
      explanation:
        'Using a cable row station or machine with a wide grip attachment, sit tall with a slight forward lean. Pull the bar into your lower chest/upper abdomen while flaring your elbows out to the sides (not tucked). This wide-elbow path shifts the work from the mid-back (rhomboids, traps) to the outer lats, thickening the back from side to side. Keep your lower back neutral — do not rock or use momentum to move the weight.',
    },
    {
      id: 'single_arm_lat_pulldown',
      name: 'Single Arm Lat Pulldown (D-Handle)',
      sets: '3 sets × 10–12 reps each arm',
      video: require('../../assets/videos/single_arm_lat_pulldown.mp4'),
      tip: 'Rotate wrist to neutral at bottom',
      explanation:
        'Attach a D-handle to the top pulley of a cable machine. Kneel or sit sideways, reach up and grab the handle with one hand. Pull the handle down toward your hip while keeping your elbow close to your body and rotating your wrist from pronated to neutral at the bottom. Training one arm at a time eliminates the strong side compensating for the weak side, ensuring balanced lat development. You will feel a deep stretch in the lat at the top of each rep — do not rush through it.',
    },
    {
      id: 'db_rows',
      name: 'Dumbbell Rows',
      sets: '4 sets × 10–12 reps each side',
      video: require('../../assets/videos/db_rows.mp4'),
      tip: 'Elbow past the torso at the top',
      explanation:
        'Place one hand and knee on a flat bench. Hold a dumbbell in the other hand and let it hang straight down. Row it up toward your hip, leading with your elbow until it passes your torso. Dumbbell rows are one of the best unilateral back builders — they allow a greater range of motion than most machines and let you really feel the lat contract at the top. Keep your back flat, avoid twisting your torso, and focus on pulling with the back, not the bicep.',
    },
  ],
};

const biceps = {
  id: 'biceps',
  name: 'Biceps',
  emoji: '💥',
  color: '#4caf50',
  exercises: [
    {
      id: 'alt_db_curls',
      name: 'Alternating Dumbbell Curls',
      sets: '4 sets × 10–12 reps each arm',
      video: require('../../assets/videos/alt_db_curls.mp4'),
      tip: 'Supinate wrist at the top',
      explanation:
        'Stand holding a dumbbell in each hand with arms hanging at your sides, palms facing inward (neutral/hammer grip). Curl one dumbbell up while rotating your wrist so your palm faces your shoulder at the top (supination). Lower slowly, then repeat on the other side. Alternating curls allow you to fully concentrate on each arm and the supination adds extra activation of the biceps short head. Keep your upper arm pinned to your side — no swinging.',
    },
    {
      id: 'rope_curl',
      name: 'Rope Curl',
      sets: '3 sets × 12–15 reps',
      video: require('../../assets/videos/rope_curl.mp4'),
      tip: 'Spread the rope at the top, slow negative',
      explanation:
        'Attach a rope to the low pulley of a cable machine. Stand facing the machine, grip both ends of the rope with palms up. Curl the rope toward your shoulders, then at the peak spread the rope ends apart (pulling them outward) to intensify the bicep peak contraction. Cables maintain constant tension throughout the entire range of motion — unlike dumbbells where tension drops at the top — making rope curls excellent for time-under-tension and the pump.',
    },
    {
      id: 'behind_body_curls',
      name: 'Bayesian Curl (Behind-the-Body)',
      sets: '3 sets × 12 reps each arm',
      video: require('../../assets/videos/behind_body_curls.mp4'),
      tip: 'Keep elbow stationary, let shoulder stretch',
      explanation:
        'Set a cable pulley to the lowest setting on a cable machine. Stand with your side to the machine, reach back and slightly behind your body to grab the D-handle with one hand (arm slightly extended behind the torso). Curl the handle forward and up. This behind-the-body starting position puts the long head of the bicep in a fully stretched position at the bottom, creating a unique line of pull that most standard curls do not replicate. Great for building the bicep peak.',
    },
  ],
};

const legs = {
  id: 'legs',
  name: 'Legs',
  emoji: '🦵',
  color: '#00bcd4',
  exercises: [
    {
      id: 'leg_extension',
      name: 'Leg Extension',
      sets: '4 sets × 12–15 reps',
      video: require('../../assets/videos/leg_extension.mp4'),
      tip: 'Flex quads hard at the top, slow negative',
      explanation:
        'Sit in the leg extension machine with the pad resting on your shins just above the ankles. Extend your legs until straight, hold the peak contraction for 1 second flexing your quads hard, then lower slowly. Leg extensions isolate the quadriceps (front of the thigh) without any involvement from the glutes or hamstrings. They are great for warming up the knee joint before heavier compound movements, and for finishing off the quads with targeted volume.',
    },
    {
      id: 'leg_curls',
      name: 'Leg Curls',
      sets: '4 sets × 12–15 reps',
      video: require('../../assets/videos/leg_curls.mp4'),
      tip: 'Curl to at least 90°, slow eccentric',
      explanation:
        'Adjust the leg curl machine and lie face down (or sit, depending on the machine). With the pad behind your ankles, curl your heels toward your glutes as far as possible, then lower slowly. Leg curls are the primary isolation exercise for the hamstrings. The hamstrings span two joints (hip and knee) so they work most effectively when the hip is in a neutral or slightly extended position — which lying/seated machines provide. A slow 3-second negative (lowering phase) dramatically increases the muscle stimulus.',
    },
    {
      id: 'hip_abduction',
      name: 'Hip Abduction (Machine)',
      sets: '3 sets × 15–20 reps',
      video: require('../../assets/videos/hip_abduction.mp4'),
      tip: 'Full range, do not let pads snap together',
      explanation:
        'Sit in the hip abduction machine with the pads on the outsides of your knees. Push your legs apart against the resistance as wide as possible, hold briefly, then control the return. Hip abduction targets the gluteus medius and minimus — the muscles on the sides of your glutes that contribute to hip stability and that rounder glute appearance. This exercise is also critical for knee health: strong hip abductors prevent knees from caving inward during squats and other leg movements.',
    },
    {
      id: 'calf_raise_smith',
      name: 'Calf Raise (Smith Machine)',
      sets: '4 sets × 15–20 reps',
      video: require('../../assets/videos/calf_raise_smith.mp4'),
      tip: 'Full stretch at bottom, hard flex at top',
      explanation:
        'Position a step or weight plate under the Smith machine bar. Place the bar across your traps (upper back), stand with the balls of your feet on the edge of the step, heels hanging off. Lower your heels as far below the step as possible (full stretch), then rise as high on your toes as you can go. Calves are composed largely of slow-twitch muscle fibers, meaning they respond best to higher reps (15–25) and full range of motion. The Smith machine allows you to load the movement safely without needing a spotter, and the fixed bar path keeps balance out of the equation so you can focus purely on the calf contraction.',
    },
  ],
};

const shoulders = {
  id: 'shoulders',
  name: 'Shoulders',
  emoji: '🎯',
  color: '#9c27b0',
  exercises: [
    {
      id: 'db_shoulder_press',
      name: 'Seated Dumbbell Press',
      sets: '4 sets × 8–12 reps',
      video: require('../../assets/videos/db_shoulder_press.mp4'),
      tip: 'Press straight up, do not flare elbows too wide',
      explanation:
        'Sit on a bench with back support. Hold dumbbells at shoulder height with palms forward. Press both dumbbells straight up overhead until arms are fully extended, then lower back to the start. The overhead press is the primary mass builder for the deltoids, hitting all three heads with emphasis on the anterior (front) and medial (side) delts. Using dumbbells over a barbell allows a more natural wrist path and equal loading on both shoulders.',
    },
    {
      id: 'cable_lateral_raises',
      name: 'Lateral Raises (Cable)',
      sets: '4 sets × 12–15 reps each side',
      video: require('../../assets/videos/cable_lateral_raises.mp4'),
      tip: 'Lead with pinky, slight forward lean',
      explanation:
        'Set a cable pulley to the lowest position. Stand sideways to the machine and hold the handle with the hand farthest from it (crossing in front of your body). Raise your arm straight out to the side until it is parallel to the floor, then slowly lower. Cable lateral raises are superior to dumbbell laterals because the cable provides constant tension — especially at the bottom of the movement where dumbbells are almost entirely slack. This constant resistance sculpts the medial (side) delt that creates shoulder width.',
    },
    {
      id: 'face_pulls',
      name: 'Face Pulls (Rear Delts)',
      sets: '3 sets × 15–20 reps',
      video: require('../../assets/videos/face_pulls.mp4'),
      tip: 'Pull to your nose level, externally rotate at peak',
      explanation:
        'Attach a rope to a cable pulley set at face height. Grab both ends of the rope with an overhand grip and step back. Pull the rope toward your face, splitting the rope and driving your hands wide at the end so elbows flare out and back, externally rotating your shoulders at the peak. Face pulls directly target the posterior (rear) deltoid and external rotators (rotator cuff) — muscles that are often undertrained and critical for shoulder health. They also hit the middle trapezius and rhomboids, improving posture.',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Workout Split — 3 training days
// ─────────────────────────────────────────────────────────────────────────────
export const workoutProgram = {
  athlete: 'Pintico',
  days: [
    {
      id: 'chest_triceps',
      name: 'Chest & Triceps',
      label: 'DAY A',
      emoji: '💪🔥',
      colors: [chest.color, triceps.color],
      groups: [chest, triceps],
    },
    {
      id: 'back_biceps',
      name: 'Back & Biceps',
      label: 'DAY B',
      emoji: '🏋️💥',
      colors: [back.color, biceps.color],
      groups: [back, biceps],
    },
    {
      id: 'legs_shoulders',
      name: 'Legs & Shoulders',
      label: 'DAY C',
      emoji: '🦵🎯',
      colors: [legs.color, shoulders.color],
      groups: [legs, shoulders],
    },
  ],
};
