import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, User, Mail, Edit3, Save, X, LogOut } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import SafeScreen from '../../components/SafeScreen';
import { profileService, Profile } from '../../lib/profileService';

export default function ManageProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  
  // Original values for change detection
  const [originalUsername, setOriginalUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { profile: userProfile, error } = await profileService.getProfile(user.id);
        if (error) {
          console.error('Error fetching profile:', error);
          Alert.alert('Error', 'Failed to load profile');
        } else {
          setProfile(userProfile);
          setUsername(userProfile?.username || '');
          setEmail(user?.email || '');
          setOriginalUsername(userProfile?.username || '');
        }
      } catch (error) {
        console.error('Profile fetch error:', error);
        Alert.alert('Error', 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  // Check for changes
  useEffect(() => {
    const hasChanges = username !== originalUsername;
    setHasChanges(hasChanges);
  }, [username, originalUsername]);

  const checkUsernameAvailability = async (username: string) => {
    if (username === originalUsername) {
      setUsernameError('');
      return true;
    }

    if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return false;
    }

    try {
      const { available, error } = await profileService.checkUsernameAvailability(username);
      if (error) {
        setUsernameError('Error checking username availability');
        return false;
      }
      
      if (!available) {
        setUsernameError('Username is already taken');
        return false;
      }
      
      setUsernameError('');
      return true;
    } catch (error) {
      setUsernameError('Error checking username');
      return false;
    }
  };

  const handleUsernameChange = async (text: string) => {
    setUsername(text);
    if (text.length >= 3) {
      await checkUsernameAvailability(text);
    } else {
      setUsernameError('');
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset to original values
      setUsername(originalUsername);
      setUsernameError('');
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    if (!profile || !user?.id) return;

    setSaving(true);
    try {
      // Check username availability if changed
      if (username !== originalUsername) {
        const isAvailable = await checkUsernameAvailability(username);
        if (!isAvailable) {
          setSaving(false);
          return;
        }
      }

      // Update profile
      const { success, error } = await profileService.updateUsername(user.id, username);
      if (!success) {
        Alert.alert('Error', error?.message || 'Failed to update username');
        setSaving(false);
        return;
      }

      // Update original values
      setOriginalUsername(username);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

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
              router.replace('/auth/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeScreen style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9933" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Profile</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditToggle}
          >
            {isEditing ? (
              <X size={20} color="#EF4444" />
            ) : (
              <Edit3 size={20} color="#FF9933" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Information</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username</Text>
              <View style={[styles.inputWrapper, !isEditing && styles.disabledInput]}>
                <User size={20} color={isEditing ? "#6B7280" : "#9CA3AF"} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, usernameError && styles.inputError, !isEditing && styles.disabledText]}
                  value={username}
                  onChangeText={isEditing ? handleUsernameChange : undefined}
                  placeholder="Enter username"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={isEditing}
                />
              </View>
              {usernameError ? (
                <Text style={styles.errorText}>{usernameError}</Text>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputWrapper, styles.disabledInput]}>
                <Mail size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.disabledText]}
                  value={email}
                  editable={false}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <Text style={styles.helpText}>Email cannot be changed</Text>
            </View>
          </View>

          {/* Account Actions Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Actions</Text>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSignOut}
            >
              <LogOut size={20} color="#EF4444" />
              <Text style={styles.actionButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          {/* Save Button - Only show when editing and has changes */}
          {isEditing && (
            <TouchableOpacity
              style={[styles.saveButton, (!hasChanges || saving || !!usernameError) && styles.saveButtonDisabled]}
              onPress={handleSaveProfile}
              disabled={!hasChanges || saving || !!usernameError}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Save size={20} color="#FFFFFF" />
              )}
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
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
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  disabledInput: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 4,
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#EF4444',
    marginLeft: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9933',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 32,
    marginBottom: 40,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});