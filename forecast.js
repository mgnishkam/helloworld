// forecast.js — Yearly and Monthly prediction engine.
// Depends on: julianDay, lahiriAyanamsa, planetLongitude (astro.js)
//             SIGNS (interpret.js)
//             getCurrentPeriods (dasha.js)

// ══════════════════════════════════════════════════════════
// § 1  TRANSIT TEXT BANKS
// ══════════════════════════════════════════════════════════

// Jupiter transit through houses 1-12 from Lagna (index = house-1)
const JUP_HOUSE = [
  { title:'Jupiter transits your Lagna', text:'A wave of optimism, vitality, and new opportunity arrives. Personality becomes more magnanimous; new ventures prosper. Spiritual inclinations deepen. This is one of the most auspicious transits in Jyotish — blessings flow especially if a Jupiter-related Dasha is concurrently running. Physical weight may increase; a regular walk and moderate diet channels Jupiter\'s abundance productively.' },
  { title:'Jupiter transits your 2nd house', text:'Financial fortune improves and family income expands. Family harmony is supported; pleasant gatherings follow. Speech becomes more eloquent — public speaking or teaching can be especially rewarding. Interest in sacred texts and philosophy draws you toward learning. Avoid overindulgence in rich food and unnecessary expenditure.' },
  { title:'Jupiter transits your 3rd house', text:'Effort and initiative are rewarded — Jupiter here asks for courage and then delivers results. Short trips are productive; writing, media, and communication flourish. Sibling relationships warm considerably. Results come through your own action more than spontaneous luck; the second half of this transit is stronger than the first.' },
  { title:'Jupiter transits your 4th house', text:'Domestic life is blessed — home improvement, property acquisition, and family happiness are all favoured. The mother\'s wellbeing improves. Academic pursuits prosper. Vehicles and comforts may be added. A rare deep inner contentment characterises the later months. Property investments made now tend to yield long-term value.' },
  { title:'Jupiter transits your 5th house', text:'Creative and romantic energies peak. This is the classic transit for having children — conception or joyful news is common. Creative work finds recognition. Romance deepens for the partnered; new love may arrive for the single. Speculative investments can profit, though moderation is wise. Students often achieve breakthroughs under this transit.' },
  { title:'Jupiter transits your 6th house', text:'An upachaya house — Jupiter here gradually dissolves obstacles. Enemies are neutralised through goodwill. Persistent health problems begin to resolve. Work and service become more meaningful. Legal matters tend to resolve in your favour. Debts can be cleared this year with disciplined effort. This transit rewards engagement, not passivity.' },
  { title:'Jupiter transits your 7th house', text:'Partnerships of all kinds are blessed — marriage, business, and collaborations receive Jupiter\'s grace. For those seeking marriage, this is one of the most reliable transits for it to happen. Existing marriages deepen in trust. Business partnerships are productive. Legal contracts work out favourably. The name and reputation improve in professional circles.' },
  { title:'Jupiter transits your 8th house', text:'A mixed transit — Jupiter here expands 8th-house themes of transformation, occult knowledge, and shared wealth. Inheritance or windfall is possible. Research, psychology, and spiritual depth are rewarded. Health requires attention, especially in the first months. Deep personal transformation occurs: what was hidden becomes strength.' },
  { title:'Jupiter transits your 9th house', text:'Jupiter in its natural domain is supremely auspicious. Fortune peaks, dharmic inspiration flows, and teachers and guides appear. This is the year for pilgrimages, higher studies, and spiritual connection. The father\'s blessings are particularly significant. Long-distance travel is especially productive. This transit\'s blessings persist for years afterward.' },
  { title:'Jupiter transits your 10th house', text:'Career recognition arrives — promotions, public reputation, and professional achievements are actively supported. Authority figures become allies. New responsibilities that feel challenging lead to long-term growth. The public face becomes more visible and past work begins to bear recognised fruit. Step forward, take credit, and build the professional legacy.' },
  { title:'Jupiter transits your 11th house', text:'The classic transit for financial gains, fulfilment of desires, and social success. Income rises, old debts are repaid, and long-held wishes have a strong chance of manifesting. Social connections multiply — new networks bring valuable opportunities. Elder siblings prosper and support you. This is considered the single best Jupiter transit for material gain.' },
  { title:'Jupiter transits your 12th house', text:'A spiritually rich but materially recessive transit. Expenses increase — wisely directed toward travel, spiritual retreat, or education they become meaningful investments. The mind turns inward; meditation and solitude are deeply beneficial. Foreign travel is likely. For those with spiritual orientation, this transit can bring profound inner peace and liberation.' }
];

