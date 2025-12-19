import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChart } from '@/contexts/ChartContext';
import Colors from '@/constants/colors';
import { useRouter } from 'expo-router';
import { Sparkles, Star, TrendingUp, AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function DashboardScreen() {
  const { chartData, hasData } = useChart();
  const router = useRouter();
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  if (!hasData || !chartData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Sparkles size={80} color={Colors.cosmic.primary} />
          </Animated.View>
          <Text style={styles.welcomeTitle}>Welcome to Jyotish AI</Text>
          <Text style={styles.welcomeText}>
            Your personal Vedic astrology companion. Enter your birth details to unlock the cosmic wisdom of your Kundli.
          </Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => router.push('/(tabs)/input')}
          >
            <Text style={styles.startButtonText}>Enter Birth Data</Text>
            <Star size={20} color={Colors.cosmic.background} />
          </TouchableOpacity>
          
          <View style={styles.featureGrid}>
            <View style={styles.featureCard}>
              <Star size={24} color={Colors.cosmic.secondary} />
              <Text style={styles.featureText}>Precise Calculations</Text>
            </View>
            <View style={styles.featureCard}>
              <TrendingUp size={24} color={Colors.cosmic.accent} />
              <Text style={styles.featureText}>Shad Bala Analysis</Text>
            </View>
            <View style={styles.featureCard}>
              <Sparkles size={24} color={Colors.cosmic.primary} />
              <Text style={styles.featureText}>Dosh Detection</Text>
            </View>
            <View style={styles.featureCard}>
              <AlertCircle size={24} color={Colors.cosmic.warning} />
              <Text style={styles.featureText}>Remedies</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const signNames = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];

  const moonPlanet = chartData.planets.find(p => p.id === 'moon');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Namaste 🙏</Text>
          <Text style={styles.name}>{chartData.birthData.name || 'Seeker'}</Text>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push('/(tabs)/input')}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <LinearGradient
            colors={[Colors.cosmic.primary, Colors.cosmic.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.scoreCard}
          >
            <Sparkles size={40} color={Colors.cosmic.background} />
            <Text style={styles.scoreLabel}>Kundli Strength Score</Text>
            <Text style={styles.scoreValue}>{chartData.kundliScore}</Text>
            <Text style={styles.scoreMax}>out of 100</Text>
          </LinearGradient>

          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Ascendant (Lagna)</Text>
              <Text style={styles.infoValue}>{signNames[chartData.ascendantSign - 1]}</Text>
              <Text style={styles.infoDetail}>
                {chartData.ascendant.toFixed(2)}°
              </Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Moon Sign (Rasi)</Text>
              <Text style={styles.infoValue}>
                {moonPlanet ? signNames[moonPlanet.sign - 1] : 'N/A'}
              </Text>
              <Text style={styles.infoDetail}>
                {moonPlanet?.nakshatra}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Dosh Summary</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/analysis')}>
                <Text style={styles.viewAll}>View All →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.doshGrid}>
              <View style={[
                styles.doshCard,
                { borderColor: chartData.doshAnalysis.hasMangalDosh ? Colors.cosmic.warning : Colors.cosmic.success }
              ]}>
                <Text style={styles.doshName}>Mangal</Text>
                <Text style={[
                  styles.doshStatus,
                  { color: chartData.doshAnalysis.hasMangalDosh ? Colors.cosmic.warning : Colors.cosmic.success }
                ]}>
                  {chartData.doshAnalysis.hasMangalDosh ? 'Present' : 'Absent'}
                </Text>
              </View>

              <View style={[
                styles.doshCard,
                { borderColor: chartData.doshAnalysis.hasShaniDosh ? Colors.cosmic.warning : Colors.cosmic.success }
              ]}>
                <Text style={styles.doshName}>Shani</Text>
                <Text style={[
                  styles.doshStatus,
                  { color: chartData.doshAnalysis.hasShaniDosh ? Colors.cosmic.warning : Colors.cosmic.success }
                ]}>
                  {chartData.doshAnalysis.hasShaniDosh ? 'Present' : 'Absent'}
                </Text>
              </View>

              <View style={[
                styles.doshCard,
                { borderColor: chartData.doshAnalysis.hasRahuKetuDosh ? Colors.cosmic.warning : Colors.cosmic.success }
              ]}>
                <Text style={styles.doshName}>Rahu-Ketu</Text>
                <Text style={[
                  styles.doshStatus,
                  { color: chartData.doshAnalysis.hasRahuKetuDosh ? Colors.cosmic.warning : Colors.cosmic.success }
                ]}>
                  {chartData.doshAnalysis.hasRahuKetuDosh ? 'Present' : 'Absent'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Planetary Strength (Top 3)</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/analysis')}>
                <Text style={styles.viewAll}>View All →</Text>
              </TouchableOpacity>
            </View>

            {chartData.shadBala
              .sort((a, b) => b.totalRupas - a.totalRupas)
              .slice(0, 3)
              .map((bala, index) => (
                <View key={bala.planetId} style={styles.strengthCard}>
                  <View style={styles.strengthHeader}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.strengthName}>{bala.planetName}</Text>
                  </View>
                  <View style={styles.strengthBar}>
                    <View
                      style={[
                        styles.strengthBarFill,
                        { width: `${(bala.totalRupas / 12) * 100}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.strengthValue}>
                    {bala.totalRupas.toFixed(2)} Rupas - {bala.strength}
                  </Text>
                </View>
              ))}
          </View>

          <TouchableOpacity
            style={styles.chartButton}
            onPress={() => router.push('/(tabs)/chart')}
          >
            <Text style={styles.chartButtonText}>View Full Kundli Charts</Text>
            <Sparkles size={20} color={Colors.cosmic.background} />
          </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 16,
    color: Colors.cosmic.textSecondary,
    marginBottom: 4,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: Colors.cosmic.text,
  },
  editButton: {
    backgroundColor: Colors.cosmic.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cosmic.border,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.cosmic.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  scoreCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreLabel: {
    fontSize: 16,
    color: Colors.cosmic.background,
    marginTop: 12,
    marginBottom: 8,
    opacity: 0.9,
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: 'bold' as const,
    color: Colors.cosmic.background,
  },
  scoreMax: {
    fontSize: 16,
    color: Colors.cosmic.background,
    opacity: 0.8,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  infoCard: {
    flex: 1,
    backgroundColor: Colors.cosmic.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cosmic.border,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.cosmic.textMuted,
    marginBottom: 8,
    fontWeight: '600' as const,
  },
  infoValue: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.cosmic.text,
    marginBottom: 4,
  },
  infoDetail: {
    fontSize: 13,
    color: Colors.cosmic.textSecondary,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.cosmic.text,
  },
  viewAll: {
    fontSize: 14,
    color: Colors.cosmic.primary,
    fontWeight: '600' as const,
  },
  doshGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  doshCard: {
    flex: 1,
    backgroundColor: Colors.cosmic.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    alignItems: 'center',
  },
  doshName: {
    fontSize: 14,
    color: Colors.cosmic.textSecondary,
    marginBottom: 8,
    fontWeight: '600' as const,
  },
  doshStatus: {
    fontSize: 13,
    fontWeight: 'bold' as const,
  },
  strengthCard: {
    backgroundColor: Colors.cosmic.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  strengthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.cosmic.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: Colors.cosmic.background,
  },
  strengthName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.cosmic.text,
  },
  strengthBar: {
    height: 6,
    backgroundColor: Colors.cosmic.cardLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  strengthBarFill: {
    height: '100%',
    backgroundColor: Colors.cosmic.secondary,
  },
  strengthValue: {
    fontSize: 13,
    color: Colors.cosmic.textSecondary,
  },
  chartButton: {
    flexDirection: 'row',
    backgroundColor: Colors.cosmic.secondary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
  },
  chartButtonText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.cosmic.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: Colors.cosmic.text,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: Colors.cosmic.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  startButton: {
    flexDirection: 'row',
    backgroundColor: Colors.cosmic.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 10,
    marginBottom: 40,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.cosmic.background,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    maxWidth: 340,
  },
  featureCard: {
    width: 160,
    backgroundColor: Colors.cosmic.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.cosmic.border,
  },
  featureText: {
    fontSize: 13,
    color: Colors.cosmic.textSecondary,
    textAlign: 'center',
    fontWeight: '600' as const,
  },
});
