// Vedic interpretation engine: signs, nakshatras, dignities, houses, doshas, remedies.
// Consumes the sidereal chart produced by astro.js and produces a human-readable
// reading plus targeted remedies for the principal afflictions.

// ── Rashi (sign) data, ordered 0..11 from Mesha (Aries) ──
const SIGNS = [
  { name:'Mesha',     english:'Aries',       symbol:'♈', lord:'Mars',    element:'Fire',  quality:'Cardinal' },
  { name:'Vrishabha', english:'Taurus',      symbol:'♉', lord:'Venus',   element:'Earth', quality:'Fixed'    },
  { name:'Mithuna',   english:'Gemini',      symbol:'♊', lord:'Mercury', element:'Air',   quality:'Mutable'  },
  { name:'Karka',     english:'Cancer',      symbol:'♋', lord:'Moon',    element:'Water', quality:'Cardinal' },
  { name:'Simha',     english:'Leo',         symbol:'♌', lord:'Sun',     element:'Fire',  quality:'Fixed'    },
  { name:'Kanya',     english:'Virgo',       symbol:'♍', lord:'Mercury', element:'Earth', quality:'Mutable'  },
  { name:'Tula',      english:'Libra',       symbol:'♎', lord:'Venus',   element:'Air',   quality:'Cardinal' },
  { name:'Vrishchika',english:'Scorpio',     symbol:'♏', lord:'Mars',    element:'Water', quality:'Fixed'    },
  { name:'Dhanu',     english:'Sagittarius', symbol:'♐', lord:'Jupiter', element:'Fire',  quality:'Mutable'  },
  { name:'Makara',    english:'Capricorn',   symbol:'♑', lord:'Saturn',  element:'Earth', quality:'Cardinal' },
  { name:'Kumbha',    english:'Aquarius',    symbol:'♒', lord:'Saturn',  element:'Air',   quality:'Fixed'    },
  { name:'Meena',     english:'Pisces',      symbol:'♓', lord:'Jupiter', element:'Water', quality:'Mutable'  }
];

// ── Nakshatras: name, ruling planet, deity, gana, span 13°20' each ──
const NAKSHATRAS = [
  { n:'Ashwini',           lord:'Ketu',    deity:'Ashwini Kumaras', gana:'Deva' },
  { n:'Bharani',           lord:'Venus',   deity:'Yama',            gana:'Manushya' },
  { n:'Krittika',          lord:'Sun',     deity:'Agni',            gana:'Rakshasa' },
  { n:'Rohini',            lord:'Moon',    deity:'Brahma',          gana:'Manushya' },
  { n:'Mrigashira',        lord:'Mars',    deity:'Soma',            gana:'Deva' },
  { n:'Ardra',             lord:'Rahu',    deity:'Rudra',           gana:'Manushya' },
  { n:'Punarvasu',         lord:'Jupiter', deity:'Aditi',           gana:'Deva' },
  { n:'Pushya',            lord:'Saturn',  deity:'Brihaspati',      gana:'Deva' },
  { n:'Ashlesha',          lord:'Mercury', deity:'Nagas',           gana:'Rakshasa' },
  { n:'Magha',             lord:'Ketu',    deity:'Pitris',          gana:'Rakshasa' },
  { n:'Purva Phalguni',    lord:'Venus',   deity:'Bhaga',           gana:'Manushya' },
  { n:'Uttara Phalguni',   lord:'Sun',     deity:'Aryaman',         gana:'Manushya' },
  { n:'Hasta',             lord:'Moon',    deity:'Savitar',         gana:'Deva' },
  { n:'Chitra',            lord:'Mars',    deity:'Vishvakarma',     gana:'Rakshasa' },
  { n:'Swati',             lord:'Rahu',    deity:'Vayu',            gana:'Deva' },
  { n:'Vishakha',          lord:'Jupiter', deity:'Indra-Agni',      gana:'Rakshasa' },
  { n:'Anuradha',          lord:'Saturn',  deity:'Mitra',           gana:'Deva' },
  { n:'Jyeshtha',          lord:'Mercury', deity:'Indra',           gana:'Rakshasa' },
  { n:'Mula',              lord:'Ketu',    deity:'Nirriti',         gana:'Rakshasa' },
  { n:'Purva Ashadha',     lord:'Venus',   deity:'Apas',            gana:'Manushya' },
  { n:'Uttara Ashadha',    lord:'Sun',     deity:'Vishvedevas',     gana:'Manushya' },
  { n:'Shravana',          lord:'Moon',    deity:'Vishnu',          gana:'Deva' },
  { n:'Dhanishtha',        lord:'Mars',    deity:'Vasus',           gana:'Rakshasa' },
  { n:'Shatabhisha',       lord:'Rahu',    deity:'Varuna',          gana:'Rakshasa' },
  { n:'Purva Bhadrapada',  lord:'Jupiter', deity:'Aja Ekapada',     gana:'Manushya' },
  { n:'Uttara Bhadrapada', lord:'Saturn',  deity:'Ahir Budhnya',    gana:'Manushya' },
  { n:'Revati',            lord:'Mercury', deity:'Pushan',          gana:'Deva' }
];

