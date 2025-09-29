import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    Platform, 
    ScrollView, 
    Alert, 
    ActivityIndicator,
    KeyboardAvoidingView,
    StatusBar,
    Modal
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Calendar, Phone, Users, MessageSquare, ArrowLeft, Plus, Minus } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { createBooking } from '../../lib/bookingService';
import { getMonasteryById, Monastery } from '../../lib/monasteryService';
import Bookstyle from './styles/Bookstyle';
import SafeScreen from '../../components/SafeScreen';

// It's good practice to define props interfaces clearly.
interface BookingFormProps {
  monastery: Monastery;
  userEmail: string;
  isSubmitting: boolean;
  onSubmit: (formData: Omit<BookingData, 'monastery_id' | 'user_id' | 'email' | 'status'>) => void;
}

// This is a data structure for your booking.
interface BookingData {
    monastery_id: string;
    user_id: string;
    email: string;
    phone: string;
    number_of_people: number;
    visit_date: string;
    special_requests?: string | null;
    status: 'pending' | 'confirmed' | 'cancelled';
}

function BookingForm({ monastery, userEmail, isSubmitting, onSubmit }: BookingFormProps) {
  const [phone, setPhone] = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [visitDate, setVisitDate] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handlePhoneChange = (text: string) => {
    // Remove any non-digit characters
    const cleanedText = text.replace(/[^0-9]/g, '');
    // Limit to 10 digits
    if (cleanedText.length <= 10) {
      setPhone(cleanedText);
    }
  };

  const incrementPeople = () => {
    if (numberOfPeople < 50) {
      setNumberOfPeople(numberOfPeople + 1);
    }
  };

  const decrementPeople = () => {
    if (numberOfPeople > 1) {
      setNumberOfPeople(numberOfPeople - 1);
    }
  };

  const formatDate = (date: Date) => {
    // Use local time instead of UTC to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const generateCalendarDays = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      // Create a clean date object to avoid timezone issues
      const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      
      const isCurrentMonth = dayDate.getMonth() === currentMonth;
      const isToday = dayDate.getTime() === today.getTime();
      const isPast = dayDate < today;
      
      // Check if this date matches the selected visit date
      let isSelected = false;
      if (visitDate) {
        const visitDateObj = new Date(visitDate + 'T00:00:00'); // Add time to avoid timezone issues
        const visitLocalDate = new Date(visitDateObj.getFullYear(), visitDateObj.getMonth(), visitDateObj.getDate());
        isSelected = dayDate.getTime() === visitLocalDate.getTime();
      }
      
      days.push({
        date: new Date(dayDate),
        day: dayDate.getDate(),
        isCurrentMonth,
        isToday,
        isPast,
        isSelected
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const handleDateSelect = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Create a new date with local timezone to avoid timezone shifts
    const selectedLocalDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (selectedLocalDate >= today) {
      setVisitDate(formatDate(selectedLocalDate));
      setShowDatePicker(false);
    }
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedDate(newDate);
  };

  const validateAndSubmit = () => {
    if (!phone.trim() || numberOfPeople < 1 || !visitDate.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    if (phone.length !== 10) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number.');
      return;
    }

    if (numberOfPeople < 1 || numberOfPeople > 50) {
      Alert.alert('Invalid Input', 'Number of people must be between 1 and 50.');
      return;
    }

    const selectedDateObj = new Date(visitDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDateObj < today) {
      Alert.alert('Invalid Date', 'Please select a future date for your visit.');
      return;
    }

    onSubmit({
        phone: phone.trim(),
        number_of_people: numberOfPeople,
        visit_date: visitDate,
        special_requests: specialRequests.trim() || null,
    });
  };

  return (
    <View style={Bookstyle.formContent}>
      <View style={Bookstyle.monasteryInfo}>
        <Text style={Bookstyle.monasteryName}>{monastery.name}</Text>
        <Text style={Bookstyle.monasteryLocation}>{monastery.location}</Text>
      </View>

      <View style={Bookstyle.inputGroup}>
        <Text style={Bookstyle.label}>Email</Text>
        <View style={[Bookstyle.inputContainer, Bookstyle.disabledInputContainer]}>
          <TextInput
            style={[Bookstyle.input, Bookstyle.disabledInput]}
            value={userEmail}
            editable={false}
          />
        </View>
      </View>

      <View style={Bookstyle.inputGroup}>
        <Text style={Bookstyle.label}>Phone Number * <Text style={Bookstyle.labelHint}>(10 digits)</Text></Text>
        <View style={Bookstyle.inputContainer}>
          <Phone size={20} color="#DF8020" style={Bookstyle.icon} />
          <TextInput
            style={Bookstyle.input}
            placeholder="Enter 10-digit phone number"
            value={phone}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
            autoComplete="tel"
            maxLength={10}
          />
        </View>
        {phone.length > 0 && phone.length < 10 && (
          <Text style={Bookstyle.errorText}>{10 - phone.length} more digits required</Text>
        )}
      </View>

      <View style={Bookstyle.inputGroup}>
        <Text style={Bookstyle.label}>Visit Date *</Text>
        <TouchableOpacity style={Bookstyle.datePickerContainer} onPress={() => setShowDatePicker(true)}>
          <View style={Bookstyle.dateIconContainer}>
            <Calendar size={24} color="#DF8020" />
          </View>
          <Text style={[Bookstyle.dateDisplayText, !visitDate && Bookstyle.placeholderText]}>
            {visitDate ? new Date(visitDate).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            }) : 'Select visit date'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={Bookstyle.inputGroup}>
        <Text style={Bookstyle.label}>Number of Visitors</Text>
        <View style={Bookstyle.visitorContainer}>
          <View style={Bookstyle.visitorIconContainer}>
            <Users size={24} color="#DF8020" />
          </View>
          <View style={Bookstyle.visitorInfo}>
            <Text style={Bookstyle.visitorLabel}>Visitors</Text>
          </View>
          <View style={Bookstyle.visitorControls}>
            <TouchableOpacity 
              style={[Bookstyle.visitorButton, numberOfPeople <= 1 && Bookstyle.visitorButtonDisabled]} 
              onPress={decrementPeople}
              disabled={numberOfPeople <= 1}
            >
              <Minus size={20} color={numberOfPeople <= 1 ? "#D1D5DB" : "#FFFFFF"} />
            </TouchableOpacity>
            <Text style={Bookstyle.visitorCount}>{numberOfPeople}</Text>
            <TouchableOpacity 
              style={[Bookstyle.visitorButton, numberOfPeople >= 50 && Bookstyle.visitorButtonDisabled]} 
              onPress={incrementPeople}
              disabled={numberOfPeople >= 50}
            >
              <Plus size={20} color={numberOfPeople >= 50 ? "#D1D5DB" : "#FFFFFF"} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={Bookstyle.inputGroup}>
        <Text style={Bookstyle.label}>Special Requests / Notes</Text>
        <View style={Bookstyle.inputContainer}>
          <MessageSquare size={20} color="#DF8020" style={Bookstyle.textAreaIcon} />
          <TextInput
            style={[Bookstyle.input, Bookstyle.textArea]}
            placeholder="Any special requirements or notes..."
            value={specialRequests}
            onChangeText={setSpecialRequests}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </View>

      <TouchableOpacity
        style={[Bookstyle.button, isSubmitting && Bookstyle.buttonDisabled]}
        onPress={validateAndSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={Bookstyle.buttonText}>Confirm Booking</Text>
        )}
      </TouchableOpacity>

      {/* Custom Calendar Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={Bookstyle.modalOverlay}>
          <View style={Bookstyle.calendarModal}>
            <View style={Bookstyle.calendarHeader}>
              <TouchableOpacity onPress={() => navigateMonth(-1)} style={Bookstyle.monthNav}>
                <ArrowLeft size={20} color="#DF8020" />
              </TouchableOpacity>
              <Text style={Bookstyle.monthYear}>
                {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={() => navigateMonth(1)} style={Bookstyle.monthNav}>
                <ArrowLeft size={20} color="#DF8020" style={{ transform: [{ rotate: '180deg' }] }} />
              </TouchableOpacity>
            </View>
            
            <View style={Bookstyle.weekDays}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <Text key={day} style={Bookstyle.weekDay}>{day}</Text>
              ))}
            </View>
            
            <View style={Bookstyle.calendar}>
              {generateCalendarDays().map((dayInfo, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    Bookstyle.calendarDay,
                    !dayInfo.isCurrentMonth && Bookstyle.calendarDayInactive,
                    dayInfo.isPast && Bookstyle.calendarDayPast,
                    dayInfo.isSelected && Bookstyle.calendarDaySelected,
                    dayInfo.isToday && Bookstyle.calendarDayToday
                  ]}
                  onPress={() => handleDateSelect(dayInfo.date)}
                  disabled={dayInfo.isPast}
                >
                  <Text style={[
                    Bookstyle.calendarDayText,
                    !dayInfo.isCurrentMonth && Bookstyle.calendarDayTextInactive,
                    dayInfo.isPast && Bookstyle.calendarDayTextPast,
                    dayInfo.isSelected && Bookstyle.calendarDayTextSelected,
                    dayInfo.isToday && Bookstyle.calendarDayTextToday
                  ]}>
                    {dayInfo.day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity 
              style={Bookstyle.calendarCloseButton} 
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={Bookstyle.calendarCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function BookingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { monasteryId } = useLocalSearchParams();
  
  const [monastery, setMonastery] = useState<Monastery | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMonasteryDetails = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMonasteryById(id);
      setMonastery(data);
    } catch (err) {
      console.error('Error fetching monastery:', err);
      setError('Failed to load monastery details.');
      Alert.alert('Error', 'Failed to load monastery details.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof monasteryId === 'string' && monasteryId) {
      fetchMonasteryDetails(monasteryId);
    } else {
        setError("No monastery ID provided.");
        setLoading(false);
    }
  }, [monasteryId, fetchMonasteryDetails]);

  const handleBookingSubmit = async (formData: Omit<BookingData, 'monastery_id' | 'user_id' | 'email' | 'status'>) => {
    if (!user || !monastery) {
      Alert.alert('Error', 'User or monastery data is missing.');
      return;
    }

    setSubmitting(true);
    try {
      await createBooking({
        ...formData,
        monastery_id: monastery.id,
        user_id: user.id,
        email: user.email || '',
        status: 'pending',
      });

      Alert.alert(
        'Booking Submitted',
        'Your visit request has been sent successfully! You will receive a confirmation soon.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error creating booking:', error);
      Alert.alert('Error', 'Failed to submit your booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={Bookstyle.centeredContainer}>
          <ActivityIndicator size="large" color="#DF8020" />
          <Text style={Bookstyle.loadingText}>Loading Monastery Details...</Text>
        </View>
      );
    }

    if (error) {
        return (
            <View style={Bookstyle.centeredContainer}>
              <Text style={Bookstyle.errorText}>{error}</Text>
            </View>
        );
    }

    if (!user) {
      return (
        <View style={Bookstyle.formContent}>
          <Text style={Bookstyle.infoText}>Please log in to make a booking.</Text>
          <TouchableOpacity 
            style={[Bookstyle.button, { backgroundColor: '#6B7280' }]} 
            onPress={() => router.push('/auth/login')} // Or your login route
          >
            <Text style={Bookstyle.buttonText}>Login</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!monastery) {
        return (
            <View style={Bookstyle.centeredContainer}>
              <Text style={Bookstyle.errorText}>Monastery details could not be loaded.</Text>
            </View>
        );
    }

    return (
      <BookingForm
        monastery={monastery}
        userEmail={user.email || ''}
        isSubmitting={submitting}
        onSubmit={handleBookingSubmit}
      />
    );
  };

  return (
    <SafeScreen backgroundColor="#FFFFFF" forceTopPadding>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView 
        style={Bookstyle.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={Bookstyle.header}>
          <TouchableOpacity onPress={() => router.back()} style={Bookstyle.backButton}>
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={Bookstyle.headerCenter}>
            <Text style={Bookstyle.title}>Book a Visit</Text>
          </View>
          <View style={Bookstyle.headerRight} />
        </View>
        <ScrollView 
          style={Bookstyle.scrollView}
          contentContainerStyle={Bookstyle.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

