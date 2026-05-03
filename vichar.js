// vichar.js — Deep traditional analysis of Shani Sade Sati, Kaal Sarp Dosha, and Mangal Dosha.
// Depends on: julianDay, lahiriAyanamsa, planetLongitude (astro.js) and SIGNS (interpret.js).

// ══════════════════════════════════════════════════════════
// § 1  SHANI SADE SATI VICHAR
// ══════════════════════════════════════════════════════════

// Saturn's sidereal sign at a given year + month (15th of month, noon UT).
function saturnSignAt(year, month) {
  const jd = julianDay(year, month, 15, 12);
  const ay = lahiriAyanamsa(jd);
  const lon = ((planetLongitude('Saturn', jd) - ay) + 360) % 360;
  return Math.floor(lon / 30);
}

// Find all Sade Sati windows (±35 years from birth) as { start, end, phases[] }.
function findSadeSatiPeriods(moonSignIdx, birthYear) {
  const sign12 = (moonSignIdx + 11) % 12;
  const sign1  = moonSignIdx;
  const sign2  = (moonSignIdx + 1) % 12;
  const ssSet  = new Set([sign12, sign1, sign2]);

  const periods = [];
  let inSS = false, ssStart = null;
  const fromY = Math.max(1900, birthYear - 30);
  const toY   = birthYear + 60;

  for (let y = fromY; y <= toY; y++) {
    for (let m = 1; m <= 12; m++) {
      const sg = saturnSignAt(y, m);
      const in_ = ssSet.has(sg);
      if (in_ && !inSS) { inSS = true; ssStart = new Date(y, m - 1, 1); }
      else if (!in_ && inSS) { inSS = false; periods.push({ start: ssStart, end: new Date(y, m - 1, 1) }); }
    }
  }
  if (inSS) periods.push({ start: ssStart, end: new Date(toY, 11, 31) });
  return periods;
}

// Current Sade Sati phase (null if not in SS).
function currentSSPhase(moonSignIdx) {
  const today = new Date();
  const jd = julianDay(today.getFullYear(), today.getMonth() + 1, today.getDate(), 12);
  const ay = lahiriAyanamsa(jd);
  const satSign = Math.floor(((planetLongitude('Saturn', jd) - ay + 360) % 360) / 30);
  if (satSign === (moonSignIdx + 11) % 12) return 'rising';
  if (satSign === moonSignIdx)             return 'peak';
  if (satSign === (moonSignIdx + 1) % 12) return 'setting';
  return null;
}

// Next Sade Sati entry (rough — when Saturn will next enter sign12 from Moon).
function nextSSEntry(moonSignIdx, birthYear) {
  const sign12 = (moonSignIdx + 11) % 12;
  const today = new Date();
  const fromY = today.getFullYear();
  for (let y = fromY; y <= fromY + 30; y++) {
    for (let m = 1; m <= 12; m++) {
      if (saturnSignAt(y, m) === sign12) return new Date(y, m - 1, 1);
    }
  }
  return null;
}