// Exaltation / debilitation / own signs (sign index 0..11, degree of deepest dignity)
const DIGNITY = {
  Sun:     { exalt:[0,10],  debil:[6,10],  own:[4],          moolaTri:[4,0,20] },
  Moon:    { exalt:[1,3],   debil:[7,3],   own:[3],          moolaTri:[1,3,30] },
  Mars:    { exalt:[9,28],  debil:[3,28],  own:[0,7],        moolaTri:[0,0,12] },
  Mercury: { exalt:[5,15],  debil:[11,15], own:[2,5],        moolaTri:[5,15,20] },
  Jupiter: { exalt:[3,5],   debil:[9,5],   own:[8,11],       moolaTri:[8,0,10] },
  Venus:   { exalt:[11,27], debil:[5,27],  own:[1,6],        moolaTri:[6,0,15] },
  Saturn:  { exalt:[6,20],  debil:[0,20],  own:[9,10],       moolaTri:[10,0,20]},
  Rahu:    { exalt:[1,15],  debil:[7,15],  own:[],           moolaTri:null },
  Ketu:    { exalt:[7,15],  debil:[1,15],  own:[],           moolaTri:null }
};

// Friendship table — naisargika maitri (natural relationships)
const FRIENDS = {
  Sun:     { friend:['Moon','Mars','Jupiter'],     enemy:['Venus','Saturn'],         neutral:['Mercury'] },
  Moon:    { friend:['Sun','Mercury'],             enemy:[],                         neutral:['Mars','Jupiter','Venus','Saturn'] },
  Mars:    { friend:['Sun','Moon','Jupiter'],      enemy:['Mercury'],                neutral:['Venus','Saturn'] },
  Mercury: { friend:['Sun','Venus'],               enemy:['Moon'],                   neutral:['Mars','Jupiter','Saturn'] },
  Jupiter: { friend:['Sun','Moon','Mars'],         enemy:['Mercury','Venus'],        neutral:['Saturn'] },
  Venus:   { friend:['Mercury','Saturn'],          enemy:['Sun','Moon'],             neutral:['Mars','Jupiter'] },
  Saturn:  { friend:['Mercury','Venus'],           enemy:['Sun','Moon','Mars'],      neutral:['Jupiter'] },
  Rahu:    { friend:['Venus','Saturn'],            enemy:['Sun','Moon','Mars'],      neutral:['Mercury','Jupiter'] },
  Ketu:    { friend:['Mars','Venus','Saturn'],     enemy:['Moon','Sun'],             neutral:['Mercury','Jupiter'] }
};

const NAK_SPAN = 360 / 27;       // 13.333° per nakshatra
const PADA_SPAN = NAK_SPAN / 4;  // 3.333° per pada

// Convert a sidereal longitude to sign + nakshatra metadata.
function decodeLongitude(deg) {
  const lon = ((deg % 360) + 360) % 360;
  const signIdx = Math.floor(lon / 30);
  const degInSign = lon - signIdx * 30;
  const nakIdx = Math.floor(lon / NAK_SPAN);
  const pada = Math.floor((lon - nakIdx * NAK_SPAN) / PADA_SPAN) + 1;
  return { lon, signIdx, sign: SIGNS[signIdx], degInSign, nakIdx, nakshatra: NAKSHATRAS[nakIdx], pada };
}

