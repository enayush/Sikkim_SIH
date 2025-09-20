import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { ArrowLeft, Github, Mail, Globe, Heart, MapPin, BookOpen, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import SafeScreen from '../../components/SafeScreen';

interface Developer {
  id: string;
  name: string;
  role: string;
  github: string;
  avatar: string;
  description: string;
}

const developers: Developer[] = [
  {
    id: '1',
    name: 'Ayush Sharma',
    role: 'Lead Developer',
    github: 'enayush',
    avatar: 'https://via.placeholder.com/80x80/FF9933/FFFFFF?text=AS',
    description: 'Full-stack developer passionate about cultural preservation and technology.'
  },
  {
    id: '2',
    name: 'Shubham Singh',
    role: 'DevOps Engineer',
    github: 'shibs-01',
    avatar: 'https://via.placeholder.com/80x80/FF9933/FFFFFF?text=SS',
    description: 'DevOps expert ensuring reliable deployment and monitoring of our monastery exploration platform.'
    
  },
  {
    id: '3',
    name: 'Kushagra Anand',
    role: 'Backend Developer',
    github: 'Kusha008',
    avatar: 'https://via.placeholder.com/80x80/FF9933/FFFFFF?text=KA',
    description: 'Backend specialist with expertise in scalable architecture and database design.'
  },
  {
    id: '4',
    name: 'Laksh Sachdeva',
    role: 'Database Expert',
    github: 'Laksh-01',
    avatar: 'https://via.placeholder.com/80x80/FF9933/FFFFFF?text=LS',
    description: 'Database architect specializing in PostgreSQL optimization and data modeling for cultural heritage applications.'
  },
  {
    id: '5',
    name: 'Piyush',
    role: 'AI Engineer',
    github: 'Piyush-Sharma79',
    avatar: 'https://via.placeholder.com/80x80/FF9933/FFFFFF?text=PS',
    description: 'AI specialist developing intelligent features for monastery discovery and personalized cultural experiences.'
  },
  {
    id: '6',
    name: 'Bhavya Tiwari',
    role: 'UI/UX Designer',
    github: 'bhavya-tiwari',
    avatar: 'https://via.placeholder.com/80x80/FF9933/FFFFFF?text=BT',
    description: 'Creative designer focused on creating intuitive and beautiful user experiences.'
  }
];

export default function AboutScreen() {
  const router = useRouter();

  const handleGithubPress = (githubUsername: string) => {
    Linking.openURL(`https://github.com/${githubUsername}`);
  };

  const handleEmailPress = () => {
    Linking.openURL('mailto:support@sacredsikkim.com');
  };

  const handleWebsitePress = () => {
    Linking.openURL('https://sacredsikkim.com');
  };

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
        <Text style={styles.headerTitle}>About</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Introduction */}
        <View style={styles.section}>
          <View style={styles.appIconContainer}>
            <View style={styles.appIcon}>
              <MapPin size={32} color="#FF9933" />
            </View>
          </View>
          
          <Text style={styles.appTitle}>Sacred Sikkim</Text>
          <Text style={styles.appSubtitle}>Discover the Spiritual Heritage of Sikkim</Text>
          
          <Text style={styles.appDescription}>
            Sacred Sikkim is a comprehensive mobile application designed to help you explore 
            and discover the rich cultural heritage of monasteries in Sikkim. Our mission is 
            to preserve and share the spiritual wisdom and architectural beauty of these 
            sacred places through technology.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          
          <View style={styles.featureItem}>
            <MapPin size={20} color="#FF9933" />
            <Text style={styles.featureText}>Interactive monastery maps with GPS navigation</Text>
          </View>
          
          <View style={styles.featureItem}>
            <BookOpen size={20} color="#FF9933" />
            <Text style={styles.featureText}>Comprehensive digital cultural archive</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Users size={20} color="#FF9933" />
            <Text style={styles.featureText}>Community reviews and booking system</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Heart size={20} color="#FF9933" />
            <Text style={styles.featureText}>Support monastery preservation through donations</Text>
          </View>
        </View>

        {/* Mission */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.missionText}>
            We believe that technology can be a powerful tool for cultural preservation. 
            By making monastery information accessible and engaging, we hope to inspire 
            more people to visit these sacred places and contribute to their preservation 
            for future generations.
          </Text>
        </View>

        {/* Meet the Team */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meet the Developers</Text>
          
          {developers.map((developer) => (
            <View key={developer.id} style={styles.developerCard}>
              <View style={styles.developerAvatar}>
                <Text style={styles.avatarText}>
                  {developer.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
              
              <View style={styles.developerInfo}>
                <Text style={styles.developerName}>{developer.name}</Text>
                <Text style={styles.developerRole}>{developer.role}</Text>
                <Text style={styles.developerDescription}>{developer.description}</Text>
                
                <TouchableOpacity
                  style={styles.githubButton}
                  onPress={() => handleGithubPress(developer.github)}
                >
                  <Github size={16} color="#FFFFFF" />
                  <Text style={styles.githubButtonText}>GitHub</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Contact & Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get in Touch</Text>
          
          <TouchableOpacity style={styles.contactItem} onPress={handleEmailPress}>
            <Mail size={20} color="#FF9933" />
            <Text style={styles.contactText}>support@sacredsikkim.com</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.contactItem} onPress={handleWebsitePress}>
            <Globe size={20} color="#FF9933" />
            <Text style={styles.contactText}>sacredsikkim.com</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
          <Text style={styles.copyrightText}>
            © 2024 Sacred Sikkim. All rights reserved.
          </Text>
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
  section: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  appIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  appDescription: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  missionText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  developerCard: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  developerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF9933',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  developerInfo: {
    flex: 1,
  },
  developerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  developerRole: {
    fontSize: 14,
    color: '#FF9933',
    fontWeight: '500',
    marginBottom: 8,
  },
  developerDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  githubButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  githubButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  versionSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  copyrightText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});