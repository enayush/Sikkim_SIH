import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Linking from 'expo-linking';
import {
  requestLocationPermission,
  LocationPermissionResult,
  getLocationPermissionStatus,
} from './locationUtils';

interface LocationPermissionModalProps {
  visible: boolean;
  onPermissionResult: (result: LocationPermissionResult) => void;
  onClose: () => void;
}

export default function LocationPermissionModal({
  visible,
  onPermissionResult,
  onClose,
}: LocationPermissionModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAllowOnce = async () => {
    setIsLoading(true);
    try {
      const result = await requestLocationPermission();
      onPermissionResult(result);
    } catch (error) {
      console.error('Error requesting location permission:', error);
      Alert.alert(
        'Permission Error',
        'Unable to request location permission. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAlwaysAllow = async () => {
    setIsLoading(true);
    try {
      const result = await requestLocationPermission();
      
      if (result.granted) {
        onPermissionResult(result);
      } else if (!result.canAskAgain) {
        // Permission was permanently denied, show settings alert
        Alert.alert(
          'Location Access Required',
          'To use location features, please enable location access in your device settings.',
          [
            { text: 'Not Now', style: 'cancel', onPress: () => onPermissionResult(result) },
            {
              text: 'Open Settings',
              onPress: () => {
                Linking.openSettings();
                onPermissionResult(result);
              },
            },
          ]
        );
      } else {
        onPermissionResult(result);
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      Alert.alert(
        'Permission Error',
        'Unable to request location permission. Please try again.'
      );
      onPermissionResult({
        granted: false,
        canAskAgain: true,
        status: 'denied' as any,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeny = () => {
    const result: LocationPermissionResult = {
      granted: false,
      canAskAgain: true,
      status: 'denied' as any,
    };
    onPermissionResult(result);
  };

  const handleNotNow = () => {
    const result: LocationPermissionResult = {
      granted: false,
      canAskAgain: true,
      status: 'denied' as any,
    };
    onPermissionResult(result);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={20} tint="dark" style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modal}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Ionicons
                name="location-outline"
                size={60}
                color="#4F46E5"
              />
            </View>

            {/* Title */}
            <Text style={styles.title}>
              Enable Location Services
            </Text>

            {/* Description */}
            <Text style={styles.description}>
              Sacred Sikkim needs access to your location to show nearby monasteries, temples, and spiritual places on the map.
            </Text>

            {/* Benefits */}
            <View style={styles.benefitsContainer}>
              <View style={styles.benefitRow}>
                <Ionicons name="map-outline" size={20} color="#10B981" />
                <Text style={styles.benefitText}>
                  Find spiritual places near you
                </Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons name="navigate-outline" size={20} color="#10B981" />
                <Text style={styles.benefitText}>
                  Get directions to sacred sites
                </Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons name="star-outline" size={20} color="#10B981" />
                <Text style={styles.benefitText}>
                  Discover hidden gems nearby
                </Text>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleAlwaysAllow}
                disabled={isLoading}
              >
                <Text style={styles.primaryButtonText}>
                  {isLoading ? 'Requesting...' : 'Allow'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleAllowOnce}
                disabled={isLoading}
              >
                <Text style={styles.secondaryButtonText}>
                  Allow Once
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.textButton}
                onPress={handleNotNow}
                disabled={isLoading}
              >
                <Text style={styles.textButtonText}>
                  Not Now
                </Text>
              </TouchableOpacity>
            </View>

            {/* Privacy note */}
            <Text style={styles.privacyNote}>
              Your location data is stored locally on your device and is never shared with third parties.
            </Text>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
  },
  modal: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: 32,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    borderWidth: 1,
    borderColor: '#4F46E5',
  },
  secondaryButtonText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '600',
  },
  textButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  textButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  privacyNote: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});