// Whole-sign house number for a planet, given the Lagna sign.
function houseOf(planetSignIdx, lagnaSignIdx) {
  return ((planetSignIdx - lagnaSignIdx + 12) % 12) + 1;
}

// Dignity status of a planet given its sidereal position.
function planetDignity(planet, signIdx, degInSign) {
  const d = DIGNITY[planet];
  if (!d) return 'neutral';
  if (d.exalt && d.exalt[0] === signIdx) return 'exalted';
  if (d.debil && d.debil[0] === signIdx) return 'debilitated';
  if (d.moolaTri && d.moolaTri[0] === signIdx
      && degInSign >= d.moolaTri[1] && degInSign <= d.moolaTri[2]) return 'moolatrikona';
  if (d.own && d.own.includes(signIdx)) return 'own sign';
  // Friendship via sign lord
  const lord = SIGNS[signIdx].lord;
  if (lord === planet) return 'own sign';
  const f = FRIENDS[planet];
  if (f) {
    if (f.friend.includes(lord)) return 'friendly';
    if (f.enemy.includes(lord))  return 'inimical';
  }
  return 'neutral';
}

// Combustion: planet too close to the Sun loses strength.
const COMBUSTION_ORB = { Mercury:12, Venus:8, Mars:17, Jupiter:11, Saturn:15 };
function isCombust(planet, planetLon, sunLon) {
  const orb = COMBUSTION_ORB[planet];
  if (!orb) return false;
  let diff = Math.abs(planetLon - sunLon);
  if (diff > 180) diff = 360 - diff;
  return diff <= orb;
}

// Build the per-planet position table.
function buildPositions(sidereal, lagnaSignIdx, sunLon) {
  const order = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
  const out = [];
  for (const p of order) {
    const d = decodeLongitude(sidereal[p]);
    const dignity = planetDignity(p, d.signIdx, d.degInSign);
    const combust = isCombust(p, sidereal[p], sunLon);
    const house = houseOf(d.signIdx, lagnaSignIdx);
    out.push({ planet:p, ...d, dignity, combust, house });
  }
  return out;
}

