

import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Share2, Eye } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeScreen from '../../../components/SafeScreen';

const dummyArchives = [
  {
    id: '1',
    title: 'Thangka Art Collection',
    description: 'A vibrant collection of traditional Buddhist thangka paintings from Sikkim monasteries.',
    image: 'https://images.pexels.com/photos/2050718/pexels-photo-2050718.jpeg',
    culture: 'Buddhist',
    date: '2022-03-15',
    type: 'Image',
    tags: ['Art', 'Thangka'],
  },
  {
    id: '2',
    title: 'Monastic Manuscripts',
    description: 'Ancient scriptures and handwritten texts preserved in Sikkimese monasteries.',
    image: 'https://images.pexels.com/photos/1770809/pexels-photo-1770809.jpeg',
    culture: 'Buddhist',
    date: '2021-11-02',
    type: 'Document',
    tags: ['Scripture', 'Manuscript'],
  },
  {
    id: '3',
    title: 'Festivals of Sikkim',
    description: 'Photo archive of vibrant festivals celebrated across Sikkim monasteries.',
    image: 'https://images.pexels.com/photos/2832382/pexels-photo-2832382.jpeg',
    culture: 'Multi-cultural',
    date: '2023-01-10',
    type: 'Image',
    tags: ['Festival', 'Culture'],
  },
  {
    id: '4',
    title: 'Oral Traditions',
    description: 'Audio recordings and transcripts of folk stories and chants from Sikkim.',
    image: 'https://images.pexels.com/photos/3225531/pexels-photo-3225531.jpeg',
    culture: 'Folk',
    date: '2022-07-22',
    type: 'Audio',
    tags: ['Oral', 'Folk'],
  },
  {
    id: '5',
    title: 'Monastery Architecture',
    description: 'Archive of architectural drawings and photos of Sikkimese monasteries.',
    image: 'https://images.pexels.com/photos/1770808/pexels-photo-1770808.jpeg',
    culture: 'Buddhist',
    date: '2020-09-18',
    type: 'Image',
    tags: ['Architecture'],
  },
  {
    id: '6',
    title: 'Royal Sikkim',
    description: 'Artifacts and documents from the royal history of Sikkim.',
    image: 'https://images.pexels.com/photos/3225529/pexels-photo-3225529.jpeg',
    culture: 'Royal',
    date: '2021-05-30',
    type: 'Document',
    tags: ['Royal', 'History'],
  },
  {
    id: '7',
    title: 'Sacred Music',
    description: 'Audio archive of sacred music and chants from Sikkim monasteries.',
    image: 'https://images.pexels.com/photos/2832381/pexels-photo-2832381.jpeg',
    culture: 'Buddhist',
    date: '2023-04-12',
    type: 'Audio',
    tags: ['Music', 'Chant'],
  },
  {
    id: '8',
    title: 'Traditional Attire',
    description: 'Photos and descriptions of traditional clothing worn during monastery festivals.',
    image: 'https://images.pexels.com/photos/1770810/pexels-photo-1770810.jpeg',
    culture: 'Multi-cultural',
    date: '2022-12-05',
    type: 'Image',
    tags: ['Attire', 'Festival'],
  },
];

const archiveTypes = ['All', 'Image', 'Audio', 'Document'];

export default function DigitalArchivePage() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [selectedType, setSelectedType] = useState('All');
  const [search, setSearch] = useState('');

  // Animation states for header using reanimated
  const lastScrollY = useSharedValue(0);
  const scrollY = useSharedValue(0);
  
  const HEADER_HEIGHT = 60 + insets.top; // Filter header height + safe area
  
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      const diff = y - lastScrollY.value;

      if (diff > 0 && y > 10) {
        // scrolling down → hide header (only after scrolling past 10px)
        scrollY.value = Math.min(scrollY.value + diff, HEADER_HEIGHT + 5);
      } else if (diff < 0) {
        // scrolling up → show header
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

  const filteredArchives = dummyArchives.filter((archive) => {
    const matchesType = selectedType === 'All' || archive.type === selectedType;
    const matchesSearch =
      archive.title.toLowerCase().includes(search.toLowerCase()) ||
      archive.description.toLowerCase().includes(search.toLowerCase()) ||
      archive.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <SafeScreen>
      <View style={styles.container}>
        {/* Filter Bar as Top Bar - Clean without logo */}
        <Animated.View style={[styles.filterHeader, headerStyle, { paddingTop: insets.top }]}>
          <View style={styles.segmentedControl}>
            {archiveTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.segment, selectedType === type && styles.segmentSelected]}
                onPress={() => setSelectedType(type)}
              >
                <Text style={[styles.segmentText, selectedType === type && styles.segmentTextSelected]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <Animated.ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingTop: 60 + insets.top }]} 
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
        {filteredArchives.map((archive) => (
          <View key={archive.id} style={styles.card}>
            <Image source={{ uri: archive.image }} style={styles.cardImage} />
            <View style={styles.cardContentStack}>
              <Text style={styles.cardTitle}>{archive.title}</Text>
              <Text style={styles.cardDesc}>{archive.description}</Text>
              <View style={styles.metaRowStack}>
                <Text style={styles.metaText}>{archive.date}</Text>
                <Text style={styles.metaType}>{archive.type}</Text>
                <View style={styles.tagsRow}>
                  {archive.tags.map((tag) => (
                    <View key={tag} style={styles.tagChip}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.actionRowStack}>
                <TouchableOpacity style={styles.actionBtnStack}>
                  <Eye size={18} color="#1F2937" />
                  <Text style={styles.actionText}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtnStack}>
                  <Share2 size={18} color="#1F2937" />
                  <Text style={styles.actionText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
        {filteredArchives.length === 0 && (
          <Text style={styles.noResults}>No archives found.</Text>
        )}
      </Animated.ScrollView>

    
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  filterHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    zIndex: 1000,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 2,
  },
  segment: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 1,
  },
  segmentSelected: {
    backgroundColor: '#DF8020',
  },
  segmentText: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '500',
  },
  segmentTextSelected: {
    color: '#FFF',
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginLeft: 10,
    flex: 1,
    height: 36,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Extra bottom padding
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#F3F4F6',
  },
  cardContentStack: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  metaRowStack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 10,
  },
  metaType: {
    fontSize: 12,
    color: '#DF8020',
    fontWeight: '600',
    marginRight: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginRight: 6,
    marginBottom: 2,
  },
  tagText: {
    fontSize: 11,
    color: '#1F2937',
    fontWeight: '500',
  },
  actionRowStack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 2,
  },
  actionBtnStack: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionText: {
    fontSize: 13,
    color: '#1F2937',
    marginLeft: 4,
    fontWeight: '500',
  },
  noResults: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 16,
    marginTop: 40,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: '#DF8020',
    borderRadius: 32,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
});
