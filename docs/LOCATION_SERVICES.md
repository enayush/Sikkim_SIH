# Location Services Documentation

## Overview
This location system provides comprehensive location management for the Sacred Sikkim app, including permission handling, caching, and real-time tracking.

## Architecture

### Key Components

1. **locationUtils.ts** - Core location utilities and functions
2. **LocationPermissionModal.tsx** - Permission request UI component  
3. **LocationContext.tsx** - Global location state management
4. **useLocationManager.ts** - Custom hook for easy location management

### Features

- ✅ Permission handling (Allow, Allow Once, Deny)
- ✅ Location caching with expiration
- ✅ Real-time location tracking
- ✅ Automatic cache clearing on logout
- ✅ Distance calculations
- ✅ Industry standard location refresh logic
- ✅ Error handling and retry mechanisms

## Usage

### Basic Location Access

```typescript
import { useLocation } from '@/contexts/LocationContext';

function MyComponent() {
  const { 
    userLocation, 
    locationLoading, 
    requestLocation 
  } = useLocation();

  const handleGetLocation = async () => {
    const location = await requestLocation();
    if (location) {
      console.log(`User is at: ${location.latitude}, ${location.longitude}`);
    }
  };
}
```

### Advanced Location Management

```typescript
import { useLocationManager } from '@/hooks/useLocationManager';

function MapComponent() {
  const {
    location,
    loading,
    hasPermission,
    getLocation,
    startTracking,
    distanceTo
  } = useLocationManager({
    autoRequest: true,
    watchLocation: true,
    onLocationUpdate: (location) => {
      console.log('Location updated:', location);
    }
  });

  // Calculate distance to a monastery
  const distanceToMonastery = distanceTo(27.3389, 88.6065); // Rumtek Monastery
}
```

## Location Data Structure

```typescript
interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
  address?: string;
}
```

## Permission States

- **Granted**: Full location access
- **Denied**: No location access (can ask again)
- **Never Ask Again**: Permission permanently denied

## Caching Strategy

- **Cache Duration**: 5 minutes (configurable)
- **Storage**: AsyncStorage (client-side only)
- **Auto-Clear**: On user logout
- **Refresh Logic**: Auto-refresh if cache expired

## Location Settings

```typescript
interface LocationSettings {
  autoUpdate: boolean;      // Auto-update location
  updateInterval: number;   // Update frequency (ms)
  highAccuracy: boolean;    // Use GPS vs Network
  maxAge: number;          // Cache expiration (ms)
}
```

## Industry Best Practices Implemented

1. **Permission Handling**
   - Clear permission explanations
   - Graceful degradation without location
   - Settings redirect for denied permissions

2. **Performance**
   - Client-side caching only
   - Configurable update intervals
   - Battery-efficient location requests

3. **Privacy**
   - No server-side location storage
   - Auto-clear on logout
   - Local-only coordinate storage

4. **User Experience**
   - Progressive permission requests
   - Clear error messages
   - Loading states and feedback

## Location Flow

1. **App Start**: Check permission status
2. **Splash Screen**: Show permission modal if needed
3. **User Login**: Request location (if permitted)
4. **Map Usage**: Auto-refresh stale locations
5. **Background**: Optional real-time tracking
6. **Logout**: Clear all location data

## Integration with Map

```typescript
// Example integration with a map library
function CustomMap() {
  const { location } = useLocationManager({ autoRequest: true });
  
  if (!location) return <Text>Getting your location...</Text>;
  
  return (
    <MapView
      initialRegion={{
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
    >
      <Marker coordinate={{
        latitude: location.latitude,
        longitude: location.longitude,
      }} />
    </MapView>
  );
}
```

## Error Handling

The system includes comprehensive error handling for:
- Network connectivity issues
- GPS/location service disabled
- Permission denied scenarios
- Timeout situations
- Invalid location data

## Future Enhancements

- [ ] Geofencing for monastery notifications
- [ ] Route planning and navigation
- [ ] Offline map support
- [ ] Location-based content filtering
- [ ] Background location tracking (with user consent)

## Security Considerations

- All location data stored locally
- No transmission to external servers
- User-controlled permission levels
- Automatic data cleanup on logout
- Privacy-first approach throughout
