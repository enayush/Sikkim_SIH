

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { supabase } from '../../lib/supabase';

export default function Monastery360View() {
  const { id } = useLocalSearchParams();
  const [panoramaUrl, setPanoramaUrl] = useState('');
  const [loading, setLoading] = useState(true);
    const [rawData, setRawData] = useState<null | { image_url: string }[]>(null);

  useEffect(() => {
    async function fetchPanorama() {
      let url = '';
      let raw = null;
      if (id) {
        try {
          const monasteryId = String(id);
          const { data, error } = await supabase
            .from('monastery_360_images')
            .select('image_url')
            .eq('monastery_id', monasteryId)
            .limit(1);
          raw = data;
          if (!error && Array.isArray(data) && data.length > 0 && data[0].image_url) {
            url = data[0].image_url.trim();
          }
        } catch (err) {
          console.error('Error fetching panorama URL:', err);
        }
      }
      console.log('Fetched panoramaUrl:', url);
      setRawData(raw);
      setPanoramaUrl(url);
      setLoading(false);
    }
    fetchPanorama();
  }, [id]);

  const deviceWidth = Dimensions.get('window').width;
  const deviceHeight = Dimensions.get('window').height;

  return (
  <View style={styles.container}>
    <View style={styles.iconContainer}>
      <MaterialCommunityIcons name="rotate-360" size={32} color="#DF8020" />
    </View>
    <Text style={styles.text}>360° Panorama View</Text>
    {panoramaUrl ? (
      <WebView
        source={{
          html: `
            <html>
              <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #F9FAFB; }
                  #panorama { width: 100vw; height: 100vh; max-width: 100%; max-height: 100%; border-radius: 16px; }
                  #custom-loader {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(90deg, #FFF7ED 0%, #FDE68A 100%);
                    z-index: 9999;
                  }
                  .spinner {
                    border: 6px solid #FDE68A;
                    border-top: 6px solid #DF8020;
                    border-radius: 50%;
                    width: 48px;
                    height: 48px;
                    animation: spin 1s linear infinite;
                  }
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                  .loader-text {
                    margin-top: 18px;
                    font-size: 20px;
                    color: #DF8020;
                    font-weight: bold;
                    text-align: center;
                  }
                </style>
              </head>
              <body>
                <div id="panorama"></div>
                <div id="custom-loader">
                  <div class="spinner"></div>
                  <div class="loader-text">Loading View...</div>
                </div>
                <script src='https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js'></script>
                <link rel='stylesheet' href='https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css'/>
                <script>
                  var viewer = pannellum.viewer('panorama', {
                    type: 'equirectangular',
                    panorama: '${panoramaUrl}',
                    autoLoad: true,
                    compass: true,
                    showControls: true,
                    hfov: 110,
                    minHfov: 50,
                    maxHfov: 120,
                  });
                  viewer.on('load', function() {
                    var loader = document.getElementById('custom-loader');
                    if (loader) loader.style.display = 'none';
                  });
                </script>
              </body>
            </html>
          `
        }}
        style={{ width: deviceWidth - 40, height: deviceHeight * 0.5, borderRadius: 16, marginTop: 16, backgroundColor: '#E5E7EB', overflow: 'hidden' }}
      />
    ) : (
      <Text style={styles.subtext}>No panorama image available.</Text>
    )}
  </View>
  );
}

const styles = StyleSheet.create({
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
  loadingBox: {
    width: '90%',
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
    marginTop: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  loadingGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    backgroundColor: '#FDE68A',
    opacity: 0.3,
    zIndex: 0,
  },
  loadingText: {
    fontSize: 18,
    color: '#DF8020',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
    zIndex: 1,
  },
});