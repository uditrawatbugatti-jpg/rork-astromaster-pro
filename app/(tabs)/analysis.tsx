import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChart } from '@/contexts/ChartContext';
import Colors from '@/constants/colors';
import { useRouter } from 'expo-router';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react-native';

export default function AnalysisScreen() {
  const { chartData, hasData } = useChart();
  const router = useRouter();

  if (!hasData || !chartData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Analysis Available</Text>
          <Text style={styles.emptyText}>
            Enter your birth details to view detailed analysis
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Chart Analysis</Text>
        <Text style={styles.subtitle}>Shad Bala, Ashtakavarga & Dosh</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Overall Kundli Score</Text>
            <Text style={styles.scoreValue}>{chartData.kundliScore}/100</Text>
            <View style={styles.scoreBar}>
              <View style={[styles.scoreBarFill, { width: `${chartData.kundliScore}%` }]} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shad Bala (Planetary Strength)</Text>
            {chartData.shadBala.map(bala => (
              <View key={bala.planetId} style={styles.balaCard}>
                <View style={styles.balaHeader}>
                  <Text style={styles.balaName}>{bala.planetName}</Text>
                  <View style={[
                    styles.strengthBadge,
                    { backgroundColor: getStrengthColor(bala.strength) }
                  ]}>
                    <Text style={styles.strengthText}>{bala.strength}</Text>
                  </View>
                </View>
                <Text style={styles.balaScore}>
                  {bala.totalRupas.toFixed(2)} Rupas ({bala.totalBala.toFixed(0)} Virupas)
                </Text>
                <View style={styles.balaDetails}>
                  <Text style={styles.balaDetail}>Sthana: {bala.sthanaBala.toFixed(0)}</Text>
                  <Text style={styles.balaDetail}>Dig: {bala.digBala.toFixed(0)}</Text>
                  <Text style={styles.balaDetail}>Kala: {bala.kalaBala.toFixed(0)}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ashtakavarga Summary</Text>
            {chartData.ashtakavarga.map(chart => (
              <View key={chart.planetId} style={styles.ashtakavargaCard}>
                <Text style={styles.ashtakavargaName}>{chart.planetName}</Text>
                <Text style={styles.ashtakavargaTotal}>
                  Total Points: {chart.totalPoints}/56
                </Text>
                <View style={styles.signRow}>
                  {chart.signPoints.map((points, index) => (
                    <View key={index} style={styles.signBox}>
                      <Text style={styles.signName}>{signNames[index].slice(0, 3)}</Text>
                      <Text style={[
                        styles.signPoints,
                        { color: points >= 4 ? Colors.cosmic.success : Colors.cosmic.warning }
                      ]}>
                        {points}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dosh Analysis</Text>
            
            <View style={styles.doshCard}>
              <View style={styles.doshHeader}>
                {chartData.doshAnalysis.hasMangalDosh ? (
                  <AlertTriangle size={20} color={Colors.cosmic.warning} />
                ) : (
                  <CheckCircle size={20} color={Colors.cosmic.success} />
                )}
                <Text style={styles.doshTitle}>Mangal Dosh</Text>
              </View>
              <Text style={styles.doshDetail}>{chartData.doshAnalysis.mangalDoshDetails}</Text>
              {chartData.doshAnalysis.hasMangalDosh && (
                <View style={styles.severityBadge}>
                  <Text style={styles.severityText}>
                    Severity: {chartData.doshAnalysis.mangalDoshSeverity}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.doshCard}>
              <View style={styles.doshHeader}>
                {chartData.doshAnalysis.hasShaniDosh ? (
                  <AlertTriangle size={20} color={Colors.cosmic.warning} />
                ) : (
                  <CheckCircle size={20} color={Colors.cosmic.success} />
                )}
                <Text style={styles.doshTitle}>Shani Dosh</Text>
              </View>
              <Text style={styles.doshDetail}>{chartData.doshAnalysis.shaniDoshDetails}</Text>
            </View>

            <View style={styles.doshCard}>
              <View style={styles.doshHeader}>
                {chartData.doshAnalysis.hasRahuKetuDosh ? (
                  <AlertTriangle size={20} color={Colors.cosmic.warning} />
                ) : (
                  <CheckCircle size={20} color={Colors.cosmic.success} />
                )}
                <Text style={styles.doshTitle}>Rahu-Ketu Dosh</Text>
              </View>
              <Text style={styles.doshDetail}>{chartData.doshAnalysis.rahuKetuDoshDetails}</Text>
            </View>

            {chartData.doshAnalysis.remedies.length > 0 && (
              <View style={styles.remediesCard}>
                <View style={styles.remediesHeader}>
                  <Info size={20} color={Colors.cosmic.secondary} />
                  <Text style={styles.remediesTitle}>Recommended Remedies</Text>
                </View>
                {chartData.doshAnalysis.remedies.map((remedy, index) => (
                  <Text key={index} style={styles.remedyText}>• {remedy}</Text>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getStrengthColor(strength: string): string {
  switch (strength) {
    case 'Excellent': return Colors.cosmic.success;
    case 'Good': return Colors.cosmic.primary;
    case 'Average': return Colors.cosmic.warning;
    case 'Weak': return Colors.cosmic.error;
    case 'Very Weak': return Colors.cosmic.malefic;
    default: return Colors.cosmic.neutral;
  }
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
  scoreCard: {
    backgroundColor: Colors.cosmic.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 16,
    color: Colors.cosmic.textSecondary,
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold' as const,
    color: Colors.cosmic.primary,
    marginBottom: 16,
  },
  scoreBar: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.cosmic.cardLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: Colors.cosmic.primary,
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
  balaCard: {
    backgroundColor: Colors.cosmic.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  balaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balaName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.cosmic.text,
  },
  strengthBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: 'bold' as const,
    color: Colors.cosmic.background,
  },
  balaScore: {
    fontSize: 14,
    color: Colors.cosmic.textSecondary,
    marginBottom: 8,
  },
  balaDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  balaDetail: {
    fontSize: 12,
    color: Colors.cosmic.textMuted,
  },
  ashtakavargaCard: {
    backgroundColor: Colors.cosmic.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  ashtakavargaName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.cosmic.text,
    marginBottom: 8,
  },
  ashtakavargaTotal: {
    fontSize: 14,
    color: Colors.cosmic.textSecondary,
    marginBottom: 12,
  },
  signRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  signBox: {
    width: 50,
    alignItems: 'center',
  },
  signName: {
    fontSize: 11,
    color: Colors.cosmic.textMuted,
  },
  signPoints: {
    fontSize: 14,
    fontWeight: 'bold' as const,
  },
  doshCard: {
    backgroundColor: Colors.cosmic.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  doshHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  doshTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.cosmic.text,
  },
  doshDetail: {
    fontSize: 14,
    color: Colors.cosmic.textSecondary,
    lineHeight: 20,
  },
  severityBadge: {
    backgroundColor: Colors.cosmic.cardLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  severityText: {
    fontSize: 12,
    color: Colors.cosmic.warning,
    fontWeight: '600' as const,
  },
  remediesCard: {
    backgroundColor: Colors.cosmic.cardLight,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  remediesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  remediesTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.cosmic.text,
  },
  remedyText: {
    fontSize: 14,
    color: Colors.cosmic.textSecondary,
    lineHeight: 22,
    marginBottom: 4,
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
