import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Alert,
  PanResponder,
  Linking,
} from 'react-native';
import { GestureHandlerRootView, PinchGestureHandler, PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
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

  // Animation values for image
  const imageScale = useSharedValue(1);
  const imageTranslateX = useSharedValue(0);
  const imageTranslateY = useSharedValue(0);
  const baseScale = useSharedValue(1);
  const lastScale = useSharedValue(1);

  // Animation values for modal
  const modalTranslateY = useSharedValue(screenHeight * 0.5);
  const modalOpacity = useSharedValue(0);
  const modalPanY = useSharedValue(0);

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
    modalTranslateY.value = withSpring(0, {
      damping: 20,
      stiffness: 300,
    });
    modalOpacity.value = withTiming(1, { duration: 300 });
  };

  const hideModal = () => {
    modalTranslateY.value = withTiming(screenHeight * 0.5, { duration: 300 });
    modalOpacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(setModalVisible)(false);
    });
  };

  const handleLinkPress = async (url: string) => {
    try {
      // Check if the device can handle the URL
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        // Open the URL
        await Linking.openURL(url);
      } else {
        // Show an alert if the URL can't be opened
        Alert.alert('Error', `Don't know how to open this URL: ${url}`);
      }
    } catch (error) {
      // Show an alert if there's an error opening the URL
      Alert.alert('Error', 'Failed to open the link. Please try again.');
      console.error('Error opening URL:', error);
    }
  };

  const nextImage = () => {
    if (archive?.image_urls && currentImageIndex < archive.image_urls.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
      resetImageTransform();
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
      resetImageTransform();
    }
  };

  const resetImageTransform = () => {
    imageScale.value = withSpring(1);
    imageTranslateX.value = withSpring(0);
    imageTranslateY.value = withSpring(0);
    baseScale.value = 1;
    lastScale.value = 1;
  };

  // Pinch gesture handler for zoom
  const pinchGestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startScale = imageScale.value;
    },
    onActive: (event: any, context: any) => {
      const scale = Math.max(0.5, Math.min(3, context.startScale * event.scale));
      imageScale.value = scale;
    },
    onEnd: () => {
      if (imageScale.value < 1) {
        imageScale.value = withSpring(1);
        imageTranslateX.value = withSpring(0);
        imageTranslateY.value = withSpring(0);
      }
    },
  });

  // Pan gesture handler for image panning when zoomed
  const panGestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startX = imageTranslateX.value;
      context.startY = imageTranslateY.value;
    },
    onActive: (event: any, context: any) => {
      if (imageScale.value > 1) {
        imageTranslateX.value = context.startX + event.translationX;
        imageTranslateY.value = context.startY + event.translationY;
      }
    },
    onEnd: () => {
      // Keep image within bounds when zoomed
      const maxTranslateX = (screenWidth * (imageScale.value - 1)) / 2;
      const maxTranslateY = (screenHeight * 0.7 * (imageScale.value - 1)) / 2;
      
      imageTranslateX.value = withSpring(
        Math.max(-maxTranslateX, Math.min(maxTranslateX, imageTranslateX.value))
      );
      imageTranslateY.value = withSpring(
        Math.max(-maxTranslateY, Math.min(maxTranslateY, imageTranslateY.value))
      );
    },
  });

  // Modal pan gesture handler for swipe down to close
  const modalPanGestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startY = modalPanY.value;
    },
    onActive: (event: any, context: any) => {
      if (event.translationY > 0) {
        modalPanY.value = event.translationY;
      }
    },
    onEnd: (event: any) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        // Close modal if swiped down enough
        runOnJS(hideModal)();
      } else {
        // Snap back to half height
        modalPanY.value = withSpring(0);
      }
    },
  });


  const modalStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: modalTranslateY.value + modalPanY.value }
      ],
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
    <GestureHandlerRootView style={{ flex: 1 }}>
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
              <View style={styles.imageWrapper}>
                <PanGestureHandler onGestureEvent={panGestureHandler}>
                  <Animated.View style={styles.gestureContainer}>
                    <PinchGestureHandler onGestureEvent={pinchGestureHandler}>
                      <Animated.Image
                        source={{ uri: currentImage }}
                        style={[styles.image, imageStyle]}
                        resizeMode="contain"
                      />
                    </PinchGestureHandler>
                  </Animated.View>
                </PanGestureHandler>
                
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
              </View>
            ) : (
              <View style={styles.noImageContainer}>
                <Text style={styles.noImageText}>No images available</Text>
              </View>
            )}
          </View>
          {modalVisible && <View style={styles.bounceCatcher} />}

          {/* Metadata Modal */}
          {modalVisible && (
            <Animated.View style={[styles.modal, modalStyle]}>
              {/* Drag Handle with Pan Gesture */}
              <PanGestureHandler onGestureEvent={modalPanGestureHandler}>
                <Animated.View style={styles.modalDragArea}>
                  <View style={styles.modalHandle} />
                </Animated.View>
              </PanGestureHandler>
              
              {/* Scrollable Content */}
              <ScrollView
                style={styles.modalContent}
                contentContainerStyle={[styles.modalScrollContent, { paddingBottom: 40 }]}
                showsVerticalScrollIndicator={true}
                scrollEventThrottle={16}
                bounces={true}
                alwaysBounceVertical={false}
                nestedScrollEnabled={true}
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
                          <TouchableOpacity 
                            onPress={() => handleLinkPress(archive.archive_url!)}
                            style={styles.linkContainer}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.metadataValue, styles.linkText]}>
                              {archive.archive_url}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
              </ScrollView>
            </Animated.View>
          )}

          {/* Tap to show metadata hint */}
          {!modalVisible && (
            <TouchableOpacity 
              style={styles.hintContainer}
              onPress={showModal}
            >
              <Text style={styles.hintText}>Tap to view details</Text>
            </TouchableOpacity>
          )}

          {/* Click outside modal to close */}
          {modalVisible && (
            <TouchableOpacity 
              style={styles.modalOverlay}
              onPress={hideModal}
              activeOpacity={1}
            />
          )}
        </View>
      </SafeScreen>
    </GestureHandlerRootView>
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
  gestureContainer: {
    width: '100%',
    height: '100%',
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
    height: screenHeight * 0.5,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 2000,
  },
  modalDragArea: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
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
    paddingTop: 10,
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
  linkContainer: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  linkText: {
    color: '#DF8020',
    textDecorationLine: 'underline',
    fontWeight: '500',
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1500,
  },
  bounceCatcher: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50, // A small height, enough to cover the bounce
    backgroundColor: '#FFFFFF', // Must be the same color as the modal
    zIndex: 1999, // Just below the modal's zIndex of 2000
  },
});