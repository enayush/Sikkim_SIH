import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { User, LogOut, Globe, Heart, Award, ChevronRight, Calendar, Settings, BookOpen, CreditCard, Gift } from 'lucide-react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import SafeScreen from '../../../components/SafeScreen';
import { useSharedValue, useAnimatedScrollHandler, useAnimatedStyle } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const lastScrollY = useSharedValue(0);
  const scrollY = useSharedValue(0);

const HEADER_MAX_HEIGHT = 60; // or whatever your header height is

const scrollHandler = useAnimatedScrollHandler({
  onScroll: (event: any) => {
    const y = event.contentOffset.y;
    const diff = y - lastScrollY.value;

    if (diff > 0) {
      // scrolling down → hide
      scrollY.value = Math.min(scrollY.value + diff, HEADER_MAX_HEIGHT);
    } else {
      // scrolling up → show
      scrollY.value = Math.max(scrollY.value + diff, 0);
    }

    lastScrollY.value = y;
  },
});

const headerStyle = useAnimatedStyle(() => {
  return {
    transform: [{ translateY: -scrollY.value }],
  };
});

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              // Redirect directly to login to avoid splash screen redirect loop
              router.replace('/auth/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
  };

  return (
    <SafeScreen style={styles.container}>
      <Animated.ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with curved background */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#FF8A50', '#FFAA70', '#FFE8B0', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#E8F5E8', '#C8E6C8', '#A8D7A8']}
            locations={[0, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerGradient}
          >
            {/* Additional decorative curves */}
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />
          </LinearGradient>
          
          {/* Curved bottom overlay */}
          <View style={styles.curvedBackground} />
          
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              <View style={styles.profileImageBorder}>
                <View style={styles.profileImage}>
                  <User size={50} color="#FF9933" />
                </View>
              </View>
            </View>
            <Text style={styles.profileName}>{user?.email?.split('@')[0] || 'User'}</Text>
            <Text style={styles.profileRole}>Monastery Explorer</Text>
          </View>
        </View>

        {/* Language Selection */}
        <View style={[styles.section, styles.languageSection]}>
          <View style={styles.sectionHeader}>
            <Globe size={20} color="#FF9933" />
            <Text style={styles.sectionTitle}>Language Preferences</Text>
          </View>
          <View style={styles.languageContainer}>
            <TouchableOpacity
              style={[
                styles.languageOption,
                i18n.language === 'en' && styles.languageOptionActive,
              ]}
              onPress={() => changeLanguage('en')}
            >
              <Text style={[
                styles.languageText,
                i18n.language === 'en' && styles.languageTextActive,
              ]}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.languageOption,
                i18n.language === 'hi' && styles.languageOptionActive,
              ]}
              onPress={() => changeLanguage('hi')}
            >
              <Text style={[
                styles.languageText,
                i18n.language === 'hi' && styles.languageTextActive,
              ]}>हिन्दी</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.languageOption,
                i18n.language === 'ne' && styles.languageOptionActive,
              ]}
              onPress={() => changeLanguage('ne')}
            >
              <Text style={[
                styles.languageText,
                i18n.language === 'ne' && styles.languageTextActive,
              ]}>नेपाली</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Manage Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Settings size={20} color="#FF9933" />
            <Text style={styles.sectionTitle}>Manage</Text>
          </View>
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={styles.optionCard}
              onPress={() => {
                // Navigate to manage profile screen
                Alert.alert('Coming Soon', 'Profile management will be available soon!');
              }}
            >
              <View style={styles.optionIconContainer}>
                <User size={24} color="#3B82F6" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Edit Profile</Text>
                <Text style={styles.optionSubtitle}>Update your personal information and preferences</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" style={styles.optionArrow} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.optionCard} 
              onPress={() => router.push('/profile/user-bookings')}
            >
              <View style={styles.optionIconContainer}>
                <Calendar size={24} color="#FF9933" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>My Bookings</Text>
                <Text style={styles.optionSubtitle}>View and manage your monastery bookings</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" style={styles.optionArrow} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.optionCard} 
              onPress={() => router.push('/donations-bookings')}
            >
              <View style={styles.optionIconContainer}>
                <Heart size={24} color="#EC4899" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Donations</Text>
                <Text style={styles.optionSubtitle}>Track your contributions and support</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" style={styles.optionArrow} />
            </TouchableOpacity>
          </View>
        </View>

        {/* My Rewards Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Award size={20} color="#FF9933" />
            <Text style={styles.sectionTitle}>My Rewards</Text>
          </View>
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={styles.optionCard}
              onPress={() => {
                // Navigate to rewards or achievements screen
                Alert.alert('Coming Soon', 'Rewards system will be available soon!');
              }}
            >
              <View style={styles.optionIconContainer}>
                <Award size={24} color="#F59E0B" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Explorer Badges</Text>
                <Text style={styles.optionSubtitle}>Your monastery exploration achievements</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" style={styles.optionArrow} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.optionCard}
              onPress={() => {
                // Navigate to rewards or achievements screen
                Alert.alert('Coming Soon', 'Rewards system will be available soon!');
              }}
            >
              <View style={styles.optionIconContainer}>
                <Gift size={24} color="#10B981" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Rewards Points</Text>
                <Text style={styles.optionSubtitle}>View your earned points and benefits</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" style={styles.optionArrow} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Support & Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <BookOpen size={20} color="#FF9933" />
            <Text style={styles.sectionTitle}>Support & Information</Text>
          </View>
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={styles.optionCard}
              onPress={() => {
                // Navigate to FAQ screen
                Alert.alert('Coming Soon', 'FAQ section will be available soon!');
              }}
            >
              <View style={styles.optionIconContainer}>
                <BookOpen size={24} color="#8B5CF6" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>FAQ</Text>
                <Text style={styles.optionSubtitle}>Frequently asked questions and help</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" style={styles.optionArrow} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.optionCard}
              onPress={() => {
                // Navigate to updates screen
                Alert.alert('Coming Soon', 'Updates section will be available soon!');
              }}
            >
              <View style={styles.optionIconContainer}>
                <Calendar size={24} color="#10B981" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Updates</Text>
                <Text style={styles.optionSubtitle}>Latest app updates and new features</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" style={styles.optionArrow} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.optionCard}
              onPress={() => {
                // Navigate to about screen
                Alert.alert('Coming Soon', 'About section will be available soon!');
              }}
            >
              <View style={styles.optionIconContainer}>
                <Globe size={24} color="#F59E0B" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>About</Text>
                <Text style={styles.optionSubtitle}>Learn more about our monastery exploration app</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" style={styles.optionArrow} />
            </TouchableOpacity>
          </View>
        </View>


        {user && (
          <View style={styles.signOutSection}>
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <LogOut size={20} color="#EF4444" />
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    position: 'relative',
    height: 280,
    marginBottom: 20,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    top: 20,
    left: -40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  curvedBackground: {
    position: 'absolute',
    bottom: -30,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  profileSection: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  profileImageContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  profileImageBorder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  profileRole: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  languageSection: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  languageContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  languageOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageOptionActive: {
    backgroundColor: '#FF9933',
  },
  languageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  languageTextActive: {
    color: '#FFFFFF',
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  optionArrow: {
    marginLeft: 8,
  },
  signOutSection: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
});
