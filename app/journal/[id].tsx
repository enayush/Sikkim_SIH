import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getJournalEntryById, updateJournalEntry, deleteJournalEntry, JournalEntry } from '../../lib/journalService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Edit3, Trash2, X } from 'lucide-react-native';

export default function JournalDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [imageLoading, setImageLoading] = useState<Set<number>>(new Set());
  const [imageRetries, setImageRetries] = useState<Map<number, number>>(new Map());
  const [imageDimensions, setImageDimensions] = useState<Map<number, { width: number; height: number }>>(new Map());
  
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    if (id) {
      loadEntry();
    }
  }, [id]);

  const loadEntry = async () => {
    try {
      const data = await getJournalEntryById(id as string);
      setEntry(data);
      setEditTitle(data.title || '');
      setEditContent(data.content);
    } catch (error) {
      Alert.alert('Error', 'Failed to load journal entry');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!entry) return;

    try {
      const updated = await updateJournalEntry(entry.id, {
        title: editTitle || undefined,
        content: editContent,
      });
      setEntry(updated);
      setEditing(false);
      Alert.alert('Success', 'Journal entry updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update entry');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry? This will also delete all associated images.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteJournalEntry(entry!.id);
              Alert.alert('Success', 'Journal entry and associated images deleted');
              router.back();
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete entry. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleImageError = (index: number) => {
    const retries = imageRetries.get(index) || 0;
    
    if (retries < 2) {
      // Try to reload the image up to 2 times
      console.log(`Retrying image load for index ${index}, attempt ${retries + 1}`);
      setImageRetries(prev => new Map(prev).set(index, retries + 1));
      
      // Force a re-render by briefly removing and re-adding the image
      setTimeout(() => {
        setImageLoading(prev => {
          const newSet = new Set(prev);
          newSet.delete(index);
          return newSet;
        });
      }, 1000);
    } else {
      // Mark as error after 2 failed attempts
      setImageErrors(prev => new Set(prev).add(index));
      setImageLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  const handleImageLoadStart = (index: number) => {
    setImageLoading(prev => new Set(prev).add(index));
  };

  const handleImageLoadEnd = (index: number) => {
    setImageLoading(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  };

  const isValidImageUrl = (url: string) => {
    const index = entry!.image_urls.indexOf(url);
    const hasError = imageErrors.has(index);
    const retries = imageRetries.get(index) || 0;
    return url && url.startsWith('http') && (!hasError || retries < 2);
  };

  const testImageUrl = async (url: string) => {
    try {
      const response = await fetch(url, {
        method: 'HEAD', // Just check if the URL is accessible
        headers: {
          'Accept': 'image/*',
        },
      });
      console.log('Image URL test result:', {
        url,
        status: response.status,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
      });
      return response.ok;
    } catch (error) {
      console.log('Image URL test failed:', url, error);
      return false;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!entry) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Entry not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {entry.title || 'Untitled Entry'}
          </Text>
          <Text style={styles.date}>
            {new Date(entry.created_at).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setEditing(true)}
          >
            <Edit3 size={20} color="#007AFF" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Trash2 size={20} color="#FF3B30" />
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.content}>{entry.content}</Text>

        {entry.image_urls.length > 0 && (
          <View style={styles.imagesContainer}>
            <Text style={styles.imagesTitle}>Photos</Text>
            {entry.image_urls
              .filter((url, index) => isValidImageUrl(url))
              .map((url, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image
                    key={`image-${index}-${imageRetries.get(index) || 0}`}
                    source={{ 
                      uri: url,
                      cache: 'reload'
                    }}
                    style={[
                      styles.image,
                      imageDimensions.has(index) 
                        ? { 
                            width: screenWidth,
                            height: imageDimensions.get(index)!.height,
                          }
                        : { width: screenWidth, height: 300 } // Default height while loading
                    ]}
                    resizeMode="contain"
                    onLoadStart={() => handleImageLoadStart(index)}
                    onLoad={(event) => {
                      const { width, height } = event.nativeEvent.source;
                      // Calculate the height that maintains aspect ratio for full screen width
                      const aspectRatio = height / width;
                      const calculatedHeight = screenWidth * aspectRatio;
                      
                      // Limit height between 200 and 500 pixels
                      const finalHeight = Math.max(200, Math.min(500, calculatedHeight));
                      
                      setImageDimensions(prev => new Map(prev.set(index, { 
                        width: screenWidth, 
                        height: finalHeight 
                      })));
                      
                      handleImageLoadEnd(index);
                    }}
                    onError={async (error: any) => {
                      console.log('Image load error for URL:', url);
                      handleImageError(index);
                    }}
                  />
                  {imageLoading.has(index) && (
                    <View style={styles.loadingOverlay}>
                      <ActivityIndicator size="small" color="#007AFF" />
                    </View>
                  )}
                </View>
              ))}
            {entry.image_urls.some((url, index) => imageErrors.has(index)) && (
              <Text style={styles.errorText}>
                Some images could not be loaded. This might be due to network issues or invalid image files.
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      <Modal visible={editing} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditing(false)}>
              <X size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Entry</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            <TextInput
              style={styles.titleInput}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Entry title (optional)"
              placeholderTextColor="#999"
            />

            <TextInput
              style={styles.contentInput}
              value={editContent}
              onChangeText={setEditContent}
              placeholder="Write your thoughts..."
              placeholderTextColor="#999"
              multiline
              textAlignVertical="top"
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    marginLeft: 5,
    color: '#007AFF',
    fontSize: 16,
  },
  deleteButton: {
    marginRight: 0,
  },
  deleteText: {
    marginLeft: 5,
    color: '#FF3B30',
    fontSize: 16,
  },
  content: {
    backgroundColor: 'white',
    padding: 20,
    fontSize: 16,
    lineHeight: 24,
  },
  imagesContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 0, // Remove horizontal padding to allow full width
    paddingVertical: 20,
  },
  imagesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    paddingHorizontal: 20, // Add padding back to title only
  },
  imageWrapper: {
    position: 'relative',
    marginBottom: 15,
    width: '100%',
  },
  image: {
    borderRadius: 0, // Remove border radius for full width display
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 0,
  },
  errorContainer: {
    position: 'relative',
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 0,
    height: 200,
    borderWidth: 1,
    borderColor: '#ddd',
    width: '100%',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalScroll: {
    flex: 1,
    padding: 20,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  contentInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    height: 300,
    textAlignVertical: 'top',
  },
});
