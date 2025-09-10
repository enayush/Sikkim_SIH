import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
  address?: string;
}

export interface LocationPermissionResult {
  granted: boolean;
  canAskAgain: boolean;
  status: Location.PermissionStatus;
}

// Storage keys
const LOCATION_STORAGE_KEY = '@user_location';
const LOCATION_PERMISSION_KEY = '@location_permission_status';
const LOCATION_SETTINGS_KEY = '@location_settings';

// Location settings interface
export interface LocationSettings {
  autoUpdate: boolean;
  updateInterval: number; // in milliseconds
  highAccuracy: boolean;
  maxAge: number; // max age of cached location in milliseconds
}

// Default location settings
const DEFAULT_LOCATION_SETTINGS: LocationSettings = {
  autoUpdate: true,
  updateInterval: 30000, // 30 seconds
  highAccuracy: true,
  maxAge: 300000, // 5 minutes
};

/**
 * Request location permissions from the user
 */
export const requestLocationPermission = async (): Promise<LocationPermissionResult> => {
  try {
    // First check current permission status
    const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
    
    if (existingStatus === 'granted') {
      return {
        granted: true,
        canAskAgain: true,
        status: existingStatus,
      };
    }

    // Request permission if not already granted
    const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
    
    // Store permission status
    await AsyncStorage.setItem(LOCATION_PERMISSION_KEY, JSON.stringify({
      status,
      canAskAgain,
      timestamp: Date.now(),
    }));

    return {
      granted: status === 'granted',
      canAskAgain,
      status,
    };
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return {
      granted: false,
      canAskAgain: false,
      status: Location.PermissionStatus.DENIED,
    };
  }
};

/**
 * Get current location permission status without requesting
 */
export const getLocationPermissionStatus = async (): Promise<LocationPermissionResult> => {
  try {
    const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
    
    return {
      granted: status === 'granted',
      canAskAgain,
      status,
    };
  } catch (error) {
    console.error('Error getting location permission status:', error);
    return {
      granted: false,
      canAskAgain: false,
      status: Location.PermissionStatus.DENIED,
    };
  }
};

/**
 * Get user's current location
 */
export const getCurrentLocation = async (highAccuracy: boolean = true): Promise<UserLocation | null> => {
  try {
    const permissionResult = await getLocationPermissionStatus();
    
    if (!permissionResult.granted) {
      throw new Error('Location permission not granted');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: highAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
    });

    const userLocation: UserLocation = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy || undefined,
      timestamp: Date.now(),
    };

    // Try to get address if possible
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      });

      if (addresses.length > 0) {
        const address = addresses[0];
        userLocation.address = `${address.street || ''} ${address.city || ''} ${address.region || ''}`.trim();
      }
    } catch (addressError) {
      console.warn('Could not get address for location:', addressError);
    }

    return userLocation;
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
};

/**
 * Cache user location in AsyncStorage
 */
export const cacheUserLocation = async (location: UserLocation): Promise<void> => {
  try {
    await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
  } catch (error) {
    console.error('Error caching user location:', error);
  }
};

/**
 * Get cached user location from AsyncStorage
 */
export const getCachedUserLocation = async (): Promise<UserLocation | null> => {
  try {
    const cachedLocationStr = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
    
    if (!cachedLocationStr) {
      return null;
    }

    const cachedLocation: UserLocation = JSON.parse(cachedLocationStr);
    
    // Check if cached location is still valid based on settings
    const settings = await getLocationSettings();
    const isExpired = Date.now() - cachedLocation.timestamp > settings.maxAge;
    
    if (isExpired) {
      await clearCachedLocation();
      return null;
    }

    return cachedLocation;
  } catch (error) {
    console.error('Error getting cached user location:', error);
    return null;
  }
};

/**
 * Clear cached user location
 */
export const clearCachedLocation = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(LOCATION_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing cached location:', error);
  }
};

/**
 * Get location settings
 */
export const getLocationSettings = async (): Promise<LocationSettings> => {
  try {
    const settingsStr = await AsyncStorage.getItem(LOCATION_SETTINGS_KEY);
    
    if (!settingsStr) {
      return DEFAULT_LOCATION_SETTINGS;
    }

    return { ...DEFAULT_LOCATION_SETTINGS, ...JSON.parse(settingsStr) };
  } catch (error) {
    console.error('Error getting location settings:', error);
    return DEFAULT_LOCATION_SETTINGS;
  }
};

