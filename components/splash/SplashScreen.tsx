import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, ImageBackground, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { BlurView } from 'expo-blur';
import LocationPermissionModal from './LocationPermissionModal';
import { 
  LocationPermissionResult, 
  getLocationPermissionStatus,
  getUserLocationWithCache 
} from './locationUtils';

const FADE_IN_DURATION = 800;
const SLIDE_UP_DURATION = 700;
const STAGGER_DELAY = 150;

export default function SplashScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationPermissionChecked, setLocationPermissionChecked] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const mountTime = useRef(Date.now());

  const dotAnims = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
  ];

  useEffect(() => {
    const entranceAnimation = Animated.stagger(STAGGER_DELAY, [
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: FADE_IN_DURATION,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: SLIDE_UP_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    entranceAnimation.start();

    const createLoadingAnimation = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 800,
            delay,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    const loadingAnimations = [
      createLoadingAnimation(dotAnims[0], 0),
      createLoadingAnimation(dotAnims[1], 300),
      createLoadingAnimation(dotAnims[2], 600),
    ];

    loadingAnimations.forEach((anim) => anim.start());

    return () => {
      entranceAnimation.stop();
      loadingAnimations.forEach((anim) => anim.stop());
    };
  }, []);

  // Check location permission after auth loading is complete
  useEffect(() => {
    if (!loading && !locationPermissionChecked) {
      checkLocationPermission();
    }
  }, [loading, locationPermissionChecked]);

  const checkLocationPermission = async () => {
    try {
      const permissionStatus = await getLocationPermissionStatus();
      
      // If user is logged in and location permission hasn't been granted, show modal
      if (user && !permissionStatus.granted) {
        setShowLocationModal(true);
      }
      
      setLocationPermissionChecked(true);
    } catch (error) {
      console.error('Error checking location permission:', error);
      setLocationPermissionChecked(true);
    }
  };

  const handleLocationPermissionResult = async (result: LocationPermissionResult) => {
    setShowLocationModal(false);
    
    if (result.granted) {
      console.log('Location permission granted, caching initial location...');
      // Try to get and cache initial location
      try {
        await getUserLocationWithCache();
        console.log('Initial location cached successfully');
      } catch (error) {
        console.error('Error getting initial location:', error);
      }
    } else {
      console.log('Location permission denied');
    }
  };

  useEffect(() => {
    if (loading || showLocationModal) {
      return;
    }

    const handleRedirect = () => {
      if (user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/auth/login');
      }
    };

    const elapsed = Date.now() - mountTime.current;
    const remaining = 2500 - elapsed;

    const timer = setTimeout(handleRedirect, Math.max(0, remaining));

    return () => clearTimeout(timer);
  }, [user, loading, router, showLocationModal]);


  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('@/assets/images/splash.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <BlurView intensity={25} tint="dark" style={styles.blurOverlay}>
          <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
            <Animated.View style={[styles.logoContainer, { transform: [{ scale: scaleAnim }] }]}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </Animated.View>

            <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
                <Text style={styles.title}>Sacred Sikkim</Text>
                <Text style={styles.subtitle}>Discover spiritual places near you</Text>
            </Animated.View>

            <View style={styles.loadingContainer}>
              {dotAnims.map((anim, index) => (
                <Animated.View
                  key={index}
                  style={[styles.loadingDot, { opacity: anim }]}
                />
              ))}
            </View>
          </Animated.View>
        </BlurView>
      </ImageBackground>

      {/* Location Permission Modal */}
      <LocationPermissionModal
        visible={showLocationModal}
        onPermissionResult={handleLocationPermissionResult}
        onClose={() => setShowLocationModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    flex: 1,
  },
  blurOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  logo: {
    width: 130,
    height: 130,
    borderRadius: 65,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 24,
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#E5E7EB',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '300',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  loadingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginTop: 60,
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 8,
  },
});