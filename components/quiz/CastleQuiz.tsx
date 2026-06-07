'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const QUESTIONS = [
  {
    id: 'vibe',
    question: 'What draws you to a castle?',
    options: [
      { label: 'Royal grandeur & opulence', tags: ['royal-residence', 'baroque', 'palace'] },
      { label: 'Dark history & medieval drama', tags: ['medieval', 'fortress', 'dramatic'] },
      { label: 'Fairy-tale magic & romance', tags: ['fairy-tale', 'romantic', 'colorful'] },
      { label: 'Dramatic scenery & landscapes', tags: ['dramatic', 'hilltop', 'coastal'] },
    ],
  },
  {
    id: 'setting',
    question: 'What setting speaks to you?',
    options: [
      { label: 'Mountain peaks & alpine views', tags: ['mountain-castle', 'alpine', 'mountain'] },
      { label: 'Coastal cliffs & sea views', tags: ['coastal', 'sea-view', 'island'] },
      { label: 'Forest & hidden valleys', tags: ['forest', 'river', 'lake'] },
      { label: 'City centres & urban history', tags: ['city-centre', 'iconic'] },
    ],
  },
  {
    id: 'era',
    question: 'Which historical era fascinates you most?',
    options: [
      { label: 'Medieval knights & crusades', tags: ['medieval', 'crusader', 'norman'] },
      { label: 'Renaissance & royal courts', tags: ['renaissance', 'royal-residence', '16th-century'] },
      { label: 'Baroque & 18th-century splendour', tags: ['baroque', '17th-century', '18th-century'] },
      { label: 'Romantic 19th-century revival', tags: ['neo-gothic', 'neogothic', '19th-century', 'romantic'] },
    ],
  },
  {
    id: 'travel',
    question: 'How do you prefer to travel?',
    options: [
      { label: 'Solo explorer', tags: ['instagram-worthy', 'dramatic', 'off-the-beaten-path'] },
      { label: 'Romantic getaway', tags: ['romantic', 'lake', 'fairy-tale'] },
      { label: 'Family adventure', tags: ['family-friendly', 'museum', 'city-centre'] },
      { label: 'Culture deep-dive with a group', tags: ['unesco', 'unesco-world-heritage', 'royal-residence'] },
    ],
  },
  {
    id: 'region',
    question: 'Which part of Europe calls to you?',
    options: [
      { label: 'Western Europe (France, Spain, Portugal)', tags: ['french-castle', 'moorish', 'day-trip-from-paris', 'manueline'] },
      { label: 'British Isles (England, Scotland, Ireland)', tags: ['english-castle', 'scottish-castle', 'irish-castle', 'welsh-castle'] },
      { label: 'Central Europe (Germany, Austria, Czechia)', tags: ['german-castle', 'habsburg', 'gothic', 'baroque'] },
      { label: 'Eastern & Southern Europe', tags: ['byzantine', 'ottoman', 'romanian', 'bulgarian', 'hilltop'] },
    ],
  },
  {
    id: 'priority',
    question: 'What matters most for your visit?',
    options: [
      { label: 'The perfect Instagram photo', tags: ['instagram-worthy', 'colorful', 'dramatic'] },
      { label: 'Learning the real history', tags: ['museum', 'unesco', 'royal-residence'] },
      { label: 'A full day out & experience', tags: ['gardens', 'family-friendly', 'iconic'] },
      { label: 'Off-the-beaten-path discovery', tags: ['off-the-beaten-path', 'unique', 'cave'] },
    ],
  },
  {
    id: 'fiction',
    question: 'Which fictional world resonates with you?',
    options: [
      { label: 'Game of Thrones / medieval epics', tags: ['game-of-thrones', 'dramatic', 'ruins', 'fortress'] },
      { label: 'Cinderella / fairy-tale classics', tags: ['fairy-tale', 'disney', 'disney-inspired', 'romantic'] },
      { label: 'Harry Potter / gothic mystery', tags: ['harry-potter', 'gothic', 'haunted', 'dramatic'] },
      { label: 'Versailles / royal court dramas', tags: ['baroque', 'royal-residence', 'palace', 'gardens'] },
    ],
  },
];

