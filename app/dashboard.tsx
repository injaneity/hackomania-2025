import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/constants/Typography';
import { Text } from '@/components/ui/StyledText';
import { leaderboardManager, PlayerScore } from '@/utils/leaderboardManager';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import QRCode from 'react-native-qrcode-svg';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";

// import ProximityMeter from "@/components/ProximityMeter";

export default function Dashboard() {
  const [qrVisible, setQrVisible] = useState(false);

  const { currentUserId, username } = useCurrentUser();
  const [leaderboard, setLeaderboard] = useState<PlayerScore[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = leaderboardManager.subscribeToLeaderboard((players) => {
      setLeaderboard(players);
      if (currentUserId) {
        const rank = players.findIndex(p => p.id === currentUserId) + 1;
        setUserRank(rank > 0 ? rank : null);
      }
    });

    return () => unsubscribe();
  }, [currentUserId]);

  // Format score with commas
  const formatScore = (score: number) => score.toLocaleString();

  return (
    <ScrollView style={styles.container}>
      {/* Modal to display the QR Code */}
      <Modal
        visible={qrVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setQrVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <QRCode
              value={username}
              size={200}
              backgroundColor="transparent"
              color="black"
            />
            <TouchableOpacity
              onPress={() => setQrVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <View>
          <Text style={[Typography.header, { color: 'white' }]}>{username}</Text>
          <Text style={[Typography.subheader, { color: '#aaa' }]}>Leetcode Therapy</Text>
        </View>
        <View style={styles.qrContainer}>
          <TouchableOpacity onPress={() => setQrVisible(true)}>
            <Ionicons name="qr-code-outline" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.qrCode}>Code: ABC-123</Text>
        </View>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.schedule}>
          <Text style={styles.sectionTitle}>Upcoming</Text>
          <View style={styles.scheduleContent}>
            <Text style={styles.scheduleItem}>Hackomania 2025</Text>
            <Text style={styles.scheduleItem}>Date: February 15, 2025</Text>
            <Text style={styles.scheduleItem}>Time: 10:00 AM - 10:00 PM</Text>
            <Text style={styles.scheduleItem}>
              Location: CapitaGreen, Singapore
            </Text>
          </View>
        </View>

        <View style={styles.eventScore}>
          <View style={styles.scoreHeader}>
            <Text style={styles.sectionTitle}>Leaderboard</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.leaderboardContainer}>
            <View style={styles.leaderboardList}>
              {leaderboard.map((player, index) => (
                <Text 
                  key={player.id} 
                  style={[
                    styles.scoreItem,
                    player.id === currentUserId && styles.currentUserScore
                  ]}
                >
                  {index + 1}. {player.username} - {formatScore(player.score)}
                </Text>
              ))}
            </View>
            {userRank && (
              <View style={styles.userRankContainer}>
                <View style={styles.rankDivider} />
                <Text style={styles.userRank}>Your Rank: #{userRank}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.todoList}>
        <Text style={styles.sectionTitle}>To-Do List</Text>
        <View style={styles.todoContent}>
          <Text style={styles.todoItem}>1. Submit proposal</Text>
          <Text style={styles.todoItem}>2. Finalise team members</Text>
        </View>
      </View>

      <View>
        {/* <Text style={styles.sectionTitle}>Proximity Tracker</Text> */}
        {/* <ProximityMeter />  */}
        {/* Proximity Meter integrated here */}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#333",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#aaa",
  },
  qrContainer: {
    alignItems: "flex-end",
  },
  qrCode: {
    fontSize: 12,
    color: "#aaa",
    marginTop: 4,
  },
  mainContent: {
    flexDirection: "row",
    flex: 1,
    gap: 16,
  },
  schedule: {
    flex: 1,
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 16,
    justifyContent: "flex-start",
  },
  scheduleContent: {
    marginTop: 8,
  },
  scheduleItem: {
    ...Typography.body,
    color: 'white',
    marginBottom: 4,
  },
  eventScore: {
    flex: 2,
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 16,
  },
  scoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#555",
    marginVertical: 8,
  },
  scoreItem: {
    fontSize: 18,
    color: 'white',
    marginBottom: 4,
  },
  todoList: {
    backgroundColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 24,
    marginTop: 16,
  },
  todoContent: {
    marginTop: 8,
  },
  todoItem: {
    fontSize: 18,
    color: 'white',
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: "#333",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  userRank: {
    ...Typography.subheader,
    color: '#4CAF50',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  currentUserScore: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  leaderboardContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  leaderboardList: {
    flex: 1,
  },
  userRankContainer: {
    marginTop: 10,
  },
  rankDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#555',
    marginBottom: 10,
  },
});
