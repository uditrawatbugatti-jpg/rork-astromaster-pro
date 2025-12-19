import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import {
  BirthData,
  PlanetPosition,
  calculatePlanetPositions,
  calculateAscendant,
  assignHousesToPlanets,
  calculateNavamsha,
} from '@/utils/astronomical';
import { calculateShadBala, ShadBalaScores } from '@/utils/shadbala';
import { calculateAshtakavarga, AshtakavargaChart, getSarvashtakavarga } from '@/utils/ashtakavarga';
import { analyzeDosh, DoshAnalysis, calculateKundliScore } from '@/utils/dosh';

const STORAGE_KEY = 'birth_data';

export interface ChartData {
  birthData: BirthData;
  ascendant: number;
  ascendantSign: number;
  planets: PlanetPosition[];
  navamshaPositions: Map<string, number>;
  shadBala: ShadBalaScores[];
  ashtakavarga: AshtakavargaChart[];
  sarvashtakavarga: number[];
  doshAnalysis: DoshAnalysis;
  kundliScore: number;
}

export const [ChartProvider, useChart] = createContextHook(() => {
  const [birthData, setBirthData] = useState<BirthData | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  useEffect(() => {
    loadBirthData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBirthData = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        data.date = new Date(data.date);
        setBirthData(data);
        calculateChart(data);
      }
    } catch (error) {
      console.error('Error loading birth data:', error);
    }
  };

  const saveBirthData = async (data: BirthData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setBirthData(data);
      calculateChart(data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error saving birth data:', error);
    }
  };

  const calculateChart = (data: BirthData) => {
    setIsCalculating(true);
    try {
      const ascendant = calculateAscendant(data);
      const ascendantSign = Math.floor(ascendant / 30) + 1;
      
      const rawPlanets = calculatePlanetPositions(data);
      const planets = assignHousesToPlanets(rawPlanets, ascendant);

      const navamshaPositions = new Map<string, number>();
      planets.forEach(planet => {
        navamshaPositions.set(planet.id, calculateNavamsha(planet.longitude));
      });

      const shadBala = calculateShadBala(planets, data.date);
      const ashtakavarga = calculateAshtakavarga(planets);
      const sarvashtakavarga = getSarvashtakavarga(ashtakavarga);
      const doshAnalysis = analyzeDosh(planets);

      const avgShadBala = shadBala.reduce((sum, s) => sum + s.totalRupas, 0) / shadBala.length;
      const kundliScore = calculateKundliScore(planets, doshAnalysis, avgShadBala);

      setChartData({
        birthData: data,
        ascendant,
        ascendantSign,
        planets,
        navamshaPositions,
        shadBala,
        ashtakavarga,
        sarvashtakavarga,
        doshAnalysis,
        kundliScore,
      });
    } catch (error) {
      console.error('Error calculating chart:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const clearData = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setBirthData(null);
      setChartData(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  };

  return {
    birthData,
    chartData,
    isCalculating,
    saveBirthData,
    clearData,
    hasData: !!chartData,
  };
});
