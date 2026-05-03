// yoga.js — Yogas, Planetary Drishti (aspects), and Navamsha (D9) chart.
// Depends on SIGNS being in scope (from interpret.js loaded first).

// ── Navamsha (D9) ──
// Starting Navamsha sign by Rashi element:
//   Fire (0,4,8) → Mesha (0),  Earth (1,5,9) → Makara (9)
//   Air  (2,6,10)→ Tula (6),   Water (3,7,11)→ Karka (3)
const NAV_START = [0,9,6,3, 0,9,6,3, 0,9,6,3];

function navamshaSignIdx(siderealLon) {
  const lon = ((siderealLon % 360) + 360) % 360;
  const rashi = Math.floor(lon / 30);
  const posInSign = lon - rashi * 30;
  const pada = Math.floor(posInSign / (30 / 9)); // 0..8
  return (NAV_START[rashi] + pada) % 12;
}

function buildNavamsha(sidereal) {
  const planets = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu','Lagna'];
  return planets.map(p => {
    const lon = sidereal[p];
    const rashi = Math.floor(((lon % 360) + 360) % 360 / 30);
    const nav   = navamshaSignIdx(lon);
    return {
      planet: p,
      rashiSign: rashi, rashiName: SIGNS[rashi].name,
      navSign:   nav,   navName:   SIGNS[nav].name,
      navLord:   SIGNS[nav].lord,
      vargottama: rashi === nav  // same sign in D1 and D9 — strongest placement
    };
  });
}

// ── Planetary Drishti (aspects) ──
// All planets aspect the 7th house; Mars adds 4th & 8th; Jupiter adds 5th & 9th;
// Saturn adds 3rd & 10th. Rahu/Ketu in Parashari: 5th & 9th (like Jupiter).
const SPECIAL_ASPECTS = {
  Mars:    [4, 8],
  Jupiter: [5, 9],
  Saturn:  [3, 10],
  Rahu:    [5, 9],
  Ketu:    [5, 9]
};

// Houses that planet in `fromHouse` aspects (1-indexed, 1..12).
function aspectedHouses(fromHouse, planetName) {
  const offsets = [7, ...(SPECIAL_ASPECTS[planetName] || [])];
  return offsets.map(off => ((fromHouse - 1 + off - 1) % 12) + 1);
}

// Returns true if planet in fromHouse aspects targetHouse.
function doesAspect(fromHouse, planetName, targetHouse) {
  return aspectedHouses(fromHouse, planetName).includes(targetHouse);
}

// Build a complete aspect map: for each planet, list what it aspects.
function buildAspects(positions) {
  const map = {};
  for (const p of positions) {
    map[p.planet] = {
      houses: aspectedHouses(p.house, p.planet),
      planets: [] // filled below
    };
  }
  // For each planet pair, check mutual aspect situation
  for (const a of positions) {
    for (const b of positions) {
      if (a.planet === b.planet) continue;
      if (doesAspect(a.house, a.planet, b.house)) {
        map[a.planet].planets.push(b.planet);
      }
    }
  }
  return map;
}

