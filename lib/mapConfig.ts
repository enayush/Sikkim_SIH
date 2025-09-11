// Map configuration for optimized Google Maps usage
export const MAP_CONFIG = {
  // Default region centered on Sikkim, India
  DEFAULT_REGION: {
    latitude: 27.3389,    // Center of Sikkim state
    longitude: 88.6100,   // Center of Sikkim state
    latitudeDelta: 1.0,   // Show entire Sikkim state
    longitudeDelta: 1.0,  // Show entire Sikkim state
  },

  // Map settings optimized for cost-efficiency
  MAP_SETTINGS: {
    showsUserLocation: true,
    showsMyLocationButton: false,
    showsCompass: false,
    showsScale: false,
    showsBuildings: false, // Disable to save API calls
    showsTraffic: false,   // Disable to save API calls
    showsIndoors: false,   // Disable to save API calls
    rotateEnabled: false,  // Keep simple
    pitchEnabled: false,   // Keep simple
    mapType: 'standard' as const,
    loadingEnabled: true,
  },

  // Zoom levels optimized for Sikkim
  ZOOM_LEVELS: {
    MIN: 8,          // Don't zoom out too far from Sikkim
    MAX: 18,         // Reasonable max zoom for monasteries
    DEFAULT: 10,     // Good overview of Sikkim
    STATE_VIEW: 9,   // Full Sikkim state view
    USER_FOCUS: 14,  // Close-up on user location
    MONASTERY_FOCUS: 15, // Focus on monastery area
  },

  // Animation durations
  ANIMATION: {
    ZOOM: 300,
    PAN: 1000,
    MODAL_DELAY: 1200,
  },

  // Sikkim-specific boundaries for validation
  SIKKIM_BOUNDS: {
    NORTH: 28.1,
    SOUTH: 27.0,
    EAST: 88.9,
    WEST: 88.0,
  },

  // Search settings
  SEARCH: {
    DEBOUNCE_MS: 300,
    MIN_QUERY_LENGTH: 1,
  },
} as const;

// Helper functions for map operations
export const mapHelpers = {
  /**
   * Create a region object with proper delta values
   */
  createRegion: (latitude: number, longitude: number, zoomLevel?: number) => {
    const zoom = zoomLevel || MAP_CONFIG.ZOOM_LEVELS.DEFAULT;
    const delta = Math.max(0.001, 0.1 / zoom); // Prevent too small deltas
    return {
      latitude,
      longitude,
      latitudeDelta: delta,
      longitudeDelta: delta,
    };
  },

  /**
   * Validate coordinates
   */
  isValidCoordinate: (lat: number, lng: number): boolean => {
    return (
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180 &&
      !isNaN(lat) && !isNaN(lng)
    );
  },

  /**
   * Check if coordinates are within Sikkim bounds (approximate)
   */
  isInSikkim: (lat: number, lng: number): boolean => {
    const bounds = MAP_CONFIG.SIKKIM_BOUNDS;
    return (
      lat >= bounds.SOUTH && lat <= bounds.NORTH &&
      lng >= bounds.WEST && lng <= bounds.EAST
    );
  },

  /**
   * Calculate distance between two points (in kilometers)
   */
  calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  /**
   * Get the default Sikkim region for centering map
   */
  getSikkimRegion: () => MAP_CONFIG.DEFAULT_REGION,

  /**
   * Reset map to show all of Sikkim
   */
  createSikkimViewRegion: () => ({
    ...MAP_CONFIG.DEFAULT_REGION,
    latitudeDelta: 1.2,  // Slightly larger view to show surrounding areas
    longitudeDelta: 1.2,
  }),
};