// Moon-sign specific Sade Sati effects and Saturn's relationship.
const SS_MOON_EFFECTS = {
  0:  { rel: 'Neutral (Mars rules, Saturn neutral to Mars)',    severity: 'Moderate',
        effect: 'Physical energy and career both face unexpected headwinds. Property matters may need attention. Patience in conflict is the key lesson. Guard against impulsive decisions and accidents.',
        positive: 'Courage and resilience built during this period become permanent strengths.' },
  1:  { rel: 'Friendly (Venus rules, Saturn friend of Venus)', severity: 'Mild–Moderate',
        effect: 'Financial discipline is required — overspending or poor investments may be tempting. Relationships ask for more give than take. Work is demanding but rewarding in the longer arc.',
        positive: 'Material foundations are restructured into something more durable and lasting.' },
  2:  { rel: 'Friendly (Mercury rules, Saturn friend)',        severity: 'Mild',
        effect: 'The mind is busy and sometimes scattered. Siblings or neighbours may bring complications. Communication matters need careful handling. Professional efforts bring slow but genuine results.',
        positive: 'Intellect sharpens under pressure; skills developed now have lasting professional value.' },
  3:  { rel: 'Challenging (Moon rules — Saturn is Moon\'s enemy)', severity: 'Challenging',
        effect: 'The most emotionally testing Sade Sati. Domestic upheaval, mother\'s health, and deep emotional insecurity can surface. The mind fluctuates and sleep may be disturbed. Financial losses are possible. Old wounds resurface for healing.',
        positive: 'Profound emotional maturity and spiritual depth emerge from this period of inner purification.' },
  4:  { rel: 'Challenging (Sun rules — Saturn is Sun\'s enemy)', severity: 'Challenging',
        effect: 'Career, authority, and the father relationship all come under strain. Recognition may be delayed or denied despite genuine effort. Health of the father or senior figures may decline. Pride and ego are tested repeatedly.',
        positive: 'True leadership capacity — earned through adversity, not given — is forged in this period.' },
  5:  { rel: 'Friendly (Mercury rules)',                       severity: 'Mild–Moderate',
        effect: 'Digestive health and daily routines require attention. Work becomes more demanding and service-oriented. Disputes with employees or service staff may arise. Financial caution is advised.',
        positive: 'Skills of analysis, precision, and service are deepened and professionally valuable.' },
  6:  { rel: 'Exalted (Saturn is exalted in Tula)',            severity: 'Transformative — Often Positive',
        effect: 'This is the most auspicious Sade Sati possible. Saturn in exaltation brings discipline, justice, and the rewards of past karma. Professional rise, legal victories, and social recognition are all possible. Relationships are tested but emerge stronger.',
        positive: 'Many great achievements, social positions, and lasting recognitions are attained during Tula Sade Sati.' },
  7:  { rel: 'Neutral (Mars rules — co-lord Ketu)',            severity: 'Moderate',
        effect: 'Transformation and hidden matters come to the surface. Occult, inheritance, and joint-finances issues may arise. Health requires attention — especially chronic or hidden conditions. Enemies may become more active.',
        positive: 'Deep psychological transformation and access to occult or spiritual knowledge.' },
  8:  { rel: 'Neutral (Jupiter rules)',                        severity: 'Moderate',
        effect: 'Dharma, higher education, and the father relationship are affected. Long journeys may be undertaken under difficult circumstances. Religious or philosophical confusion is possible. Fortune temporarily contracts before expanding.',
        positive: 'Wisdom through experience; deep philosophical inquiry leads to genuine understanding.' },
  9:  { rel: 'Own sign (Saturn owns Makara)',                  severity: 'Mild — Often Productive',
        effect: 'Saturn is comfortable in its own sign. Hard work, discipline, and persistent effort are demanded and rewarded. Career restructuring is likely but ultimately beneficial. Authority and recognition increase after initial difficulty.',
        positive: 'Makara Sade Sati often marks the rise of truly disciplined and enduring success.' },
  10: { rel: 'Own sign (Saturn owns Kumbha)',                  severity: 'Mild — Often Productive',
        effect: 'Saturn here brings innovative restructuring of social and professional life. Community, technology, and humanitarian work may become central. Friendships shift toward those of genuine depth and purpose.',
        positive: 'Original ideas find their platform; social contribution becomes a source of identity and fulfilment.' },
  11: { rel: 'Neutral (Jupiter rules — co-lord Ketu)',         severity: 'Mild–Moderate',
        effect: 'Expenses and foreign-related matters are highlighted. Sleep and retreat may be disrupted. Spiritual practice deepens naturally. Hidden enemies may act; be discerning about who you trust.',
        positive: 'Spiritual liberation, creative imagination, and deep inner life all flourish during this period.' }
};

const SS_PHASE_TEXT = {
  rising:  { label: 'Prathama Dhaiya — Rising Phase (12th from Moon)', color: 'sati-rising',
             text:  'Saturn transits the 12th house from your natal Moon — the opening of Sade Sati. This phase activates hidden fears, unexplained expenses, foreign travel, and a quiet withdrawal from the usual social rhythm. Sleep patterns may shift; introspection deepens. Losses may occur — of money, relationships, or a comfortable status quo — but these losses are ultimately clearing space for new growth. This is the right time to release what no longer serves you.' },
  peak:    { label: 'Madhyama — Peak Phase (1st from Moon / Janma Rashi)', color: 'sati-peak',
             text:  'Saturn now sits directly on your natal Moon — the most intense phase of Sade Sati. The mind and body both feel Saturn\'s weight directly. Identity, health, self-confidence, and emotional wellbeing are all tested. Confusion, loneliness, and heavy responsibility are common companions. However, this phase is also the great purifier — it burns away everything inessential from the personality so that only authentic self remains. Many people report their most profound spiritual breakthroughs during this phase.' },
  setting: { label: 'Antima Dhaiya — Setting Phase (2nd from Moon)', color: 'sati-setting',
             text:  'Saturn moves into the 2nd house from your natal Moon — the closing phase. Family dynamics, financial accumulation, and speech come under pressure. Old financial karma plays out. Family relationships require patient effort. The intensity is lessening compared to the peak, and the lessons of the previous 5 years are being integrated. This is the time to consolidate, speak carefully, and prepare for the post-Sade Sati phase of new beginnings that is now visible on the horizon.' }
};