// Notable aspect interpretations (shown as insight lines, not full paragraphs).
function buildAspectInsights(positions, lagnaSignIdx, aspects) {
  const byPlanet = {};
  positions.forEach(p => byPlanet[p.planet] = p);
  const insights = [];

  const aspJup = aspects['Jupiter'] ? aspects['Jupiter'].planets : [];
  const aspSat = aspects['Saturn'] ? aspects['Saturn'].planets : [];
  const aspMars= aspects['Mars'] ? aspects['Mars'].planets : [];

  // Jupiter aspecting Moon → Gajakesari support (aspect branch)
  if (aspJup.includes('Moon')) insights.push({ type:'positive', text:'Jupiter aspects the Moon — wisdom, emotional stability, and fortune flow together. This is a deeply protective influence.' });
  // Jupiter aspecting Lagna (house 1)
  if (byPlanet['Jupiter'] && doesAspect(byPlanet['Jupiter'].house, 'Jupiter', 1)) insights.push({ type:'positive', text:'Jupiter aspects the Lagna — grace, optimism, and expansion colour the outward personality and health.' });
  // Jupiter aspecting 7th
  if (byPlanet['Jupiter'] && doesAspect(byPlanet['Jupiter'].house, 'Jupiter', 7)) insights.push({ type:'positive', text:'Jupiter aspects the 7th house of partnership — beneficial, wise, or prosperous partnerships are indicated.' });
  // Jupiter aspecting 10th
  if (byPlanet['Jupiter'] && doesAspect(byPlanet['Jupiter'].house, 'Jupiter', 10)) insights.push({ type:'positive', text:'Jupiter casts its full aspect on the 10th house of career — professional expansion, recognition, and dharmic work are supported.' });
  // Saturn aspecting Moon
  if (aspSat.includes('Moon')) insights.push({ type:'caution', text:'Saturn aspects the Moon — emotional discipline, periods of melancholy, and a serious, patient inner life. Meditation and routine are the antidote.' });
  // Mars aspecting Moon
  if (aspMars.includes('Moon')) insights.push({ type:'caution', text:'Mars aspects the Moon — emotional intensity, impulsiveness, and a quick temper. Physical activity channels this energy constructively.' });
  // Mars aspecting 7th
  if (byPlanet['Mars'] && doesAspect(byPlanet['Mars'].house, 'Mars', 7)) insights.push({ type:'caution', text:'Mars aspects the 7th house — assertive or combative energy in partnerships; Mangal Dosha consideration applies.' });
  // Saturn aspecting 7th
  if (byPlanet['Saturn'] && doesAspect(byPlanet['Saturn'].house, 'Saturn', 7)) insights.push({ type:'caution', text:'Saturn aspects the 7th house — delayed or karmic marriages; serious, dutiful partnerships; choose a partner with patience.' });
  // Saturn aspecting 10th
  if (byPlanet['Saturn'] && doesAspect(byPlanet['Saturn'].house, 'Saturn', 10)) insights.push({ type:'caution', text:'Saturn aspects the 10th house of career — slow but rock-solid career progress; late success in life; authority in fields requiring discipline.' });
  // Venus aspecting 7th
  if (byPlanet['Venus'] && doesAspect(byPlanet['Venus'].house, 'Venus', 7)) insights.push({ type:'positive', text:'Venus aspects the 7th house — harmonious, beautiful, or materially comfortable partnerships are indicated.' });
  // Rahu aspecting Moon
  if (aspJup.includes('Moon') === false && aspects['Rahu'] && aspects['Rahu'].planets.includes('Moon')) insights.push({ type:'caution', text:'Rahu aspects the Moon — restless mind, unconventional emotional patterns, vivid dreams; grounding practices are essential.' });

  return insights;
}

// ── Yoga detection ──

