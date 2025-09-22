import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { ArrowLeft, ChevronDown, ChevronUp, HelpCircle, BookOpen, MapPin } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import SafeScreen from '../../components/SafeScreen';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  // General Questions
  {
    id: '1',
    question: 'What is Monastery360?',
    answer: 'Monastery360 is a comprehensive mobile application designed to help you explore and discover the rich cultural heritage of monasteries in Sikkim. It provides interactive maps, detailed monastery information, booking services, and cultural archives.',
    category: 'General'
  },
  {
    id: '2',
    question: 'How do I create an account?',
    answer: 'You can create an account by tapping the "Sign Up" button on the login screen. You\'ll need to provide a username, email address, and password. Your account will be created and you can start exploring immediately.',
    category: 'General'
  },
  {
    id: '3',
    question: 'Is the app free to use?',
    answer: 'Yes, Monastery360 is completely free to download and use. All core features including monastery exploration, maps, and basic booking services are available at no cost.',
    category: 'General'
  },
  
  // Monastery & Booking
  {
    id: '4',
    question: 'How do I book a monastery visit?',
    answer: 'To book a visit, navigate to the monastery details page, tap "Book Visit", select your preferred date and time, enter the number of people, and provide your contact information. You\'ll receive a confirmation email.',
    category: 'Monastery & Booking'
  },
  {
    id: '5',
    question: 'Can I cancel my booking?',
    answer: 'Yes, you can cancel your booking through the "My Bookings" section in your profile. Cancellations are free up to 24 hours before your scheduled visit.',
    category: 'Monastery & Booking'
  },
  {
    id: '6',
    question: 'Are all monasteries open to visitors?',
    answer: 'Most monasteries welcome visitors, but some may have restricted access during religious ceremonies or special events. Check the monastery details for current visiting hours and any restrictions.',
    category: 'Monastery & Booking'
  },
  
  // Technical Support
  {
    id: '7',
    question: 'The app is not loading properly. What should I do?',
    answer: 'Try closing and reopening the app, check your internet connection, or restart your device. If the problem persists, try clearing the app cache or reinstalling the app.',
    category: 'Technical Support'
  },
  {
    id: '8',
    question: 'How do I enable location services?',
    answer: 'Go to your device settings, find Monastery360 in the app list, and enable location permissions. This allows the app to show your current location on the map and provide nearby monastery recommendations.',
    category: 'Technical Support'
  },
  {
    id: '9',
    question: 'Can I use the app offline?',
    answer: 'Some features like monastery information and maps work offline after initial download. However, booking services and real-time updates require an internet connection.',
    category: 'Technical Support'
  }
];

const categories = ['All', 'General', 'Monastery & Booking', 'Technical Support'];

export default function FAQScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const filteredFAQs = selectedCategory === 'All' 
    ? faqData 
    : faqData.filter(item => item.category === selectedCategory);

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'General':
        return <HelpCircle size={20} color="#FF9933" />;
      case 'Monastery & Booking':
        return <MapPin size={20} color="#FF9933" />;
      case 'Technical Support':
        return <BookOpen size={20} color="#FF9933" />;
      default:
        return <HelpCircle size={20} color="#FF9933" />;
    }
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
        <Text style={styles.headerTitle}>FAQ</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Category Filter */}
        <View style={styles.categoryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === category && styles.categoryButtonTextActive
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* FAQ Items */}
        <View style={styles.faqContainer}>
          {filteredFAQs.map((item) => {
            const isExpanded = expandedItems.has(item.id);
            return (
              <View key={item.id} style={styles.faqItem}>
                <TouchableOpacity
                  style={styles.faqQuestion}
                  onPress={() => toggleExpanded(item.id)}
                >
                  <View style={styles.questionContent}>
                    <View style={styles.questionHeader}>
                      {getCategoryIcon(item.category)}
                      <Text style={styles.questionText}>{item.question}</Text>
                    </View>
                    {isExpanded ? (
                      <ChevronUp size={20} color="#6B7280" />
                    ) : (
                      <ChevronDown size={20} color="#6B7280" />
                    )}
                  </View>
                </TouchableOpacity>
                
                {isExpanded && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.answerText}>{item.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Contact Support */}
        <View style={styles.supportSection}>
          <Text style={styles.supportTitle}>Still need help?</Text>
          <Text style={styles.supportText}>
            If you can't find the answer to your question, feel free to contact our support team.
          </Text>
          <TouchableOpacity style={styles.contactButton}>
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
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
  categoryContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 12,
  },
  categoryButtonActive: {
    backgroundColor: '#FF9933',
    borderColor: '#FF9933',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  faqContainer: {
    paddingHorizontal: 20,
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  faqQuestion: {
    padding: 16,
  },
  questionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  answerText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginTop: 8,
  },
  supportSection: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  supportText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  contactButton: {
    backgroundColor: '#FF9933',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