// Saturn transit through houses 1-12 from Lagna (index = house-1)
const SAT_HOUSE = [
  { title:'Saturn transits your Lagna', text:'A period of significant self-restructuring. Health discipline is essential; responsibilities multiply. Slow, steady effort without shortcuts defines the year. By the time Saturn moves on, you will be more disciplined, more honest, and more capable. (Also part of Sade Sati if your Moon is in the Lagna sign.)' },
  { title:'Saturn transits your 2nd house', text:'Financial discipline is required — plan expenditure carefully. Family relationships may be strained by old wounds resurfacing. Speech must be measured. However, genuine disciplined effort can restructure finances into something more durable. (Part of Sade Sati if Moon is in the 1st sign.)' },
  { title:'Saturn transits your 3rd house', text:'Persistent effort is heavily rewarded over time — the 3rd is an upachaya house. Siblings may pose occasional challenges; patience and cooperation pay off. Communication becomes more careful and precise: a good period for detailed writing, technical work, or skilled craftsmanship. The second half of this transit is more rewarding.' },
  { title:'Saturn transits your 4th house', text:'Domestic peace may be disrupted — property matters, home repairs, or family obligations take centre stage. The mother\'s health may require attention. A feeling of rootlessness is possible; Saturn is asking you to build something more permanent. Property disputes are common. Studies begun seriously now lead to lasting qualifications.' },
  { title:'Saturn transits your 5th house', text:'Creative projects require patient, disciplined effort before bearing fruit — Saturn delays rather than denies. Children may bring responsibilities more than ease. Romance may be tested. Speculative investments should be strictly avoided. Creative work undertaken with serious discipline — long-form writing, structured artistic projects — builds enduring foundations.' },
  { title:'Saturn transits your 6th house', text:'One of Saturn\'s most favourable transit positions. The 6th is an upachaya house and Saturn here excels — defeating enemies, recovering from illness, and creating disciplined excellence. Legal matters tend to resolve in your favour. Debts are cleared systematically. Adversaries are outworked. Health discipline now creates lasting vitality. Good habits made now stick.' },
  { title:'Saturn transits your 7th house', text:'Partnerships face scrutiny — marriage relationships experience distance, increased responsibility, or frank reappraisal. Business partnerships require careful contractual clarity. Marriage commitments may be delayed. However, relationships that endure this transit emerge far more authentic and durable. Foreign travel and legal matters require patience.' },
  { title:'Saturn transits your 8th house', text:'Hidden matters, chronic health conditions, and joint financial arrangements come under scrutiny. This is a period for careful attention to health — preventive care pays dividends. Occult or spiritual inquiry deepens. Jointly-held assets may require management. What no longer serves the life must be released. This is one of life\'s great personal transformation periods.' },
  { title:'Saturn transits your 9th house', text:'Fortune temporarily contracts as Saturn passes through dharma, higher learning, and fate. Long-distance travel may be delayed. The father\'s health may require attention. Philosophical beliefs are tested and purified — old dogmas release, a more personal spiritual understanding emerges. The integrity and right action during this period creates fortune for the next decade.' },
  { title:'Saturn transits your 10th house', text:'Saturn in the 10th — its own natural domain — is one of the most productive career transits, though it demands sustained, disciplined effort. Hard-earned authority, promotions through merit, and long-term recognition are possible. The public life comes under scrutiny: integrity pays richly. Career restructuring that seems difficult now creates a lasting professional legacy.' },
  { title:'Saturn transits your 11th house', text:'Social circles restructure — superficial friendships are shed; meaningful ones deepen. Financial gains come through steady effort. Elder siblings may need support. Long-term goals that were worked toward persistently begin to show results. The 11th is an upachaya house — Saturn here delivers genuine and lasting gains. New associations bring serious, purposeful people.' },
  { title:'Saturn transits your 12th house', text:'Expenses must be managed carefully; hidden costs are common. Sleep may be disrupted; hidden anxieties surface for examination. Foreign travel or periods of retreat are possible. Spiritual practice deepens naturally. Clearing debts, forgiving old grievances, and letting go of the unnecessary prepares the ground for the renewal ahead when Saturn crosses the Lagna.' }
];

