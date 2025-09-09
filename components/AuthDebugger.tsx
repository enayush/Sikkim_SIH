import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AuthDebugger() {
  const [debugInfo, setDebugInfo] = useState<string>('Loading...');

  const checkStoredSession = async () => {
    try {
      // Check what's stored in AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const supabaseKeys = keys.filter(key => key.includes('supabase'));
      
      let info = 'AsyncStorage Supabase Keys:\n';
      for (const key of supabaseKeys) {
        const value = await AsyncStorage.getItem(key);
        info += `${key}: ${value ? 'Has data' : 'Empty'}\n`;
      }
      
      // Check current session
      const { data: { session }, error } = await supabase.auth.getSession();
      info += `\nCurrent Session: ${session ? `User: ${session.user?.email}` : 'None'}`;
      if (error) {
        info += `\nError: ${error.message}`;
      }
      
      setDebugInfo(info);
    } catch (error) {
      setDebugInfo(`Error: ${error}`);
    }
  };

  const clearStorage = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const supabaseKeys = keys.filter(key => key.includes('supabase'));
      await AsyncStorage.multiRemove(supabaseKeys);
      await checkStoredSession();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  };

  useEffect(() => {
    checkStoredSession();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Auth Debug Info</Text>
      <Text style={styles.info}>{debugInfo}</Text>
      <TouchableOpacity style={styles.button} onPress={checkStoredSession}>
        <Text style={styles.buttonText}>Refresh</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearStorage}>
        <Text style={styles.buttonText}>Clear Storage</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 20,
    borderRadius: 10,
    zIndex: 1000,
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  info: {
    color: 'white',
    fontSize: 12,
    marginBottom: 15,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#DF8020',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  clearButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