const SS_GENERAL_REMEDIES = [
  'Recite <strong>Hanuman Chalisa</strong> every day — Hanuman is the supreme pacifier of Saturn\'s karma.',
  'Light a <strong>mustard-oil lamp</strong> (til ka tel diya) under a Peepal tree every Saturday evening.',
  '<strong>Donate on Saturdays:</strong> black sesame (til), urad dal, mustard oil, iron, black cloth, or shoes to labourers, elderly, or the underprivileged.',
  'Chant <strong>Shani Beej Mantra</strong>: <em>Om Praam Preem Praum Sah Shanaischaraya Namaha</em> — 108 times, preferably at dusk on Saturdays.',
  'Visit a <strong>Shani temple</strong> on Saturdays; offer black sesame and oil on the Shani idol.',
  '<strong>Serve the elderly, disabled, and those doing hard labour</strong> — this is the most direct form of Shani worship.',
  'Observe <strong>Saturday fast</strong> — eat once after sunset; avoid meat, alcohol, and sharp speech on Saturdays.',
  'Wear <strong>iron, horse-shoe iron (ghodi ki naal), or black cloth</strong> on Saturdays to absorb Saturn\'s energy.',
  'Recite <strong>Shani Stotra</strong> from Dasharatha\'s prayer or Shani Kavach during the entire Sade Sati period.',
  'Perform <strong>Shani Shanti Pooja</strong> at a qualified temple — especially at the start of Sade Sati.'
];

function buildSadeSatiVichar(moonSignIdx, moonDecoded, birthYear) {
  const phase = currentSSPhase(moonSignIdx);
  const periods = findSadeSatiPeriods(moonSignIdx, birthYear);
  const today = new Date();
  const currentPeriod = periods.find(p => today >= p.start && today < p.end) || null;
  const futurePeriods = periods.filter(p => p.start > today);
  const pastPeriods   = periods.filter(p => p.end <= today);
  const moonSign = SIGNS[moonSignIdx];
  const moonEffect = SS_MOON_EFFECTS[moonSignIdx];
  return { phase, periods, currentPeriod, futurePeriods, pastPeriods, moonSign, moonEffect };
}

// ══════════════════════════════════════════════════════════
// § 2  KAAL SARP DOSHA VICHAR
// ══════════════════════════════════════════════════════════

const KSD_TYPES = [
  { name:'Anant',      rahuH:1,  ketuH:7,  severity:'Strong',
    effect:'Rahu in the Lagna and Ketu in the 7th creates a powerful tension between self-expression and partnerships. The personality is magnetic but restless; relationships feel karmically fated and often turbulent. Sudden rises and unexpected falls mark the life journey. Success comes through unconventional paths; conventional expectations rarely apply.' },
  { name:'Kulik',      rahuH:2,  ketuH:8,  severity:'Strong',
    effect:'Wealth accumulation and family security are the constant preoccupations. Early life may see financial disruption or family instability. Hidden dangers — legal, financial, or health-related — may emerge unexpectedly. The person has a deep relationship with the occult and with the cycle of crisis-and-recovery.' },
  { name:'Vasuki',     rahuH:3,  ketuH:9,  severity:'Moderate',
    effect:'Great personal courage and effort often feel blocked by fortune — the 9th house Ketu disconnects from luck, dharma, and father\'s blessings. Siblings may be sources of complication. Communication efforts go unrewarded periodically. Spiritual detachment from conventional religion marks the soul.' },
  { name:'Shankhapal', rahuH:4,  ketuH:10, severity:'Moderate',
    effect:'Domestic happiness and career progress pull in opposite directions. The home and mother may face instability. Career achievements come with psychological costs. There is a restlessness in the domestic sphere — a feeling of never being fully settled. Foreign or unconventional living situations are common.' },
  { name:'Padma',      rahuH:5,  ketuH:11, severity:'Moderate',
    effect:'Creativity, romance, and children are the zones of karmic intensity. Creative work may be unconventional or struggle for recognition. Gains (11th) are elusive — money comes but does not stay. Children may bring both joy and karmic responsibility. Speculation and gambling should be strictly avoided.' },
  { name:'Mahapadma',  rahuH:6,  ketuH:12, severity:'Mild–Moderate',
    effect:'Enemies, litigation, and illness are the karmic arena — the person overcomes adversaries with persistent effort. The 12th Ketu bestows liberation-oriented spirituality, but may bring expenses and isolation. Foreign lands may figure prominently, for both hardship and eventual gain. This is among the milder KSD types.' },
  { name:'Takshak',    rahuH:7,  ketuH:1,  severity:'Strong',
    effect:'The 7th Rahu creates intense karmic partnerships — marriage and business relationships are the site of transformation, betrayal, and eventual wisdom. The self (1st Ketu) feels incomplete without the "other." Marital delays or complications are common. Partners may be foreign, unusual, or from different backgrounds.' },
  { name:'Karkotak',   rahuH:8,  ketuH:2,  severity:'Strong',
    effect:'Sudden events, accidents, occult experiences, and transformation are the recurring themes. Family wealth and ancestral legacy (2nd Ketu) may be disrupted or require relinquishment. The person is drawn to hidden knowledge. Life may include a dramatic "before and after" turning point.' },
  { name:'Shankhnaad', rahuH:9,  ketuH:3,  severity:'Moderate',
    effect:'Dharma, higher learning, father, and fortune are the arenas of Rahu\'s ambition — often manifesting as unconventional religious views or foreign spiritual influences. The 3rd Ketu brings disinterest in conventional courage and communication. Fortune arrives through unusual, often philosophical or spiritual channels.' },
  { name:'Ghatak',     rahuH:10, ketuH:4,  severity:'Strong',
    effect:'Career ambition (10th Rahu) overrides domestic peace (4th Ketu). Professional life is marked by sudden rises, power struggles, and unconventional paths to authority. Home life, mother, and emotional security are sacrificed at the altar of ambition. This yoga can produce powerful public figures who privately struggle with rootlessness.' },
  { name:'Vishdhar',   rahuH:11, ketuH:5,  severity:'Moderate',
    effect:'Gains, social networks, and elder siblings are Rahu\'s domain — the person can achieve worldly success but may find it does not bring inner peace. The 5th Ketu creates a karmic relationship with children, creativity, and speculative intelligence. Children may be delayed or bring deep spiritual lessons.' },
  { name:'Sheshnag',   rahuH:12, ketuH:6,  severity:'Mild',
    effect:'The most spiritually inclined KSD — Rahu in the 12th pulls toward foreign lands, liberation, and hidden realms; Ketu in the 6th removes fear of enemies and illness, often making the person a healer or solver of others\' problems. This is considered among the mildest and most spiritually productive KSD types.' }
];

