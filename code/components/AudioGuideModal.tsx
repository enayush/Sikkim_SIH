import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  Animated
} from 'react-native';
import { X, Play, Pause, RotateCcw, Volume2 } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { Monastery } from '@/lib/monasteryService';

interface AudioGuideModalProps {
  visible: boolean;
  monastery: Monastery | null;
  onClose: () => void;
}

interface TextChunk {
  text: string;
  startTime: number;
  endTime: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function AudioGuideModal({ visible, monastery, onClose }: AudioGuideModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [textChunks, setTextChunks] = useState<TextChunk[]>([]);
  const [progress, setProgress] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const highlightAnimation = useRef(new Animated.Value(0)).current;
  const animationFrameRef = useRef<number | null>(null);
  const animationStopRef = useRef<(() => void) | null>(null);

  // Reset everything when monastery changes or modal opens
  useEffect(() => {
    if (monastery?.audio_guide && visible) {
      // Stop any existing audio and animations
      Speech.stop();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Reset all state
      setIsPlaying(false);
      setCurrentChunkIndex(0);
      setProgress(0);
      progressAnimation.setValue(0);
      highlightAnimation.setValue(0);

      // Create new chunks for this monastery
      const chunks = createTextChunks(monastery.audio_guide);
      setTextChunks(chunks);
    }
  }, [monastery?.id, visible]); // Use monastery.id to detect monastery changes

  // Stop audio when modal closes
  useEffect(() => {
    if (!visible && isPlaying) {
      Speech.stop();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setIsPlaying(false);
      setCurrentChunkIndex(0);
      setProgress(0);
      progressAnimation.setValue(0);
    }
  }, [visible, isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Speech.stop();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const createTextChunks = (text: string): TextChunk[] => {
    // Split text into sentences and estimate timing
    const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [text];
    const chunks: TextChunk[] = [];
    let currentTime = 0;

    sentences.forEach((sentence, index) => {
      const trimmed = sentence.trim();
      if (trimmed) {
        // Estimate reading time: ~4 words per second for TTS
        const wordCount = trimmed.split(' ').length;
        const duration = Math.max(2, wordCount / 4) * 1000; // Convert to milliseconds

        chunks.push({
          text: trimmed,
          startTime: currentTime,
          endTime: currentTime + duration
        });

        currentTime += duration;
      }
    });

    return chunks;
  };

  const playAudio = async () => {
    if (!monastery?.audio_guide) return;

    try {
      const totalText = monastery.audio_guide;

      // Calculate total estimated duration
      const wordCount = totalText.split(' ').length;
      const estimatedDuration = (wordCount / 4) * 1000; // ~4 words per second

      // Set duration and playing state
      setTotalDuration(estimatedDuration);
      setIsPlaying(true);

      // Start animation immediately
      setTimeout(() => {
        startTextAnimation(estimatedDuration);
      }, 100);

      const options = {
        language: 'en-IN', // Indian English
        pitch: 1.1, // Slightly higher pitch for female voice
        rate: 0.8, // Good rate for narration
        quality: 'enhanced' as const,
        onStart: () => {
          setIsPlaying(true);
        },
        onDone: () => {
          setIsPlaying(false);
          setCurrentChunkIndex(0);
          setProgress(0);
          progressAnimation.setValue(0);
        },
        onStopped: () => {
          setIsPlaying(false);
        },
        onError: () => {
          setIsPlaying(false);
          setCurrentChunkIndex(0);
        }
      };

      Speech.speak(totalText, options);

    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  const startTextAnimation = (duration?: number) => {
    if (textChunks.length === 0) return;

    const animationDuration = duration || totalDuration;
    if (animationDuration <= 0) return;

    let startTime = Date.now();

    const animateText = () => {
      const elapsed = Date.now() - startTime;
      const progressPercent = Math.min(elapsed / animationDuration, 1);

      setProgress(progressPercent);

      // Animate progress bar
      Animated.timing(progressAnimation, {
        toValue: progressPercent,
        duration: 100,
        useNativeDriver: false,
      }).start();

      // Find current chunk based on elapsed time
      const currentChunk = textChunks.findIndex(chunk =>
        elapsed >= chunk.startTime && elapsed < chunk.endTime
      );

      if (currentChunk >= 0 && currentChunk !== currentChunkIndex) {
        setCurrentChunkIndex(currentChunk);

        // Animate highlight
        highlightAnimation.setValue(0);
        Animated.timing(highlightAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }).start();

        // Auto-scroll to current chunk
        scrollViewRef.current?.scrollTo({
          y: currentChunk * 80, // Approximate height per chunk
          animated: true,
        });
      }

      if (progressPercent < 1) {
        animationFrameRef.current = requestAnimationFrame(animateText);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animateText);
  };  const stopAudio = () => {
    Speech.stop();
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsPlaying(false);
    setCurrentChunkIndex(0);
    setProgress(0);
    progressAnimation.setValue(0);
  };

  const restartAudio = () => {
    stopAudio();
    setTimeout(() => {
      playAudio();
    }, 100);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    // Stop audio and animations before closing
    Speech.stop();
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsPlaying(false);
    setCurrentChunkIndex(0);
    setProgress(0);
    progressAnimation.setValue(0);
    onClose();
  };

  if (!monastery) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={2}>
            {monastery.name}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Monastery Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: monastery.images[0] || 'https://via.placeholder.com/300x200' }}
            style={styles.monasteryImage}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay}>
            <Volume2 size={32} color="white" />
            <Text style={styles.imageText}>Audio Guide</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Text style={styles.timeText}>
            {formatTime((progress * totalDuration) / 1000)}
          </Text>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                }
              ]}
            />
          </View>
          <Text style={styles.timeText}>
            {formatTime(totalDuration / 1000)}
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity onPress={restartAudio} style={styles.controlButton}>
            <RotateCcw size={24} color="#333" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={isPlaying ? stopAudio : playAudio}
            style={[styles.playButton, isPlaying && styles.playButtonActive]}
          >
            {isPlaying ? (
              <Pause size={32} color="white" />
            ) : (
              <Play size={32} color="white" />
            )}
          </TouchableOpacity>

          <View style={styles.placeholder} />
        </View>

        {/* Lyrics/Text Display */}
        <View style={styles.lyricsContainer}>
          <Text style={styles.lyricsTitle}>Audio Guide Text</Text>
          <ScrollView
            ref={scrollViewRef}
            style={styles.lyricsScroll}
            showsVerticalScrollIndicator={false}
          >
            {textChunks.map((chunk, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.textChunk,
                  index === currentChunkIndex && {
                    backgroundColor: highlightAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['transparent', '#E3F2FD'],
                    }),
                    opacity: highlightAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 1],
                    }),
                  }
                ]}
              >
                <Text
                  style={[
                    styles.chunkText,
                    index === currentChunkIndex && styles.currentChunkText
                  ]}
                >
                  {chunk.text}
                </Text>
              </Animated.View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 10,
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  imageContainer: {
    height: 200,
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  monasteryImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    minWidth: 40,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginHorizontal: 15,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 2,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  controlButton: {
    padding: 12,
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 30,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  playButtonActive: {
    backgroundColor: '#1976D2',
  },
  lyricsContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lyricsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  lyricsScroll: {
    flex: 1,
  },
  textChunk: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginVertical: 4,
    borderRadius: 8,
  },
  chunkText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
  currentChunkText: {
    color: '#1976D2',
    fontWeight: '500',
  },
});
