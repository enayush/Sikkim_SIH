import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg';
import { Text, View, StyleSheet, Image, FlatList, TouchableOpacity, Modal } from 'react-native';
import { ScrollView } from 'react-native';
// import { PieChart } from 'react-native-svg-charts';
// import * as scale from 'd3-scale';
// Helper: region color map
const REGION_COLORS: { [key: string]: string } = {
  North: '#4F8EF7',
  East: '#34C759',
  West: '#FF9500',
  South: '#FF375F',
};

// Helper: region order
const REGION_ORDER: string[] = ['North', 'East', 'West', 'South'];

import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { calculateExplorerBadgeProgress } from '../../lib/explorerBadge';


export default function ExplorerBadges() {
  const router = useRouter();
  const [regionCounts, setRegionCounts] = useState<{ [key: string]: number }>({ North: 0, East: 0, West: 0, South: 0 });
  const [showSnackbar, setShowSnackbar] = useState(false);
  const snackbarTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentPoints, setCurrentPoints] = useState(0);
  const { user } = useAuth();
  const [bookings, setBookings] = useState<string[]>([]);
  const [visitedMonasteries, setVisitedMonasteries] = useState<string[]>([]);
  const [progress, setProgress] = useState({ points: 0, level: 1, nextLevelPoints: 100, visitedMonasteries: [] as string[], bookings: [] as string[] });

  useEffect(() => {
    if (!Array.isArray(visitedMonasteries) || !visitedMonasteries.length) return;
    const fetchRegions = async () => {
      const { data, error } = await supabase
        .from('monasteries')
        .select('id,location');
      if (error || !data) return;
      const idToRegion: { [key: string]: string } = {};
      (data as { id: string; location: string }[]).forEach((row) => {
        idToRegion[row.id] = row.location;
      });
      const counts: { [key: string]: number } = { North: 0, East: 0, West: 0, South: 0 };
      visitedMonasteries.forEach((id: string) => {
        const region = idToRegion[id];
        if (region && counts[region] !== undefined) counts[region]++;
      });
      setRegionCounts(counts);
    };
    fetchRegions();
  }, [visitedMonasteries]);




  useEffect(() => {
    if (!user?.id) return;
    // Fetch bookings for current user
    const fetchBookings = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, monastery_id')
        .eq('user_id', user.id);
      if (error) {
        console.error('Error fetching bookings:', error);
        return;
      }
      setBookings(data.map((b: any) => b.id));
      // Get unique visited monasteries from bookings
      const monasteryIds = Array.from(new Set(data.map((b: any) => b.monastery_id)));
      setVisitedMonasteries(monasteryIds as string[]);
      const badgeProgress = calculateExplorerBadgeProgress(data.map((b: any) => b.id), monasteryIds);
      setProgress(badgeProgress as typeof progress);
      setCurrentPoints(badgeProgress.points);
    };
    fetchBookings();
  }, [user?.id]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      {/* Back Arrow - always visible at top */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 18, marginLeft: 8, marginBottom: 6, zIndex: 10, backgroundColor: '#fff' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 6, borderRadius: 20 }}>
          <ArrowLeft size={28} color="#222" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginLeft: 8, color: '#222' }}>Explorer Badges</Text>
      </View>
      {/* Infinite Map UI for Levels */}
      <View style={styles.badgeSection}>
        <Text style={styles.title}>Explorer Path</Text>
        <View style={{ width: '100%', height: 260, position: 'relative', marginBottom: 8 }}>
          {/* Scenic Sikkim background image */}
          <Image source={{ uri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80' }} style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: 32, opacity: 0.35 }} resizeMode="cover" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ width: '100%', height: '100%' }} contentContainerStyle={{ alignItems: 'center', height: 260 }}>
            {/* Infinite explorer path: always show current, next, and previous levels */}
            {(() => {
              const nodeSpacing = 100;
              const startX = 60;
              const centerY = 130;
              const amplitude = 70;
              // Show 3 before, current, and 8 ahead (total 12 nodes)
              const currentLevel = progress.level;
              const visibleCount = 12;
              const firstLevel = Math.max(1, currentLevel - 3);
              const nodes = Array.from({ length: visibleCount }, (_, i) => {
                const levelNum = firstLevel + i;
                const x = startX + i * nodeSpacing;
                const t = i / (visibleCount - 1); // normalized position
                const y = centerY + amplitude * Math.sin(t * Math.PI);
                return { x, y, levelNum };
              });
              // Generate zigzag path string through all nodes
              let pathStr = `M ${nodes[0].x} ${nodes[0].y}`;
              for (let i = 1; i < nodes.length; i++) {
                const prev = nodes[i - 1];
                const curr = nodes[i];
                const cpx = (prev.x + curr.x) / 2;
                const cpy = i % 2 === 0 ? centerY - amplitude : centerY + amplitude;
                pathStr += ` Q ${cpx} ${cpy} ${curr.x} ${curr.y}`;
              }
              return (
                <Svg height={260} width={startX + nodeSpacing * (visibleCount - 1) + 60} style={{ marginVertical: 0, position: 'absolute', left: 0, top: 0 }}>
                  {/* Infinite path */}
                  <Path
                    d={pathStr}
                    stroke="#DF8020"
                    strokeWidth={10}
                    fill="none"
                    opacity={0.85}
                    filter="drop-shadow(0px 2px 8px #DF8020)"
                  />
                  {/* Level nodes */}
                  {nodes.map((node, i) => {
                    const isCurrent = node.levelNum === currentLevel;
                    const isCompleted = node.levelNum < currentLevel;
                    return (
                      <React.Fragment key={`level-node-${node.levelNum}`}>
                        <Circle
                          cx={node.x}
                          cy={node.y}
                          r={isCurrent ? 24 : 18}
                          fill={isCurrent ? '#DF8020' : isCompleted ? '#FDE68A' : '#FFF'}
                          stroke="#FFF"
                          strokeWidth={isCurrent ? 5 : 2}
                          opacity={isCurrent ? 1 : 0.95}
                        />
                        <SvgText
                          x={node.x}
                          y={node.y + 7}
                          fontSize={isCurrent ? 20 : 15}
                          fontWeight="bold"
                          fill={isCurrent ? '#FFF' : '#DF8020'}
                          textAnchor="middle"
                          opacity={1}
                        >
                          {`${node.levelNum}`}
                        </SvgText>
                      </React.Fragment>
                    );
                  })}
                </Svg>
              );
            })()}
          </ScrollView>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, marginBottom: 8 }}>
          <View style={{ backgroundColor: '#FFF', borderRadius: 24, paddingVertical: 10, paddingHorizontal: 28, shadowColor: '#DF8020', shadowOpacity: 0.12, shadowRadius: 8, elevation: 2, flexDirection: 'row', alignItems: 'center' }}>
            <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png' }} style={{ width: 28, height: 28, marginRight: 10 }} />
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#DF8020', marginRight: 6 }}>{currentPoints}</Text>
            <Text style={{ fontSize: 15, color: '#6B7280' }}>Current Points</Text>
          </View>
        </View>
        <Text style={styles.subText}>Earn 20 points for each booking and 50 points for each new monastery visited.</Text>
      </View>
      {/* Visited by Region Section with Bar Visualization */}
  <View style={{ marginTop: 24, marginBottom: 8, alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 28, paddingVertical: 32, paddingHorizontal: 20, width: '92%', alignSelf: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, minHeight: 180 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#4B5563', marginBottom: 12 }}>Monasteries Visited by Region</Text>
        <View style={{ width: '100%' }}>
          {REGION_ORDER.map(region => {
            const count = regionCounts[region];
            const max = Math.max(...Object.values(regionCounts));
            const percent = max > 0 ? (count / max) : 0;
            return (
              <View key={region} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                  <View style={{ width: 14, height: 14, backgroundColor: REGION_COLORS[region], borderRadius: 4, marginRight: 8 }} />
                  <Text style={{ color: '#374151', fontSize: 13, fontWeight: 'bold', width: 60 }}>{region}</Text>
                  <View style={{ flex: 1, height: 10, backgroundColor: '#E5E7EB', borderRadius: 5, marginHorizontal: 6, overflow: 'hidden' }}>
                    <View style={{ width: `${Math.max(percent * 100, 8)}%`, height: '100%', backgroundColor: REGION_COLORS[region], borderRadius: 5 }} />
                  </View>
                  <Text style={{ color: '#4B5563', fontSize: 12, fontWeight: 'bold', marginLeft: 6 }}>{count}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 0,
  },
  badgeSection: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#DF8020',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DF8020',
    marginBottom: 12,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelLabel: {
    fontSize: 18,
    color: '#6B7280',
    marginRight: 8,
  },
  levelValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#DF8020',
  },
  progressBarWrapper: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 12,
  },
  progressBarBg: {
    width: '80%',
    height: 16,
    backgroundColor: '#FDE68A',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#DF8020',
    borderRadius: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  pointsText: {
    fontSize: 16,
    color: '#DF8020',
    fontWeight: 'bold',
    marginTop: 8,
  },
  subText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  rewardsSection: {
    marginTop: 32,
    paddingHorizontal: 8,
  },
  rewardsList: {
    paddingVertical: 8,
  },
  rewardCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 8,
    alignItems: 'center',
    width: 160,
    shadowColor: '#DF8020',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  rewardImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginBottom: 0,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DF8020',
    marginBottom: 4,
    textAlign: 'center',
  },
  rewardPoints: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  redeemBtn: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginTop: 4,
  },
  redeemBtnActive: {
    backgroundColor: '#DF8020',
  },
  redeemBtnDisabled: {
    backgroundColor: '#F3F4F6',
  },
  redeemBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
  },
});