const YOGA_DATA = {
  // Pancha Mahapurusha (five great-person yogas)
  Hamsa: {
    title: 'Hamsa Yoga',
    type: 'auspicious',
    desc: 'Jupiter occupies its own or exalted sign in a Kendra (angular house). This is one of the Pancha Mahapurusha Yogas — it bestows grace, wisdom, spiritual inclination, respected status, a fair and beautiful appearance, and an innate generosity that draws prosperity. The person becomes a teacher or guide to others.',
    remedy: null
  },
  Malavya: {
    title: 'Malavya Yoga',
    type: 'auspicious',
    desc: 'Venus occupies its own or exalted sign in a Kendra. One of the Pancha Mahapurusha Yogas, it grants beauty, charm, artistic talent, sensual refinement, a loving and loyal partner, material comforts, and success in creative or luxury fields. The person is magnetic and beloved.',
    remedy: null
  },
  Ruchaka: {
    title: 'Ruchaka Yoga',
    type: 'auspicious',
    desc: 'Mars occupies its own or exalted sign in a Kendra. This Pancha Mahapurusha Yoga creates a courageous, physically powerful, and commanding personality — a leader in military, sports, surgery, or administration. The person is bold, physically attractive, and admired for strength.',
    remedy: null
  },
  Sasha: {
    title: 'Sasha Yoga',
    type: 'auspicious',
    desc: 'Saturn occupies its own or exalted sign in a Kendra. This Pancha Mahapurusha Yoga produces a disciplined, industrious, and authoritative person who rises to positions of power through persistent effort. Success comes late but is enduring. Leadership in law, government, or large organisations.',
    remedy: null
  },
  Bhadra: {
    title: 'Bhadra Yoga',
    type: 'auspicious',
    desc: 'Mercury occupies its own or exalted sign in a Kendra. This Pancha Mahapurusha Yoga grants exceptional intellect, communication mastery, wit, business acumen, and longevity. The person excels in writing, teaching, commerce, or medicine and is admired for sharp, elegant expression.',
    remedy: null
  },
  Gajakesari: {
    title: 'Gajakesari Yoga',
    type: 'auspicious',
    desc: 'Jupiter occupies a Kendra (1st, 4th, 7th, or 10th) from the Moon. One of Jyotish\'s most celebrated yogas — it grants fame, eloquence, wisdom, prosperity, and a personality that shines like a lion (Kesari). The life is protected and guided by grace, and the person becomes well-known and respected.',
    remedy: null
  },
  BudhaAditya: {
    title: 'Budha-Aditya Yoga',
    type: 'auspicious',
    desc: 'The Sun and Mercury occupy the same sign, combining solar willpower with Mercurial intelligence. This produces a quick, sharp, expressive mind with government or leadership ability. Excellent for writing, speaking, politics, and any field where intellect and authority must work together.',
    remedy: null
  },
  ChandraMangal: {
    title: 'Chandra-Mangal Yoga',
    type: 'auspicious',
    desc: 'The Moon and Mars conjoin or aspect each other, combining emotional depth with Martian energy and ambition. This yoga produces tenacity, business drive, and the ability to accumulate wealth through active effort. The person is entrepreneurial, resourceful, and emotionally courageous.',
    remedy: null
  },
  Parivartana: {
    title: 'Parivartana Yoga (Exchange)',
    type: 'auspicious',
    desc: 'Two planets occupy each other\'s signs, creating a powerful mutual exchange. This effectively allows both planets to function as if they are in their own signs simultaneously — greatly strengthening both planets and the houses they rule. The specific life areas depend on which houses are involved.',
    remedy: null
  },
  ViparitaRaja: {
    title: 'Vipareeta Raja Yoga',
    type: 'auspicious',
    desc: 'The lord of the 6th, 8th, or 12th house sits in another dusthana (6th, 8th, or 12th), causing the malefic house energies to cancel each other and transform into unexpected success. Difficulties and crises paradoxically become the fuel for remarkable breakthroughs and social rise.',
    remedy: null
  },
  NeechaBhanga: {
    title: 'Neecha Bhanga Raja Yoga',
    type: 'auspicious',
    desc: 'A debilitated planet has its weakness cancelled by a cancelling condition (its dispositor or exaltation lord in a Kendra). The initial weakness transforms into a unique strength — the person struggles in youth but achieves distinction in the area that was initially most challenged.',
    remedy: null
  },
  RajaYoga: {
    title: 'Raja Yoga',
    type: 'auspicious',
    desc: 'The lords of a trikona (1st, 5th, or 9th — houses of dharma and fortune) and a kendra (1st, 4th, 7th, or 10th — houses of action) are connected through conjunction, mutual aspect, or sign exchange. This is the fundamental yoga for worldly success, authority, and status. The 1st house counts as both kendra and trikona.',
    remedy: null
  },
  DhanaYoga: {
    title: 'Dhana Yoga (Wealth)',
    type: 'auspicious',
    desc: 'The lords of the 2nd (accumulated wealth) and 11th (gains and income) houses are connected — conjunct, aspecting each other, or exchanging signs. This yoga promises financial prosperity and the ability to accumulate material resources, especially during the Dashas of the involved planets.',
    remedy: null
  },
  Kemdrum: {
    title: 'Kemdrum Yoga',
    type: 'challenging',
    desc: 'The Moon has no planets in the 2nd or 12th houses from it (i.e., the adjacent lunar houses are empty). This creates isolation of the Moon\'s emotional energy, which can manifest as loneliness, emotional fluctuation, financial instability, or a sense of disconnection. Remedied by regular Moon-strengthening practices.',
    remedy: 'Wear a Pearl (Moti) in silver on the little finger on a Monday. Offer water to the Moon on full-moon nights. Chant "Om Chandraya Namaha" 108 times on Mondays. Serve your mother and elderly women with devotion.'
  },
  Sakata: {
    title: 'Sakata Yoga',
    type: 'challenging',
    desc: 'The Moon sits in the 6th, 8th, or 12th house from Jupiter, severing the most benefic connection in the chart. Fortune rises and falls repeatedly like a wheel (chakra); periods of prosperity alternate with setbacks. Perseverance and spiritual practice gradually stabilise the pattern.',
    remedy: 'Recite "Om Guruve Namaha" 108 times on Thursdays. Donate yellow items — turmeric, gram dal, gold — to a temple or Brahmin. Wear Yellow Sapphire after consulting a Jyotishi. Respect and serve your teachers and father.'
  }
};

