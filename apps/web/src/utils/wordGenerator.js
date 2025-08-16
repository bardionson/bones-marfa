// Two-word ID generator for art pieces
// Inspired by Georgia O'Keeffe, Jean Baudrillard, and 2001: A Space Odyssey

const ADJECTIVES = [
  // Art & Aesthetic
  "abstract",
  "ancient",
  "angular",
  "azure",
  "baroque",
  "blazing",
  "bold",
  "brilliant",
  "carved",
  "celestial",
  "chromatic",
  "classical",
  "cosmic",
  "crystalline",
  "curved",
  // Desert & Landscape
  "barren",
  "bleached",
  "desert",
  "dry",
  "dusty",
  "endless",
  "eroded",
  "faded",
  "golden",
  "harsh",
  "heated",
  "infinite",
  "jagged",
  "luminous",
  "parched",
  "raw",
  "rugged",
  "sandy",
  "scorched",
  "stark",
  "sun-baked",
  "weathered",
  "wind-carved",
  // Simulation & Technology
  "artificial",
  "binary",
  "coded",
  "digital",
  "electric",
  "electronic",
  "false",
  "fractal",
  "generated",
  "holographic",
  "hyperreal",
  "matrix",
  "networked",
  "pixelated",
  "programmed",
  "rendered",
  "simulated",
  "synthetic",
  "temporal",
  "virtual",
  // Organic & Anatomical
  "anatomical",
  "biological",
  "calcium",
  "cartilage",
  "cellular",
  "fibrous",
  "hollow",
  "jointed",
  "marrow",
  "mineral",
  "organic",
  "ossified",
  "skeletal",
  "spinal",
  "vital",
  // Mystical & Cinematic
  "cinematic",
  "cosmic",
  "dreamy",
  "ethereal",
  "floating",
  "ghostly",
  "glowing",
  "haunted",
  "hidden",
  "hypnotic",
  "invisible",
  "levitating",
  "luminescent",
  "magical",
  "mysterious",
  "mystical",
  "phantom",
  "radiant",
  "sacred",
  "secret",
  "shadowy",
  "shimmering",
  "silent",
  "spectral",
  "surreal",
  "transcendent",
  "translucent",
  "twisted",
];

const NOUNS = [
  // Core Project Words
  "marfa",
  "texas",
  "bones",
  "simulation",
  "okeeffe",
  "deer",
  "leg",
  "hip",
  "skull",
  "sky",
  "cloud",
  "blue",
  "intelligence",
  "springbok",
  "trees",
  "matrix",
  "beaver",
  "pig",
  "cow",
  "bull",
  "steer",

  // Bone Names & Anatomy
  "atlas",
  "axis",
  "cervix",
  "clavicle",
  "coccyx",
  "femur",
  "fibula",
  "humerus",
  "mandible",
  "maxilla",
  "metacarpal",
  "metatarsal",
  "patella",
  "pelvis",
  "phalanx",
  "radius",
  "rib",
  "sacrum",
  "scapula",
  "sternum",
  "talus",
  "tibia",
  "ulna",
  "vertebra",

  // Animals (O'Keeffe & Southwest)
  "antelope",
  "armadillo",
  "bobcat",
  "buffalo",
  "coyote",
  "elk",
  "hawk",
  "horse",
  "jackrabbit",
  "javelina",
  "lizard",
  "longhorn",
  "mustang",
  "owl",
  "prairie-dog",
  "pronghorn",
  "quail",
  "rabbit",
  "ram",
  "rattlesnake",
  "roadrunner",
  "sheep",
  "turtle",

  // Landscape & Geography
  "adobe",
  "arroyo",
  "badlands",
  "bluff",
  "butte",
  "canyon",
  "cave",
  "cliff",
  "creek",
  "dune",
  "gorge",
  "gulch",
  "mesa",
  "mound",
  "peak",
  "plain",
  "plateau",
  "prairie",
  "ravine",
  "ridge",
  "river",
  "rock",
  "sand",
  "stone",
  "valley",
  "wash",

  // Technology & Simulation
  "algorithm",
  "avatar",
  "binary",
  "circuit",
  "code",
  "cursor",
  "data",
  "file",
  "firewall",
  "firmware",
  "gateway",
  "grid",
  "interface",
  "kernel",
  "network",
  "node",
  "pixel",
  "portal",
  "program",
  "protocol",
  "server",
  "signal",
  "system",

  // Art & Cinema
  "brush",
  "canvas",
  "cinema",
  "color",
  "composition",
  "dawn",
  "dusk",
  "easel",
  "film",
  "frame",
  "gallery",
  "image",
  "lens",
  "light",
  "medium",
  "monolith",
  "museum",
  "narrative",
  "painting",
  "palette",
  "perspective",
  "pigment",
  "prism",
  "projection",
  "scene",
  "screen",
  "sculpture",
  "studio",
  "texture",
  "vision",

  // Abstract Concepts
  "abyss",
  "artifact",
  "chamber",
  "chimera",
  "echo",
  "essence",
  "fragment",
  "ghost",
  "glimpse",
  "horizon",
  "icon",
  "illusion",
  "infinity",
  "legend",
  "memory",
  "metaphor",
  "mirage",
  "moment",
  "monument",
  "myth",
  "origin",
  "phantom",
  "reality",
  "relic",
  "replica",
  "ritual",
  "shadow",
  "spirit",
  "symbol",
  "threshold",
  "truth",
  "void",
  "baudrillard",
];

// Generate a random two-word identifier
export function generateTwoWordId() {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adjective}-${noun}`;
}

// Generate multiple unique IDs
export function generateUniqueIds(count, existingIds = new Set()) {
  const totalPossible = ADJECTIVES.length * NOUNS.length;

  if (count > totalPossible - existingIds.size) {
    throw new Error(
      `Cannot generate ${count} unique IDs. Maximum possible: ${totalPossible}`
    );
  }

  const newIds = new Set();

  while (newIds.size < count) {
    const id = generateTwoWordId();
    if (!existingIds.has(id) && !newIds.has(id)) {
      newIds.add(id);
    }
  }

  return Array.from(newIds);
}

// Validate a two-word ID format
export function isValidTwoWordId(id) {
  if (!id || typeof id !== "string") return false;

  const parts = id.split("-");
  if (parts.length !== 2) return false;

  const [adjective, noun] = parts;
  return ADJECTIVES.includes(adjective) && NOUNS.includes(noun);
}

// Get total possible combinations
export function getTotalCombinations() {
  return ADJECTIVES.length * NOUNS.length;
}

// Export word lists for reference
export { ADJECTIVES, NOUNS };