const KSD_REMEDIES = [
  'Perform <strong>Kaal Sarp Shanti Pooja</strong> at Trimbakeshwar Jyotirlinga (Nashik, Maharashtra) or Sri Kalahasti temple (Andhra Pradesh) — these are the two most powerful sites for KSD relief.',
  'Worship <strong>Lord Shiva</strong> daily: offer Gangajal, bel (bilva) leaves, and white flowers; chant <em>Om Namah Shivaya</em> 108 times.',
  'Recite <strong>Mahamrityunjaya Mantra</strong> 108 times daily: <em>Om Tryambakam Yajamahe, Sugandhim Pushtivardhanam, Urvarukamiva Bandhanan, Mrityor Mukshiya Maamritat.</em>',
  'Offer <strong>silver snake images</strong> (Nag-Nagin) at a Shiva temple on Nag Panchami. Pour milk on the snake idol symbolically.',
  'Observe <strong>Nag Panchami fast</strong> every year; donate silver, milk, or white items at a Shiva-Nag temple.',
  'Chant <strong>Rahu Beej Mantra</strong> on Saturdays: <em>Om Bhraam Bhreem Bhraum Sah Rahave Namaha</em> — 108 times.',
  'Keep a <strong>Kaal Sarp Yantra</strong> (consecrated) in your home altar or place of worship.',
  'Regularly feed <strong>milk to a live Nag (cobra)</strong> at a recognised snake temple — symbolically feeding Rahu and Ketu, the serpent grahas.',
  'During the <strong>Rahu Kaal</strong> period each day, avoid starting new ventures and instead recite Rahu mantra or meditate.'
];

