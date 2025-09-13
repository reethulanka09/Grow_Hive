import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import DateTimePicker from 'react-native-ui-datepicker';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useFonts, Poppins_700Bold, Poppins_600SemiBold, Poppins_500Medium, Poppins_400Regular } from '@expo-google-fonts/poppins';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

const COLORS = {
  primary: '#34e3b0',
  secondary: '#2563eb',
  accent: '#F472B6',
  background: '#f6fbfa',
  card: '#fff',
  text: '#23272F',
  muted: '#6b7280',
  shadow: '#e0e7ef',
  logoBlue: '#2563eb',
  logoGreen: '#34e3b0',
};

const { width } = Dimensions.get('window');

// const API_BASE_URL = 'http://10.239.62.149:5000/api/auth';
import { IP } from '../Config/config';
const API_BASE_URL = `${IP}/api/auth`;

export default function DateOfBirthScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date(2003, 4, 6));
  const navigation = useNavigation();
  const route = useRoute();
  const { userToken, userId } = route.params || {};

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('DateOfBirthScreen mounted.');
    console.log('Received userToken:', userToken ? 'Present' : 'Not Present');
    console.log('Received userId:', userId ? userId : 'Not Present');
    console.log('Initial selectedDate:', selectedDate.toISOString());
    if (!userToken) {
      console.warn('DateOfBirthScreen: No userToken received. This might cause issues for API calls.');
    }
  }, []);

  const [fontsLoaded] = useFonts({
    Poppins_700Bold,
    Poppins_600SemiBold,
    Poppins_500Medium,
    Poppins_400Regular,
  });

  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: 1 - Math.abs(translateX.value) / width,
  }));

  const formatDate = (date) => {
    if (!date) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const handleNext = async () => {
    if (!selectedDate) {
      Alert.alert('Error', 'Please select your date of birth.');
      return;
    }

    setLoading(true);
    console.log('Attempting to save Date of Birth...', selectedDate.toISOString());
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
      };

      const response = await axios.put(
        `${API_BASE_URL}/profile`,
        { dateOfBirth: selectedDate.toISOString() },
        config
      );

      console.log('Date of Birth update success:', response.data);
      Alert.alert('Success', 'Date of Birth saved!');

      console.log('Attempting to navigate to PersonalDetailsScreen...');
      navigation.navigate('PersonalDetailsScreen', { userToken, userId });
      console.log('Navigation call sent from DateOfBirthScreen.');
    } catch (error) {
      console.error('Date of Birth update error:', error.response ? error.response.data : error.message);
      Alert.alert(
        'Update Failed',
        error.response && error.response.data && error.response.data.message
          ? error.response.data.message
          : 'Failed to save date of birth. Please try again.'
      );
    } finally {
      setLoading(false);
      console.log('Date of Birth process finished (loading reset).');
    }
  };

  const handleBack = () => {
    console.log('DateOfBirthScreen: Going back.');
    navigation.goBack();
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <Text style={styles.title}>Date of Birth</Text>
        <Text style={styles.selectedDateText}>{formatDate(selectedDate)}</Text>
        <Text style={styles.subtitle}>
          Tell us your birth date to personalize your experience.
        </Text>
        <View style={styles.card}>
          <DateTimePicker
            mode="single"
            date={selectedDate}
            onChange={({ date }) => {
              console.log('DateTimePicker onChange triggered, new date:', date);
              if (date) {
                setSelectedDate(new Date(date));
                console.log('Updated selectedDate:', new Date(date).toISOString());
              }
            }}
            locale="en"
            calendarTextStyle={{
              fontFamily: 'Poppins_500Medium',
              color: COLORS.text,
            }}
            selectedItemBackgroundColor={COLORS.primary}
            dayContainerStyle={{
              borderRadius: 18,
              width: 36,
              height: 36,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            style={styles.datePickerStyle}
          />
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <MaterialIcons name="arrow-back" size={28} color={COLORS.secondary} />
          </TouchableOpacity>
          <Pressable onPress={handleNext} style={styles.nextButton} android_ripple={{ color: COLORS.primary }} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={COLORS.card} size="small" />
            ) : (
              <Text style={styles.nextButtonText}>Next</Text>
            )}
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 70,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: COLORS.text,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  selectedDateText: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.secondary,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.muted,
    marginBottom: 30,
    alignSelf: 'flex-start',
    lineHeight: 22,
    fontFamily: 'Poppins_600SemiBold',
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 40,
  },
  datePickerStyle: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 0,
    width: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 20,
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.shadow,
  },
  nextButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    paddingHorizontal: 36,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: COLORS.card,
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    letterSpacing: 1,
  },
});