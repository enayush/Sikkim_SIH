import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { supabase } from '../../lib/supabase';
import { ENV_CONFIG } from '../../lib/envConfig';

export default function Monastery360View() {
  const [webViewLoading, setWebViewLoading] = useState(true);
  const [streetViewAvailable, setStreetViewAvailable] = useState(true);
  const { id } = useLocalSearchParams();
  const router = useRouter();
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
          } else {
            setStreetViewAvailable(false);
            setWebViewLoading(false);
          }
        } catch (err) {
          setStreetViewAvailable(false);
          setWebViewLoading(false);
        }
      }
    }
    fetchCoords();
  }, [id]);

  const handleBackPress = () => {
    router.back();
  };

  const handleWebViewError = () => {
    setWebViewLoading(false);
    setStreetViewAvailable(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={handleBackPress}
        activeOpacity={0.7}
      >
        <ArrowLeft size={22} color="#333333" strokeWidth={2.5} />
      </TouchableOpacity>

      {coords && streetViewAvailable ? (
        <View style={styles.webViewContainer}>
          {webViewLoading && (
            <View style={styles.loadingOverlay}>
              <View style={styles.spinner} />
              <Text style={styles.loadingText}>Loading 360° View...</Text>
            </View>
          )}
          <WebView
            source={{
              html: `
                <html>
                  <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes, maximum-scale=3.0, minimum-scale=0.5">
                    <style>
                      * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                      }
                      html, body { 
                        width: 100vw;
                        height: 100vh;
                        background: #000000;
                        overflow: hidden;
                        touch-action: manipulation;
                        position: fixed;
                        top: 0;
                        left: 0;
                      }
                      #street-view { 
                        width: 100vw; 
                        height: 100vh;
                        background: #000000;
                        position: absolute;
                        top: 0;
                        left: 0;
                      }
                      .gm-style-iw {
                        background: #000000 !important;
                      }
                      .gm-style {
                        font-family: inherit !important;
                      }
                    </style>
                    <script src="https://maps.googleapis.com/maps/api/js?key=${ENV_CONFIG.GOOGLE_MAPS.API_KEY}&libraries=geometry"></script>
                  </head>
                  <body>
                    <div id="street-view"></div>
                    <script>
                      let panorama;
                      let isInitialized = false;
                      
                      function initStreetView() {
                        try {
                          const streetViewDiv = document.getElementById('street-view');
                          
                          panorama = new google.maps.StreetViewPanorama(streetViewDiv, {
                            position: { lat: ${coords.lat}, lng: ${coords.lng} },
                            pov: { heading: 0, pitch: 0 },
                            zoom: 1,
                            addressControl: false,
                            linksControl: true,
                            panControl: true,
                            zoomControl: true,
                            fullscreenControl: true,
                            enableCloseButton: false,
                            motionTracking: true,
                            motionTrackingControl: true,
                            clickToGo: true,
                            scrollwheel: true,
                            disableDefaultUI: false,
                            backgroundColor: '#000000',
                            imageDateControl: false,
                            showRoadLabels: true
                          });
                          
                          // Add event listeners to prevent issues
                          panorama.addListener('status_changed', function() {
                            const status = panorama.getStatus();
                            if (status === 'OK') {
                              isInitialized = true;
                              window.ReactNativeWebView && window.ReactNativeWebView.postMessage('STREET_VIEW_LOADED');
                            } else if (status === 'ZERO_RESULTS') {
                              window.ReactNativeWebView && window.ReactNativeWebView.postMessage('NO_STREET_VIEW');
                            }
                          });
                          
                          panorama.addListener('error', function() {
                            window.ReactNativeWebView && window.ReactNativeWebView.postMessage('ERROR');
                          });
                          
                          // Prevent zoom/pan issues
                          panorama.addListener('zoom_changed', function() {
                            if (!isInitialized) return;
                            const zoom = panorama.getZoom();
                            if (zoom < 0) panorama.setZoom(0);
                            if (zoom > 5) panorama.setZoom(5);
                          });
                          
                          // Check if Street View data is available
                          const streetViewService = new google.maps.StreetViewService();
                          streetViewService.getPanorama({
                            location: { lat: ${coords.lat}, lng: ${coords.lng} },
                            radius: 100,
                            preference: google.maps.StreetViewPreference.NEAREST
                          }, function(data, status) {
                            if (status !== 'OK') {
                              window.ReactNativeWebView && window.ReactNativeWebView.postMessage('NO_STREET_VIEW');
                            }
                          });
                          
                        } catch (error) {
                          console.error('Street View Error:', error);
                          window.ReactNativeWebView && window.ReactNativeWebView.postMessage('ERROR');
                        }
                      }
                      
                      // Retry mechanism
                      function retryInit() {
                        if (typeof google !== 'undefined' && google.maps && google.maps.StreetViewPanorama) {
                          initStreetView();
                        } else {
                          setTimeout(retryInit, 500);
                        }
                      }
                      
                      // Handle page visibility changes
                      document.addEventListener('visibilitychange', function() {
                        if (document.visibilityState === 'visible' && panorama && isInitialized) {
                          // Refresh the panorama when page becomes visible again
                          setTimeout(function() {
                            panorama.setVisible(true);
                          }, 100);
                        }
                      });
                      
                      // Initialize when ready
                      if (document.readyState === 'loading') {
                        document.addEventListener('DOMContentLoaded', retryInit);
                      } else {
                        retryInit();
                      }
                    </script>
                  </body>
                </html>
              `
            }}
            style={styles.webView}
            onLoadStart={() => setWebViewLoading(true)}
            onLoadEnd={() => setWebViewLoading(false)}
            onError={handleWebViewError}
            onMessage={(event) => {
              const message = event.nativeEvent.data;
              if (message === 'NO_STREET_VIEW' || message === 'ERROR') {
                handleWebViewError();
              } else if (message === 'STREET_VIEW_LOADED') {
                setWebViewLoading(false);
                setStreetViewAvailable(true);
              }
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            mixedContentMode="compatibility"
            thirdPartyCookiesEnabled={true}
            sharedCookiesEnabled={true}
            onShouldStartLoadWithRequest={() => true}
            renderError={() => (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Failed to load 360° view</Text>
              </View>
            )}
            onHttpError={() => {
              console.log('HTTP Error in WebView');
              handleWebViewError();
            }}
          />
        </View>
      ) : (
        <View style={styles.noImageContainer}>
          <Text style={styles.noImageText}>
            No 360° images available for this location
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backButton: {
    position: 'absolute',
    top: 45,
    left: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  webViewContainer: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  webView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    zIndex: 10,
  },
  spinner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: 'rgba(223, 128, 32, 0.3)',
    borderTopColor: '#DF8020',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    textAlign: 'center',
  },
  noImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noImageText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  errorText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '500',
  },
});