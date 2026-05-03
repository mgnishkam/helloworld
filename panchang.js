// panchang.js — Daily Vedic almanac: Tithi, Vara, Nakshatra, Yoga, Karana.
// Depends on: julianDay, lahiriAyanamsa, sunLongitude, moonLongitude (astro.js)
//             NAKSHATRAS (interpret.js)

// ══════════════════════════════════════════════════════════
// § 1  STATIC DATA
// ══════════════════════════════════════════════════════════

// 30 Tithis (0-index = Shukla Pratipada)
const TITHIS = [
  { name:'Pratipada',   paksha:'Shukla', nature:'auspicious',
    lord:'Agni',   desc:'Excellent for beginning new ventures, travel, and ceremonies. The energy of the cycle is fresh and willing.' },
  { name:'Dwitiya',     paksha:'Shukla', nature:'auspicious',
    lord:'Brahma', desc:'Good for laying foundations, learning, and community work. Steady, constructive energy.' },
  { name:'Tritiya',     paksha:'Shukla', nature:'auspicious',
    lord:'Gauri',  desc:'Favourable for haircuts, beginning journeys, trade, and starting new relationships.' },
  { name:'Chaturthi',   paksha:'Shukla', nature:'mixed',
    lord:'Ganesh', desc:'Good for removing obstacles; honour Ganesha. Avoid initiating major new ventures.' },
  { name:'Panchami',    paksha:'Shukla', nature:'auspicious',
    lord:'Naga',   desc:'Favourable for medicine, learning, and snake worship. Health-related endeavours prosper.' },
  { name:'Shashthi',    paksha:'Shukla', nature:'auspicious',
    lord:'Kartik', desc:'Good for beauty, arts, and welcoming guests. Children\'s matters are also favoured.' },
  { name:'Saptami',     paksha:'Shukla', nature:'auspicious',
    lord:'Sun',    desc:'Auspicious for travel by vehicle, Sun worship, and outdoor activities.' },
  { name:'Ashtami',     paksha:'Shukla', nature:'inauspicious',
    lord:'Shiva',  desc:'Avoid beginning major work. Powerful for Shiva worship and developing inner courage.' },
  { name:'Navami',      paksha:'Shukla', nature:'mixed',
    lord:'Durga',  desc:'Good for purchasing equipment and machinery. Durga worship bestows strength.' },
  { name:'Dashami',     paksha:'Shukla', nature:'auspicious',
    lord:'Dharma', desc:'Excellent for charity, giving gifts, and dharmic activities of all kinds.' },
  { name:'Ekadashi',    paksha:'Shukla', nature:'auspicious',
    lord:'Vishnu', desc:'The most auspicious Tithi for fasting, Vishnu worship, and accumulating spiritual merit.' },
  { name:'Dwadashi',    paksha:'Shukla', nature:'auspicious',
    lord:'Vishnu', desc:'Good for donation and learning. Complete the Ekadashi fast; begin charitable work.' },
  { name:'Trayodashi',  paksha:'Shukla', nature:'auspicious',
    lord:'Kama',   desc:'Favourable for love, romance, music, dance, and joyful celebrations.' },
  { name:'Chaturdashi', paksha:'Shukla', nature:'inauspicious',
    lord:'Shiva',  desc:'Avoid new ventures. Pradosh Kaal on this evening is exceptionally powerful for Shiva worship.' },
  { name:'Purnima',     paksha:'Shukla', nature:'auspicious',
    lord:'Moon',   desc:'Full Moon — powerfully auspicious. Ideal for fasting, worship, bathing in sacred rivers, and group celebration.' },
  { name:'Pratipada',   paksha:'Krishna', nature:'auspicious',
    lord:'Agni',   desc:'Good for beginning work aligned with completion and reflection. Follow the waning Moon\'s inward energy.' },
  { name:'Dwitiya',     paksha:'Krishna', nature:'mixed',
    lord:'Brahma', desc:'Moderate for routine tasks; avoid major decisions. Complete rather than begin.' },
  { name:'Tritiya',     paksha:'Krishna', nature:'auspicious',
    lord:'Gauri',  desc:'Good for haircuts, beginning short journeys, and practical household matters.' },
  { name:'Chaturthi',   paksha:'Krishna', nature:'inauspicious',
    lord:'Ganesh', desc:'Sankashti Chaturthi — fast for Ganesha. Avoid new beginnings; devote the day to prayer.' },
  { name:'Panchami',    paksha:'Krishna', nature:'mixed',
    lord:'Naga',   desc:'Moderate for routine activities. Favour completion, spiritual practice, and health awareness.' },
  { name:'Shashthi',    paksha:'Krishna', nature:'mixed',
    lord:'Kartik', desc:'Focus on completing tasks rather than initiating. Routine household work is acceptable.' },
  { name:'Saptami',     paksha:'Krishna', nature:'mixed',
    lord:'Sun',    desc:'Moderate energy. Suitable for travel and vehicle-related activities.' },
  { name:'Ashtami',     paksha:'Krishna', nature:'inauspicious',
    lord:'Shiva',  desc:'Krishna Ashtami — auspicious for Krishna worship. Avoid beginning new secular work.' },
  { name:'Navami',      paksha:'Krishna', nature:'mixed',
    lord:'Durga',  desc:'Moderate. Good for completing tasks and Durga worship.' },
  { name:'Dashami',     paksha:'Krishna', nature:'auspicious',
    lord:'Dharma', desc:'Good for charity and dharmic activities even in the waning fortnight.' },
  { name:'Ekadashi',    paksha:'Krishna', nature:'auspicious',
    lord:'Vishnu', desc:'Fast day — powerful for Vishnu worship and the accumulation of spiritual merit.' },
  { name:'Dwadashi',    paksha:'Krishna', nature:'auspicious',
    lord:'Vishnu', desc:'Good for donation and completing Ekadashi observances.' },
  { name:'Trayodashi',  paksha:'Krishna', nature:'mixed',
    lord:'Kama',   desc:'Moderate. Evening Pradosh is powerful for Shiva in this fortnight.' },
  { name:'Chaturdashi', paksha:'Krishna', nature:'inauspicious',
    lord:'Shiva',  desc:'Avoid new beginnings. Maha Shivratri falls in this Tithi in Magha month. Suitable for intense Shiva devotion.' },
  { name:'Amavasya',    paksha:'Krishna', nature:'mixed',
    lord:'Pitrs',  desc:'New Moon — day for ancestral rites (Pitru Tarpan), Devi worship, and deep reflection. Not suitable for new ventures.' }
];