const CASTLE_POOL = [
  { id: 'palace-of-versailles', name: 'Palace of Versailles', country: 'france', slug: 'palace-of-versailles', tags: ['baroque', '17th-century', 'royal-residence', 'unesco-world-heritage', 'day-trip-from-paris', 'gardens', 'palace', 'iconic'] },
  { id: 'tower-of-london', name: 'Tower of London', country: 'england', slug: 'tower-of-london', tags: ['medieval', 'royal-residence', 'unesco', 'family-friendly', 'city-centre', 'fortress', 'iconic', 'museum'] },
  { id: 'mont-saint-michel', name: 'Mont-Saint-Michel', country: 'france', slug: 'mont-saint-michel', tags: ['gothic', 'romanesque', 'medieval', 'unesco-world-heritage', 'iconic', 'island', 'dramatic', 'instagram-worthy'] },
  { id: 'alhambra', name: 'Alhambra', country: 'spain', slug: 'alhambra-granada', tags: ['moorish', 'medieval', 'unesco-world-heritage', 'royal-residence', 'book-in-advance', 'gardens', 'palace', 'instagram-worthy'] },
  { id: 'neuschwanstein-castle', name: 'Neuschwanstein Castle', country: 'germany', slug: 'neuschwanstein-castle', tags: ['fairy-tale', 'neogothic', '19th-century', 'mountain-castle', 'disney-inspired', 'romantic', 'instagram-worthy', 'alpine'] },
  { id: 'edinburgh-castle', name: 'Edinburgh Castle', country: 'scotland', slug: 'edinburgh-castle', tags: ['medieval', 'royal-residence', 'dramatic', 'instagram-worthy', 'city-centre', 'fortress', 'museum', 'iconic'] },
  { id: 'prague-castle', name: 'Prague Castle', country: 'czech-republic', slug: 'prague-castle', tags: ['gothic', 'medieval', 'unesco-world-heritage', 'royal-residence', 'romantic', 'city-centre', 'iconic'] },
  { id: 'schonbrunn-palace', name: 'Schönbrunn Palace', country: 'austria', slug: 'schonbrunn-palace', tags: ['baroque', '17th-century', '18th-century', 'royal-residence', 'unesco-world-heritage', 'gardens', 'family-friendly', 'palace'] },
  { id: 'pena-palace', name: 'Pena Palace', country: 'portugal', slug: 'pena-palace', tags: ['romantic', 'royal-residence', 'unesco', 'instagram-worthy', 'colorful', 'fairy-tale', 'mountain', 'palace'] },
  { id: 'eilean-donan-castle', name: 'Eilean Donan Castle', country: 'scotland', slug: 'eilean-donan-castle', tags: ['medieval', 'dramatic', 'instagram-worthy', 'sea-view', 'scottish-castle', 'iconic', 'romantic'] },
  { id: 'eltz-castle', name: 'Eltz Castle', country: 'germany', slug: 'eltz-castle', tags: ['medieval', 'forest', 'instagram-worthy', 'fairy-tale', 'german-castle', 'off-the-beaten-path', 'romantic'] },
  { id: 'dunnottar-castle', name: 'Dunnottar Castle', country: 'scotland', slug: 'dunnottar-castle', tags: ['medieval', 'ruins', 'coastal', 'dramatic', 'instagram-worthy', 'scottish-castle', 'sea-view', 'game-of-thrones'] },
  { id: 'chateau-de-chambord', name: 'Château de Chambord', country: 'france', slug: 'chateau-de-chambord', tags: ['renaissance', '16th-century', 'fairy-tale', 'unesco-world-heritage', 'french-castle', 'royal-residence', 'gardens'] },
  { id: 'chateau-de-chenonceau', name: 'Château de Chenonceau', country: 'france', slug: 'chateau-de-chenonceau', tags: ['renaissance', '16th-century', 'river-castle', 'unesco-world-heritage', 'romantic', 'french-castle', 'instagram-worthy'] },
  { id: 'carcassonne', name: 'Carcassonne', country: 'france', slug: 'carcassonne', tags: ['medieval', 'unesco', 'dramatic', 'instagram-worthy', 'walled-city', 'fortress', 'french-castle', 'game-of-thrones'] },
  { id: 'windsor-castle', name: 'Windsor Castle', country: 'england', slug: 'windsor-castle', tags: ['royal-residence', 'gothic', 'family-friendly', 'city-centre', 'english-castle', 'palace', 'museum', 'iconic'] },
  { id: 'bled-castle', name: 'Bled Castle', country: 'slovenia', slug: 'bled-castle', tags: ['medieval', 'alpine', 'lake', 'iconic', 'dramatic', 'instagram-worthy', 'romantic'] },
  { id: 'trakai-island-castle', name: 'Trakai Island Castle', country: 'lithuania', slug: 'trakai-island-castle', tags: ['gothic', 'medieval', 'island', 'iconic', 'lake', 'romantic', 'off-the-beaten-path'] },
  { id: 'predjama-castle', name: 'Predjama Castle', country: 'slovenia', slug: 'predjama-castle', tags: ['medieval', 'cave', 'dramatic', 'instagram-worthy', 'unique', 'off-the-beaten-path'] },
  { id: 'alcazar-of-segovia', name: 'Alcázar of Segovia', country: 'spain', slug: 'alcazar-of-segovia', tags: ['medieval', 'mudejar', 'instagram-worthy', 'disney', 'fairy-tale', 'royal-residence', 'iconic'] },
  { id: 'chateau-de-chillon', name: 'Château de Chillon', country: 'switzerland', slug: 'chateau-de-chillon', tags: ['medieval', 'lake', 'romantic', 'instagram-worthy', 'swiss-castle', 'literary'] },
  { id: 'caernarfon-castle', name: 'Caernarfon Castle', country: 'wales', slug: 'caernarfon-castle', tags: ['medieval', 'unesco', 'dramatic', 'instagram-worthy', 'welsh-castle', 'concentric'] },
  { id: 'bojnice-castle', name: 'Bojnice Castle', country: 'slovakia', slug: 'bojnice-castle', tags: ['neo-gothic', 'romantic', 'medieval', 'fairytale', 'fairy-tale', 'off-the-beaten-path'] },
  { id: 'rock-of-cashel', name: 'Rock of Cashel', country: 'ireland', slug: 'rock-of-cashel', tags: ['medieval', 'romanesque', 'dramatic', 'instagram-worthy', 'irish-castle', 'hilltop', 'ruins'] },
  { id: 'buda-castle', name: 'Buda Castle', country: 'hungary', slug: 'buda-castle', tags: ['baroque', 'royal-residence', 'unesco', 'instagram-worthy', 'city-centre', 'habsburg', 'palace'] },
  { id: 'blarney-castle', name: 'Blarney Castle', country: 'ireland', slug: 'blarney-castle', tags: ['medieval', 'tower-house', 'iconic', 'gardens', 'ireland', 'irish-castle', 'family-friendly'] },
  { id: 'wawel-castle', name: 'Wawel Royal Castle', country: 'poland', slug: 'wawel-castle', tags: ['renaissance', 'royal-residence', 'unesco', 'instagram-worthy', 'city-centre', '16th-century'] },
  { id: 'castel-santangelo', name: "Castel Sant'Angelo", country: 'italy', slug: 'castel-santangelo', tags: ['roman', 'medieval', 'papal', 'instagram-worthy', 'city-centre', 'dramatic', 'fortress'] },
  { id: 'royal-palace-of-caserta', name: 'Royal Palace of Caserta', country: 'italy', slug: 'royal-palace-of-caserta', tags: ['baroque', 'palace', 'unesco-world-heritage', 'gardens', 'royal-residence', '18th-century'] },
  { id: 'drottningholm-palace', name: 'Drottningholm Palace', country: 'sweden', slug: 'drottningholm-palace', tags: ['baroque', 'palace', 'unesco-world-heritage', 'royal-residence', 'lake', '17th-century'] },
  { id: 'kronborg-castle', name: 'Kronborg Castle', country: 'denmark', slug: 'kronborg-castle', tags: ['renaissance', 'dramatic', 'instagram-worthy', 'coastal', 'sea-view', '16th-century', 'iconic'] },
  { id: 'alnwick-castle', name: 'Alnwick Castle', country: 'england', slug: 'alnwick-castle', tags: ['norman', 'english-castle', 'harry-potter', 'medieval', 'inhabited', 'dramatic', 'museum'] },
  { id: 'dunluce-castle', name: 'Dunluce Castle', country: 'northern-ireland', slug: 'dunluce-castle', tags: ['medieval', 'coastal', 'game-of-thrones', 'ruins', 'dramatic', 'sea-view', 'instagram-worthy'] },
  { id: 'tsarevets-fortress', name: 'Tsarevets Fortress', country: 'bulgaria', slug: 'tsarevets-fortress', tags: ['medieval', 'dramatic', 'hilltop', 'sound-and-light', 'fortress', 'off-the-beaten-path'] },
  { id: 'ananuri-fortress', name: 'Ananuri Fortress', country: 'georgia', slug: 'ananuri-fortress', tags: ['medieval', 'dramatic', 'mountain', 'caucasus', 'instagram-worthy', 'off-the-beaten-path'] },
  { id: 'palace-of-the-grand-master', name: 'Palace of the Grand Master', country: 'greece', slug: 'palace-of-the-grand-master', tags: ['gothic', 'crusader', 'unesco-world-heritage', 'knights-hospitaller', 'mediterranean', 'medieval'] },
  { id: 'frederiksborg-palace', name: 'Frederiksborg Palace', country: 'denmark', slug: 'frederiksborg-palace', tags: ['renaissance', 'palace', 'baroque-garden', 'museum', 'lake', '17th-century', 'instagram-worthy'] },
  { id: 'gravensteen', name: 'Gravensteen', country: 'belgium', slug: 'gravensteen', tags: ['medieval', 'crusader', 'city-centre', 'instagram-worthy', 'norman', 'fortress', 'family-friendly'] },
  { id: 'klis-fortress', name: 'Klis Fortress', country: 'croatia', slug: 'klis-fortress', tags: ['medieval', 'game-of-thrones', 'clifftop', 'dramatic', 'coastal', 'fortress', 'instagram-worthy'] },
];

