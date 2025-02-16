import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Typography } from "@/constants/Typography";
import { Text } from "@/components/ui/StyledText";
import { leaderboardManager, PlayerScore } from "@/utils/leaderboardManager";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import QRCode from "react-native-qrcode-svg";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

const ArcProgress = ({
  percentage,
  size,
  strokeWidth,
}: {
  percentage: number;
  size: number;
  strokeWidth: number;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - circumference * percentage;

  return (
    <Svg width={size} height={size}>
      {/* Background circle */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#DAD2BA" // or another neutral color
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Progress arc (solid teal) */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#9B2D16" // Retro teal
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
};

export default function Dashboard() {
  const [qrVisible, setQrVisible] = useState(false);
  const { currentUserId, username } = useCurrentUser();
  const [leaderboard, setLeaderboard] = useState<PlayerScore[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = leaderboardManager.subscribeToLeaderboard((players) => {
      setLeaderboard(players);
      if (currentUserId) {
        const rank = players.findIndex((p) => p.id === currentUserId) + 1;
        setUserRank(rank > 0 ? rank : null);
      }
    });
    return () => unsubscribe();
  }, [currentUserId]);

  // Get the current user's event score (defaulting to 0)
  const currentUserScore =
    leaderboard.find((p) => p.id === currentUserId)?.score || 0;
  // Compute the percentage fill relative to the nearest 100 (using remainder)
  const arcPercentage = (currentUserScore % 100) / 100;
  const formatScore = (score: number) => score.toLocaleString();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <Modal
        visible={qrVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setQrVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <QRCode
              value={username} // Change back to username
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

      {/* Header Row: 2/3 for name and team; 1/3 for QR code icon */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={[Typography.header, { color: "#FFFFFF" }]}>
            {username}
          </Text>
          <Text style={[Typography.subheader, { color: "#FFFFFF" }]}>
            Leetcode Therapy
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setQrVisible(true)}>
            <Ionicons name="qr-code-outline" size={36} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Event Score & Rank Row */}
      <View style={styles.eventScoreRow}>
        <View style={styles.arcContainer}>
          <ArcProgress percentage={arcPercentage} size={160} strokeWidth={15} />
          <View style={styles.arcTextOverlay}>
            <Text style={styles.scoreText}>
              {formatScore(currentUserScore)}
            </Text>
          </View>
        </View>
        {userRank && (
          <View style={styles.rankContainer}>
            <Text style={styles.rankLabel}>Your Rank:</Text>
            <Text style={styles.rankText}>#{userRank}</Text>
          </View>
        )}
      </View>

      {/* Leaderboard Section as Table */}
      <ScrollView
        style={styles.leaderboardSection}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 16,
        }}
        nestedScrollEnabled
      >
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Rank</Text>
          <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Name</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Score</Text>
        </View>
        {leaderboard.map((player, index) => (
          <View
            key={player.id}
            style={[
              styles.tableRow,
              player.id === currentUserId && styles.currentUserRow,
            ]}
          >
            <Text style={[styles.tableCell, { flex: 1 }]}>{index + 1}</Text>
            <Text style={[styles.tableCell, { flex: 3 }]}>
              {player.username}
            </Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>
              {formatScore(player.score)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F1EA", // Cream
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 8,
    padding: 18,
    marginBottom: 16,
    marginTop: 10,
    backgroundColor: "#992800", // Dark Orange / Rust
  },
  headerLeft: {
    flex: 2,
  },
  headerRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  eventScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 15,
    padding: 40,
    paddingVertical: 50,
    marginBottom: 16,
    justifyContent: "space-between",
    backgroundColor: "#cd5e30", // Golden Yellow
  },
  arcContainer: {
    position: "relative",
    alignItems: "flex-end",
  },
  arcTextOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff", // Dark Teal
  },
  rankContainer: {
    flex: 1,
    marginLeft: 16,
    alignItems: "center",
  },
  rankLabel: {
    fontSize: 18,
    color: "#ffffff", // Dark Teal
    marginBottom: 4,
  },
  rankText: {
    fontSize: 64,
    fontWeight: "bold",
    color: "#ffffff", // Deep Blue for better contrast
  },
  leaderboardSection: {
    backgroundColor: "#e3a72f", // Teal
    borderRadius: 15,
    padding: 16,
    paddingVertical: 25,
    marginTop: 4,
    maxHeight: 250,
  },
  sectionTitle: {
    fontSize: 18,
    color: "#FFFFFF", // White for contrast against Teal
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#555",
    paddingBottom: 8,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 18,
    textAlign: "left",
    color: "#FFFFFF", // White text for contrast
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#555",
    paddingHorizontal: 8,
  },
  tableCell: {
    fontSize: 16,
    color: "#FFFFFF", // White text for the Teal background
    textAlign: "left",
  },
  currentUserRow: {
    backgroundColor: "rgba(0, 0, 0, 0.25)", // Teal tint
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#F5F1EA", // Cream
    padding: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: "#2A9D8F", // Teal
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});