function detectYogas(positions, lagnaSignIdx, sidereal) {
  const byPlanet = {};
  positions.forEach(p => byPlanet[p.planet] = p);
  const yogas = [];
  const kendras = [1, 4, 7, 10];
  const trikonas = [1, 5, 9];
  const dusthanas = [6, 8, 12];

  function houseLord(h) {
    return SIGNS[(lagnaSignIdx + h - 1) % 12].lord;
  }

  // ── Pancha Mahapurusha ──
  const pmpCriteria = {
    Hamsa:   { planet:'Jupiter', ownSigns:[8,11], exaltSign:3 },
    Malavya: { planet:'Venus',   ownSigns:[1,6],  exaltSign:11 },
    Ruchaka: { planet:'Mars',    ownSigns:[0,7],  exaltSign:9 },
    Sasha:   { planet:'Saturn',  ownSigns:[9,10], exaltSign:6 },
    Bhadra:  { planet:'Mercury', ownSigns:[2,5],  exaltSign:5 }
  };
  for (const [name, crit] of Object.entries(pmpCriteria)) {
    const p = byPlanet[crit.planet];
    if (!p) continue;
    const inOwnOrExalt = crit.ownSigns.includes(p.signIdx) || p.signIdx === crit.exaltSign;
    if (inOwnOrExalt && kendras.includes(p.house)) {
      yogas.push({ key: name, ...YOGA_DATA[name], planets: [crit.planet], houses: [p.house] });
    }
  }

  // ── Gajakesari ──
  const moon = byPlanet['Moon'], jup = byPlanet['Jupiter'];
  if (moon && jup) {
    const jupHouseFromMoon = ((jup.signIdx - moon.signIdx + 12) % 12) + 1;
    if (kendras.includes(jupHouseFromMoon)) {
      yogas.push({ key:'Gajakesari', ...YOGA_DATA.Gajakesari, planets:['Jupiter','Moon'], houses:[jup.house] });
    }
  }

  // ── Budha-Aditya ──
  const sun = byPlanet['Sun'], mer = byPlanet['Mercury'];
  if (sun && mer && sun.signIdx === mer.signIdx && !mer.combust) {
    yogas.push({ key:'BudhaAditya', ...YOGA_DATA.BudhaAditya, planets:['Sun','Mercury'], houses:[sun.house] });
  }

  // ── Chandra-Mangal ──
  const mars = byPlanet['Mars'];
  if (moon && mars) {
    const conjunct = moon.signIdx === mars.signIdx;
    const moonAspectsMars = doesAspect(moon.house, 'Moon', mars.house);
    const marsAspectsMoon = doesAspect(mars.house, 'Mars', moon.house);
    if (conjunct || moonAspectsMars || marsAspectsMoon) {
      yogas.push({ key:'ChandraMangal', ...YOGA_DATA.ChandraMangal, planets:['Moon','Mars'], houses:[moon.house] });
    }
  }

  // ── Parivartana ──
  const pairs = [];
  const planetList = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
  for (let i = 0; i < planetList.length; i++) {
    for (let j = i+1; j < planetList.length; j++) {
      const pa = byPlanet[planetList[i]], pb = byPlanet[planetList[j]];
      if (!pa || !pb) continue;
      const aInBSign = SIGNS[pa.signIdx].lord === pb.planet;
      const bInASign = SIGNS[pb.signIdx].lord === pa.planet;
      if (aInBSign && bInASign && !pairs.find(p => p.includes(pa.planet))) {
        pairs.push([pa.planet, pb.planet]);
        yogas.push({
          key:'Parivartana', ...YOGA_DATA.Parivartana,
          title: `Parivartana Yoga — ${pa.planet} ↔ ${pb.planet}`,
          planets:[pa.planet, pb.planet], houses:[pa.house, pb.house]
        });
      }
    }
  }

  // ── Raja Yoga (kendra-trikona lord conjunction/exchange) ──
  const kendraLords = [...new Set(kendras.map(h => houseLord(h)))];
  const trikonaLords= [...new Set(trikonas.map(h => houseLord(h)))];
  const rajaFound = new Set();
  for (const kl of kendraLords) {
    for (const tl of trikonaLords) {
      if (kl === tl) continue; // 1st lord is both — check separately
      const kp = byPlanet[kl], tp = byPlanet[tl];
      if (!kp || !tp) continue;
      const conjunct = kp.signIdx === tp.signIdx;
      const mutualAspect = doesAspect(kp.house, kl, tp.house) && doesAspect(tp.house, tl, kp.house);
      const exchange = SIGNS[kp.signIdx].lord === tl && SIGNS[tp.signIdx].lord === kl;
      const key = [kl,tl].sort().join('-');
      if ((conjunct || mutualAspect || exchange) && !rajaFound.has(key)) {
        rajaFound.add(key);
        yogas.push({
          key:'RajaYoga', ...YOGA_DATA.RajaYoga,
          title:`Raja Yoga — ${kl} (${ordHouse(findHouse(kl,lagnaSignIdx))}) & ${tl} (${ordHouse(findHouse(tl,lagnaSignIdx))})`,
          planets:[kl, tl], houses:[kp.house, tp.house]
        });
      }
    }
  }
  // 1st lord connected to 5th or 9th lord is also Raja Yoga
  const lord1 = houseLord(1);
  for (const h of [5,9]) {
    const hl = houseLord(h);
    if (hl === lord1) continue;
    const p1 = byPlanet[lord1], ph = byPlanet[hl];
    if (!p1 || !ph) continue;
    const key = [lord1,hl].sort().join('-');
    if (!rajaFound.has(key) && (p1.signIdx === ph.signIdx || doesAspect(p1.house,lord1,ph.house))) {
      rajaFound.add(key);
      yogas.push({
        key:'RajaYoga', ...YOGA_DATA.RajaYoga,
        title:`Raja Yoga — Lagna lord ${lord1} & ${h}th lord ${hl}`,
        planets:[lord1, hl], houses:[p1.house, ph.house]
      });
    }
  }

  // ── Dhana Yoga ──
  const l2 = houseLord(2), l11 = houseLord(11);
  const p2 = byPlanet[l2], p11 = byPlanet[l11];
  if (p2 && p11 && l2 !== l11) {
    const conj = p2.signIdx === p11.signIdx;
    const asp  = doesAspect(p2.house, l2, p11.house) || doesAspect(p11.house, l11, p2.house);
    const exch = SIGNS[p2.signIdx].lord === l11 && SIGNS[p11.signIdx].lord === l2;
    if (conj || asp || exch) {
      yogas.push({ key:'DhanaYoga', ...YOGA_DATA.DhanaYoga, planets:[l2, l11], houses:[p2.house, p11.house] });
    }
  }

  // ── Vipareeta Raja Yoga ──
  const dusthanaLords = dusthanas.map(h => ({ h, lord: houseLord(h) }));
  for (const { h: h1, lord: l1 } of dusthanaLords) {
    const p = byPlanet[l1];
    if (!p) continue;
    if (dusthanas.includes(p.house) && p.house !== h1) {
      yogas.push({
        key:'ViparitaRaja', ...YOGA_DATA.ViparitaRaja,
        title:`Vipareeta Raja Yoga — ${h1}th lord ${l1} in ${p.house}th`,
        planets:[l1], houses:[p.house]
      });
      break; // one is enough
    }
  }

  // ── Neecha Bhanga Raja Yoga ──
  const DEBIL = { Sun:6, Moon:7, Mars:3, Mercury:11, Jupiter:9, Venus:5, Saturn:0 };
  for (const [planet, debilSign] of Object.entries(DEBIL)) {
    const p = byPlanet[planet];
    if (!p || p.signIdx !== debilSign) continue;
    // Cancellation conditions (any one):
    // 1. Dispositor (lord of debil sign) is in a kendra from Lagna or Moon
    const dispositor = SIGNS[debilSign].lord;
    const disp = byPlanet[dispositor];
    const dispInKendra = disp && (kendras.includes(disp.house) ||
      kendras.includes(((disp.signIdx - (moon ? moon.signIdx : 0) + 12) % 12) + 1));
    // 2. Exaltation lord is in kendra from Lagna
    const EXALT_LORDS = { Sun:'Venus', Moon:'Jupiter', Mars:'Saturn', Mercury:'Venus', Jupiter:'Mars', Venus:'Mercury', Saturn:'Venus' };
    const exaltLord = byPlanet[EXALT_LORDS[planet]];
    const exaltInKendra = exaltLord && kendras.includes(exaltLord.house);
    if (dispInKendra || exaltInKendra) {
      yogas.push({
        key:'NeechaBhanga', ...YOGA_DATA.NeechaBhanga,
        title:`Neecha Bhanga for ${planet} (debilitated in ${SIGNS[debilSign].name})`,
        planets:[planet, dispositor], houses:[p.house]
      });
    }
  }

  // ── Kemdrum Yoga (challenging) ──
  if (moon) {
    const moonH = moon.house;
    const h2  = (moonH % 12) + 1;
    const h12 = ((moonH - 2 + 12) % 12) + 1;
    const inAdjacent = positions.some(p => p.planet !== 'Moon' && (p.house === h2 || p.house === h12));
    // Also cancelled if Moon is in a kendra, or any planet aspects Moon
    const moonInKendra = kendras.includes(moonH);
    const aspectOnMoon = positions.some(p => p.planet !== 'Moon' && doesAspect(p.house, p.planet, moonH));
    if (!inAdjacent && !moonInKendra && !aspectOnMoon) {
      yogas.push({ key:'Kemdrum', ...YOGA_DATA.Kemdrum, planets:['Moon'], houses:[moonH] });
    }
  }

  // ── Sakata Yoga (challenging) ──
  if (moon && jup) {
    const jupHouseFromMoon = ((jup.signIdx - moon.signIdx + 12) % 12) + 1;
    if ([6,8,12].includes(jupHouseFromMoon)) {
      yogas.push({ key:'Sakata', ...YOGA_DATA.Sakata, planets:['Moon','Jupiter'], houses:[moon.house, jup.house] });
    }
  }

  return yogas;
}

