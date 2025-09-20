import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as Location from 'expo-location';
import {
  UserLocation,
  LocationPermissionResult,
  getUserLocationWithCache,
  refreshUserLocation,
  clearAllLocationData,
  getLocationPermissionStatus,
  requestLocationPermission,
  startLocationWatching,
  LocationSettings,
  getLocationSettings,
} from '../components/splash/locationUtils';

interface LocationContextType {
  // Location data
  userLocation: UserLocation | null;
  locationLoading: boolean;
  locationError: string | null;
  permissionStatus: LocationPermissionResult | null;
  
  // Methods
  requestPermission: () => Promise<LocationPermissionResult>;
  requestLocation: () => Promise<UserLocation | null>;
  refreshLocation: () => Promise<UserLocation | null>;
  clearLocationData: () => Promise<void>;
  startWatching: () => Promise<void>;
  stopWatching: () => void;
  
  // Settings
  locationSettings: LocationSettings | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<LocationPermissionResult | null>(null);
  const [locationSettings, setLocationSettings] = useState<LocationSettings | null>(null);
  
  const watchSubscription = useRef<Location.LocationSubscription | null>(null);
  const isWatching = useRef(false);

  // Initialize location context
  useEffect(() => {
    initializeLocation();
    loadLocationSettings();
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (watchSubscription.current) {
        watchSubscription.current.remove();
      }
    };
  }, []);

  const initializeLocation = async () => {
    try {
      // Check permission status
      const permission = await getLocationPermissionStatus();
      setPermissionStatus(permission);

      // If permission granted, try to get cached location
      if (permission.granted) {
        const cachedLocation = await getUserLocationWithCache();
        if (cachedLocation) {
          setUserLocation(cachedLocation);
        }
      }
    } catch (error) {
      console.error('Error initializing location:', error);
      setLocationError('Failed to initialize location services');
    }
  };

  const loadLocationSettings = async () => {
    try {
      const settings = await getLocationSettings();
      setLocationSettings(settings);
    } catch (error) {
      console.error('Error loading location settings:', error);
    }
  };

  const requestPermission = async (): Promise<LocationPermissionResult> => {
    try {
      const result = await requestLocationPermission();
      setPermissionStatus(result);
      return result;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      const errorResult: LocationPermissionResult = {
        granted: false,
        canAskAgain: false,
        status: 'denied' as any,
      };
      setPermissionStatus(errorResult);
      return errorResult;
    }
  };

  const requestLocation = async (): Promise<UserLocation | null> => {
    setLocationLoading(true);
    setLocationError(null);

    try {
      // First check and update permission status
      const permission = await getLocationPermissionStatus();
      setPermissionStatus(permission);

      if (!permission.granted) {
        setLocationError('Location permission not granted');
        return null;
      }

      const location = await getUserLocationWithCache();
      
      if (location) {
        setUserLocation(location);
        return location;
      } else {
        setLocationError('Unable to get location');
        return null;
      }
    } catch (error) {
      console.error('Error requesting location:', error);
      setLocationError('Failed to get location');
      return null;
    } finally {
      setLocationLoading(false);
    }
  };

  const refreshLocation = async (): Promise<UserLocation | null> => {
    setLocationLoading(true);
    setLocationError(null);

    try {
      // Check permission before refreshing
      const permission = await getLocationPermissionStatus();
      setPermissionStatus(permission);

      if (!permission.granted) {
        setLocationError('Location permission not granted');
        return null;
      }

      const location = await refreshUserLocation();
      
      if (location) {
        setUserLocation(location);
        return location;
      } else {
        setLocationError('Unable to refresh location');
        return null;
      }
    } catch (error) {
      console.error('Error refreshing location:', error);
      setLocationError('Failed to refresh location');
      return null;
    } finally {
      setLocationLoading(false);
    }
  };

  const clearLocationData = async (): Promise<void> => {
    try {
      await clearAllLocationData();
      setUserLocation(null);
      setLocationError(null);
      setPermissionStatus(null);
      
      // Stop watching if active
      if (isWatching.current) {
        stopWatching();
      }
    } catch (error) {
      console.error('Error clearing location data:', error);
    }
  };

  const startWatching = async (): Promise<void> => {
    if (isWatching.current) {
      return;
    }

    try {
      const subscription = await startLocationWatching(
        (location) => {
          setUserLocation(location);
          setLocationError(null);
        },
        (error) => {
          console.error('Location watching error:', error);
          setLocationError('Location tracking error');
        }
      );

      if (subscription) {
        watchSubscription.current = subscription;
        isWatching.current = true;
      }
    } catch (error) {
      console.error('Error starting location watching:', error);
      setLocationError('Failed to start location tracking');
    }
  };

  const stopWatching = (): void => {
    if (watchSubscription.current) {
      watchSubscription.current.remove();
      watchSubscription.current = null;
      isWatching.current = false;
    }
  };

  const value: LocationContextType = {
    userLocation,
    locationLoading,
    locationError,
    permissionStatus,
    requestPermission,
    requestLocation,
    refreshLocation,
    clearLocationData,
    startWatching,
    stopWatching,
    locationSettings,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