function buildKaalSarpVichar(positions, lagnaSignIdx) {
  const byPlanet = {};
  positions.forEach(p => byPlanet[p.planet] = p);
  const rahuH = byPlanet.Rahu.house, ketuH = byPlanet.Ketu.house;
  const rahuSign = byPlanet.Rahu.signIdx, ketuSign = byPlanet.Ketu.signIdx;

  // Check if all 7 visible planets are between Rahu and Ketu (on one arc of the circle).
  const sevenPlanets = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
  const rahuLon = byPlanet.Rahu.lon, ketuLon = byPlanet.Ketu.lon;

  let inRahuToKetu = 0, inKetuToRahu = 0;
  for (const pl of sevenPlanets) {
    const diff = ((byPlanet[pl].lon - rahuLon) + 360) % 360;
    if (diff < 180) inRahuToKetu++; else inKetuToRahu++;
  }

  const fullKSD = (inRahuToKetu === 7 || inKetuToRahu === 7);
  const partialKSD = !fullKSD && (inRahuToKetu >= 5 || inKetuToRahu >= 5);

  if (!fullKSD && !partialKSD) return null; // No KSD

  // Which planets (if any) are outside the axis (partial)
  const outsidePlanets = fullKSD ? [] : sevenPlanets.filter(pl => {
    const diff = ((byPlanet[pl].lon - rahuLon) + 360) % 360;
    return inRahuToKetu > inKetuToRahu ? diff >= 180 : diff < 180;
  });

  // Direction: anulom = planets go Rahu→Ketu in forward zodiac direction (less severe)
  //            vilom  = planets go against zodiac (more severe)
  const direction = inRahuToKetu === 7 || inRahuToKetu > inKetuToRahu ? 'Anulom (Saral)' : 'Vilom (Pratilom)';

  // Type: by Rahu's house
  const type = KSD_TYPES.find(t => t.rahuH === rahuH) || KSD_TYPES[0];

  // Cancellation conditions
  const cancellations = [];
  // 1. Any planet conjunct Rahu or Ketu
  const conjRahu = sevenPlanets.filter(pl => byPlanet[pl].house === rahuH);
  const conjKetu = sevenPlanets.filter(pl => byPlanet[pl].house === ketuH);
  if (conjRahu.length) cancellations.push(`${conjRahu.join(', ')} conjunct Rahu — partially mitigated`);
  if (conjKetu.length) cancellations.push(`${conjKetu.join(', ')} conjunct Ketu — partially mitigated`);
  // 2. Jupiter in kendra
  if ([1,4,7,10].includes(byPlanet.Jupiter.house)) cancellations.push('Jupiter in a Kendra — powerful mitigation of KSD effects');
  // 3. Partial KSD
  if (partialKSD) cancellations.push(`Partial Kaal Sarp — ${outsidePlanets.join(', ')} outside the axis, significantly reducing severity`);

  return { fullKSD, partialKSD, type, direction, rahuH, ketuH, outsidePlanets, cancellations };
}

// ══════════════════════════════════════════════════════════
// § 3  MANGAL DOSHA VICHAR
// ══════════════════════════════════════════════════════════

const MD_HOUSE_EFFECTS = {
  1:  { severity:'High', effect:'Mars in the 1st house makes the native aggressive, hot-tempered, and physically dominant. The spouse may face the brunt of the native\'s Mars energy — conflicts, arguments, and a combative household atmosphere are possible. Physical injury or surgery at some point in life is indicated. The strength of Mangal in the 1st can, however, make the native a powerful protector of the family.' },
  2:  { severity:'Moderate', effect:'Mars in the 2nd house affects family harmony, the accumulation of wealth, and the quality of speech. The tongue can be sharp and cutting, causing family discord. Financial gains may come through effort but be depleted through impulsive spending or family conflicts. Disputes over ancestral property are common.' },
  4:  { severity:'Moderate', effect:'Mars in the 4th house disturbs domestic peace and the happiness of the mother. Property disputes, frequent house changes, and a restless home environment are indicated. The native may find it difficult to feel truly settled or at peace in any home. Maternal health may also be a periodic concern.' },
  7:  { severity:'Very High', effect:'This is the most direct and powerful placement for Mangal Dosha. Mars in the 7th house directly aspects the marriage house — friction with the spouse, arguments, possible separation or divorce, and difficulty in sustaining harmony are traditional indications. The spouse may have a domineering or aggressive nature, or suffer health consequences. Marriage is a karmic battleground that requires tremendous mutual maturity.' },
  8:  { severity:'High', effect:'Mars in the 8th house is considered among the most serious Mangal Dosha placements — the 8th governs the spouse\'s longevity, shared resources, and sudden transformative events. Health risks for the spouse, accidents, or sudden financial reversals in marriage are indicated. The native has intense occult energy and a magnetic, if somewhat dangerous, personal power.' },
  12: { severity:'Moderate', effect:'Mars in the 12th house affects the intimate and private dimension of marriage — the bedroom, emotional fulfilment, and shared expenses. Dissatisfaction in the marital bed, extravagance, and possible distance (physical or emotional) from the spouse are indicated. There may be extramarital attractions if Mars is heavily afflicted here.' }
};

