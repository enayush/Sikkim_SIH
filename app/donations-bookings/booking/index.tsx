
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, Mail, Phone, Landmark, ArrowLeft } from 'lucide-react-native';



function submitBooking({ email, phone, date, monastery }: { email: string; phone: string; date: string; monastery: string }, router: any) {
  if (!email || !phone || !date || !monastery) {
    Alert.alert('Missing Info', 'Please fill all fields.');
    return;
  }
  Alert.alert('Booking Submitted', 'Your visit request has been sent!');
  router.back();
}

function BookingForm({ router }: { router: any }) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [monastery, setMonastery] = useState('');

  const handleSubmit = () => {
    submitBooking({ email, phone, date, monastery }, router);
  };

  return (
    <View style={styles.formContent}>
      <View style={styles.inputGroup}>
        <Mail size={20} color="#DF8020" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      <View style={styles.inputGroup}>
        <Phone size={20} color="#DF8020" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      </View>
      <View style={styles.inputGroup}>
        <Calendar size={20} color="#DF8020" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Date of Visit (YYYY-MM-DD)"
          value={date}
          onChangeText={setDate}
        />
      </View>
      <View style={styles.inputGroup}>
        <Landmark size={20} color="#DF8020" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Which Monastery?"
          value={monastery}
          onChangeText={setMonastery}
          autoCapitalize="words"
        />
      </View>
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit Booking</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function BookingPage() {
  const router = useRouter();
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Book a Visit</Text>
        <View style={{ width: 24 }} />
      </View>
      <BookingForm router={router} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F9FAFB',
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 32 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DF8020',
    textAlign: 'center',
  },
  formContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 18,
    width: '100%',
    shadowColor: '#DF8020',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
  },
  button: {
    backgroundColor: '#DF8020',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    width: '100%',
    shadowColor: '#DF8020',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