// 27 Yoga names and nature (0-index = Vishkambha)
const YOGAS = [
  { name:'Vishkambha', nature:'inauspicious', desc:'Avoid new undertakings today. Best used for reflection and patient waiting.' },
  { name:'Priti',      nature:'auspicious',   desc:'Love, friendship, and harmony are favoured. Good for forming new relationships.' },
  { name:'Ayushman',   nature:'auspicious',   desc:'Health, vitality, and longevity are supported. Excellent for medical treatments.' },
  { name:'Saubhagya',  nature:'auspicious',   desc:'Fortune and auspiciousness prevail. Begin important work today.' },
  { name:'Shobhana',   nature:'auspicious',   desc:'Beauty and charm are highlighted. Good for weddings and artistic work.' },
  { name:'Atiganda',   nature:'inauspicious', desc:'Proceed with caution; avoid risk. Unexpected difficulties are possible.' },
  { name:'Sukarma',    nature:'auspicious',   desc:'Good actions and virtuous deeds bear fruit. Excellent for charitable work.' },
  { name:'Dhriti',     nature:'auspicious',   desc:'Steadiness and determination succeed. Good for long-term commitments.' },
  { name:'Shoola',     nature:'inauspicious', desc:'Avoid conflicts. Be especially careful of sharp objects and painful interactions.' },
  { name:'Ganda',      nature:'inauspicious', desc:'Obstruction energy — avoid beginning new or important work today.' },
  { name:'Vriddhi',    nature:'auspicious',   desc:'Growth and increase are favoured in all spheres. Good for trade and agriculture.' },
  { name:'Dhruva',     nature:'auspicious',   desc:'Stability and permanence. Good for making lasting commitments and building structures.' },
  { name:'Vyaghata',   nature:'inauspicious', desc:'Avoid travel and direct confrontation. Wait for a better day to act.' },
  { name:'Harshana',   nature:'auspicious',   desc:'Joy and enthusiasm prevail. Excellent for celebrations, parties, and creative work.' },
  { name:'Vajra',      nature:'inauspicious', desc:'Caution with electrical, sharp, or sudden events. Avoid anger today.' },
  { name:'Siddhi',     nature:'auspicious',   desc:'Success and accomplishment are strongly supported. Begin important endeavours today.' },
  { name:'Vyatipata',  nature:'inauspicious', desc:'Avoid important undertakings. Unexpected reversals are possible — wait this out.' },
  { name:'Variyan',    nature:'auspicious',   desc:'Comfort and material wellbeing are favoured. Good for pleasure and relaxation.' },
  { name:'Parigha',    nature:'inauspicious', desc:'Be patient with delays and obstacles. Complete rather than begin.' },
  { name:'Shiva',      nature:'auspicious',   desc:'Auspiciousness and divine grace. Ideal for worship, ceremony, and spiritual work.' },
  { name:'Siddha',     nature:'auspicious',   desc:'Achievement and spiritual fulfilment are supported. A very auspicious Yoga.' },
  { name:'Sadhya',     nature:'auspicious',   desc:'Accomplishment through effort. Work done today with focus will succeed.' },
  { name:'Shubha',     nature:'auspicious',   desc:'Auspicious in all respects. Excellent for new starts and auspicious ceremonies.' },
  { name:'Shukla',     nature:'auspicious',   desc:'Purity and clarity of purpose bring results. Good for sacred rituals.' },
  { name:'Brahma',     nature:'auspicious',   desc:'Creative power and learning are especially strong. Excellent for study.' },
  { name:'Indra',      nature:'auspicious',   desc:'Leadership, authority, and victory are favoured. Good for seeking positions of influence.' },
  { name:'Vaidhriti',  nature:'inauspicious', desc:'Avoid beginning new work; delays and obstacles are likely. Patience is the key.' }
];

