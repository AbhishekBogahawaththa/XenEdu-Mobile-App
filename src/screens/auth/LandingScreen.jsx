import { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';

const LandingScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={1}
      onPress={() => navigation.replace('Login')}
    >
      <StatusBar barStyle="light-content" />

      {/* Background circles */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      {/* Logo + Name */}
      <Animated.View style={[styles.center, {
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }]}>
        {/* Logo box */}
        <View style={styles.logoBox}>
          <View style={styles.logoInner}>
            <Text style={styles.logoX}>X</Text>
            <Text style={styles.logoE}>E</Text>
          </View>
        </View>

        {/* Name */}
        <Text style={styles.name}>XenEdu</Text>
        <Text style={styles.tagline}>Education Institute</Text>
      </Animated.View>

      {/* Tap hint */}
      <Animated.Text style={[styles.tapHint, { opacity: fadeAnim }]}>
        Tap anywhere to continue
      </Animated.Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgCircle1: {
    position: 'absolute',
    width: 350, height: 350, borderRadius: 175,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -100, right: -100,
  },
  bgCircle2: {
    position: 'absolute',
    width: 250, height: 250, borderRadius: 125,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: 80, left: -80,
  },
  center: { alignItems: 'center' },
  logoBox: {
    width: 120, height: 120, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 12,
  },
  logoInner: { flexDirection: 'row', alignItems: 'baseline' },
  logoX: { fontSize: 48, fontWeight: '900', color: COLORS.gold, letterSpacing: -2 },
  logoE: { fontSize: 40, fontWeight: '900', color: COLORS.white, letterSpacing: -1 },
  name: {
    fontSize: 42, fontWeight: '900', color: COLORS.white,
    letterSpacing: 3, marginBottom: 8,
  },
  tagline: {
    fontSize: 14, color: 'rgba(255,255,255,0.6)',
    fontWeight: '500', letterSpacing: 1,
  },
  tapHint: {
    position: 'absolute', bottom: 48,
    fontSize: 13, color: 'rgba(255,255,255,0.4)',
    fontWeight: '500', letterSpacing: 0.5,
  },
});

export default LandingScreen;