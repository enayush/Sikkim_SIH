

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
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
import { useRouter } from 'expo-router';
import SafeScreen from '../../../components/SafeScreen';
import { useSystemUI } from '../../../hooks/useSystemUI';
import { archiveService, Archive } from '../../../lib/archiveService';

const archiveTypes = ['All', 'Document', 'Correspondence'];

export default function DigitalArchivePage() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState('All');
  const [search, setSearch] = useState('');
  const [archives, setArchives] = useState<Archive[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

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

  // Load archives on component mount
  useEffect(() => {
    loadArchives(true);
  }, []);

  // Reset and reload when filter changes
  useEffect(() => {
    loadArchives(true);
  }, [selectedType]);

  const loadArchives = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setOffset(0);
        setArchives([]);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      
      const currentOffset = reset ? 0 : offset;
      const result = await archiveService.getAllArchives(10, currentOffset, selectedType);
      
      if (reset) {
        setArchives(result.data);
      } else {
        setArchives(prev => [...prev, ...result.data]);
      }
      
      setHasMore(result.hasMore);
      setOffset(currentOffset + 10);
    } catch (err) {
      setError('Failed to load archives');
      console.error('Error loading archives:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreArchives = () => {
    if (!loadingMore && hasMore) {
      loadArchives(false);
    }
  };

  const filteredArchives = archives.filter((archive) => {
    const matchesSearch = search === '' || 
      archive.archive_name.toLowerCase().includes(search.toLowerCase()) ||
      (archive.place_of_origin && archive.place_of_origin.toLowerCase().includes(search.toLowerCase())) ||
      (archive.languages && archive.languages.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch;
  });

  const handleArchivePress = (archiveId: number) => {
    router.push(`/archive-detail/${archiveId}`);
  };

  const handleShare = async (archive: Archive) => {
    Alert.alert('Coming Soon', 'Share functionality will be available soon!');
  };

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
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#DF8020" />
              <Text style={styles.loadingText}>Loading archives...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => loadArchives(true)}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {filteredArchives.map((archive) => (
                <TouchableOpacity 
                  key={archive.id} 
                  style={styles.card}
                  onPress={() => handleArchivePress(archive.id)}
                  activeOpacity={0.7}
                >
                  <Image 
                    source={{ 
                      uri: archive.image_urls && archive.image_urls.length > 0 
                        ? archive.image_urls[0] 
                        : 'https://via.placeholder.com/300x200?text=No+Image' 
                    }} 
                    style={styles.cardImage} 
                  />
                  <View style={styles.cardContentStack}>
                    <Text style={styles.cardTitle}>{archive.archive_name}</Text>
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {archive.place_of_origin || 'No description available'}
                    </Text>
                    <View style={styles.metaRowStack}>
                      <Text style={styles.metaText}>
                        {archive.creation_date || archive.digitisation_date || 'Unknown date'}
                      </Text>
                      <Text style={styles.metaType}>{archive.content_type || 'Unknown'}</Text>
                      {archive.languages && (
                        <View style={styles.tagsRow}>
                          <View style={styles.tagChip}>
                            <Text style={styles.tagText}>{archive.languages}</Text>
                          </View>
                        </View>
                      )}
                    </View>
                    <View style={styles.actionRowStack}>
                      <TouchableOpacity 
                        style={styles.actionBtnStack}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleArchivePress(archive.id);
                        }}
                      >
                        <Eye size={18} color="#1F2937" />
                        <Text style={styles.actionText}>View</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionBtnStack}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleShare(archive);
                        }}
                      >
                        <Share2 size={18} color="#1F2937" />
                        <Text style={styles.actionText}>Share</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              
              {/* Load More Button */}
              {hasMore && filteredArchives.length > 0 && (
                <TouchableOpacity 
                  style={styles.loadMoreButton}
                  onPress={loadMoreArchives}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.loadMoreButtonText}>Load More</Text>
                  )}
                </TouchableOpacity>
              )}
              
              {filteredArchives.length === 0 && !loading && (
                <Text style={styles.noResults}>No archives found.</Text>
              )}
            </>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#DF8020',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadMoreButton: {
    backgroundColor: '#DF8020',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  loadMoreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