// 7 Varas (weekday lords)
const VARAS = [
  { name:'Ravivar',   english:'Sunday',    lord:'Sun',     nature:'mixed',
    desc:'Day of the Sun. Auspicious for authority, government work, and father-related matters. Shiva and Sun worship are powerful. Avoid medical treatments.' },
  { name:'Somvar',    english:'Monday',    lord:'Moon',    nature:'auspicious',
    desc:'Day of the Moon. Excellent for family, emotional healing, and water-related activities. Shiva worship is especially blessed on Mondays.' },
  { name:'Mangalvar', english:'Tuesday',   lord:'Mars',    nature:'mixed',
    desc:'Day of Mars. Good for courage, physical activity, and technical work. Avoid sensitive negotiations. Hanuman and Kartikeya worship recommended.' },
  { name:'Budhvar',   english:'Wednesday', lord:'Mercury', nature:'auspicious',
    desc:'Day of Mercury. Excellent for business, communication, education, and beginning new learning. Vishnu worship is auspicious.' },
  { name:'Guruvar',   english:'Thursday',  lord:'Jupiter', nature:'auspicious',
    desc:'Day of Jupiter (Guru). The most auspicious day of the week for ceremonies, new ventures, and teacher worship. Avoid haircuts and shaving.' },
  { name:'Shukravar', english:'Friday',    lord:'Venus',   nature:'auspicious',
    desc:'Day of Venus. Excellent for marriage, romance, arts, luxury, and celebration. Lakshmi worship is powerful on Fridays.' },
  { name:'Shanivar',  english:'Saturday',  lord:'Saturn',  nature:'inauspicious',
    desc:'Day of Saturn. Avoid new beginnings. Best used for service, completing old tasks, and Shani or Hanuman worship.' }
];

