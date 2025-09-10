import { useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useLocation } from '@/contexts/LocationContext';
import { 
  UserLocation, 
  LocationPermissionResult,
  requestLocationPermission,
  calculateDistance 
} from '@/components/splash/locationUtils';

interface UseLocationManagerOptions {
  autoRequest?: boolean;
  watchLocation?: boolean;
  onLocationUpdate?: (location: UserLocation) => void;
  onPermissionChanged?: (permission: LocationPermissionResult) => void;
}

interface UseLocationManagerReturn {
  location: UserLocation | null;
  loading: boolean;
  error: string | null;
  hasPermission: boolean;
  
  // Actions
  requestPermission: () => Promise<LocationPermissionResult>;
  getLocation: () => Promise<UserLocation | null>;
  refreshLocation: () => Promise<UserLocation | null>;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  
  // Utilities
  distanceTo: (lat: number, lon: number) => number | null;
  isLocationFresh: (maxAgeMs?: number) => boolean;
}

export function useLocationManager(
  options: UseLocationManagerOptions = {}
): UseLocationManagerReturn {
  const {
    autoRequest = false,
    watchLocation = false,
    onLocationUpdate,
    onPermissionChanged,
  } = options;

  const {
    userLocation,
    locationLoading,
    locationError,
    permissionStatus,
    requestLocation,
    refreshLocation: contextRefreshLocation,
    startWatching,
    stopWatching,
  } = useLocation();

  const [isTracking, setIsTracking] = useState(false);

  // Auto-request location on mount if enabled
  useEffect(() => {
    if (autoRequest && permissionStatus?.granted && !userLocation && !locationLoading) {
      requestLocation();
    }
  }, [autoRequest, permissionStatus, userLocation, locationLoading, requestLocation]);

  // Auto-start watching if enabled
  useEffect(() => {
    if (watchLocation && permissionStatus?.granted && !isTracking) {
      startTracking();
    }
    
    return () => {
      if (isTracking) {
        stopTracking();
      }
    };
  }, [watchLocation, permissionStatus]);

  // Notify on location updates
  useEffect(() => {
    if (userLocation && onLocationUpdate) {
      onLocationUpdate(userLocation);
    }
  }, [userLocation, onLocationUpdate]);

  // Notify on permission changes
  useEffect(() => {
    if (permissionStatus && onPermissionChanged) {
      onPermissionChanged(permissionStatus);
    }
  }, [permissionStatus, onPermissionChanged]);

  const requestPermission = useCallback(async (): Promise<LocationPermissionResult> => {
    try {
      const result = await requestLocationPermission();
      
      if (!result.granted && !result.canAskAgain) {
        Alert.alert(
          'Location Permission Required',
          'Please enable location access in your device settings to use location features.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                // Open device settings
                // This would need to be implemented based on platform
              },
            },
          ]
        );
      }
      
      return result;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      throw error;
    }
  }, []);

  const getLocation = useCallback(async (): Promise<UserLocation | null> => {
    try {
      if (!permissionStatus?.granted) {
        const permission = await requestPermission();
        if (!permission.granted) {
          throw new Error('Location permission not granted');
        }
      }
      
      return await requestLocation();
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }, [permissionStatus, requestPermission, requestLocation]);

  const refreshLocation = useCallback(async (): Promise<UserLocation | null> => {
    try {
      if (!permissionStatus?.granted) {
        throw new Error('Location permission not granted');
      }
      
      return await contextRefreshLocation();
    } catch (error) {
      console.error('Error refreshing location:', error);
      return null;
    }
  }, [permissionStatus, contextRefreshLocation]);

  const startTracking = useCallback(async (): Promise<void> => {
    try {
      if (!permissionStatus?.granted) {
        const permission = await requestPermission();
        if (!permission.granted) {
          throw new Error('Location permission not granted');
        }
      }
      
      await startWatching();
      setIsTracking(true);
    } catch (error) {
      console.error('Error starting location tracking:', error);
      throw error;
    }
  }, [permissionStatus, requestPermission, startWatching]);

  const stopTracking = useCallback((): void => {
    try {
      stopWatching();
      setIsTracking(false);
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  }, [stopWatching]);

  const distanceTo = useCallback((lat: number, lon: number): number | null => {
    if (!userLocation) {
      return null;
    }
    
    return calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      lat,
      lon
    );
  }, [userLocation]);

  const isLocationFresh = useCallback((maxAgeMs: number = 300000): boolean => {
    if (!userLocation) {
      return false;
    }
    
    const age = Date.now() - userLocation.timestamp;
    return age <= maxAgeMs;
  }, [userLocation]);

  return {
    location: userLocation,
    loading: locationLoading,
    error: locationError,
    hasPermission: permissionStatus?.granted || false,
    
    requestPermission,
    getLocation,
    refreshLocation,
    startTracking,
    stopTracking,
    
    distanceTo,
    isLocationFresh,
  };
}

// Hook for getting nearby places (placeholder for future implementation)
export function useNearbyPlaces(location: UserLocation | null, radiusKm: number = 10) {
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) {
      setNearbyPlaces([]);
      return;
    }

    // TODO: Implement actual API call to get nearby monasteries/temples
    // This is a placeholder for future implementation
    const fetchNearbyPlaces = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Placeholder - in real implementation, this would call your API
        // const response = await api.getNearbyPlaces({
        //   latitude: location.latitude,
        //   longitude: location.longitude,
        //   radius: radiusKm
        // });
        // setNearbyPlaces(response.data);
        
        // For now, just set empty array
        setNearbyPlaces([]);
      } catch (err) {
        setError('Failed to fetch nearby places');
        console.error('Error fetching nearby places:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyPlaces();
  }, [location, radiusKm]);

  return {
    nearbyPlaces,
    loading,
    error,
  };
}