const MD_EXCEPTIONS = [
  { cond: 'Mars in own sign (Mesha or Vrishchika)',                    check: p => (p.signIdx === 0 || p.signIdx === 7) },
  { cond: 'Mars in exaltation (Makara — Capricorn)',                   check: p => p.signIdx === 9 },
  { cond: 'Mars in debilitation (Karka — Cancer): severely weakened',  check: p => p.signIdx === 3 },
  { cond: 'Mars in 1st house with Mesha or Vrishchika Lagna',          check: (p, lagnaSign) => p.house === 1 && (lagnaSign === 0 || lagnaSign === 7) },
  { cond: 'Mars in 2nd house with Mithuna or Kanya Lagna',             check: (p, lagnaSign) => p.house === 2 && (lagnaSign === 2 || lagnaSign === 5) },
  { cond: 'Mars in 4th house with Mesha or Vrishchika Lagna',          check: (p, lagnaSign) => p.house === 4 && (lagnaSign === 0 || lagnaSign === 7) },
  { cond: 'Mars in 7th house in Karka or Makara (own exalt/debil)',    check: p => p.house === 7 && (p.signIdx === 3 || p.signIdx === 9) },
  { cond: 'Mars in 8th house with Dhanu or Meena Lagna',               check: (p, lagnaSign) => p.house === 8 && (lagnaSign === 8 || lagnaSign === 11) },
  { cond: 'Mars in 12th house with Tula (Libra) Lagna',                check: (p, lagnaSign) => p.house === 12 && lagnaSign === 6 },
  { cond: 'Jupiter conjunct or aspecting Mars — greatly reduces dosha', check: () => false }, // checked separately
  { cond: 'Both partners have Mangal Dosha — mutually cancelled',       check: () => false }  // advisory note
];

function buildMangalVichar(positions, lagnaSignIdx) {
  const byPlanet = {};
  positions.forEach(p => byPlanet[p.planet] = p);
  const mars = byPlanet['Mars'], moon = byPlanet['Moon'], venus = byPlanet['Venus'];
  if (!mars) return null;

  const MD_HOUSES = [1, 2, 4, 7, 8, 12];
  const lagnaSign = lagnaSignIdx;

  // Check from Lagna, Moon, Venus
  const fromLagna = MD_HOUSES.includes(mars.house) ? mars.house : null;
  const moonSignIdx = moon ? moon.signIdx : null;
  const marsHouseFromMoon = moonSignIdx !== null
    ? ((mars.signIdx - moonSignIdx + 12) % 12) + 1 : null;
  const fromMoon = marsHouseFromMoon && MD_HOUSES.includes(marsHouseFromMoon) ? marsHouseFromMoon : null;
  const venusSignIdx = venus ? venus.signIdx : null;
  const marsHouseFromVenus = venusSignIdx !== null
    ? ((mars.signIdx - venusSignIdx + 12) % 12) + 1 : null;
  const fromVenus = marsHouseFromVenus && MD_HOUSES.includes(marsHouseFromVenus) ? marsHouseFromVenus : null;

  if (!fromLagna && !fromMoon && !fromVenus) return null; // No Mangal Dosha

  // Severity: count sources and worst house
  const sources = [fromLagna, fromMoon, fromVenus].filter(Boolean);
  const worstHouse = sources.includes(7) ? 7 : sources.includes(8) ? 8 : sources.includes(1) ? 1 : sources[0];
  const houseData = MD_HOUSE_EFFECTS[worstHouse] || MD_HOUSE_EFFECTS[fromLagna] || {};
  const doubleMD = sources.length >= 2;
  const severity = doubleMD ? 'Strong (multiple sources)' : houseData.severity || 'Moderate';

  // Check exceptions
  const cancelledConditions = [];
  for (const ex of MD_EXCEPTIONS) {
    try { if (ex.check(mars, lagnaSign)) cancelledConditions.push(ex.cond); } catch(e) {}
  }
  // Jupiter aspect on Mars?
  const jup = byPlanet['Jupiter'];
  if (jup) {
    const jupAspectsMars = [7, ...(SPECIAL_ASPECTS_MD['Jupiter'] || [])].map(off => ((jup.house - 1 + off - 1) % 12) + 1).includes(mars.house);
    if (jupAspectsMars) cancelledConditions.push('Jupiter aspects Mars — dosha significantly reduced');
  }

  const isCancelled = cancelledConditions.length > 0;
  const marsSignName = SIGNS[mars.signIdx].name;

  return { mars, fromLagna, fromMoon, fromVenus, worstHouse, houseData, severity, isCancelled, cancelledConditions, marsSignName, doubleMD, sources };
}
const SPECIAL_ASPECTS_MD = { Jupiter:[5,9], Saturn:[3,10], Mars:[4,8] };