// Rahu transit through houses 1-12 from Lagna (index = house-1)
const RAHU_HOUSE = [
  { title:'Rahu transits your Lagna', text:'Intense personal transformation — a strong desire to project a new, often unconventional identity. Ambition rises sharply. Foreign influence or unusual experiences reshape the personality. The body may experience unusual or hard-to-diagnose symptoms. Simultaneously, Ketu in the 7th brings karmic completion in partnerships. Do not make permanent identity decisions mid-transit.' },
  { title:'Rahu transits your 2nd house', text:'Unusual financial opportunities — and risks — appear. Income may come from unexpected or unconventional sources. Family dynamics may be disrupted. Avoid exaggeration in communication; manipulation is amplified by Rahu here. Dietary habits change significantly. Savings require deliberate protection during this transit.' },
  { title:'Rahu transits your 3rd house', text:'Ambition and courage are powerfully amplified. Short trips multiply; communication work intensifies. Siblings may be both helpful and complicated. This is a productive transit for those in media, technology, or sales. Sudden courage and initiative produce surprising results. Ketu simultaneously in the 9th reduces attachment to conventional religion and luck.' },
  { title:'Rahu transits your 4th house', text:'Home and domestic life undergo change — property matters, moves, or renovation projects dominate. The mother\'s life may include unusual events. A restless dissatisfaction with the home environment is strong. Property investments, if carefully researched, can be profitable. Technology and modern comforts enter the home. Ketu in the 10th brings detachment from career ambitions.' },
  { title:'Rahu transits your 5th house', text:'Creative risk-taking, unconventional romance, and unusual child-related matters characterise this period. Speculation and trading can bring dramatic gains — and equally dramatic losses. Romantic attractions may be intense and karmically charged. Creative work may reach a wider than expected audience. Academic pursuit should be disciplined.' },
  { title:'Rahu transits your 6th house', text:'Rahu in the 6th is auspicious for overcoming opponents and winning competitive battles. The method of victory tends to be unconventional — using strategy, technology, or unexpected approaches. Health improvement is possible through alternative methods. This transit can produce sudden and dramatic reversal of adversity.' },
  { title:'Rahu transits your 7th house', text:'Partnerships carry karmic intensity. Unusual, foreign, or unconventional romantic or business partners enter the scene. Existing partnerships face unusual challenges — transparency and patience are essential. Business partnerships can flourish if both parties are aligned and agreements are crystal clear. Foreign travel for partnership or business reasons is likely.' },
  { title:'Rahu transits your 8th house', text:'Occult experiences, sudden transformative events, and the hidden dimensions of life are amplified. Research and investigative work prosper. Unexpected inheritance or joint financial matters may arise. Interest in astrology, psychology, or hidden knowledge can become consuming. Steadiness, grounding, and a regular spiritual practice are the best support for this challenging transit.' },
  { title:'Rahu transits your 9th house', text:'Unconventional philosophical and spiritual influences come forward — foreign teachers, unorthodox systems, and cross-cultural wisdom all carry unusual attraction. Long-distance travel is strongly supported. Fortune works in surprising ways. Conventional religious affiliations may feel insufficient. The father or a significant teacher figure may go through an unusual period.' },
  { title:'Rahu transits your 10th house', text:'Career ambitions surge — Rahu in the 10th is powerful for those willing to embrace unconventional professional paths. Sudden rises, unusual job opportunities, and public recognition through atypical means are all possible. Foreign connections play a role in professional advancement. Public image may be polarising; ride the momentum while maintaining integrity.' },
  { title:'Rahu transits your 11th house', text:'Financial gains through unexpected or unusual sources are very likely — Rahu in the 11th is one of the best transits for material gain and network expansion. Technology-related income is especially favoured. Gains come suddenly. Elder siblings or close friends may play an instrumental role. Ketu in the 5th brings detachment from older creative patterns.' },
  { title:'Rahu transits your 12th house', text:'Rahu in the 12th amplifies the pull toward foreign lands, hidden environments, spiritual practice, and unusual states of consciousness. Expenditure increases; some of it flows toward meaningful transformative experiences. Dreams become vivid and significant. This transit deepens the spiritual life considerably for those who work with it consciously.' }
];