function computeResult(answers: string[][]): typeof CASTLE_POOL[0] {
  const tagScores: Record<string, number> = {};

  answers.forEach((selectedTags) => {
    selectedTags.forEach((tag) => {
      tagScores[tag] = (tagScores[tag] ?? 0) + 1;
    });
  });

  let best = CASTLE_POOL[0];
  let bestScore = -1;

  for (const castle of CASTLE_POOL) {
    const score = castle.tags.reduce((sum, tag) => sum + (tagScores[tag] ?? 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = castle;
    }
  }

  return best;
}

export default function CastleQuiz() {
  const [state, setState] = useState<'intro' | 'questions' | 'result'>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<string[][]>([]);
  const [selected, setSelected] = useState<string[] | null>(null);
  const [result, setResult] = useState<typeof CASTLE_POOL[0] | null>(null);

  function handleAnswer(tags: string[]) {
    setSelected(tags);
    const newAnswers = [...answers, tags];
    if (currentQ < QUESTIONS.length - 1) {
      setTimeout(() => {
        setAnswers(newAnswers);
        setCurrentQ(currentQ + 1);
        setSelected(null);
      }, 300);
    } else {
      setTimeout(() => {
        const match = computeResult(newAnswers);
        setResult(match);
        setState('result');
        setSelected(null);
      }, 300);
    }
  }

  function reset() {
    setState('intro');
    setCurrentQ(0);
    setAnswers([]);
    setSelected(null);
    setResult(null);
  }

  if (state === 'intro') {
    return (
      <div className="text-center">
        <div className="text-6xl mb-6">🏰</div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1761a0] mb-4 leading-tight">
          Which European Castle Should You Visit?
        </h1>
        <p className="text-stone-500 text-base mb-10 max-w-md mx-auto leading-relaxed">
          Answer 7 questions and we&apos;ll find your perfect historic match
        </p>
        <button
          onClick={() => setState('questions')}
          className="bg-[#c9a84c] text-[#1761a0] font-bold text-base px-8 py-4 rounded-lg hover:bg-[#b8973b] transition-colors shadow-md"
        >
          Start the Quiz →
        </button>
      </div>
    );
  }

  if (state === 'questions') {
    const q = QUESTIONS[currentQ];
    const progress = (currentQ / QUESTIONS.length) * 100;

    return (
      <div>
        {/* Progress bar */}
        <div className="w-full bg-stone-100 rounded-full h-1.5 mb-3">
          <div
            className="bg-[#c9a84c] h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-stone-400 text-sm mb-8">Question {currentQ + 1} of {QUESTIONS.length}</p>

        <h2 className="font-serif text-2xl font-bold text-[#1761a0] mb-6">{q.question}</h2>

        <div className="grid grid-cols-2 gap-3">
          {q.options.map((option) => {
            const isSelected = selected === option.tags;
            return (
              <button
                key={option.label}
                onClick={() => handleAnswer(option.tags)}
                disabled={selected !== null}
                className={`rounded-lg p-4 text-sm font-medium text-left transition-colors border ${
                  isSelected
                    ? 'border-[#1761a0] bg-[#1761a0] text-white'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-[#c9a84c] hover:text-[#c9a84c]'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (state === 'result' && result) {
    const countryLabel = result.country.charAt(0).toUpperCase() + result.country.slice(1).replace(/-/g, ' ');
    const gygUrl = `https://www.getyourguide.com/s/?q=${encodeURIComponent(result.name + ' tour')}&partner_id=${process.env.NEXT_PUBLIC_GYG_PARTNER_ID ?? ''}`;

    return (
      <div className="text-center">
        <p className="text-[#c9a84c] text-xs font-medium uppercase tracking-wider mb-3">
          Your perfect castle match
        </p>
        <h2 className="font-serif text-3xl font-bold text-[#1761a0] mb-6 leading-tight">
          {result.name}
        </h2>

        <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-4">
          <Image
            src={`/images/castles/${result.slug}.webp`}
            alt={result.name}
            fill
            className="object-cover"
            sizes="(max-width: 672px) 100vw, 672px"
          />
        </div>

        <span className="inline-block bg-stone-100 text-stone-600 text-xs font-medium px-3 py-1 rounded-full mb-8">
          {countryLabel}
        </span>

        <div className="flex flex-col gap-3">
          <Link
            href={`/castles/${result.country}/${result.slug}`}
            className="block w-full bg-[#1761a0] text-white font-bold text-base px-6 py-4 rounded-lg hover:bg-[#125489] transition-colors"
          >
            Explore {result.name} →
          </Link>
          <a
            href={gygUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="block w-full bg-[#c9a84c] text-[#1761a0] font-bold text-base px-6 py-4 rounded-lg hover:bg-[#b8973b] transition-colors"
          >
            Book a Guided Tour →
          </a>
        </div>

        <button
          onClick={reset}
          className="mt-6 text-stone-400 text-sm underline hover:text-stone-600 transition-colors"
        >
          Take the quiz again
        </button>
      </div>
    );
  }

  return null;
}
