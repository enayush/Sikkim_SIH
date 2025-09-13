import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { X, Calendar, Users, Phone, Mail, MapPin } from 'lucide-react-native';
import { getAllMonasteries, Monastery } from '@/lib/monasteryService';
import { createBooking } from '@/lib/bookingService';
import { useAuth } from '@/contexts/AuthContext';

interface BookingModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function BookingModal({ visible, onClose }: BookingModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'monastery' | 'details'>('monastery');
  const [monasteries, setMonasteries] = useState<Monastery[]>([]);
  const [selectedMonastery, setSelectedMonastery] = useState<Monastery | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    numberOfPeople: '1',
    visitDate: '',
    specialRequests: '',
  });

  useEffect(() => {
    if (visible) {
      loadMonasteries();
      // Pre-fill email if user is logged in
      if (user?.email) {
        setFormData(prev => ({ ...prev, email: user.email || '' }));
      }
    }
  }, [visible, user]);

  const loadMonasteries = async () => {
    try {
      setLoading(true);
      const data = await getAllMonasteries();
      setMonasteries(data);
    } catch (error) {
      console.error('Error loading monasteries:', error);
      Alert.alert('Error', 'Failed to load monasteries');
    } finally {
      setLoading(false);
    }
  };

  const handleMonasterySelect = (monastery: Monastery) => {
    setSelectedMonastery(monastery);
    setStep('details');
  };

  const handleSubmitBooking = async () => {
    if (!selectedMonastery || !user) {
      Alert.alert('Error', 'Please select a monastery and ensure you are logged in');
      return;
    }

    // Validate form
    if (!formData.email || !formData.phone || !formData.visitDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await createBooking({
        monastery_id: selectedMonastery.id,
        user_id: user.id,
        email: formData.email,
        phone: formData.phone,
        number_of_people: parseInt(formData.numberOfPeople),
        visit_date: formData.visitDate,
        special_requests: formData.specialRequests || null,
        status: 'pending',
      });

      Alert.alert(
        'Booking Submitted!',
        `Your visit to ${selectedMonastery.name} has been submitted. You will receive a confirmation email shortly.`,
        [{ text: 'OK', onPress: handleClose }]
      );
    } catch (error) {
      console.error('Error creating booking:', error);
      Alert.alert('Error', 'Failed to submit booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('monastery');
    setSelectedMonastery(null);
    setFormData({
      email: user?.email || '',
      phone: '',
      numberOfPeople: '1',
      visitDate: '',
      specialRequests: '',
    });
    onClose();
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {step === 'monastery' ? 'Select Monastery' : 'Booking Details'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {step === 'monastery' ? (
            <ScrollView style={styles.monasteryList}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#DF8020" />
                  <Text style={styles.loadingText}>Loading monasteries...</Text>
                </View>
              ) : (
                monasteries.map((monastery) => (
                  <TouchableOpacity
                    key={monastery.id}
                    style={styles.monasteryItem}
                    onPress={() => handleMonasterySelect(monastery)}
                  >
                    <View style={styles.monasteryInfo}>
                      <Text style={styles.monasteryName}>{monastery.name}</Text>
                      <View style={styles.locationRow}>
                        <MapPin size={16} color="#6B7280" />
                        <Text style={styles.monasteryLocation}>{monastery.location}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          ) : (
            <ScrollView style={styles.form}>
              {selectedMonastery && (
                <View style={styles.selectedMonastery}>
                  <Text style={styles.selectedTitle}>Selected Monastery:</Text>
                  <Text style={styles.selectedName}>{selectedMonastery.name}</Text>
                  <Text style={styles.selectedLocation}>{selectedMonastery.location}</Text>
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email *</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={20} color="#6B7280" />
                  <TextInput
                    style={styles.input}
                    value={formData.email}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                    placeholder="your.email@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone Number *</Text>
                <View style={styles.inputWrapper}>
                  <Phone size={20} color="#6B7280" />
                  <TextInput
                    style={styles.input}
                    value={formData.phone}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                    placeholder="+91 98765 43210"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Number of People *</Text>
                <View style={styles.inputWrapper}>
                  <Users size={20} color="#6B7280" />
                  <TextInput
                    style={styles.input}
                    value={formData.numberOfPeople}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, numberOfPeople: text }))}
                    placeholder="1"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Visit Date *</Text>
                <View style={styles.inputWrapper}>
                  <Calendar size={20} color="#6B7280" />
                  <TextInput
                    style={styles.input}
                    value={formData.visitDate}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, visitDate: text }))}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <Text style={styles.hint}>Minimum date: {getTomorrowDate()}</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Special Requests (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.specialRequests}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, specialRequests: text }))}
                  placeholder="Any special requirements or requests..."
                  multiline
                  numberOfLines={3}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmitBooking}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Booking</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setStep('monastery')}
              >
                <Text style={styles.backButtonText}>← Back to Monasteries</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  monasteryList: {
    maxHeight: 400,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 8,
    color: '#6B7280',
  },
  monasteryItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  monasteryInfo: {
    flex: 1,
  },
  monasteryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monasteryLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  form: {
    padding: 16,
  },
  selectedMonastery: {
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  selectedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369A1',
    marginBottom: 4,
  },
  selectedName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  selectedLocation: {
    fontSize: 14,
    color: '#6B7280',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 8,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#DF8020',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    alignItems: 'center',
    padding: 12,
  },
  backButtonText: {
    color: '#6B7280',
    fontSize: 14,
  },
});