const MD_REMEDIES = [
  'Recite <strong>Hanuman Chalisa</strong> daily — Hanuman (himself a Mangal deity) is the most powerful remedy for Mars afflictions.',
  'Visit a <strong>Hanuman temple every Tuesday and Saturday</strong>; offer sindoor (red vermilion), red flowers, and til oil lamp.',
  'Chant <strong>Mangal Beej Mantra</strong>: <em>Om Kraam Kreem Kraum Sah Bhaumaya Namaha</em> — 108 times on Tuesdays.',
  'Perform <strong>Kumbh Vivah or Mangal Shanti Pooja</strong> before marriage when dosha is strong — this is considered highly effective in tradition.',
  'Donate <strong>red lentils (masoor dal), jaggery (gur), copper items, red cloth</strong> to a temple or needy person every Tuesday.',
  'Observe a <strong>Tuesday fast</strong>: eat once, avoid meat, consume simple red-coloured food (tomato, red lentils); break fast at sunset.',
  'Wear <strong>Red Coral (Moonga)</strong> — minimum 7 rattis, set in copper or gold, worn on the ring finger of the right hand, on a Tuesday morning after Hanuman Chalisa.',
  'Recite <strong>Subramaniam (Kartikeya / Murugan) mantra</strong>: <em>Om Saravanabhavaya Namah</em> — Lord Kartikeya is the deity of Mars and Mangal Dosha relief.',
  'At marriage, ensure the spouse also has Mangal Dosha (they cancel each other). If not possible, perform the prescribed Mangal Shanti before marriage.',
  'Avoid <strong>red clothing and meat on Tuesdays</strong>. Be especially conscious of temper and impulsive speech on Tuesdays.'
];

// ══════════════════════════════════════════════════════════
// § 4  RENDER
// ══════════════════════════════════════════════════════════

function fmtD(d) {
  if (!d || isNaN(d)) return '—';
  return d.toLocaleDateString('en-IN', { month:'short', year:'numeric' });
}

function renderSadeSatiHTML(ss) {
  const { phase, currentPeriod, futurePeriods, pastPeriods, moonSign, moonEffect } = ss;
  const inSS = !!phase;

  let html = `<div class="vichar-block">`;

  // Status badge
  if (inSS) {
    const ph = SS_PHASE_TEXT[phase];
    html += `
      <div class="vichar-status active-sati ${ph.color}">
        <div class="vs-icon">♄</div>
        <div class="vs-body">
          <div class="vs-title">⚠ Currently in Sade Sati</div>
          <div class="vs-phase">${ph.label}</div>
        </div>
      </div>
      <div class="vichar-section-text">${ph.text}</div>`;
  } else {
    const next = futurePeriods[0];
    html += `
      <div class="vichar-status neutral-sati">
        <div class="vs-icon">♄</div>
        <div class="vs-body">
          <div class="vs-title">Not currently in Sade Sati</div>
          ${next ? `<div class="vs-phase">Next Sade Sati begins approx. ${fmtD(next.start)}</div>` : ''}
        </div>
      </div>`;
  }

  // Moon sign specific effect
  html += `
    <div class="vichar-card">
      <div class="vc-heading">Effect for ${moonSign.name} (${moonSign.english}) Moon — ${moonEffect.severity}</div>
      <p class="vc-text">${moonEffect.effect}</p>
      <p class="vc-positive"><strong>Silver lining:</strong> ${moonEffect.positive}</p>
      <p class="vc-meta"><em>Saturn's relationship to this Moon sign: ${moonEffect.rel}</em></p>
    </div>`;

  // Timeline
  html += `<div class="vichar-card"><div class="vc-heading">Sade Sati Timeline (Life Arc)</div><div class="ss-timeline">`;
  const allPeriods = [...pastPeriods, ...(currentPeriod ? [currentPeriod] : []), ...futurePeriods].slice(0, 5);
  for (const p of allPeriods) {
    const today = new Date();
    const isCur = today >= p.start && today < p.end;
    html += `<div class="ss-row ${isCur ? 'ss-current' : ''}">
      <span class="ss-label">${isCur ? '▶ Current' : (p.end < today ? 'Past' : 'Future')}</span>
      <span class="ss-dates">${fmtD(p.start)} – ${fmtD(p.end)}</span>
      <span class="ss-dur">(≈ 7.5 years)</span>
    </div>`;
  }
  html += `</div></div>`;

  // Remedies
  html += `<div class="vichar-card"><div class="vc-heading">Shani Sade Sati Remedies (Upaya)</div><ul class="vichar-list">`;
  SS_GENERAL_REMEDIES.forEach(r => { html += `<li>${r}</li>`; });
  html += `</ul></div></div>`;
  return html;
}

