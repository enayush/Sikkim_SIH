import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { ArrowLeft, Calendar, Bell, CheckCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import SafeScreen from '../../components/SafeScreen';

export default function UpdatesScreen() {
  const router = useRouter();

  return (
    <SafeScreen style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Updates</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* No Updates State */}
        <View style={styles.noUpdatesContainer}>
          <View style={styles.iconContainer}>
            <Bell size={64} color="#D1D5DB" />
          </View>
          
          <Text style={styles.noUpdatesTitle}>No Updates Available</Text>
          <Text style={styles.noUpdatesText}>
            You're all caught up! There are no new updates at the moment. 
            Check back later for the latest features and improvements.
          </Text>
        </View>

        {/* Future Updates Preview */}
        <View style={styles.futureUpdatesSection}>
          <Text style={styles.sectionTitle}>Coming Soon</Text>
          
          <View style={styles.comingSoonItem}>
            <View style={styles.comingSoonIcon}>
              <Calendar size={20} color="#FF9933" />
            </View>
            <View style={styles.comingSoonContent}>
              <Text style={styles.comingSoonTitle}>Enhanced Booking System</Text>
              <Text style={styles.comingSoonDescription}>
                Improved booking experience with real-time availability and instant confirmations
              </Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonBadgeText}>Soon</Text>
            </View>
          </View>

          <View style={styles.comingSoonItem}>
            <View style={styles.comingSoonIcon}>
              <CheckCircle size={20} color="#FF9933" />
            </View>
            <View style={styles.comingSoonContent}>
              <Text style={styles.comingSoonTitle}>Offline Mode</Text>
              <Text style={styles.comingSoonDescription}>
                Download monastery information for offline access during your travels
              </Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonBadgeText}>Soon</Text>
            </View>
          </View>
        </View>

        {/* App Version Info */}
        <View style={styles.versionSection}>
          <Text style={styles.versionTitle}>App Information</Text>
          <View style={styles.versionItem}>
            <Text style={styles.versionLabel}>Current Version</Text>
            <Text style={styles.versionValue}>1.0.0</Text>
          </View>
          <View style={styles.versionItem}>
            <Text style={styles.versionLabel}>Last Updated</Text>
            <Text style={styles.versionValue}>September 2025</Text>
          </View>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  noUpdatesContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  noUpdatesTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  noUpdatesText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  futureUpdatesSection: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  comingSoonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  comingSoonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  comingSoonContent: {
    flex: 1,
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  comingSoonDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  comingSoonBadge: {
    backgroundColor: '#FEF3E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comingSoonBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FF9933',
  },
  versionSection: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  versionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  versionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  versionLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  versionValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
});
