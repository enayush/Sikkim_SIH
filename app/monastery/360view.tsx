

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { supabase } from '../../lib/supabase';
import { ENV_CONFIG } from '../../lib/envConfig';

export default function Monastery360View() {
  const [webViewLoading, setWebViewLoading] = useState(true);
  const { id } = useLocalSearchParams();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    async function fetchCoords() {
      if (id) {
        try {
          const monasteryId = String(id);
          const { data, error } = await supabase
            .from('monasteries')
            .select('latitude, longitude')
            .eq('id', monasteryId)
            .single();
          if (!error && data && data.latitude && data.longitude) {
            setCoords({ lat: Number(data.latitude), lng: Number(data.longitude) });
          }
        } catch (err) {
          setCoords(null);
        }
      }
    }
    fetchCoords();
  }, [id]);

  const deviceWidth = Dimensions.get('window').width;
  const deviceHeight = Dimensions.get('window').height;

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name="rotate-360" size={32} color="#DF8020" />
      </View>
      <Text style={styles.text}>360° Panorama View</Text>
      {coords ? (
  <View style={{ width: deviceWidth - 40, height: deviceHeight * 0.75, borderRadius: 16, marginTop: 16, backgroundColor: '#E5E7EB', overflow: 'hidden', position: 'relative' }}>
          {webViewLoading && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingGradient} />
              <View style={{ alignItems: 'center', zIndex: 1 }}>
                <View style={styles.spinner} />
                <Text style={styles.loadingText}>Loading Panorama...</Text>
              </View>
            </View>
          )}
          <WebView
            source={{
              html: `
                <html>
                  <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                      html, body { height: 100%; margin: 0; padding: 0; background: #F9FAFB; }
                      #street-view { width: 100vw; height: 100vh; border-radius: 16px; }
                    </style>
                    <script src="https://maps.googleapis.com/maps/api/js?key=${ENV_CONFIG.GOOGLE_MAPS.API_KEY}"></script>
                  </head>
                  <body>
                    <div id="street-view"></div>
                    <script>
                      function initStreetView() {
                        var panorama = new google.maps.StreetViewPanorama(
                          document.getElementById('street-view'), {
                            position: { lat: ${coords.lat}, lng: ${coords.lng} },
                            pov: { heading: 165, pitch: 0 },
                            zoom: 1
                          }
                        );
                      }
                      window.onload = initStreetView;
                    </script>
                  </body>
                </html>
              `
            }}
            style={{ flex: 1, borderRadius: 16, backgroundColor: '#E5E7EB', overflow: 'hidden' }}
            onLoadEnd={() => setWebViewLoading(false)}
          />
        </View>
      ) : (
        <Text style={styles.subtext}>No panorama available for this location.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingBox: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    minHeight: 180,
    backgroundColor: '#FFF7ED',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DF8020',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
    overflow: 'hidden',
  },
  loadingGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    backgroundColor: '#FDE68A',
    opacity: 0.3,
    zIndex: 0,
  },
  spinner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 6,
    borderColor: '#FDE68A',
    borderTopColor: '#DF8020',
    marginBottom: 16,
    zIndex: 1,
    // Simple spin animation
    transform: [{ rotate: '0deg' }],
  },
  loadingText: {
    fontSize: 18,
    color: '#DF8020',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
    zIndex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  iconContainer: {
    backgroundColor: '#FFF7ED',
    borderRadius: 40,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#DF8020',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  text: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#DF8020',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
});