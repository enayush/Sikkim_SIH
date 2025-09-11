import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Heart, Calendar } from 'lucide-react-native';
import SafeScreen from '../../components/SafeScreen';

export default function DonationsBookings() {
  const { t } = useTranslation();
  const router = useRouter();

  const handleDonatePress = () => {
  };

  const handleBookVisitPress = () => {
    // Navigate to search page
    router.push('/(tabs)/search');
  };

  const handleBackPress = () => {
    router.back();
  };

  return (
    <SafeScreen>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Donations & Bookings</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Support Our Heritage Section */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Heart size={24} color="#DF8020" />
              <Text style={styles.cardTitle}>Support Our Heritage</Text>
            </View>
            
            <Text style={styles.cardDescription}>
              Your contributions help preserve the rich cultural heritage of Sikkim's monasteries. 
              Donations support maintenance, educational programs, and community outreach.
            </Text>

            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleDonatePress}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Donate</Text>
            </TouchableOpacity>
          </View>

          {/* Plan Your Visit Section */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Calendar size={24} color="#DF8020" />
              <Text style={styles.cardTitle}>Plan Your Visit</Text>
            </View>
            
            <Text style={styles.cardDescription}>
              Book your visit to experience the tranquility and beauty of Sikkim's monasteries. 
              Choose your dates, transport, and homestay options.
            </Text>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={handleBookVisitPress}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Book Visit</Text>
            </TouchableOpacity>
          </View>

          {/* Additional Information Section */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Why Support Us?</Text>
            <Text style={styles.infoText}>
              • Preserve ancient Buddhist traditions{'\n'}
              • Support local communities{'\n'}
              • Maintain historical architecture{'\n'}
              • Fund educational programs{'\n'}
              • Promote sustainable tourism
            </Text>
          </View>
        </ScrollView>
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 12,
  },
  cardDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: '#6B7280',
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#DF8020',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#DF8020',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#DF8020',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#DF8020',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
  },
});