// Helper: find which house number a planet's lord corresponds to (for labelling).
function findHouse(planetName, lagnaSignIdx) {
  for (let h = 1; h <= 12; h++) {
    if (SIGNS[(lagnaSignIdx + h - 1) % 12].lord === planetName) return h;
  }
  return null;
}
function ordHouse(n) {
  if (!n) return '';
  const s = ['th','st','nd','rd'], v = n % 100;
  return n + (s[(v-20)%10] || s[v] || s[0]) + ' lord';
}

// ── Render HTML ──

const YOGA_TYPE_STYLE = { auspicious:'yoga-auspicious', challenging:'yoga-challenging' };
const PLANET_GLYPH2 = { Sun:'☀', Moon:'☽', Mars:'♂', Mercury:'☿', Jupiter:'♃', Venus:'♀', Saturn:'♄', Rahu:'☊', Ketu:'☋', Lagna:'↑' };

function renderYogasHTML(yogas) {
  if (!yogas.length) return '<p class="section-note">No major yogas detected. Chart is balanced — continue regular practices to maintain equilibrium.</p>';
  const auspicious = yogas.filter(y => y.type === 'auspicious');
  const challenging = yogas.filter(y => y.type === 'challenging');
  let html = '';
  if (auspicious.length) {
    html += `<h4 class="yoga-sub-title">✦ Auspicious Yogas</h4><div class="yoga-grid">` +
      auspicious.map(yogaCard).join('') + `</div>`;
  }
  if (challenging.length) {
    html += `<h4 class="yoga-sub-title">⚠ Challenging Yogas</h4><div class="yoga-grid">` +
      challenging.map(yogaCard).join('') + `</div>`;
  }
  return html;
}

