import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import SafeScreen from '../../components/SafeScreen';
import { archiveService, Archive } from '../../lib/archiveService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ArchiveDetailPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [archive, setArchive] = useState<Archive | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);

  // Animation values
  const modalTranslateY = useSharedValue(screenHeight);
  const modalOpacity = useSharedValue(0);
  const imageScale = useSharedValue(1);
  const imageTranslateX = useSharedValue(0);
  const imageTranslateY = useSharedValue(0);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadArchive();
  }, [id]);

  const loadArchive = async () => {
    try {
      setLoading(true);
      setError(null);
      const archiveId = parseInt(id as string);
      const data = await archiveService.getArchiveById(archiveId);
      setArchive(data);
    } catch (err) {
      setError('Failed to load archive details');
      console.error('Error loading archive:', err);
    } finally {
      setLoading(false);
    }
  };

  const showModal = () => {
    setModalVisible(true);
    modalTranslateY.value = withSpring(screenHeight * 0.5, {
      damping: 20,
      stiffness: 300,
    });
    modalOpacity.value = withTiming(1, { duration: 300 });
  };

  const hideModal = () => {
    modalTranslateY.value = withTiming(screenHeight, { duration: 300 });
    modalOpacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(setModalVisible)(false);
    });
  };

  const nextImage = () => {
    if (archive?.image_urls && currentImageIndex < archive.image_urls.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const resetImageTransform = () => {
    imageScale.value = withSpring(1);
    imageTranslateX.value = withSpring(0);
    imageTranslateY.value = withSpring(0);
  };

  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    if (scrollY > 50 && !modalVisible) {
      showModal();
    }
  };

  const modalStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: modalTranslateY.value }],
      opacity: modalOpacity.value,
    };
  });

  const imageStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: imageScale.value },
        { translateX: imageTranslateX.value },
        { translateY: imageTranslateY.value },
      ],
    };
  });

  const panGestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startScale = imageScale.value;
      context.startTranslateX = imageTranslateX.value;
      context.startTranslateY = imageTranslateY.value;
    },
    onActive: (event, context) => {
      if (event.numberOfPointers === 1) {
        // Single finger - pan
        imageTranslateX.value = context.startTranslateX + event.translationX;
        imageTranslateY.value = context.startTranslateY + event.translationY;
      } else if (event.numberOfPointers === 2) {
        // Two fingers - zoom
        const scale = Math.max(0.5, Math.min(3, context.startScale * event.scale));
        imageScale.value = scale;
      }
    },
    onEnd: () => {
      // Snap back if scale is too small
      if (imageScale.value < 1) {
        imageScale.value = withSpring(1);
        imageTranslateX.value = withSpring(0);
        imageTranslateY.value = withSpring(0);
      }
    },
  });

  if (loading) {
    return (
      <SafeScreen backgroundColor="#000000" statusBarStyle="light-content">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading archive...</Text>
        </View>
      </SafeScreen>
    );
  }

  if (error || !archive) {
    return (
      <SafeScreen backgroundColor="#000000" statusBarStyle="light-content">
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Archive not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadArchive}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeScreen>
    );
  }

  const images = archive.image_urls || [];
  const currentImage = images[currentImageIndex];

  return (
    <SafeScreen backgroundColor="#000000" statusBarStyle="light-content">
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {archive.archive_name}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          {images.length > 0 ? (
            <PanGestureHandler onGestureEvent={panGestureHandler}>
              <Animated.View style={styles.imageWrapper}>
                <Animated.Image
                  source={{ uri: currentImage }}
                  style={[styles.image, imageStyle]}
                  resizeMode="contain"
                />
                
                {/* Image Navigation */}
                {images.length > 1 && (
                  <>
                    {currentImageIndex > 0 && (
                      <TouchableOpacity
                        style={[styles.navButton, styles.navButtonLeft]}
                        onPress={prevImage}
                      >
                        <ChevronLeft size={24} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}
                    {currentImageIndex < images.length - 1 && (
                      <TouchableOpacity
                        style={[styles.navButton, styles.navButtonRight]}
                        onPress={nextImage}
                      >
                        <ChevronRight size={24} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}
                  </>
                )}

                {/* Image Counter */}
                {images.length > 1 && (
                  <View style={styles.imageCounter}>
                    <Text style={styles.imageCounterText}>
                      {currentImageIndex + 1} / {images.length}
                    </Text>
                  </View>
                )}

                {/* Reset Zoom Button */}
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={resetImageTransform}
                >
                  <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>
              </Animated.View>
            </PanGestureHandler>
          ) : (
            <View style={styles.noImageContainer}>
              <Text style={styles.noImageText}>No images available</Text>
            </View>
          )}
        </View>

        {/* Metadata Modal */}
        {modalVisible && (
          <Animated.View style={[styles.modal, modalStyle]}>
            <View style={styles.modalHandle} />
            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{archive.archive_name}</Text>
                <TouchableOpacity onPress={hideModal} style={styles.closeButton}>
                  <X size={24} color="#1F2937" />
                </TouchableOpacity>
              </View>

              <View style={styles.metadataContainer}>
                {archive.creation_date && (
                  <View style={styles.metadataRow}>
                    <Text style={styles.metadataLabel}>Creation Date:</Text>
                    <Text style={styles.metadataValue}>{archive.creation_date}</Text>
                  </View>
                )}

                {archive.digitisation_date && (
                  <View style={styles.metadataRow}>
                    <Text style={styles.metadataLabel}>Digitisation Date:</Text>
                    <Text style={styles.metadataValue}>{archive.digitisation_date}</Text>
                  </View>
                )}

                {archive.content_type && (
                  <View style={styles.metadataRow}>
                    <Text style={styles.metadataLabel}>Content Type:</Text>
                    <Text style={styles.metadataValue}>{archive.content_type}</Text>
                  </View>
                )}

                {archive.languages && (
                  <View style={styles.metadataRow}>
                    <Text style={styles.metadataLabel}>Languages:</Text>
                    <Text style={styles.metadataValue}>{archive.languages}</Text>
                  </View>
                )}

                {archive.scripts && (
                  <View style={styles.metadataRow}>
                    <Text style={styles.metadataLabel}>Scripts:</Text>
                    <Text style={styles.metadataValue}>{archive.scripts}</Text>
                  </View>
                )}

                {archive.place_of_origin && (
                  <View style={styles.metadataRow}>
                    <Text style={styles.metadataLabel}>Place of Origin:</Text>
                    <Text style={styles.metadataValue}>{archive.place_of_origin}</Text>
                  </View>
                )}

                {archive.originals_information && (
                  <View style={styles.metadataRow}>
                    <Text style={styles.metadataLabel}>Originals Information:</Text>
                    <Text style={styles.metadataValue}>{archive.originals_information}</Text>
                  </View>
                )}

                {archive.related_people && (
                  <View style={styles.metadataRow}>
                    <Text style={styles.metadataLabel}>Related People:</Text>
                    <Text style={styles.metadataValue}>{archive.related_people}</Text>
                  </View>
                )}

                {archive.reference && (
                  <View style={styles.metadataRow}>
                    <Text style={styles.metadataLabel}>Reference:</Text>
                    <Text style={styles.metadataValue}>{archive.reference}</Text>
                  </View>
                )}

                {archive.archive_url && (
                  <View style={styles.metadataRow}>
                    <Text style={styles.metadataLabel}>Archive URL:</Text>
                    <Text style={[styles.metadataValue, styles.linkText]}>
                      {archive.archive_url}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </Animated.View>
        )}

        {/* Tap to show metadata hint */}
        {!modalVisible && (
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>Scroll up to view details</Text>
          </View>
        )}
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
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
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    width: screenWidth,
    height: screenHeight * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: screenWidth,
    height: '100%',
  },
  noImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  navButtonLeft: {
    left: 20,
  },
  navButtonRight: {
    right: 20,
  },
  imageCounter: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  imageCounterText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  resetButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: screenHeight * 0.6,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 2000,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  metadataContainer: {
    paddingBottom: 40,
  },
  metadataRow: {
    marginBottom: 16,
  },
  metadataLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  metadataValue: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 22,
  },
  linkText: {
    color: '#DF8020',
    textDecorationLine: 'underline',
  },
  hintContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
});