// 11 Karana types for lookup
const KARANA_MOVING = ['Bava','Balava','Kaulava','Taitila','Garija','Vanija','Vishti'];
const KARANA_NATURE = { Vishti:'inauspicious', Kimstughna:'inauspicious', Naga:'inauspicious' };

// Rahu Kaal block index by weekday (0=Sun..6=Sat), each block = 90 min from 6:00 AM
const RAHU_KAAL_BLOCK = [8, 2, 7, 5, 6, 4, 3]; // day index 0..6 → block number 1..8
const GULIKA_BLOCK    = [7, 6, 5, 4, 3, 2, 1];

// ══════════════════════════════════════════════════════════
// § 2  COMPUTATION
// ══════════════════════════════════════════════════════════

function getKarana(moonSid, sunSid) {
  const angle = (moonSid - sunSid + 360) % 360;
  const k = Math.floor(angle / 6); // 0-59
  if (k === 0) return { name:'Kimstughna', nature:'inauspicious', type:'fixed' };
  if (k <= 56) {
    const name = KARANA_MOVING[(k - 1) % 7];
    return { name, nature: KARANA_NATURE[name] || 'auspicious', type:'moving' };
  }
  if (k === 57) return { name:'Shakuni',     nature:'mixed',       type:'fixed' };
  if (k === 58) return { name:'Chatushpada', nature:'mixed',       type:'fixed' };
  return            { name:'Naga',         nature:'inauspicious', type:'fixed' };
}