// Pratyantar lord themes — the flavour of each planet as Pratyantar lord
const PRAT_THEMES = {
  Sun:     { icon:'☉', theme:'Authority, clarity, and vitality', text:'The Sun\'s sub-period brings a month of focus, authority, and clarity of purpose. Your energy is heightened and your presence commands attention. Government matters, career decisions, and dealings with authority figures are highlighted. Physical vitality is good — use it for purposeful action. Father\'s matters may require attention. Be generous: the Sun\'s energy is most beneficial when it shines outward.' },
  Moon:    { icon:'☽', theme:'Emotions, intuition, and home', text:'The Moon\'s sub-period brings a month of emotional sensitivity, heightened intuition, and focus on home and family. Travel may increase. Relationships with women are especially significant. The mind is reflective; creative and artistic work flourishes. Attend to the mother\'s wellbeing. Time near water, regular sleep, and avoiding emotional reactivity all support the month\'s energy.' },
  Mars:    { icon:'♂', theme:'Energy, action, and courage', text:'Mars\'s sub-period brings heightened energy, initiative, and the need for decisive action. Physical activity is important to channel Mars productively — exercise, sports, or manual work. Anger and impatience are the month\'s challenges; pause before reacting. Disputes can be resolved swiftly if approached directly and honestly. Property and brothers are highlighted.' },
  Mercury: { icon:'☿', theme:'Communication, intellect, and trade', text:'Mercury\'s sub-period activates the intellect and communication. Writing, analysis, negotiations, and detailed work all prosper. Business transactions and trade are favoured. Short trips are productive. Social interactions multiply pleasantly. Mental agility is at its best — complex problems yield to careful thought. Be cautious with contracts; read the fine print.' },
  Jupiter: { icon:'♃', theme:'Wisdom, fortune, and expansion', text:'Jupiter\'s sub-period brings one of the most auspicious months of the Dasha cycle. Wisdom and good fortune flow. Teachers, mentors, or guides may appear. Long-pending matters resolve favourably. Financial prosperity, spiritual insight, and family harmony characterise the period. This is an excellent month for beginning new ventures, seeking blessings, or undertaking pilgrimage.' },
  Venus:   { icon:'♀', theme:'Beauty, love, and abundance', text:'Venus\'s sub-period brings a month of pleasure, romance, aesthetic appreciation, and material comfort. Relationships are harmonious and warm. Artistic work finds both inspiration and recognition. Financial prosperity accompanies the period. Social life flourishes. Use this energy for deepening relationships, creative work, and appreciating the beauty around you rather than overindulgence.' },
  Saturn:  { icon:'♄', theme:'Discipline, patience, and karma', text:'Saturn\'s sub-period is a month of duty, patience, and karmic accounting. Old responsibilities require attention; delays and obstacles test character. Steady, disciplined effort is what Saturn rewards here — do not rush or take shortcuts. Service, charitable acts, and helping the elderly or marginalised are particularly powerful this month. Health discipline and sleep quality deserve attention.' },
  Rahu:    { icon:'☊', theme:'Ambition, disruption, and transformation', text:'Rahu\'s sub-period brings unusual intensity, ambition, and possible disruption. Unexpected events can be both challenging and opportunity-bearing — stay flexible. Foreign matters, technology, and unconventional pursuits are highlighted. The mind can become obsessive; ground yourself through nature, physical activity, and regular meditation. Avoid speculation, intoxicants, and questionable associations.' },
  Ketu:    { icon:'☋', theme:'Spirituality, detachment, and karma', text:'Ketu\'s sub-period is a profoundly internal month — the pull toward spirituality, solitude, and inner contemplation is strong. Events may feel karmically destined. Use this introspective mood for reflection rather than resignation. Spiritual practices, meditation, and study of sacred texts are deeply rewarding this month. Health may require attention, especially for mysterious or difficult-to-diagnose conditions.' }
};

// Sun in house 1-12 from Lagna — monthly solar focus (index = house-1)
const SUN_MONTH_HOUSE = [
  { title:'Sun transits your Lagna', text:'Personal energy peaks. Natural leadership, visible recognition, and a strong sense of purpose define this month. The body feels vibrant. Your presence in any room is noticed. Drive and intention align — use this month to initiate, assert, and move forward.' },
  { title:'Sun illuminates your 2nd house', text:'Focus on financial planning, family interactions, and the power of your words. A strong month to negotiate a raise, review savings, or speak publicly. Family gatherings are warm. Avoid harsh speech — what you say now carries more weight than usual.' },
  { title:'Sun travels through your 3rd house', text:'Courage, short journeys, writing, and sibling interactions are highlighted. Initiative taken this month is backed by unusual clarity and willpower. Communication work — writing, presenting, negotiating — produces exceptional results. A good month to make that phone call or pitch.' },
  { title:'Sun moves through your 4th house', text:'Home, mother, property, and inner peace take centre stage. Family gatherings are warm and supportive. Consider home improvements or property decisions. Inner life seeks quiet and rootedness — honour this need alongside your outer responsibilities.' },
  { title:'Sun transits your 5th house', text:'Creativity, children, romance, and speculation are all lit up. A month for expression, play, and joyful engagement. Creative work finds an audience. Guard against speculative excess; the Sun here can make risk-taking feel more appealing than it really is.' },
  { title:'Sun moves through your 6th house', text:'Work intensity increases; health awareness rises. Resolve disputes with confidence — your vitality helps you outwork any obstacle this month. Attend to diet and exercise. Enemies or competitors are neutralised through sheer diligence. This is a month to focus and deliver.' },
  { title:'Sun transits your 7th house', text:'Partnerships, marriage, and legal contracts are highlighted. Public dealings prosper. The balance between ego and cooperation is this month\'s key lesson — those who partner rather than dominate gain the most. A good month for signing agreements and strengthening key relationships.' },
  { title:'Sun passes through your 8th house', text:'Research, transformation, and hidden matters come forward. Attend to health and finances carefully. Spiritual depth is accessible. Unexpected events may require you to adapt — do so with the Sun\'s characteristic courage. Avoid unnecessary conflict; hidden opponents may be active.' },
  { title:'Sun illuminates your 9th house', text:'Fortune, dharma, teachers, and long journeys are favoured. A month for philosophy, spiritual study, and seeking blessings from the father or a teacher figure. Long-distance travel is productive. This is one of the most auspicious Sun transits — act on your highest intentions.' },
  { title:'Sun transits your 10th house', text:'Career visibility peaks. Recognition, authority, and professional action are fully supported. Your efforts are seen and appreciated. Step forward, take credit, and pursue the most ambitious professional goal on your list — this month\'s solar energy backs you.' },
  { title:'Sun moves through your 11th house', text:'Income and gains, social success, and desire-fulfilment are highlighted. Network with intention; elder siblings or senior friends are supportive. Gains from multiple sources are possible. A good month to ask for what you want — the solar energy here says yes.' },
  { title:'Sun passes through your 12th house', text:'A time for rest, reflection, retreat, and inner work. Expenses need watching; hidden costs may appear. Foreign connections or spiritual practice bring the most value. The month rewards solitude and honest self-examination. Avoid overextending in public or professional spheres.' }
];