// ── Doshas ──
function detectDoshas(positions, lagnaSignIdx, currentDate) {
  const byPlanet = {};
  positions.forEach(p => byPlanet[p.planet] = p);
  const doshas = [];

  // Mangal Dosha — Mars in 1, 2, 4, 7, 8, or 12 from Lagna or from Moon.
  const marsHouse = byPlanet.Mars.house;
  const moonSignIdx = byPlanet.Moon.signIdx;
  const marsHouseFromMoon = houseOf(byPlanet.Mars.signIdx, moonSignIdx);
  const mangalHouses = [1,2,4,7,8,12];
  const fromLagna = mangalHouses.includes(marsHouse);
  const fromMoon  = mangalHouses.includes(marsHouseFromMoon);
  if (fromLagna || fromMoon) {
    doshas.push({
      name:'Mangal Dosha (Kuja Dosha)',
      severity: fromLagna && fromMoon ? 'strong' : 'moderate',
      description:`Mars sits in the ${marsHouse}${ord(marsHouse)} house from Lagna and the ${marsHouseFromMoon}${ord(marsHouseFromMoon)} from the Moon. This placement traditionally signals friction in marriage and partnerships, sudden temper, and the need for conscious patience in close relationships.`,
      planet:'Mars'
    });
  }

  // Kaal Sarpa Dosha — all 7 planets (Sun..Saturn) hemmed between Rahu and Ketu.
  const rahuLon = byPlanet.Rahu.lon, ketuLon = byPlanet.Ketu.lon;
  const sevenLons = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'].map(p => byPlanet[p].lon);
  // Walk the ecliptic from Rahu forward to Ketu (180°) — count planets in that arc;
  // if all seven are on one side, it's Kaal Sarpa.
  let inFront = 0, inBack = 0;
  for (const lon of sevenLons) {
    const diff = ((lon - rahuLon) + 360) % 360;
    if (diff < 180) inFront++; else inBack++;
  }
  if (inFront === 7 || inBack === 7) {
    doshas.push({
      name:'Kaal Sarpa Dosha',
      severity:'strong',
      description:'All seven planets sit on one side of the Rahu-Ketu axis, forming Kaal Sarpa Yoga. Life can feel governed by larger karmic currents — periods of struggle followed by sudden, almost destined, breakthroughs. Spiritual practice transforms this energy into power.',
      planet:'Rahu'
    });
  }

  // Sade Sati — current transit Saturn in 12th, 1st, or 2nd from natal Moon.
  // Approximate transit Saturn longitude using current date.
  if (currentDate && window.Astro) {
    const now = currentDate;
    const utNow = now.getUTCHours() + now.getUTCMinutes()/60;
    const jdNow = window.Astro.julianDay(now.getUTCFullYear(), now.getUTCMonth()+1, now.getUTCDate(), utNow);
    const ayNow = window.Astro.lahiriAyanamsa(jdNow);
    const satNow = ((window.Astro.planetLongitude('Saturn', jdNow) - ayNow) + 360) % 360;
    const satSign = Math.floor(satNow / 30);
    const houseFromMoon = ((satSign - moonSignIdx + 12) % 12) + 1;
    if ([12,1,2].includes(houseFromMoon)) {
      const phase = houseFromMoon === 12 ? 'rising (Arohi)' : houseFromMoon === 1 ? 'peak (Madhya)' : 'setting (Avarohi)';
      doshas.push({
        name:`Sade Sati — ${phase} phase`,
        severity: houseFromMoon === 1 ? 'strong' : 'moderate',
        description:`Transit Saturn currently sits in the ${houseFromMoon}${ord(houseFromMoon)} house from your natal Moon. You are in the ${phase} phase of the seven-and-a-half-year Sade Sati cycle — a profound period of restructuring, hard-won maturity, and shedding what no longer serves your soul's path.`,
        planet:'Saturn'
      });
    }
  }

  // Debilitated planets
  positions.forEach(p => {
    if (p.dignity === 'debilitated') {
      doshas.push({
        name:`Debilitated ${p.planet} (Neecha)`,
        severity:'moderate',
        description:`${p.planet} occupies its sign of debilitation (${p.sign.name} / ${p.sign.english}). The natural significations of ${p.planet} can feel obstructed or muted unless deliberate strengthening is undertaken.`,
        planet:p.planet
      });
    }
  });

  // Combust planets (excluding Sun/Moon)
  positions.forEach(p => {
    if (p.combust) {
      doshas.push({
        name:`Combust ${p.planet} (Asta)`,
        severity:'mild',
        description:`${p.planet} is within the Sun's combustion orb and has its outer expression burnt by solar rays. Its inner gifts remain, but their visible expression in the world may need extra cultivation.`,
        planet:p.planet
      });
    }
  });

  // Rahu/Ketu in 1st or 7th — afflicting self or partnership axis
  if (byPlanet.Rahu.house === 1 || byPlanet.Rahu.house === 7) {
    doshas.push({
      name:`Rahu in the ${byPlanet.Rahu.house}${ord(byPlanet.Rahu.house)} house`,
      severity:'moderate',
      description:`Rahu on the ${byPlanet.Rahu.house === 1 ? 'self (Tanu)' : 'partnership (Yuvati)'} axis brings unconventional desires, restlessness, and a magnetism that draws unusual experiences and people.`,
      planet:'Rahu'
    });
  }

  return doshas;
}

