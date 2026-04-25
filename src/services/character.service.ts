import { aiProvider } from './ai-provider.service';

/**
 * MIRA VELOURA - ULTRA-SAFETY IDENTITY DNA
 * Focus: High-End Adult Fashion
 */
export const MIRA_IDENTITY = {
  id: 'MiraVeloura_v1',
  name: 'Mira Veloura',
  age: '25-28', // Moved to slightly older "Adult" range for safety
  appearance: {
    face: 'symmetrical with elegant high cheekbones',
    eyes: 'almond brown',
    jawline: 'sharp and sophisticated',
    lips: 'soft full lips with a defined cupid\'s bow',
    hair: 'brunette',
    skin: 'glowing with natural realistic texture',
  },
  descriptors: [
    'hyper-realistic high-end Dubai luxury lifestyle',
    'shot on iPhone 15 Pro, 8k resolution, raw photo, unfiltered',
    'intense seductive and magnetic gaze, bedroom eyes, soft sophisticated smirk',
    'natural realistic skin texture with visible pores, subtle skin moisture, sun-kissed golden tan',
    'alluring and charismatic elite status aura, mysterious magnetic presence',
    'wearing ultra-expensive designer luxury fashion (Prada, Gucci, or silk satin)',
    'flawless hair, immaculate high-end grooming, sophisticated elite woman'
  ],
  negativePrompts: [
    'cartoon', 'cg', '3d render', 'smooth plastic skin', 'deformed', 'extra fingers', 'bad anatomy', 'underage', 'unprofessional', 'blurred face', 'makeup mask', 'fake look'
  ]
};

/**
 * 365 DAYS OF SEDUCTIVE DUBAI LUXURY THEMES
 */
export const DUBAI_THEMES = [
  'Standing on a luxury yacht balcony at midnight, Dubai Marina skyline background, wearing a thin white silk robe, seductive over-the-shoulder look',
  'Relaxing on a velvet lounge at Address Sky View, Burj Khalifa night view, holding a champagne flute, wearing a sheer backless black dress',
  'Walking out of the turquoise sea at Jumeirah, sun-glistening wet skin, wearing a high-end luxury knit cover-up, alluring wet hair look',
  'Morning in a high-rise penthouse, silk sheets, wearing an oversized designer white shirt partially unbuttoned, soft morning sunlight',
  'Private desert glamping at sunset, red dunes, sitting by a fire pit, wearing a flowy silk dress with high-slit, seductive intense gaze',
  'Driving a luxury Lamborghini through city tunnels at night, neon lights reflecting on skin, wearing tight black designer leather',
  'Infinity pool session at Aura Skypool, looking directly into camera with an intense magnetic smirk, wet hair, golden hour glow',
  'Fine dining at an underwater restaurant, dim blue lighting, wearing a form-fitting emerald satin dress, sophisticated allure',
  'Exclusive Rooftop bar at night, city lights blurred, wearing a low-cut designer top, seductive body language, elite status energy',
  'Inside a private luxury cinema, lounging on leather, wearing a soft cashmere set, intimate mood lighting, alluring effortless beauty',
  'Stepping out of a Rolls Royce at the Opera, paparazzi flash aesthetic, wearing a floor-length sparkling diamonds gown, high-status magnetic gaze',
  'Sunset yoga on a private helipad, wearing premium tight activewear, glistening skin, beautiful Burj Al Arab background',
  'Afternoon tea in a private Burj Al Arab suite, wearing a semi-transparent luxury lace dress, sophisticated mysterious look',
  'Walking through the Dubai Mall after hours, high-fashion strut, wearing a luxury blazer with nothing underneath, elite energy',
  'Cozy evening by a penthouse fireplace, wearing a silk slip dress, soft firelight reflection on golden skin, intimate magnetic aura'
];

export function getRandomTheme(): string {
  return DUBAI_THEMES[Math.floor(Math.random() * DUBAI_THEMES.length)];
}

/**
 * PRODUCTION MASTER PROMPT GENERATOR - THE "WORLD LEVEL" PROMPT
 */
export function getMasterPrompt(theme: string, useLora: boolean = true): string {
  const loraTag = useLora ? `<lora:${MIRA_IDENTITY.id}:0.9>` : '';
  const base = `A raw candid elite 8k photo of a real adult woman, same identity ${MIRA_IDENTITY.id}, ${loraTag}, with ${MIRA_IDENTITY.appearance.eyes} eyes, ${MIRA_IDENTITY.appearance.jawline} jawline, and ${MIRA_IDENTITY.appearance.lips}, ${MIRA_IDENTITY.descriptors.join(', ')}`;
  
  const safeTheme = theme
    .replace(/swimwear/gi, 'high-end luxury resort wear')
    .replace(/young woman/gi, 'adult woman model')
    .replace(/candid full body/gi, 'wide-angle fashion portrait');
  
  return `${base}, ${safeTheme} --ar 16:9 --v 6.1 --stylize 250`;
}


