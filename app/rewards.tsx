import React, { useState, useRef, useEffect } from 'react';

type Reward = {
  id: string;
  name: string;
  image: string;
  pointsRequired: number;
};
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { getUserPointsAndRewards } from '../lib/rewardsService';
import { REWARDS } from '../lib/explorerBadge';
import { Gift, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';



export default function RewardsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentPoints, setCurrentPoints] = useState(0);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [redeemModalVisible, setRedeemModalVisible] = useState(false);
  const [redeemQty, setRedeemQty] = useState(1);
  const snackbarTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    getUserPointsAndRewards(user.id).then(res => {
      setCurrentPoints(res.points);
      setLoading(false);
    });
  }, [user?.id]);

  const maxQty = selectedReward ? Math.floor(currentPoints / (selectedReward?.pointsRequired || 1)) : 1;
  const handleRedeem = () => {
    if (!selectedReward) return;
    const totalCost = selectedReward.pointsRequired * redeemQty;
    setCurrentPoints(prev => prev - totalCost);
    setRedeemModalVisible(false);
    setShowSnackbar(true);
    if (snackbarTimeout.current) clearTimeout(snackbarTimeout.current);
    snackbarTimeout.current = setTimeout(() => setShowSnackbar(false), 2500);
  };

  return (
    <LinearGradient
      colors={["#FFF7ED", "#F9FAFB", "#F3E8FF"]}
      style={styles.gradientBg}
    >
      {/* Back Arrow */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 18, marginLeft: 8, marginBottom: 6 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 6, borderRadius: 20 }}>
          <ArrowLeft size={28} color="#222" />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: 'bold', marginLeft: 8, color: '#222' }}>Rewards</Text>
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      {/* Snackbar Popup */}
      {showSnackbar && (
        <View style={{ position: 'absolute', top: 40, left: 0, right: 0, alignItems: 'center', zIndex: 999 }}>
          <View style={{ backgroundColor: '#DF8020', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 32, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 }}>
            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Your order has been placed!</Text>
          </View>
        </View>
      )}
      {/* Redeem Modal */}
      <Modal
        visible={redeemModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRedeemModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <View style={{ backgroundColor: '#FFF', borderRadius: 20, padding: 24, alignItems: 'center', width: 300 }}>
            {selectedReward && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Image source={{ uri: selectedReward.image }} style={{ width: 80, height: 80, borderRadius: 16 }} />
                </View>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#DF8020', marginBottom: 8 }}>{selectedReward.name}</Text>
                <Text style={{ fontSize: 16, color: '#6B7280', marginBottom: 12 }}>Points required: {selectedReward.pointsRequired} each</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <TouchableOpacity disabled={redeemQty <= 1} onPress={() => setRedeemQty(q => Math.max(1, q - 1))} style={{ padding: 8 }}>
                    <Text style={{ fontSize: 24, color: redeemQty > 1 ? '#DF8020' : '#CCC' }}>-</Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 20, marginHorizontal: 16 }}>{redeemQty}</Text>
                  <TouchableOpacity disabled={redeemQty >= maxQty} onPress={() => setRedeemQty(q => Math.min(maxQty, q + 1))} style={{ padding: 8 }}>
                    <Text style={{ fontSize: 24, color: redeemQty < maxQty ? '#DF8020' : '#CCC' }}>+</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={{ backgroundColor: '#DF8020', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 32, marginBottom: 8 }}
                  onPress={handleRedeem}
                  disabled={redeemQty < 1 || redeemQty > maxQty}
                >
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Redeem</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setRedeemModalVisible(false)}>
                  <Text style={{ color: '#DF8020', fontSize: 15 }}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
      {/* Gamified Current Points UI */}
      <View style={{ alignItems: 'center', marginTop: 36, marginBottom: 18 }}>
        <LinearGradient
          colors={["#FFD580", "#FFF7ED"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 36, paddingVertical: 20, paddingHorizontal: 44, shadowColor: '#DF8020', shadowOpacity: 0.18, shadowRadius: 12, elevation: 3, flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}
        >
          <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png' }} style={{ width: 38, height: 38, marginRight: 14 }} />
          <Text style={{ fontSize: 34, fontWeight: 'bold', color: '#DF8020', marginRight: 10 }}>{currentPoints}</Text>
          <Text style={{ fontSize: 18, color: '#6B7280' }}>Points</Text>
        </LinearGradient>
        <Text style={{ fontSize: 14, color: '#7C3AED', marginBottom: 8, marginTop: 2, fontWeight: '600' }}>Level up by exploring Sikkim!</Text>
        <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>Earn points by bookings and monastery visits!</Text>
      </View>
      {/* Rewards List UI - Vertical Cards */}
      <View style={{ paddingHorizontal: 8, paddingBottom: 16 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#DF8020" style={{ marginTop: 40 }} />
        ) : (
          REWARDS.map((item, idx) => (
            <LinearGradient
              key={item.id}
              colors={currentPoints >= item.pointsRequired ? ["#FFF7ED", "#FFD580"] : ["#F3F4F6", "#E5E7EB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 28,
                padding: 22,
                marginVertical: 14,
                alignItems: 'center',
                width: '100%',
                shadowColor: '#DF8020',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 14,
                elevation: 4,
                borderWidth: currentPoints >= item.pointsRequired ? 2 : 1,
                borderColor: currentPoints >= item.pointsRequired ? '#DF8020' : '#E5E7EB',
              }}
            >
              <Image source={{ uri: item.image }} style={{ width: 90, height: 90, borderRadius: 24, marginBottom: 14, borderWidth: 2, borderColor: currentPoints >= item.pointsRequired ? '#DF8020' : '#E5E7EB' }} />
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: currentPoints >= item.pointsRequired ? '#DF8020' : '#A1A1AA', marginBottom: 7, textAlign: 'center', letterSpacing: 0.5 }}>{item.name}</Text>
              <Text style={{ fontSize: 16, color: '#6B7280', marginBottom: 12 }}>{item.pointsRequired} pts</Text>
              <TouchableOpacity
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 40,
                  borderRadius: 20,
                  marginTop: 6,
                  backgroundColor: currentPoints >= item.pointsRequired ? '#DF8020' : '#F3F4F6',
                  width: '85%',
                  shadowColor: currentPoints >= item.pointsRequired ? '#DF8020' : undefined,
                  shadowOpacity: currentPoints >= item.pointsRequired ? 0.18 : 0,
                  elevation: currentPoints >= item.pointsRequired ? 2 : 0,
                }}
                disabled={currentPoints < item.pointsRequired}
                onPress={() => {
                  setSelectedReward(item);
                  setRedeemQty(1);
                  setRedeemModalVisible(true);
                }}
              >
                <Text style={{ color: currentPoints >= item.pointsRequired ? '#FFF' : '#A1A1AA', fontWeight: 'bold', fontSize: 18, textAlign: 'center', letterSpacing: 0.5 }}>
                  {currentPoints >= item.pointsRequired ? 'Redeem' : 'Locked'}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          ))
        )}
      </View>
      {/* End of ScrollView content */}
      </ScrollView>

  </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 0,
  },
  gradientBg: {
    flex: 1,
    padding: 0,
  },
});