function blockToTime(block) {
  // Block 1 = 6:00-7:30 AM, block 2 = 7:30-9:00 AM, ...
  const startMin = 360 + (block - 1) * 90; // minutes from midnight
  const endMin   = startMin + 90;
  function fmt(m) {
    const h = Math.floor(m / 60) % 24;
    const mn = m % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hh = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hh}:${String(mn).padStart(2,'0')} ${ampm}`;
  }
  return `${fmt(startMin)} – ${fmt(endMin)}`;
}

function computePanchang(date) {
  // Use noon IST (UTC+5:30 = 6.5) as canonical reference
  const utH = Math.max(0, 12 - 5.5); // 6.5 UT ≈ noon IST
  const jd  = julianDay(date.getFullYear(), date.getMonth() + 1, date.getDate(), utH);
  const ay  = lahiriAyanamsa(jd);

  const sunSid  = ((sunLongitude(jd)  - ay) + 360) % 360;
  const moonSid = ((moonLongitude(jd) - ay) + 360) % 360;

  // Tithi: each Tithi = 12° of Moon-Sun separation
  const tithiAngle = (moonSid - sunSid + 360) % 360;
  const tithiIdx   = Math.floor(tithiAngle / 12); // 0-29
  const tithi      = TITHIS[tithiIdx];
  const tithiDeg   = tithiAngle % 12;             // degrees into current Tithi

  // Nakshatra of the Moon
  const NAK_SPAN = 360 / 27;
  const nakIdx   = Math.floor(moonSid / NAK_SPAN);
  const nakshatra = NAKSHATRAS[nakIdx];
  const nakDeg    = moonSid % NAK_SPAN;

  // Yoga: each Yoga = (Sun + Moon) / (360/27)
  const yogaAngle = (sunSid + moonSid) % 360;
  const yogaIdx   = Math.floor(yogaAngle / NAK_SPAN);
  const yoga      = YOGAS[yogaIdx];

  // Karana
  const karana = getKarana(moonSid, sunSid);

  // Vara (weekday)
  const vara = VARAS[date.getDay()];

  // Rahu Kaal and Gulika
  const dayNum = date.getDay();
  const rahuKaal = blockToTime(RAHU_KAAL_BLOCK[dayNum]);
  const gulikaKaal = blockToTime(GULIKA_BLOCK[dayNum]);

  // Abhijit Muhurtha: 48 min around midday (11:36 AM – 12:24 PM standard)
  const abhijit = '11:36 AM – 12:24 PM';

  // Overall day quality
  const ausp = [tithi.nature, yoga.nature, vara.nature, karana.nature];
  const badCount  = ausp.filter(n => n === 'inauspicious').length;
  const goodCount = ausp.filter(n => n === 'auspicious').length;
  const dayQuality = badCount >= 2 ? 'inauspicious' : goodCount >= 3 ? 'auspicious' : 'mixed';

  // Day guidance
  const guidanceLines = [];
  if (vara.nature === 'auspicious') guidanceLines.push(`${vara.english} (${vara.lord}'s day) is generally favourable — honour this by visiting a ${vara.lord}-related temple or starting the day with the relevant mantra.`);
  if (tithi.nature === 'auspicious') guidanceLines.push(`${tithi.paksha} ${tithi.name} supports ${tithi.desc.toLowerCase()}`);
  if (yoga.nature === 'inauspicious') guidanceLines.push(`Today's Yoga (${yoga.name}) advises caution — ${yoga.desc.toLowerCase()}`);
  if (yoga.nature === 'auspicious')   guidanceLines.push(`Today's Yoga (${yoga.name}) is auspicious — ${yoga.desc.toLowerCase()}`);
  if (karana.name === 'Vishti') guidanceLines.push('Vishti (Bhadra) Karana is currently active — avoid important beginnings during this half-Tithi.');

  return {
    date, jd, sunSid, moonSid,
    tithi, tithiIdx, tithiDeg,
    nakshatra, nakIdx, nakDeg,
    yoga, yogaIdx,
    karana,
    vara,
    rahuKaal, gulikaKaal, abhijit,
    dayQuality, guidanceLines
  };
}

// ══════════════════════════════════════════════════════════
// § 3  RENDER
// ══════════════════════════════════════════════════════════

const NATURE_CLS = { auspicious:'panch-auspicious', inauspicious:'panch-inauspicious', mixed:'panch-mixed' };
const NATURE_LABEL = { auspicious:'Auspicious', inauspicious:'Caution', mixed:'Neutral' };

function renderPanchangHTML(p) {
  const dateStr = p.date.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  // Helper for one element card
  function panCard(icon, label, name, sub, desc, nature) {
    const cls = NATURE_CLS[nature] || '';
    return `
      <div class="panch-card ${cls}">
        <div class="panch-icon">${icon}</div>
        <div class="panch-label">${label}</div>
        <div class="panch-name">${name}</div>
        ${sub ? `<div class="panch-sub">${sub}</div>` : ''}
        <p class="panch-desc">${desc}</p>
        <div class="panch-nature-badge ${cls}">${NATURE_LABEL[nature] || nature}</div>
      </div>`;
  }

  const tithiPer = Math.round((p.tithiDeg / 12) * 100);
  const nakPer   = Math.round((p.nakDeg / (360/27)) * 100);

  let html = `
    <div class="panchang-block">
      <div class="panchang-date-bar">
        <span class="pdb-om">☽</span>
        <span class="pdb-date">${dateStr}</span>
        <span class="pdb-quality panch-${p.dayQuality}">${{ auspicious:'✦ Auspicious Day', inauspicious:'⚠ Proceed with Care', mixed:'◈ Mixed Energies' }[p.dayQuality]}</span>
      </div>

      <div class="panchang-grid">
        ${panCard('🌙', 'Tithi — Lunar Day', `${p.tithi.paksha} ${p.tithi.name}`, `Lord: ${p.tithi.lord} · ${tithiPer}% elapsed`, p.tithi.desc, p.tithi.nature)}
        ${panCard(p.vara.lord === 'Sun' ? '☉' : p.vara.lord === 'Moon' ? '☽' : p.vara.lord === 'Mars' ? '♂' : p.vara.lord === 'Mercury' ? '☿' : p.vara.lord === 'Jupiter' ? '♃' : p.vara.lord === 'Venus' ? '♀' : '♄', 'Vara — Weekday', `${p.vara.name} (${p.vara.english})`, `Ruling planet: ${p.vara.lord}`, p.vara.desc, p.vara.nature)}
        ${panCard('⭐', 'Nakshatra — Moon Star', p.nakshatra.n, `Lord: ${p.nakshatra.lord} · ${nakPer}% elapsed`, `Today the Moon transits ${p.nakshatra.n}, ruled by ${p.nakshatra.lord}. Deity: ${p.nakshatra.deity}. This nakshatra carries the quality of ${p.nakshatra.gana} gana — ${p.nakshatra.gana === 'Deva' ? 'divine, sattvic, auspicious for most ceremonies' : p.nakshatra.gana === 'Manushya' ? 'human, rajasic, good for worldly activities' : 'fierce, tamasic, powerful for protective or aggressive intentions'}.`, 'auspicious')}
        ${panCard('◎', 'Yoga — Sun+Moon', p.yoga.name, `Index: ${p.yogaIdx + 1} of 27`, p.yoga.desc, p.yoga.nature)}
        ${panCard('◑', 'Karana — Half-Tithi', p.karana.name, `Type: ${p.karana.type}`, `The Karana is the half-Tithi unit. ${p.karana.name} is a ${p.karana.type} Karana and is ${p.karana.nature}. ${p.karana.name === 'Vishti' ? 'Vishti (also called Bhadra) is the most inauspicious Karana — avoid beginning anything important while it is active.' : p.karana.nature === 'auspicious' ? 'Auspicious Karanas support undertaking new activities in this half-Tithi.' : 'Exercise caution and prefer completion over new beginnings.'}`, p.karana.nature)}
      </div>

      <div class="panchang-timings">
        <div class="pt-title">Today's Auspicious &amp; Inauspicious Timings</div>
        <div class="pt-grid">
          <div class="pt-row pt-good">
            <span class="pt-icon">✦</span>
            <div class="pt-body">
              <div class="pt-label">Abhijit Muhurtha</div>
              <div class="pt-time">${p.abhijit}</div>
              <div class="pt-note">The most universally auspicious daily period — midday window blessed by the Sun. Begin important work here when other Muhurthas are unavailable.</div>
            </div>
          </div>
          <div class="pt-row pt-bad">
            <span class="pt-icon">⚠</span>
            <div class="pt-body">
              <div class="pt-label">Rahu Kaal</div>
              <div class="pt-time">${p.rahuKaal} <span class="pt-note-inline">(approx., standard sunrise 6 AM)</span></div>
              <div class="pt-note">Avoid beginning new ventures, signing contracts, or starting journeys during Rahu Kaal. Recite Rahu mantra if you must act: <em>Om Raam Rahave Namaha</em>.</div>
            </div>
          </div>
          <div class="pt-row pt-bad">
            <span class="pt-icon">⚠</span>
            <div class="pt-body">
              <div class="pt-label">Gulika Kaal</div>
              <div class="pt-time">${p.gulikaKaal} <span class="pt-note-inline">(approx.)</span></div>
              <div class="pt-note">Sub-period of Saturn's son — avoid auspicious ceremonies and new beginnings during this window.</div>
            </div>
          </div>
        </div>
      </div>`;

  if (p.guidanceLines.length) {
    html += `
      <div class="panchang-guidance">
        <div class="pg-title">Today's Guidance</div>
        <ul class="pg-list">`;
    p.guidanceLines.forEach(g => { html += `<li>${g}</li>`; });
    html += `</ul></div>`;
  }

  html += `</div>`;
  return html;
}

if (typeof window !== 'undefined') {
  window.Panchang = { computePanchang, renderPanchangHTML };
}
