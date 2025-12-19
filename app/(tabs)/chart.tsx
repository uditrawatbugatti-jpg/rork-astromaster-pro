import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChart } from '@/contexts/ChartContext';
import Colors from '@/constants/colors';
import { useRouter } from 'expo-router';

export default function ChartScreen() {
  const { chartData, hasData } = useChart();
  const router = useRouter();

  if (!hasData || !chartData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Birth Chart</Text>
          <Text style={styles.emptyText}>
            Enter your birth details to generate your Kundli
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/(tabs)/input')}
          >
            <Text style={styles.buttonText}>Enter Birth Data</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const signNames = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];

  const getPlanetsInSign = (sign: number) => {
    return chartData.planets.filter(p => p.sign === sign);
  };

  const getNavamshaPlanetsInSign = (sign: number) => {
    return chartData.planets.filter(p => chartData.navamshaPositions.get(p.id) === sign);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Kundli Charts</Text>
        <Text style={styles.subtitle}>{chartData.birthData.name || 'Birth Chart'}</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rasi Chart (D1)</Text>
            <View style={styles.chartContainer}>
              <View style={styles.diamondChart}>
                {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((sign, index) => {
                  const planets = getPlanetsInSign(sign);
                  const positions = [
                    styles.house12, styles.house1, styles.house2, styles.house3,
                    styles.house4, styles.house5, styles.house6, styles.house7,
                    styles.house8, styles.house9, styles.house10, styles.house11
                  ];
                  
                  return (
                    <View key={sign} style={[styles.houseBox, positions[index]]}>
                      <Text style={styles.houseNumber}>{signNames[sign - 1].slice(0, 3)}</Text>
                      {sign === chartData.ascendantSign && (
                        <Text style={styles.ascendantMarker}>ASC</Text>
                      )}
                      {planets.map(planet => (
                        <Text key={planet.id} style={styles.planetText}>
                          {planet.name.slice(0, 2)}
                          {planet.isRetrograde ? 'R' : ''}
                        </Text>
                      ))}
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Navamsha Chart (D9)</Text>
            <View style={styles.chartContainer}>
              <View style={styles.diamondChart}>
                {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((sign, index) => {
                  const planets = getNavamshaPlanetsInSign(sign);
                  const positions = [
                    styles.house12, styles.house1, styles.house2, styles.house3,
                    styles.house4, styles.house5, styles.house6, styles.house7,
                    styles.house8, styles.house9, styles.house10, styles.house11
                  ];
                  
                  return (
                    <View key={sign} style={[styles.houseBox, positions[index]]}>
                      <Text style={styles.houseNumber}>{signNames[sign - 1].slice(0, 3)}</Text>
                      {planets.map(planet => (
                        <Text key={planet.id} style={styles.planetText}>
                          {planet.name.slice(0, 2)}
                        </Text>
                      ))}
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Planetary Positions</Text>
            {chartData.planets.map(planet => (
              <View key={planet.id} style={styles.planetRow}>
                <Text style={styles.planetName}>{planet.name}</Text>
                <View style={styles.planetInfo}>
                  <Text style={styles.planetDetail}>
                    {planet.signName} {planet.degree.toFixed(2)}°
                  </Text>
                  <Text style={styles.planetDetail}>
                    {planet.nakshatra} ({planet.pada})
                  </Text>
                  {planet.isRetrograde && (
                    <Text style={styles.retrogradeText}>Retrograde</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cosmic.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: Colors.cosmic.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.cosmic.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.cosmic.text,
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.cosmic.card,
    borderRadius: 16,
  },
  diamondChart: {
    width: 300,
    height: 300,
    position: 'relative',
  },
  houseBox: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderWidth: 1,
    borderColor: Colors.cosmic.border,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  house12: { top: 0, left: 105 },
  house1: { top: 45, left: 165 },
  house2: { top: 105, left: 210 },
  house3: { top: 165, left: 210 },
  house4: { top: 210, left: 165 },
  house5: { top: 210, left: 105 },
  house6: { top: 210, left: 45 },
  house7: { top: 210, left: 0 },
  house8: { top: 165, left: 0 },
  house9: { top: 105, left: 0 },
  house10: { top: 45, left: 0 },
  house11: { top: 0, left: 45 },
  houseNumber: {
    fontSize: 10,
    color: Colors.cosmic.textMuted,
    fontWeight: '600' as const,
  },
  ascendantMarker: {
    fontSize: 9,
    color: Colors.cosmic.primary,
    fontWeight: 'bold' as const,
  },
  planetText: {
    fontSize: 11,
    color: Colors.cosmic.secondary,
    fontWeight: '600' as const,
  },
  planetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.cosmic.card,
    borderRadius: 12,
    marginBottom: 8,
  },
  planetName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.cosmic.text,
    flex: 1,
  },
  planetInfo: {
    alignItems: 'flex-end',
  },
  planetDetail: {
    fontSize: 13,
    color: Colors.cosmic.textSecondary,
    marginBottom: 2,
  },
  retrogradeText: {
    fontSize: 11,
    color: Colors.cosmic.warning,
    fontWeight: '600' as const,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.cosmic.text,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.cosmic.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: Colors.cosmic.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.cosmic.background,
  },
});
