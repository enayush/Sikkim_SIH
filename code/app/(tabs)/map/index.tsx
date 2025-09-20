import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { 
  Text, 
  View, 
  TouchableOpacity, 
  Modal,
  TextInput,
  FlatList,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLocation } from '@/contexts/LocationContext';
import { getAllMonasteries, Monastery } from '@/lib/monasteryService';
import MapView, { Marker } from 'react-native-maps';
import Mapstyle from './styles/Mapstyle';
import { MapErrorBoundary } from '@/components/MapErrorBoundary';
import SafeScreen from '@/components/SafeScreen';
import { MAP_CONFIG, mapHelpers } from '@/lib/mapConfig';

export default function Map() {
  const {
    userLocation,
    locationLoading,
    permissionStatus,
    requestPermission,
    requestLocation,
    refreshLocation,
  } = useLocation();

  const [selectedMonastery, setSelectedMonastery] = useState<Monastery | null>(null);
  const [showMonasteryModal, setShowMonasteryModal] = useState(false);
  const [monasteries, setMonasteries] = useState<Monastery[]>([]);
  const [loadingMonasteries, setLoadingMonasteries] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMonasteries, setFilteredMonasteries] = useState<Monastery[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<MapView>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load monasteries on component mount
  useEffect(() => {
    loadMonasteries();
    return () => {
      // Cleanup search timeout on unmount
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const loadMonasteries = useCallback(async () => {
    try {
      setLoadingMonasteries(true);
      setMapError(null);
      const data = await getAllMonasteries();
      setMonasteries(data);
    } catch (error) {
      console.error('Error loading monasteries:', error);
      setMapError('Failed to load monastery data. Please check your internet connection.');
      // Show user-friendly error
      Alert.alert(
        'Loading Error',
        'Unable to load monastery locations. Please check your internet connection and try again.',
        [
          { text: 'Retry', onPress: loadMonasteries },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setLoadingMonasteries(false);
    }
  }, []);

  const handleRefreshLocation = useCallback(async () => {
    try {
      if (!permissionStatus?.granted) {
        const permission = await requestPermission();
        if (!permission.granted) {
          Alert.alert(
            'Location Permission Required',
            'Please enable location services to use this feature.',
            [{ text: 'OK' }]
          );
          return;
        }
      }
      await refreshLocation();
    } catch (error) {
      console.error('Failed to refresh location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [permissionStatus, requestPermission, refreshLocation]);

  const handleCenterOnUser = useCallback(() => {
    if (!userLocation) {
      Alert.alert(
        'Location Unavailable',
        'Your location is not available. Please enable location services and try again.',
        [
          { text: 'Refresh Location', onPress: handleRefreshLocation },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    if (mapRef.current && mapReady) {
      const region = mapHelpers.createRegion(
        userLocation.latitude,
        userLocation.longitude,
        MAP_CONFIG.ZOOM_LEVELS.USER_FOCUS
      );
      mapRef.current.animateToRegion(region, MAP_CONFIG.ANIMATION.PAN);
    }
  }, [userLocation, mapReady, handleRefreshLocation]);

  const handleCenterOnSikkim = useCallback(() => {
    if (mapRef.current && mapReady) {
      const sikkimRegion = mapHelpers.getSikkimRegion();
      mapRef.current.animateToRegion(sikkimRegion, MAP_CONFIG.ANIMATION.PAN);
    }
  }, [mapReady]);

  const handleZoomIn = useCallback(() => {
    if (mapRef.current && mapReady) {
      mapRef.current.getCamera().then((camera) => {
        const currentZoom = camera.zoom || MAP_CONFIG.ZOOM_LEVELS.DEFAULT;
        const newZoom = Math.min(currentZoom + 1, MAP_CONFIG.ZOOM_LEVELS.MAX);
        const newCamera = { ...camera, zoom: newZoom };
        mapRef.current?.animateCamera(newCamera, { duration: MAP_CONFIG.ANIMATION.ZOOM });
      }).catch((error) => {
        console.warn('Zoom in failed:', error);
      });
    }
  }, [mapReady]);

  const handleZoomOut = useCallback(() => {
    if (mapRef.current && mapReady) {
      mapRef.current.getCamera().then((camera) => {
        const currentZoom = camera.zoom || MAP_CONFIG.ZOOM_LEVELS.DEFAULT;
        const newZoom = Math.max(currentZoom - 1, MAP_CONFIG.ZOOM_LEVELS.MIN);
        const newCamera = { ...camera, zoom: newZoom };
        mapRef.current?.animateCamera(newCamera, { duration: MAP_CONFIG.ANIMATION.ZOOM });
      }).catch((error) => {
        console.warn('Zoom out failed:', error);
      });
    }
  }, [mapReady]);

  const handleMarkerPress = useCallback((monastery: Monastery) => {
    setSelectedMonastery(monastery);
    setShowMonasteryModal(true);
  }, []);

  const handleViewDetails = useCallback(() => {
    if (selectedMonastery) {
      setShowMonasteryModal(false);
      router.push(`/monastery/${selectedMonastery.id}`);
    }
  }, [selectedMonastery]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search to avoid excessive filtering
    searchTimeoutRef.current = setTimeout(() => {
      if (query.trim().length >= MAP_CONFIG.SEARCH.MIN_QUERY_LENGTH) {
        const filtered = monasteries.filter(monastery =>
          monastery.name.toLowerCase().includes(query.toLowerCase()) ||
          monastery.location.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredMonasteries(filtered);
        setShowSearchResults(true);
      } else {
        setFilteredMonasteries([]);
        setShowSearchResults(false);
      }
    }, MAP_CONFIG.SEARCH.DEBOUNCE_MS);
  }, [monasteries]);

  // Memoize the initial region to prevent unnecessary re-renders
  const initialMapRegion = useMemo(() => {
    // Always start with Sikkim as the default region
    return MAP_CONFIG.DEFAULT_REGION;
  }, []);

  // Memoize monastery markers for better performance
  const monasteryMarkers = useMemo(() => {
    return monasteries
      .filter(monastery => 
        mapHelpers.isValidCoordinate(monastery.latitude, monastery.longitude)
      )
      .map((monastery) => (
        <Marker
          key={monastery.id}
          coordinate={{
            latitude: monastery.latitude,
            longitude: monastery.longitude,
          }}
          title={monastery.name}
          description={monastery.location}
          onPress={() => handleMarkerPress(monastery)}
          tracksViewChanges={false} // Optimize performance
        />
      ));
  }, [monasteries, handleMarkerPress]);

  const handleSelectMonastery = useCallback((monastery: Monastery) => {
    setSearchQuery('');
    setShowSearchResults(false);
    Keyboard.dismiss();
    
    // Animate to monastery location
    if (mapRef.current && mapReady) {
      const region = mapHelpers.createRegion(
        monastery.latitude,
        monastery.longitude,
        MAP_CONFIG.ZOOM_LEVELS.MONASTERY_FOCUS
      );
      mapRef.current.animateToRegion(region, MAP_CONFIG.ANIMATION.PAN);
      
      // Show monastery details after a short delay
      setTimeout(() => {
        setSelectedMonastery(monastery);
        setShowMonasteryModal(true);
      }, MAP_CONFIG.ANIMATION.MODAL_DELAY);
    } else {
      // If map not ready, show details immediately
      setSelectedMonastery(monastery);
      setShowMonasteryModal(true);
    }
  }, [mapReady]);

  return (
    <SafeScreen backgroundColor="#F9FAFB">
      <MapErrorBoundary>
        <View style={Mapstyle.container}>
      {/* Search Bar */}
      <View style={Mapstyle.searchContainer}>
        <View style={Mapstyle.searchInputContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={Mapstyle.searchIcon} />
          <TextInput
            style={Mapstyle.searchInput}
            placeholder="Search monasteries..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
            onSubmitEditing={() => {
              if (filteredMonasteries.length > 0) {
                handleSelectMonastery(filteredMonasteries[0]);
              }
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => {
                setSearchQuery('');
                setShowSearchResults(false);
                Keyboard.dismiss();
              }}
              style={Mapstyle.clearButton}
            >
              <Ionicons name="close" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Results */}
        {showSearchResults && filteredMonasteries.length > 0 && (
          <View style={Mapstyle.searchResults}>
            <FlatList
              data={filteredMonasteries}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={Mapstyle.searchResultItem}
                  onPress={() => handleSelectMonastery(item)}
                >
                  <Ionicons name="location" size={16} color="#FF8C00" />
                  <View style={Mapstyle.searchResultText}>
                    <Text style={Mapstyle.searchResultName}>{item.name}</Text>
                    <Text style={Mapstyle.searchResultLocation}>{item.location}</Text>
                  </View>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}
      </View>

      {/* Native Map View */}
      <View style={Mapstyle.mapContainer}>
        <MapView
          ref={mapRef}
          style={Mapstyle.map}
          initialRegion={initialMapRegion}
          {...MAP_CONFIG.MAP_SETTINGS}
          showsUserLocation={permissionStatus?.granted && !locationLoading && MAP_CONFIG.MAP_SETTINGS.showsUserLocation}
          onMapReady={() => {
            setMapReady(true);
            setMapError(null);
          }}
          onMapLoaded={() => {
            // Map loaded successfully
          }}
        >
          {/* Monastery Markers - Memoized for performance */}
          {monasteryMarkers}
        </MapView>
        
        {/* Loading Overlay */}
        {(loadingMonasteries || !mapReady) && (
          <View style={Mapstyle.loadingOverlay}>
            <ActivityIndicator size="small" color="#DF8020" />
            <Text style={Mapstyle.loadingText}>
              {loadingMonasteries ? 'Loading monasteries...' : 'Initializing map...'}
            </Text>
          </View>
        )}

        {/* Error Overlay */}
        {mapError && !loadingMonasteries && (
          <View style={[Mapstyle.loadingOverlay, { backgroundColor: 'rgba(255, 0, 0, 0.1)' }]}>
            <Ionicons name="warning" size={20} color="#DC2626" />
            <Text style={[Mapstyle.loadingText, { color: '#DC2626', textAlign: 'center' }]}>
              {mapError}
            </Text>
            <TouchableOpacity
              onPress={loadMonasteries}
              style={{
                marginTop: 8,
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: '#DC2626',
                borderRadius: 4,
              }}
            >
              <Text style={{ color: 'white', fontSize: 12 }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Zoom Control Panel - Left Bottom */}
      <View style={Mapstyle.zoomControlPanel}>
        <TouchableOpacity
          style={[
            Mapstyle.circularButton,
            !mapReady && { opacity: 0.5 }
          ]}
          onPress={handleZoomIn}
          disabled={!mapReady}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            Mapstyle.circularButton,
            { marginTop: 12 },
            !mapReady && { opacity: 0.5 }
          ]}
          onPress={handleZoomOut}
          disabled={!mapReady}
        >
          <Ionicons name="remove" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Control Panel - Only Refresh and Center buttons */}
      <View style={Mapstyle.controlPanel}>
        <TouchableOpacity
          style={[
            Mapstyle.circularButton,
            locationLoading && { opacity: 0.5 }
          ]}
          onPress={handleRefreshLocation}
          disabled={locationLoading}
        >
          {locationLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            Mapstyle.circularButton,
            { marginTop: 12 },
            (!userLocation || !mapReady) && { opacity: 0.5 }
          ]}
          onPress={handleCenterOnUser}
          disabled={!userLocation || !mapReady}
        >
          <Ionicons name="navigate" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            Mapstyle.circularButton,
            { marginTop: 12 },
            !mapReady && { opacity: 0.5 }
          ]}
          onPress={handleCenterOnSikkim}
          disabled={!mapReady}
        >
          <Ionicons name="home" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Monastery Details Modal */}
      <Modal
        visible={showMonasteryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMonasteryModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowMonasteryModal(false)}>
          <View style={Mapstyle.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={Mapstyle.modalContent}>
                {selectedMonastery && (
                  <>
                    <View style={Mapstyle.modalHeader}>
                      <TouchableOpacity
                        style={Mapstyle.modalCloseButton}
                        onPress={() => setShowMonasteryModal(false)}
                      >
                        <Ionicons name="close" size={24} color="#6B7280" />
                      </TouchableOpacity>
                    </View>

                    <View style={Mapstyle.modalBody}>
                      <View style={Mapstyle.monasteryIcon}>
                        <Ionicons name="business" size={32} color="#FF8C00" />
                      </View>
                      
                      <Text style={Mapstyle.modalTitle}>{selectedMonastery.name}</Text>
                      <Text style={Mapstyle.modalSubtitle}>{selectedMonastery.location}</Text>
                      <Text style={Mapstyle.modalEra}>{selectedMonastery.era}</Text>
                      
                      <Text style={Mapstyle.modalDescription}>
                        {selectedMonastery.description}
                      </Text>
                      
                      <View style={Mapstyle.modalButtons}>
                        <TouchableOpacity
                          style={Mapstyle.modalButton}
                          onPress={handleViewDetails}
                        >
                          <Ionicons name="information-circle" size={20} color="#FFFFFF" />
                          <Text style={Mapstyle.modalButtonText}>View Details</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
        </View>
      </MapErrorBoundary>
    </SafeScreen>
  );
}
