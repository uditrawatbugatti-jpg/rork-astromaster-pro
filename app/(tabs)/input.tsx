import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChart } from '@/contexts/ChartContext';
import Colors from '@/constants/colors';
import { Calendar, MapPin, Clock, User, Trash2 } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';

export default function InputScreen() {
  const { birthData, saveBirthData, clearData } = useChart();
  
  const [name, setName] = useState(birthData?.name || '');
  const [date, setDate] = useState(birthData?.date || new Date());
  const [place, setPlace] = useState(birthData?.place || '');
  const [latitude, setLatitude] = useState(birthData?.latitude?.toString() || '');
  const [longitude, setLongitude] = useState(birthData?.longitude?.toString() || '');
  const [timezone, setTimezone] = useState(birthData?.timezone || 'UTC+5:30');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleSave = () => {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      alert('Please enter valid latitude and longitude');
      return;
    }

    saveBirthData({
      name,
      date,
      place,
      latitude: lat,
      longitude: lon,
      timezone,
    });
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    clearData();
    setName('');
    setDate(new Date());
    setPlace('');
    setLatitude('');
    setLongitude('');
    setTimezone('UTC+5:30');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Birth Details</Text>
        <Text style={styles.subtitle}>Enter accurate birth information for precise calculations</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <User size={18} color={Colors.cosmic.primary} />
              <Text style={styles.label}>Name</Text>
            </View>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={Colors.cosmic.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Calendar size={18} color={Colors.cosmic.primary} />
              <Text style={styles.label}>Date of Birth</Text>
            </View>
            <TouchableOpacity
              style={styles.input}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowDatePicker(true);
              }}
            >
              <Text style={styles.inputText}>{date.toLocaleDateString()}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Clock size={18} color={Colors.cosmic.primary} />
              <Text style={styles.label}>Time of Birth</Text>
            </View>
            <TouchableOpacity
              style={styles.input}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowTimePicker(true);
              }}
            >
              <Text style={styles.inputText}>{date.toLocaleTimeString()}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <MapPin size={18} color={Colors.cosmic.primary} />
              <Text style={styles.label}>Place of Birth</Text>
            </View>
            <TextInput
              style={styles.input}
              value={place}
              onChangeText={setPlace}
              placeholder="Enter place of birth"
              placeholderTextColor={Colors.cosmic.textMuted}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Latitude</Text>
              <TextInput
                style={styles.input}
                value={latitude}
                onChangeText={setLatitude}
                placeholder="28.6139"
                placeholderTextColor={Colors.cosmic.textMuted}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Longitude</Text>
              <TextInput
                style={styles.input}
                value={longitude}
                onChangeText={setLongitude}
                placeholder="77.2090"
                placeholderTextColor={Colors.cosmic.textMuted}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Timezone</Text>
            <TextInput
              style={styles.input}
              value={timezone}
              onChangeText={setTimezone}
              placeholder="UTC+5:30"
              placeholderTextColor={Colors.cosmic.textMuted}
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Calculate Kundli</Text>
          </TouchableOpacity>

          {birthData && (
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Trash2 size={18} color={Colors.cosmic.error} />
              <Text style={styles.clearButtonText}>Clear Data</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              setDate(selectedDate);
            }
          }}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={date}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowTimePicker(Platform.OS === 'ios');
            if (selectedDate) {
              setDate(selectedDate);
            }
          }}
        />
      )}
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.cosmic.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.cosmic.textSecondary,
  },
  input: {
    backgroundColor: Colors.cosmic.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.cosmic.text,
    borderWidth: 1,
    borderColor: Colors.cosmic.border,
  },
  inputText: {
    fontSize: 16,
    color: Colors.cosmic.text,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: Colors.cosmic.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.cosmic.background,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.cosmic.error,
  },
});