function renderKaalSarpHTML(ksd) {
  if (!ksd) return `<div class="vichar-block"><div class="vichar-status good-status"><div class="vs-icon">✓</div><div class="vs-body"><div class="vs-title">No Kaal Sarp Dosha</div><div class="vs-phase">All seven planets are not hemmed between the Rahu-Ketu axis. This is an auspicious chart configuration.</div></div></div></div>`;

  let html = `<div class="vichar-block">`;
  const sev = ksd.partialKSD ? 'Partial / Ardha Kaal Sarp' : 'Full Kaal Sarp Dosha';
  html += `
    <div class="vichar-status active-ksd">
      <div class="vs-icon">☊</div>
      <div class="vs-body">
        <div class="vs-title">${sev} — ${ksd.type.name} Type</div>
        <div class="vs-phase">Rahu in ${ksd.rahuH}${ord(ksd.rahuH)} house · Ketu in ${ksd.ketuH}${ord(ksd.ketuH)} house · ${ksd.direction}</div>
      </div>
    </div>`;

  html += `<div class="vichar-card">
    <div class="vc-heading">${ksd.type.name} Kaal Sarp — Traditional Effect</div>
    <p class="vc-text">${ksd.type.effect}</p>
    <p class="vc-meta"><strong>Severity:</strong> ${ksd.type.severity}</p>
  </div>`;

  if (ksd.cancellations.length) {
    html += `<div class="vichar-card good-card"><div class="vc-heading">Mitigating Factors</div><ul class="vichar-list">`;
    ksd.cancellations.forEach(c => { html += `<li>${c}</li>`; });
    html += `</ul></div>`;
  }

  html += `<div class="vichar-card"><div class="vc-heading">Kaal Sarp Dosha Remedies (Upaya)</div><ul class="vichar-list">`;
  KSD_REMEDIES.forEach(r => { html += `<li>${r}</li>`; });
  html += `</ul></div></div>`;
  return html;
}

function renderMangalHTML(md) {
  if (!md) return `<div class="vichar-block"><div class="vichar-status good-status"><div class="vs-icon">✓</div><div class="vs-body"><div class="vs-title">No Mangal Dosha</div><div class="vs-phase">Mars does not occupy the 1st, 2nd, 4th, 7th, 8th, or 12th house from Lagna, Moon, or Venus in this chart.</div></div></div></div>`;

  let html = `<div class="vichar-block">`;
  const sevCol = md.isCancelled ? 'neutral-sati' : (md.severity.startsWith('Strong') || md.severity.startsWith('Very High') ? 'active-ksd' : 'sati-rising');
  html += `
    <div class="vichar-status ${sevCol}">
      <div class="vs-icon">♂</div>
      <div class="vs-body">
        <div class="vs-title">Mangal Dosha Present${md.isCancelled ? ' — Partially Cancelled' : ''}</div>
        <div class="vs-phase">
          Mars in ${md.marsSignName} (house ${md.mars.house} from Lagna)
          ${md.fromLagna ? ` · ${md.fromLagna}${ord(md.fromLagna)} from Lagna` : ''}
          ${md.fromMoon  ? ` · ${md.fromMoon}${ord(md.fromMoon)} from Moon`   : ''}
          ${md.fromVenus ? ` · ${md.fromVenus}${ord(md.fromVenus)} from Venus` : ''}
          · Severity: ${md.severity}
        </div>
      </div>
    </div>`;

  html += `<div class="vichar-card">
    <div class="vc-heading">Effect — Mars in ${ord(md.worstHouse)} House</div>
    <p class="vc-text">${md.houseData.effect}</p>
  </div>`;

  if (md.isCancelled) {
    html += `<div class="vichar-card good-card"><div class="vc-heading">Cancellation (Anulom) Conditions Found</div><ul class="vichar-list">`;
    md.cancelledConditions.forEach(c => { html += `<li>${c}</li>`; });
    html += `</ul><p class="vc-positive" style="margin-top:10px;">The presence of these cancelling conditions significantly reduces or nullifies the adverse effects. However, the planet's placement still creates some intensity in the relevant life areas — awareness and the remedies below remain beneficial.</p></div>`;
  }

  html += `<div class="vichar-card"><div class="vc-heading">Mangal Dosha Remedies (Upaya)</div><ul class="vichar-list">`;
  MD_REMEDIES.forEach(r => { html += `<li>${r}</li>`; });
  html += `</ul></div></div>`;
  return html;
}

function ord(n) {
  const s = ['th','st','nd','rd'], v = n % 100;
  return n + (s[(v-20)%10] || s[v] || s[0]);
}

if (typeof window !== 'undefined') {
  window.Vichar = {
    buildSadeSatiVichar, buildKaalSarpVichar, buildMangalVichar,
    renderSadeSatiHTML, renderKaalSarpHTML, renderMangalHTML
  };
}
