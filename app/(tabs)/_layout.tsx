import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Search, User, Map as MapIcon, Archive } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <ProtectedRoute>
      <Tabs
        screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#DF8020',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: t('map'),
          tabBarIcon: ({ size, color }) => (
            <MapIcon size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('search'),
          tabBarIcon: ({ size, color }) => (
            <Search size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="digital-archive"
        options={{
          title: t('archive'),
          tabBarIcon: ({ size, color }) => (
            <Archive size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
        </Tabs>
      </ProtectedRoute>
    );
  }