function yogaCard(y) {
  const cls = YOGA_TYPE_STYLE[y.type] || '';
  const planets = y.planets ? y.planets.map(p => `<span class="yp">${PLANET_GLYPH2[p] || ''} ${p}</span>`).join(' ') : '';
  return `
    <div class="yoga-card ${cls}">
      <div class="yoga-title">${escH(y.title)}</div>
      <div class="yoga-planets">${planets}</div>
      <p class="yoga-desc">${escH(y.desc)}</p>
      ${y.remedy ? `<div class="yoga-remedy"><strong>Remedy:</strong> ${escH(y.remedy)}</div>` : ''}
    </div>`;
}

function renderNavamshaHTML(navamsha) {
  const rows = navamsha.map(n => `
    <tr class="${n.vargottama ? 'vargottama' : ''}">
      <td><strong>${PLANET_GLYPH2[n.planet] || ''} ${n.planet}</strong></td>
      <td>${SIGNS[n.rashiSign].symbol} ${n.rashiName}</td>
      <td>${SIGNS[n.navSign].symbol} ${n.navName}</td>
      <td>${n.navLord}</td>
      <td>${n.vargottama ? '<span class="varg-badge">Vargottama ★</span>' : ''}</td>
    </tr>`).join('');
  return `
    <div class="table-wrap">
      <table class="planet-table">
        <thead><tr><th>Graha</th><th>Rashi (D1)</th><th>Navamsha (D9)</th><th>D9 Lord</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <p class="section-note" style="margin-top:12px;">A <span style="color:var(--gold);">Vargottama</span> planet occupies the same sign in both the birth chart and Navamsha — considered exceptionally strong. The Navamsha lord reveals who strengthens or tests each planet's deeper promise.</p>`;
}

function renderAspectsHTML(insights) {
  if (!insights.length) return '<p class="section-note">No stand-out aspect patterns detected beyond standard planetary influences.</p>';
  return `<div class="aspect-list">` +
    insights.map(i => `
      <div class="aspect-item ${i.type === 'positive' ? 'asp-pos' : 'asp-caut'}">
        <span class="asp-icon">${i.type === 'positive' ? '✦' : '⚠'}</span>
        <span class="asp-text">${escH(i.text)}</span>
      </div>`).join('') +
    `</div>`;
}

function escH(s) {
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

if (typeof window !== 'undefined') {
  window.Yoga = {
    buildNavamsha, navamshaSignIdx, buildAspects, buildAspectInsights,
    detectYogas, renderYogasHTML, renderNavamshaHTML, renderAspectsHTML
  };
}