function ord(n) {
  const s = ['th','st','nd','rd'], v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// ── Remedies database — mantras, gemstones, donations, fasts, deities ──
const REMEDIES = {
  Sun: {
    mantra:    'Om Hraam Hreem Hraum Sah Suryaya Namaha (108 times at sunrise)',
    gayatri:   'Om Bhur Bhuvah Svah, Tat Savitur Varenyam, Bhargo Devasya Dhimahi, Dhiyo Yo Nah Prachodayat',
    gem:       'Ruby (Manik) — set in gold, worn on the ring finger of the right hand on a Sunday morning',
    day:       'Sunday',
    fast:      'Sunday — eat once after sunset; avoid salt',
    charity:   'Donate wheat, jaggery, copper, or red cloth to a needy elder or a temple',
    deity:     'Lord Surya / Lord Vishnu — offer water (Arghya) at sunrise',
    practice:  'Surya Namaskara at sunrise; recite Aditya Hridaya Stotra'
  },
  Moon: {
    mantra:    'Om Shraam Shreem Shraum Sah Chandraya Namaha (108 times on Monday evening)',
    gem:       'Pearl (Moti) — set in silver, worn on the little finger on a Monday',
    day:       'Monday',
    fast:      'Monday — single meal of white foods (rice, milk, curd)',
    charity:   'Donate rice, milk, white sugar, white cloth, or silver',
    deity:     'Lord Shiva — offer milk and white flowers on Mondays',
    practice:  'Chant Mahamrityunjaya Mantra; meditate on the full moon'
  },
  Mars: {
    mantra:    'Om Kraam Kreem Kraum Sah Bhaumaya Namaha (108 times on Tuesday)',
    gem:       'Red Coral (Moonga) — set in gold or copper, worn on the ring finger on a Tuesday',
    day:       'Tuesday',
    fast:      'Tuesday — single meal; avoid red foods if Mars is afflicting',
    charity:   'Donate red lentils (masoor dal), jaggery, copper, or red cloth',
    deity:     'Lord Hanuman — recite Hanuman Chalisa on Tuesdays and Saturdays',
    practice:  'Visit Hanuman temple on Tuesdays; offer red flowers and sindoor'
  },
  Mercury: {
    mantra:    'Om Braam Breem Braum Sah Budhaya Namaha (108 times on Wednesday)',
    gem:       'Emerald (Panna) — set in gold, worn on the little finger on a Wednesday',
    day:       'Wednesday',
    fast:      'Wednesday — single meal of green foods',
    charity:   'Donate green moong dal, green cloth, books, or stationery to students',
    deity:     'Lord Vishnu / Lord Ganesha — recite Vishnu Sahasranama',
    practice:  'Feed green grass to a cow on Wednesdays; help students with their education'
  },
  Jupiter: {
    mantra:    'Om Graam Greem Graum Sah Gurave Namaha (108 times on Thursday)',
    gem:       'Yellow Sapphire (Pukhraj) — set in gold, worn on the index finger on a Thursday',
    day:       'Thursday',
    fast:      'Thursday — single meal; avoid salt; eat yellow foods (chana dal, turmeric)',
    charity:   'Donate yellow items — turmeric, gram dal, gold, books — to a Brahmin or temple',
    deity:     'Lord Brihaspati / Lord Vishnu — recite Vishnu Sahasranama',
    practice:  'Wear yellow on Thursdays; respect teachers and elders deeply'
  },
  Venus: {
    mantra:    'Om Draam Dreem Draum Sah Shukraya Namaha (108 times on Friday)',
    gem:       'Diamond or White Sapphire — set in white gold or platinum, worn on the middle finger on Friday',
    day:       'Friday',
    fast:      'Friday — single meal of sweet white foods',
    charity:   'Donate white items — silver, white cloth, sugar, perfume, dairy — especially to women',
    deity:     'Goddess Lakshmi / Goddess Saraswati — light a ghee lamp on Fridays',
    practice:  'Cultivate beauty around you; respect women; avoid harshness in speech'
  },
  Saturn: {
    mantra:    'Om Praam Preem Praum Sah Shanaischaraya Namaha (108 times on Saturday evening)',
    gem:       'Blue Sapphire (Neelam) — must be tested first; set in iron or panchdhatu on Saturday',
    day:       'Saturday',
    fast:      'Saturday — single meal of dark foods (urad dal, sesame); avoid oil',
    charity:   'Donate black sesame, mustard oil, iron, black cloth, or shoes to the elderly and poor',
    deity:     'Lord Shani / Lord Hanuman — light a mustard-oil lamp under a peepal tree on Saturday',
    practice:  'Serve the elderly, disabled, or labourers; avoid alcohol and meat on Saturdays'
  },
  Rahu: {
    mantra:    'Om Bhraam Bhreem Bhraum Sah Rahave Namaha (108 times on Saturday)',
    gem:       'Hessonite Garnet (Gomed) — set in silver, worn on the middle finger on Saturday',
    day:       'Saturday',
    fast:      'Saturdays; eat dark foods; avoid the new-moon day',
    charity:   'Donate black blankets, mustard oil, lead, or coconut to lepers or the destitute',
    deity:     'Goddess Durga / Lord Bhairava — recite Durga Saptashati',
    practice:  'Avoid shortcuts and deception; serve outcasts; flow water on Shiva linga on Mondays'
  },
  Ketu: {
    mantra:    'Om Sraam Sreem Sraum Sah Ketave Namaha (108 times on Tuesday)',
    gem:       "Cat's Eye (Lehsunia) — set in silver, worn on the middle finger on Thursday",
    day:       'Tuesday',
    fast:      'Tuesdays; eat simply; practice silence for an hour daily',
    charity:   'Donate sesame seeds, brown blankets, or feed dogs (especially black dogs)',
    deity:     'Lord Ganesha / Lord Bhairava — chant Ganesha mantra to remove obstacles',
    practice:  'Cultivate detachment; spend time in solitude or pilgrimage'
  }
};

// Generic remedies for compound doshas
const COMPOUND_REMEDIES = {
  'Mangal Dosha (Kuja Dosha)': [
    'Recite Hanuman Chalisa daily, especially on Tuesdays and Saturdays.',
    'Visit a Hanuman temple on 11 consecutive Tuesdays; offer sindoor and red flowers.',
    'Perform Kumbh Vivah or Mangal Shanti pooja before marriage if dosha is strong.',
    'Donate red lentils (masoor dal) and jaggery to a temple every Tuesday.',
    'Wear red coral (Moonga) only after consulting a qualified Jyotishi.'
  ],
  'Kaal Sarpa Dosha': [
    'Perform Kaal Sarpa Shanti pooja at Trimbakeshwar (Nashik) or Kalahasti (Andhra Pradesh).',
    'Worship Lord Shiva daily; offer water and bilva leaves on the linga.',
    'Recite Maha Mrityunjaya Mantra 108 times daily.',
    'Feed snakes (offer milk symbolically at temples) on Nag Panchami.',
    'Donate silver snake images to a Shiva temple.'
  ],
  'Sade Sati': [
    'Recite Hanuman Chalisa daily — Hanuman is the great pacifier of Saturn.',
    'Light a mustard-oil lamp under a peepal tree on Saturday evenings.',
    'Donate black sesame, mustard oil, iron, or black cloth to the poor every Saturday.',
    'Serve the elderly, disabled, and underprivileged — Saturn rewards true service.',
    'Avoid alcohol, non-vegetarian food, and harsh speech on Saturdays.',
    'Visit a Shani temple on Saturdays; offer black sesame and oil.'
  ]
};

// Build a personalised remedies block from detected doshas + debilitated planets.
function buildRemedies(doshas, positions) {
  const remedyBlocks = [];
  const seenPlanets = new Set();

  for (const d of doshas) {
    const block = { title:d.name, severity:d.severity, items:[] };

    // Compound dosha-level guidance first
    const compoundKey = d.name.startsWith('Sade Sati') ? 'Sade Sati'
                      : d.name.startsWith('Mangal') ? 'Mangal Dosha (Kuja Dosha)'
                      : d.name.startsWith('Kaal Sarpa') ? 'Kaal Sarpa Dosha'
                      : null;
    if (compoundKey && COMPOUND_REMEDIES[compoundKey]) {
      block.items.push(...COMPOUND_REMEDIES[compoundKey]);
    }

    // Planet-specific remedy
    const r = REMEDIES[d.planet];
    if (r) {
      block.items.push(`<strong>Mantra:</strong> ${r.mantra}`);
      block.items.push(`<strong>Gemstone:</strong> ${r.gem}`);
      block.items.push(`<strong>Auspicious day:</strong> ${r.day} — ${r.fast}`);
      block.items.push(`<strong>Charity (Daan):</strong> ${r.charity}`);
      block.items.push(`<strong>Deity worship:</strong> ${r.deity}`);
      block.items.push(`<strong>Practice:</strong> ${r.practice}`);
      seenPlanets.add(d.planet);
    }
    remedyBlocks.push(block);
  }

  return remedyBlocks;
}

// ── Per-house life-area headlines based on Lagna ──
const HOUSE_THEMES = [
  '', // 1-indexed
  'Self, body, vitality, the personality the world meets',
  'Wealth, family, speech, the food you eat',
  'Courage, siblings, communication, short journeys',
  'Mother, home, inner peace, real estate',
  'Children, intelligence, romance, creative expression',
  'Enemies, debts, illness, daily service',
  'Marriage, partnerships, business alliances',
  'Longevity, transformation, hidden matters, inheritance',
  'Father, dharma, fortune, higher learning, long journeys',
  'Career, status, public reputation',
  'Gains, friends, elder siblings, fulfilled desires',
  'Losses, expenses, foreign lands, liberation, sleep'
];

// Build the prediction text per life area, weighting by which planets sit in each house.
function buildHousePredictions(positions, lagnaSignIdx, concern) {
  const planetsByHouse = {};
  for (const p of positions) {
    if (!planetsByHouse[p.house]) planetsByHouse[p.house] = [];
    planetsByHouse[p.house].push(p);
  }

  const concernHouses = {
    career:   [10, 2, 11, 6],
    love:     [7, 5, 4, 11],
    health:   [1, 6, 8, 12],
    spiritual:[9, 12, 5, 1],
    general:  [1, 10, 7, 4]
  };
  const houses = concernHouses[concern] || concernHouses.general;

  return houses.map(h => {
    const occupants = planetsByHouse[h] || [];
    const lordSignIdx = (lagnaSignIdx + h - 1) % 12;
    const lord = SIGNS[lordSignIdx].lord;
    const occText = occupants.length
      ? occupants.map(p => `${p.planet} (${p.sign.english}, ${p.dignity})`).join(', ')
      : 'no planet present — read through the house lord';
    return {
      house:h,
      theme:HOUSE_THEMES[h],
      lord,
      occupants:occText,
      reading:houseReading(h, occupants, lord)
    };
  });
}

function houseReading(h, occupants, lord) {
  const themes = HOUSE_THEMES[h];
  if (!occupants.length) {
    return `The ${h}${ord(h)} house (${themes.toLowerCase()}) is unoccupied. Outcomes here flow through its lord ${lord} — examine where ${lord} sits in your chart, as that house and its condition deeply colour these matters.`;
  }
  const benefics = ['Jupiter','Venus','Moon','Mercury'];
  const malefics = ['Saturn','Mars','Sun','Rahu','Ketu'];
  const ben = occupants.filter(p => benefics.includes(p.planet));
  const mal = occupants.filter(p => malefics.includes(p.planet));
  let tone = '';
  if (ben.length && !mal.length) tone = 'auspicious and well-supported';
  else if (mal.length && !ben.length) tone = 'demanding effort and conscious work';
  else if (ben.length && mal.length) tone = 'mixed — moments of grace alongside testing periods';
  else tone = 'balanced';

  const dignities = occupants.map(p => `${p.planet} is ${p.dignity}${p.combust ? ' and combust' : ''}`).join('; ');
  const exalted = occupants.filter(p => p.dignity === 'exalted');
  const debil   = occupants.filter(p => p.dignity === 'debilitated');

  let extra = '';
  if (exalted.length) extra += ` ${exalted.map(p=>p.planet).join(', ')} sits exalted here — a powerful blessing for this area.`;
  if (debil.length)   extra += ` ${debil.map(p=>p.planet).join(', ')} is debilitated — strengthen this graha through its remedy to lift this domain.`;

  return `The ${h}${ord(h)} house (${themes.toLowerCase()}) is ruled by ${lord} and occupied by ${occupants.map(p=>p.planet).join(', ')}. ${capitalize(dignities)}. The overall reading here is ${tone}.${extra}`;
}

function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

// Expose
if (typeof window !== 'undefined') {
  window.Interpret = {
    SIGNS, NAKSHATRAS, REMEDIES,
    decodeLongitude, houseOf, planetDignity, isCombust,
    buildPositions, detectDoshas, buildRemedies, buildHousePredictions,
    ord
  };
}
