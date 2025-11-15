// LYRĪON Oracle Glimpse - Local seeded readings with elegant guidance

// Data tables: curated, concise, poetic
const ELEMENT_BY_SIGN = {
  Aries: "Fire",
  Taurus: "Earth",
  Gemini: "Air",
  Cancer: "Water",
  Leo: "Fire",
  Virgo: "Earth",
  Libra: "Air",
  Scorpio: "Water",
  Sagittarius: "Fire",
  Capricorn: "Earth",
  Aquarius: "Air",
  Pisces: "Water"
};

const MODALITY_BY_SIGN = {
  Aries: "Cardinal",
  Cancer: "Cardinal",
  Libra: "Cardinal",
  Capricorn: "Cardinal",
  Taurus: "Fixed",
  Leo: "Fixed",
  Scorpio: "Fixed",
  Aquarius: "Fixed",
  Gemini: "Mutable",
  Virgo: "Mutable",
  Sagittarius: "Mutable",
  Pisces: "Mutable"
};

const PLANET_BY_SIGN = {
  Aries: "Mars",
  Taurus: "Venus",
  Gemini: "Mercury",
  Cancer: "Moon",
  Leo: "Sun",
  Virgo: "Mercury",
  Libra: "Venus",
  Scorpio: "Pluto",
  Sagittarius: "Jupiter",
  Capricorn: "Saturn",
  Aquarius: "Uranus",
  Pisces: "Neptune"
};

const TONES = [
  "The veil thins; a quiet answer arrives.",
  "Listen for the soft click of alignment.",
  "What you seek is seeking a doorway through you.",
  "A small yes opens a larger one.",
  "Patience carries the gold to the surface."
];

const GUIDANCE = [
  "Choose the simpler path that still feels generous.",
  "Answer one message you've delayed; it unlocks momentum.",
  "Name the fear, then take one elegant step anyway.",
  "Declutter one sacred corner; the room will exhale.",
  "Ask for help from someone who already loves you."
];

const INSIGHTS_FIRE = [
  "Act at dawn.",
  "Warmth persuades more than force.",
  "Courage wants a container."
];

const INSIGHTS_EARTH = [
  "Make it touchable.",
  "Refine the bones, then adorn.",
  "Consistency is the ritual."
];

const INSIGHTS_AIR = [
  "Say it beautifully once.",
  "Invite a second idea to braid with yours.",
  "Lightness is leverage."
];

const INSIGHTS_WATER = [
  "Let feeling finish the sentence.",
  "Choose the kinder timeline.",
  "Protect the tide that restores you."
];

const LUCKY_COLORS = [
  "Deep indigo",
  "Soft gold",
  "Ivory cream",
  "Forest green",
  "Wine velvet",
  "Midnight blue"
];

const LUCKY_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

const LUCKY_NUMBERS = [
  "3",
  "4",
  "7",
  "8",
  "11",
  "12",
  "21",
  "33"
];

const AFFIRMATIONS = [
  "I move like light through form.",
  "What is mine arrives on time.",
  "My work carries a quiet magnetism.",
  "I choose the elegant next step.",
  "Calm is my superpower."
];

/**
 * Generate a deterministic seed from a string
 * @param {string} str - Input string (question + sign + date)
 * @returns {number} - Deterministic integer seed
 */
function seedFrom(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Create a seeded random number generator
 * @param {number} seed - Initial seed value
 * @returns {function} - Function that returns pseudo-random numbers [0,1)
 */
function seededRand(seed) {
  let state = seed;
  return function() {
    // Linear Congruential Generator (LCG)
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/**
 * Pick a random element from an array using a seeded random function
 * @param {function} rand - Seeded random function
 * @param {Array} array - Array to pick from
 * @returns {*} - Random element from array
 */
function pick(rand, array) {
  const index = Math.floor(rand() * array.length);
  return array[index];
}

/**
 * Build a complete reading based on question, sign, and date
 * @param {Object} params - Parameters for the reading
 * @param {string} params.question - User's question
 * @param {string} params.sign - User's zodiac sign
 * @returns {Object} - Reading object with text and meta information
 */
function buildReading({ question, sign }) {
  const today = new Date();
  const dateKey = today.toISOString().slice(0, 10);
  const seed = seedFrom((question || "") + "|" + (sign || "") + "|" + dateKey);
  const rand = seededRand(seed);

  const element = ELEMENT_BY_SIGN[sign] || pick(rand, ["Fire", "Earth", "Air", "Water"]);
  const modality = MODALITY_BY_SIGN[sign] || pick(rand, ["Cardinal", "Fixed", "Mutable"]);
  const planet = PLANET_BY_SIGN[sign] || pick(rand, ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"]);

  const tone = pick(rand, TONES);
  const guidance = pick(rand, GUIDANCE);
  const insight =
    element === "Fire" ? pick(rand, INSIGHTS_FIRE) :
    element === "Earth" ? pick(rand, INSIGHTS_EARTH) :
    element === "Air" ? pick(rand, INSIGHTS_AIR) :
    pick(rand, INSIGHTS_WATER);

  const color = pick(rand, LUCKY_COLORS);
  const day = pick(rand, LUCKY_DAYS);
  const number = pick(rand, LUCKY_NUMBERS);
  const affirmation = pick(rand, AFFIRMATIONS);

  const lines = [
    tone,
    `${sign || "Your sign"} leans ${modality.toLowerCase()} ${element.toLowerCase()} guided by ${planet}.`,
    insight,
    guidance
  ];

  return {
    text: lines.join(" "),
    meta: { color, day, number, affirmation, element, modality, planet }
  };
}

/**
 * Initialize the Oracle Glimpse feature on the page
 */
export function initOracleGlimpse() {
  const btn = document.getElementById("glimpseBtn");
  const out = document.getElementById("glimpseOut");
  if (!btn || !out) return;

  btn.addEventListener("click", () => {
    const form = document.querySelector('form[name="oracle"]');
    const q = form?.querySelector('textarea[name="question"]')?.value?.trim() || "";
    const sign = form?.querySelector('select[name="sign"]')?.value || "";
    
    if (!q) {
      out.textContent = "Ask a clear question first.";
      return;
    }

    // 20s local cooldown
    const now = Date.now();
    const last = Number(localStorage.getItem("lyrion_glimpse_ts") || 0);
    if (now - last < 20000) {
      out.textContent = "Let the stars breathe… try again in a moment.";
      return;
    }
    localStorage.setItem("lyrion_glimpse_ts", String(now));

    out.innerHTML = "⟡ Reading the room of the sky…";

    // Slight delay for effect
    setTimeout(() => {
      const reading = buildReading({ question: q, sign });
      const { color, day, number, affirmation } = reading.meta;

      out.innerHTML = `
        <div class="glow-note">
          <p>${reading.text}</p>
          <p class="muted" style="margin-top:10px">
            Lucky color: ${color} · Day: ${day} · Number: ${number}<br/>
            <em>${affirmation}</em>
          </p>
        </div>
      `;
    }, 800);
  });
}
