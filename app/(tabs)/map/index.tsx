import React, { useEffect, useState, useRef } from 'react';
import { 
  Text, 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  Modal,
  Platform,
  TextInput,
  FlatList,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLocation } from '@/contexts/LocationContext';
import { getAllMonasteries, Monastery } from '@/lib/monasteryService';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Mapstyle from './styles/Mapstyle';

const { width, height } = Dimensions.get('window');

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
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMonasteries, setFilteredMonasteries] = useState<Monastery[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const mapRef = useRef<MapView>(null);

  // Load monasteries on component mount
  useEffect(() => {
    loadMonasteries();
  }, []);

  const loadMonasteries = async () => {
    try {
      setLoadingMonasteries(true);
      const data = await getAllMonasteries();
      setMonasteries(data);
    } catch (error) {
      console.error('Error loading monasteries:', error);
    } finally {
      setLoadingMonasteries(false);
    }
  };

  const handleRefreshLocation = async () => {
    try {
      await refreshLocation();
    } catch (error) {
      console.error('Failed to refresh location:', error);
    }
  };

  const handleCenterOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.getCamera().then((camera) => {
        const newCamera = {
          ...camera,
          zoom: (camera.zoom || 10) + 1
        };
        mapRef.current?.animateCamera(newCamera, { duration: 200 });
      });
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.getCamera().then((camera) => {
        const newCamera = {
          ...camera,
          zoom: Math.max((camera.zoom || 10) - 1, 1)
        };
        mapRef.current?.animateCamera(newCamera, { duration: 200 });
      });
    }
  };

  const handleMarkerPress = (monastery: Monastery) => {
    setSelectedMonastery(monastery);
    setShowMonasteryModal(true);
  };

  const handleViewDetails = () => {
    if (selectedMonastery) {
      setShowMonasteryModal(false);
      router.push(`/monastery/${selectedMonastery.id}`);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 0) {
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
  };

  const handleSelectMonastery = (monastery: Monastery) => {
    setSearchQuery('');
    setShowSearchResults(false);
    Keyboard.dismiss();
    
    // Animate to monastery location
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: monastery.latitude,
        longitude: monastery.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
    
    // Show monastery details after a short delay
    setTimeout(() => {
      setSelectedMonastery(monastery);
      setShowMonasteryModal(true);
    }, 1200);
  };

  return (
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
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: 27.3389,
            longitude: 88.6100,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
          showsUserLocation={permissionStatus?.granted}
          showsMyLocationButton={false}
          showsCompass={false}
          showsScale={false}
          showsBuildings={false}
          showsTraffic={false}
          showsIndoors={false}
          rotateEnabled={false}
          pitchEnabled={false}
        >
          {/* Monastery Markers */}
          {monasteries.map((monastery) => (
            <Marker
              key={monastery.id}
              coordinate={{
                latitude: monastery.latitude,
                longitude: monastery.longitude,
              }}
              title={monastery.name}
              description={monastery.location}
              onPress={() => handleMarkerPress(monastery)}
            />
          ))}
        </MapView>
        
        {/* Loading Overlay */}
        {loadingMonasteries && (
          <View style={Mapstyle.loadingOverlay}>
            <Text style={Mapstyle.loadingText}>Loading monasteries...</Text>
          </View>
        )}
      </View>

      {/* Zoom Control Panel - Left Bottom */}
      <View style={Mapstyle.zoomControlPanel}>
        <TouchableOpacity
          style={Mapstyle.circularButton}
          onPress={handleZoomIn}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[Mapstyle.circularButton, { marginTop: 12 }]}
          onPress={handleZoomOut}
        >
          <Ionicons name="remove" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Control Panel - Only Refresh and Center buttons */}
      <View style={Mapstyle.controlPanel}>
        <TouchableOpacity
          style={Mapstyle.circularButton}
          onPress={handleRefreshLocation}
          disabled={locationLoading}
        >
          <Ionicons name="refresh" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[Mapstyle.circularButton, { marginTop: 12 }]}
          onPress={handleCenterOnUser}
          disabled={!userLocation}
        >
          <Ionicons name="navigate" size={20} color="#FFFFFF" />
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
  );
}
