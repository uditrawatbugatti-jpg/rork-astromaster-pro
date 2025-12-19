import { PlanetPosition } from './astronomical';

export interface DoshAnalysis {
  hasMangalDosh: boolean;
  mangalDoshSeverity: 'None' | 'Mild' | 'Moderate' | 'Strong';
  mangalDoshDetails: string;
  hasShaniDosh: boolean;
  shaniDoshDetails: string;
  hasRahuKetuDosh: boolean;
  rahuKetuDoshDetails: string;
  remedies: string[];
}

export function analyzeDosh(planets: PlanetPosition[]): DoshAnalysis {
  const mars = planets.find(p => p.id === 'mars');
  const saturn = planets.find(p => p.id === 'saturn');
  const rahu = planets.find(p => p.id === 'rahu');
  const ketu = planets.find(p => p.id === 'ketu');

  const mangalDosh = checkMangalDosh(mars);
  const shaniDosh = checkShaniDosh(saturn);
  const rahuKetuDosh = checkRahuKetuDosh(rahu, ketu);

  const remedies: string[] = [];
  if (mangalDosh.hasDosh) {
    remedies.push('Recite Hanuman Chalisa on Tuesdays');
    remedies.push('Fast on Tuesdays');
    remedies.push('Donate red lentils and red cloth');
  }
  if (shaniDosh) {
    remedies.push('Light mustard oil lamp under Peepal tree on Saturdays');
    remedies.push('Donate black sesame seeds and iron');
    remedies.push('Recite Shani mantras');
  }
  if (rahuKetuDosh) {
    remedies.push('Recite Maha Mrityunjaya Mantra');
    remedies.push('Donate to spiritual causes');
    remedies.push('Wear Gomed (Hessonite) for Rahu or Cat\'s Eye for Ketu after consultation');
  }

  return {
    hasMangalDosh: mangalDosh.hasDosh,
    mangalDoshSeverity: mangalDosh.severity,
    mangalDoshDetails: mangalDosh.details,
    hasShaniDosh: shaniDosh,
    shaniDoshDetails: shaniDosh ? 'Saturn placed in challenging houses causing delays and obstacles' : 'No Shani Dosh detected',
    hasRahuKetuDosh: rahuKetuDosh,
    rahuKetuDoshDetails: rahuKetuDosh ? 'Rahu/Ketu in critical houses causing karmic challenges' : 'No Rahu-Ketu Dosh detected',
    remedies,
  };
}

function checkMangalDosh(mars: PlanetPosition | undefined): {
  hasDosh: boolean;
  severity: 'None' | 'Mild' | 'Moderate' | 'Strong';
  details: string;
} {
  if (!mars) {
    return { hasDosh: false, severity: 'None', details: 'Mars position not found' };
  }

  const doshHouses = [1, 2, 4, 7, 8, 12];
  const strongDoshHouses = [1, 4, 7, 8, 12];

  if (doshHouses.includes(mars.house)) {
    const isStrong = strongDoshHouses.includes(mars.house);
    const severity = isStrong ? 'Strong' : 'Moderate';
    
    const houseDescription: Record<number, string> = {
      1: 'First house (self) - may cause aggressive temperament',
      2: 'Second house (family) - may cause family discord',
      4: 'Fourth house (home) - may cause domestic turbulence',
      7: 'Seventh house (marriage) - may cause marital challenges',
      8: 'Eighth house (longevity) - may cause health and transformation issues',
      12: 'Twelfth house (losses) - may cause separation tendencies',
    };

    return {
      hasDosh: true,
      severity,
      details: `Mangal Dosh present: Mars in ${houseDescription[mars.house] || `house ${mars.house}`}`,
    };
  }

  if (mars.sign === 1 || mars.sign === 8) {
    return {
      hasDosh: true,
      severity: 'Mild',
      details: 'Mild Mangal Dosh: Mars in own sign (Aries or Scorpio) - effects are reduced',
    };
  }

  return {
    hasDosh: false,
    severity: 'None',
    details: 'No Mangal Dosh detected',
  };
}

function checkShaniDosh(saturn: PlanetPosition | undefined): boolean {
  if (!saturn) return false;

  const challengingHouses = [1, 4, 7, 8, 10, 12];
  return challengingHouses.includes(saturn.house);
}

function checkRahuKetuDosh(
  rahu: PlanetPosition | undefined,
  ketu: PlanetPosition | undefined
): boolean {
  if (!rahu || !ketu) return false;

  const criticalHouses = [1, 5, 7, 9, 10];
  
  const rahuInCritical = criticalHouses.includes(rahu.house);
  const ketuInCritical = criticalHouses.includes(ketu.house);

  return rahuInCritical || ketuInCritical;
}

export function calculateKundliScore(
  planets: PlanetPosition[],
  doshAnalysis: DoshAnalysis,
  shadBalaAverage: number
): number {
  let score = 50;

  score += Math.min(shadBalaAverage / 10 * 20, 20);

  const beneficPlanets = planets.filter(p => 
    ['moon', 'jupiter', 'venus', 'mercury'].includes(p.id)
  );
  const beneficInGoodHouses = beneficPlanets.filter(p =>
    [1, 4, 5, 7, 9, 10, 11].includes(p.house)
  ).length;
  score += beneficInGoodHouses * 3;

  if (doshAnalysis.hasMangalDosh) {
    if (doshAnalysis.mangalDoshSeverity === 'Strong') score -= 15;
    else if (doshAnalysis.mangalDoshSeverity === 'Moderate') score -= 10;
    else score -= 5;
  }

  if (doshAnalysis.hasShaniDosh) score -= 8;
  if (doshAnalysis.hasRahuKetuDosh) score -= 7;

  const lagna = planets.find(p => p.house === 1);
  if (lagna && [5, 9, 1].includes(lagna.sign)) score += 10;

  return Math.max(0, Math.min(100, score));
}