// ══════════════════════════════════════════════════════════
// § 2  HELPERS
// ══════════════════════════════════════════════════════════

function transitPlanetSign(planetName, date) {
  const jd = julianDay(date.getFullYear(), date.getMonth()+1, date.getDate(), 12);
  const ay = lahiriAyanamsa(jd);
  const lon = ((planetLongitude(planetName, jd) - ay) + 360) % 360;
  const signIdx = Math.floor(lon / 30);
  return { signIdx, lon, sign: SIGNS[signIdx] };
}

function houseFromSign(planetSignIdx, refSignIdx) {
  return ((planetSignIdx - refSignIdx + 12) % 12) + 1;
}

function lastBirthday(birthDate) {
  const today = new Date();
  let bd = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  if (bd > today) bd.setFullYear(bd.getFullYear() - 1);
  return bd;
}

function nextBirthday(birthDate) {
  const lb = lastBirthday(birthDate);
  const nb = new Date(lb);
  nb.setFullYear(nb.getFullYear() + 1);
  return nb;
}

function fmtDateFc(d) {
  if (!d || isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

function ordFc(n) {
  const s = ['th','st','nd','rd'], v = n % 100;
  return n + (s[(v-20)%10] || s[v] || s[0]);
}

// ══════════════════════════════════════════════════════════
// § 3  YEARLY FORECAST
// ══════════════════════════════════════════════════════════

const DASHA_REMEDY_YEARLY = {
  Sun:     'Offer water (Arghya) to the rising Sun daily and recite <em>Om Suryaya Namaha</em> 108 times. The Sun Mahadasha responds to reverence for the father and service to authority figures.',
  Moon:    'Offer white flowers and milk to Lord Shiva on Mondays. Maintain a consistent sleep schedule; emotional regulation is the primary Moon remedy this year.',
  Mars:    'Recite <strong>Hanuman Chalisa</strong> every Tuesday and Saturday. Donate red lentils (masoor dal) and jaggery on Tuesdays.',
  Mercury: 'Recite <em>Om Budhaya Namaha</em> on Wednesdays; donate green mung dal to students. Keep communication honest and precise.',
  Jupiter: 'Perform <strong>Guru Puja</strong> on Thursdays; donate to teachers or educational institutions. Jupiter Dasha rewards generosity and dharmic action.',
  Venus:   'Offer white flowers to Goddess Lakshmi on Fridays; recite <em>Om Shukraya Namaha</em>. This Dasha responds to beauty, gratitude, and harmonious relationships.',
  Saturn:  'Recite <strong>Shani Stotra or Shani Kavach</strong> regularly. Service to the elderly, disabled, and marginalised is the most powerful Saturn remedy.',
  Rahu:    'Worship Lord Shiva and recite <strong>Mahamrityunjaya Mantra</strong> 108 times daily. Ground yourself in spiritual practice during Rahu Dasha.',
  Ketu:    'Worship <strong>Lord Ganesha</strong> and recite <em>Om Gam Ganapataye Namaha</em> on Tuesdays. Ketu Dasha rewards detachment and meditation.'
};

function buildYearlyForecast(dashaResult, positions, lagnaSignIdx, moonSignIdx, birthDate) {
  const today = new Date();
  const lb    = lastBirthday(birthDate);
  const nb    = nextBirthday(birthDate);

  // Get current periods
  const cp = (typeof window !== 'undefined' && window.Dasha)
    ? window.Dasha.getCurrentPeriods(dashaResult)
    : null;
  const mdLord   = cp?.maha?.lord  || null;
  const adLord   = cp?.anta?.lord  || null;

  // Collect Antardashas that overlap the birthday year
  const activeDashas = [];
  for (const md of (dashaResult.dashas || [])) {
    for (const ad of (md.antardashas || [])) {
      const adStart = new Date(ad.startDate), adEnd = new Date(ad.endDate);
      if (adEnd >= lb && adStart <= nb) {
        activeDashas.push({
          md: md.lord, ad: ad.lord,
          start: adStart < lb ? lb : adStart,
          end:   adEnd   > nb ? nb : adEnd,
          isCurrent: ad.isCurrent
        });
      }
    }
  }

  // Transit planets at birthday-year midpoint
  const midYear = new Date((lb.getTime() + nb.getTime()) / 2);
  const jupTr = transitPlanetSign('Jupiter', midYear);
  const satTr = transitPlanetSign('Saturn',  midYear);
  const rahTr = transitPlanetSign('Rahu',    midYear);

  const jupH = houseFromSign(jupTr.signIdx, lagnaSignIdx);
  const satH = houseFromSign(satTr.signIdx, lagnaSignIdx);
  const rahH = houseFromSign(rahTr.signIdx, lagnaSignIdx);

  const themes = [
    { planet:'Jupiter', icon:'♃', cls:'ft-jupiter', ...JUP_HOUSE[jupH-1] },
    { planet:'Saturn',  icon:'♄', cls:'ft-saturn',  ...SAT_HOUSE[satH-1] },
    { planet:'Rahu',    icon:'☊', cls:'ft-rahu',    ...RAHU_HOUSE[rahH-1] }
  ];

  // Year remedies
  const yearRemedies = [];
  if ([6,8,12].includes(jupH)) {
    yearRemedies.push('Jupiter is in a challenging house this year — recite <strong>Guru Stotra or Vishnu Sahasranama</strong> on Thursdays to strengthen its beneficial influence.');
  } else {
    yearRemedies.push('Jupiter is well-placed this year — honour Thursday by donating yellow items (turmeric, yellow lentils, bananas) to teachers, priests, or students.');
  }
  if ([1,2,4,7,8,12].includes(satH)) {
    yearRemedies.push('Light a <strong>mustard-oil lamp</strong> under a Peepal tree every Saturday evening and chant <em>Om Shanaishcharaya Namaha</em> 108 times. Donate black sesame, urad dal, iron, or footwear to those who work hard.');
  } else {
    yearRemedies.push('Saturn is productively placed — Saturday discipline (service, fasting, a long walk) maximises its constructive energy this year.');
  }
  yearRemedies.push('Rahu remedy: Recite <strong>Rahu Beej Mantra</strong> (<em>Om Bhraam Bhreem Bhraum Sah Rahave Namaha</em>) on Saturdays at dusk — 108 times. Feed animals and maintain scrupulous honesty.');
  if (mdLord && DASHA_REMEDY_YEARLY[mdLord]) {
    yearRemedies.push(`<strong>${mdLord} Mahadasha remedy:</strong> ${DASHA_REMEDY_YEARLY[mdLord]}`);
  }
  if (adLord && adLord !== mdLord && DASHA_REMEDY_YEARLY[adLord]) {
    yearRemedies.push(`<strong>${adLord} Antardasha remedy:</strong> ${DASHA_REMEDY_YEARLY[adLord]}`);
  }

  return { lb, nb, today, activeDashas, mdLord, adLord,
           jupTr, satTr, rahTr, jupH, satH, rahH,
           themes, yearRemedies };
}

// ══════════════════════════════════════════════════════════
// § 4  MONTHLY FORECAST
// ══════════════════════════════════════════════════════════

const DASHA_REMEDY_MONTHLY = {
  Sun:     'Offer water (Arghya) to the Sun at sunrise each morning this month. Recite <em>Aditya Hridayam</em> or <em>Om Suryaya Namaha</em>.',
  Moon:    'Visit a Shiva temple or offer milk to Lord Shiva on Mondays. Practise lunar pranayama and maintain regular sleep hours.',
  Mars:    'Recite <strong>Hanuman Chalisa</strong> on Tuesdays and Saturdays. Donate red lentils (masoor dal) to a temple or the needy this Tuesday.',
  Mercury: 'Light incense in front of Lord Vishnu or Ganesha on Wednesday morning and recite <em>Om Budhaya Namaha</em> 27 or 108 times.',
  Jupiter: 'Touch the feet of your teacher or parents on Thursday, donate to an educational cause, and recite <em>Om Gurave Namaha</em>.',
  Venus:   'Offer white flowers to Goddess Lakshmi on Friday and recite <em>Om Shukraya Namaha</em>. This month favours beautiful, harmonious acts.',
  Saturn:  'Light a mustard-oil lamp on Saturday morning and recite <em>Om Shanaishcharaya Namaha</em> 108 times. Serve someone less fortunate.',
  Rahu:    'On Saturday at dusk recite Rahu Beej Mantra 108 times and offer blue flowers or durva grass to Lord Shiva.',
  Ketu:    'Light a camphor lamp on Tuesday and recite <em>Om Ketave Namaha</em>. Spend time in meditation; release something from the past.'
};

function buildMonthlyForecast(dashaResult, positions, lagnaSignIdx, moonSignIdx, birthDate) {
  const today = new Date();
  const midMonth = new Date(today.getFullYear(), today.getMonth(), 15);

  const cp = (typeof window !== 'undefined' && window.Dasha)
    ? window.Dasha.getCurrentPeriods(dashaResult)
    : null;
  const mdLord   = cp?.maha?.lord || null;
  const adLord   = cp?.anta?.lord || null;
  const pratLord = cp?.prat?.lord || null;

  // Transit planets mid-month
  const sunTr = transitPlanetSign('Sun',     midMonth);
  const jupTr = transitPlanetSign('Jupiter', midMonth);
  const satTr = transitPlanetSign('Saturn',  midMonth);
  const rahTr = transitPlanetSign('Rahu',    midMonth);

  const sunH = houseFromSign(sunTr.signIdx, lagnaSignIdx);
  const jupH = houseFromSign(jupTr.signIdx, lagnaSignIdx);
  const satH = houseFromSign(satTr.signIdx, lagnaSignIdx);
  const rahH = houseFromSign(rahTr.signIdx, lagnaSignIdx);

  const pratTheme  = pratLord ? PRAT_THEMES[pratLord] : null;
  const antarTheme = adLord   ? PRAT_THEMES[adLord]   : null;
  const sunMonthText = SUN_MONTH_HOUSE[sunH - 1];

  // Monthly remedies
  const monthRemedies = [];
  const primaryLord = pratLord || adLord || mdLord;
  if (primaryLord && DASHA_REMEDY_MONTHLY[primaryLord]) {
    monthRemedies.push(`<strong>${primaryLord} ${pratLord ? 'Pratyantar' : (adLord ? 'Antardasha' : 'Mahadasha')} remedy this month:</strong> ${DASHA_REMEDY_MONTHLY[primaryLord]}`);
  }
  if ([6,8,12].includes(sunH)) {
    monthRemedies.push('The Sun\'s transit this month passes through a challenging house — offer water to the Sun at sunrise daily and avoid conflicts with authority figures.');
  }
  if ([2,5,9,10,11].includes(jupH)) {
    monthRemedies.push('Jupiter is in a favourable position this month — honour Thursday with gratitude, teaching, or charitable acts to amplify its blessings.');
  }
  if ([1,4,7,8,12].includes(satH)) {
    monthRemedies.push('Saturn\'s transit this month calls for patience and discipline — avoid shortcuts and conflicts; use Saturday for service and honest reflection.');
  }
  monthRemedies.push('<strong>Universal this month:</strong> Morning pranayama + 10 minutes of meditation. Recite <em>Mahamrityunjaya Mantra</em> 11 times before sleep for all-round protection.');

  const monthName = today.toLocaleDateString('en-IN', { month:'long', year:'numeric' });

  return { monthName, today, mdLord, adLord, pratLord,
           pratTheme, antarTheme, sunTr, jupTr, satTr, rahTr,
           sunH, jupH, satH, rahH, sunMonthText, monthRemedies };
}

// ══════════════════════════════════════════════════════════
// § 5  RENDER
// ══════════════════════════════════════════════════════════

function renderYearlyHTML(yf) {
  if (!yf) return '';
  let html = `
    <div class="forecast-banner">
      <div class="fcb-title">Your Birthday Year</div>
      <div class="fcb-dates">${fmtDateFc(yf.lb)} &nbsp;→&nbsp; ${fmtDateFc(yf.nb)}</div>
      <div class="fcb-chips">
        <span class="fcb-chip pl-jupiter">♃ Jupiter in ${yf.jupTr.sign.name} · ${ordFc(yf.jupH)} house</span>
        <span class="fcb-chip pl-saturn">♄ Saturn in ${yf.satTr.sign.name} · ${ordFc(yf.satH)} house</span>
        <span class="fcb-chip pl-rahu">☊ Rahu in ${yf.rahTr.sign.name} · ${ordFc(yf.rahH)} house</span>
      </div>
    </div>`;

  // Active dasha periods this year
  if (yf.activeDashas.length) {
    html += `<h4 class="forecast-sub-title">Dasha Periods Active This Birthday Year</h4>
      <div class="forecast-dasha-list">`;
    for (const d of yf.activeDashas) {
      html += `
        <div class="forecast-dasha-row ${d.isCurrent ? 'fc-current' : ''}">
          <div class="fdr-planets">
            <span class="fdr-md pl-${d.md.toLowerCase()}">${d.md}</span>
            <span class="fdr-sep">›</span>
            <span class="fdr-ad pl-${d.ad.toLowerCase()}">${d.ad}</span>
            ${d.isCurrent ? '<span class="fdr-badge">Active Now</span>' : ''}
          </div>
          <div class="fdr-dates">${fmtDateFc(d.start)} – ${fmtDateFc(d.end)}</div>
        </div>`;
    }
    html += `</div>`;
  }

  // Transit themes
  html += `<h4 class="forecast-sub-title">Major Planetary Themes for This Year</h4>
    <div class="forecast-themes">`;
  for (const t of yf.themes) {
    html += `
      <div class="forecast-theme-card ${t.cls}">
        <div class="ftc-header">
          <span class="ftc-icon">${t.icon}</span>
          <span class="ftc-title">${t.title}</span>
        </div>
        <p class="ftc-text">${t.text}</p>
      </div>`;
  }
  html += `</div>`;

  // Remedies
  html += `
    <div class="forecast-remedy-block">
      <div class="frb-title">Upaya — Remedies for This Year</div>
      <ul class="vichar-list">`;
  yf.yearRemedies.forEach(r => { html += `<li>${r}</li>`; });
  html += `</ul></div>`;
  return html;
}

function renderMonthlyHTML(mf) {
  if (!mf) return '';
  let html = `
    <div class="forecast-banner">
      <div class="fcb-title">${mf.monthName}</div>
      <div class="fcb-chips">
        ${mf.mdLord   ? `<span class="fcb-chip pl-${mf.mdLord.toLowerCase()}">${mf.mdLord} Mahadasha</span>` : ''}
        ${mf.adLord   ? `<span class="fcb-chip pl-${mf.adLord.toLowerCase()}">${mf.adLord} Antardasha</span>` : ''}
        ${mf.pratLord ? `<span class="fcb-chip pl-${mf.pratLord.toLowerCase()}">${mf.pratLord} Pratyantar</span>` : ''}
      </div>
    </div>`;

  // Pratyantar / Antardasha theme
  const pt = mf.pratTheme || mf.antarTheme;
  if (pt) {
    html += `
      <div class="forecast-theme-card ft-prat">
        <div class="ftc-header">
          <span class="ftc-icon">${pt.icon}</span>
          <span class="ftc-title">${pt.theme}</span>
        </div>
        <p class="ftc-text">${pt.text}</p>
      </div>`;
  }

  // Solar month focus
  html += `
    <div class="forecast-theme-card ft-sun">
      <div class="ftc-header">
        <span class="ftc-icon">☉</span>
        <span class="ftc-title">${mf.sunMonthText.title}</span>
      </div>
      <p class="ftc-text">${mf.sunMonthText.text}</p>
    </div>`;

  // Transit summary strip
  html += `
    <div class="forecast-transit-strip">
      <div class="fts-label">Planetary positions this month</div>
      <div class="fcb-chips">
        <span class="fcb-chip pl-sun">☉ Sun in ${mf.sunTr.sign.name} · ${ordFc(mf.sunH)} house</span>
        <span class="fcb-chip pl-jupiter">♃ Jupiter in ${mf.jupTr.sign.name} · ${ordFc(mf.jupH)} house</span>
        <span class="fcb-chip pl-saturn">♄ Saturn in ${mf.satTr.sign.name} · ${ordFc(mf.satH)} house</span>
        <span class="fcb-chip pl-rahu">☊ Rahu in ${mf.rahTr.sign.name} · ${ordFc(mf.rahH)} house</span>
      </div>
    </div>`;

  // Remedies
  html += `
    <div class="forecast-remedy-block">
      <div class="frb-title">Upaya — Remedies for ${mf.monthName}</div>
      <ul class="vichar-list">`;
  mf.monthRemedies.forEach(r => { html += `<li>${r}</li>`; });
  html += `</ul></div>`;
  return html;
}

if (typeof window !== 'undefined') {
  window.Forecast = {
    buildYearlyForecast, buildMonthlyForecast,
    renderYearlyHTML, renderMonthlyHTML
  };
}
