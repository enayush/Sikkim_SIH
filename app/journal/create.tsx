import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { createJournalEntry, CreateJournalEntryData } from '../../lib/journalService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, X, Plus } from 'lucide-react-native';
import { useLocation } from '../../contexts/LocationContext';
import { getMonasteryById } from '../../lib/monasteryService';

export default function CreateJournalEntryScreen() {
  const router = useRouter();
  const { monasteryId } = useLocalSearchParams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [saving, setSaving] = useState(false);
  const { userLocation, requestLocation } = useLocation();

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Camera roll permissions are needed to select photos.'
      );
    }
  };

  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.7,
        selectionLimit: 1,
        allowsEditing: false,
        exif: false,
        base64: false,
        aspect: undefined,
        videoQuality: undefined,
      });

      if (!result.canceled) {
        const newImages = result.assets.slice(0, 1 - images.length);
        setImages([...images, ...newImages]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permissions are needed to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: false,
        exif: false,
        base64: false,
        aspect: undefined,
        videoQuality: undefined,
      });

      if (!result.canceled) {
        if (images.length < 1) {
          setImages([...images, ...result.assets]);
        } else {
          Alert.alert('Limit reached', 'You can only add 1 photo per journal entry.');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please write something in your journal entry');
      return;
    }

    if (!monasteryId) {
      Alert.alert('Error', 'No monastery selected');
      return;
    }

    setSaving(true);
    try {
      // Get current location
      let coordinates = null;
      try {
        const location = await requestLocation();
        if (location) {
          coordinates = {
            latitude: location.latitude,
            longitude: location.longitude,
          };
        }
      } catch (locationError) {
        console.warn('Could not get user location:', locationError);
      }

      // If user coordinates are null, use monastery coordinates
      if (!coordinates && monasteryId) {
        try {
          const monastery = await getMonasteryById(monasteryId as string);
          if (monastery) {
            coordinates = {
              latitude: monastery.latitude,
              longitude: monastery.longitude,
            };
          }
        } catch (monasteryError) {
          console.warn('Could not get monastery coordinates:', monasteryError);
        }
      }

      const entryData: CreateJournalEntryData = {
        monastery_id: monasteryId as string,
        title: title.trim() || undefined,
        content: content.trim(),
        images,
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
      };

      await createJournalEntry(entryData);
      Alert.alert('Success', 'Journal entry saved!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save journal entry');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          placeholder="Entry title (optional)"
          placeholderTextColor="#999"
        />

        <TextInput
          style={styles.contentInput}
          value={content}
          onChangeText={setContent}
          placeholder="Write your thoughts, memories, and experiences..."
          placeholderTextColor="#999"
          multiline
          textAlignVertical="top"
        />

        <View style={styles.imagesSection}>
          <Text style={styles.sectionTitle}>Photo {images.length > 0 ? '(1 selected)' : '(optional)'}</Text>

          <View style={styles.imageButtons}>
            <TouchableOpacity style={styles.imageButton} onPress={pickImages} disabled={images.length >= 1}>
              <Plus size={20} color={images.length >= 1 ? "#ccc" : "#007AFF"} />
              <Text style={[styles.imageButtonText, images.length >= 1 && styles.disabledText]}>Add Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.imageButton} onPress={takePhoto} disabled={images.length >= 1}>
              <Camera size={20} color={images.length >= 1 ? "#ccc" : "#007AFF"} />
              <Text style={[styles.imageButtonText, images.length >= 1 && styles.disabledText]}>Take Photo</Text>
            </TouchableOpacity>
          </View>

          {images.length > 0 && (
            <View style={styles.imagesContainer}>
              {images.map((image, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri: image.uri }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeImage(index)}
                  >
                    <X size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Save Entry</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  titleInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  contentInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    height: 200,
    textAlignVertical: 'top',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  imagesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  imageButtons: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  imageButtonText: {
    marginLeft: 8,
    color: '#007AFF',
    fontSize: 16,
  },
  disabledText: {
    color: '#ccc',
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 10,
    marginBottom: 10,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});