/**
 * Update location settings
 */
export const updateLocationSettings = async (settings: Partial<LocationSettings>): Promise<void> => {
  try {
    const currentSettings = await getLocationSettings();
    const newSettings = { ...currentSettings, ...settings };
    await AsyncStorage.setItem(LOCATION_SETTINGS_KEY, JSON.stringify(newSettings));
  } catch (error) {
    console.error('Error updating location settings:', error);
  }
};

/**
 * Get user location with caching logic
 * This function implements the industry standard approach:
 * 1. Check cache first
 * 2. If cache is valid and not expired, return cached location
 * 3. If cache is invalid/expired, fetch new location
 * 4. Update cache with new location
 */
export const getUserLocationWithCache = async (): Promise<UserLocation | null> => {
  try {
    // First check cached location
    const cachedLocation = await getCachedUserLocation();
    
    if (cachedLocation) {
      console.log('Using cached location');
      return cachedLocation;
    }

    // If no valid cached location, get current location
    console.log('Fetching fresh location');
    const settings = await getLocationSettings();
    const currentLocation = await getCurrentLocation(settings.highAccuracy);
    
    if (currentLocation) {
      // Cache the new location
      await cacheUserLocation(currentLocation);
    }

    return currentLocation;
  } catch (error) {
    console.error('Error getting user location with cache:', error);
    return null;
  }
};

/**
 * Force refresh user location (bypass cache)
 */
export const refreshUserLocation = async (): Promise<UserLocation | null> => {
  try {
    const settings = await getLocationSettings();
    const currentLocation = await getCurrentLocation(settings.highAccuracy);
    
    if (currentLocation) {
      await cacheUserLocation(currentLocation);
    }

    return currentLocation;
  } catch (error) {
    console.error('Error refreshing user location:', error);
    return null;
  }
};

/**
 * Clear all location data (call this on logout)
 */
export const clearAllLocationData = async (): Promise<void> => {
  try {
    await Promise.all([
      AsyncStorage.removeItem(LOCATION_STORAGE_KEY),
      AsyncStorage.removeItem(LOCATION_PERMISSION_KEY),
      AsyncStorage.removeItem(LOCATION_SETTINGS_KEY),
    ]);
    console.log('All location data cleared');
  } catch (error) {
    console.error('Error clearing location data:', error);
  }
};

/**
 * Helper function to check if location services are enabled on the device
 */
export const isLocationServicesEnabled = async (): Promise<boolean> => {
  try {
    return await Location.hasServicesEnabledAsync();
  } catch (error) {
    console.error('Error checking location services:', error);
    return false;
  }
};

/**
 * Get a human-readable permission status message
 */
export const getPermissionStatusMessage = (status: LocationPermissionResult): string => {
  if (status.granted) {
    return 'Location access granted';
  }
  
  if (!status.canAskAgain) {
    return 'Location access permanently denied. Please enable in device settings.';
  }
  
  return 'Location access required for enhanced app features';
};

/**
 * Start watching user location (for real-time updates)
 */
export const startLocationWatching = async (
  onLocationUpdate: (location: UserLocation) => void,
  onError?: (error: Error) => void
): Promise<Location.LocationSubscription | null> => {
  try {
    const permissionResult = await getLocationPermissionStatus();
    
    if (!permissionResult.granted) {
      throw new Error('Location permission not granted');
    }

    const settings = await getLocationSettings();
    
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: settings.highAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
        timeInterval: settings.updateInterval,
        distanceInterval: 10, // meters
      },
      (location) => {
        const userLocation: UserLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || undefined,
          timestamp: Date.now(),
        };

        // Cache the new location
        cacheUserLocation(userLocation);
        
        // Notify callback
        onLocationUpdate(userLocation);
      }
    );

    return subscription;
  } catch (error) {
    console.error('Error starting location watching:', error);
    if (onError) {
      onError(error as Error);
    }
    return null;
  }
};

/**
 * Calculate distance between two coordinates (in meters)
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};
