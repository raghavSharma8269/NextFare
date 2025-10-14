import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../hooks/useAuth";

interface ProfileScreenProps {
  navigation: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <LinearGradient
        colors={["#0f0f15", "#1a1a24", "#1e1e2e"]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#a0d2eb" size="large" />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";

    try {
      // Handle Firestore Timestamp object
      if (timestamp.seconds !== undefined) {
        const date = new Date(timestamp.seconds * 1000);
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }

      // Handle regular date string
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return "N/A";
      }

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };

  return (
    <LinearGradient
      colors={["#0f0f15", "#1a1a24", "#1e1e2e"]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#a0d2eb" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Profile Avatar */}
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={["#a0d2eb", "#8458B3"]}
              style={styles.avatar}
            >
              <Ionicons name="person" size={60} color="#fff" />
            </LinearGradient>
            <Text style={styles.username}>@{user.username}</Text>
          </View>

          {/* Profile Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Information</Text>

            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="mail-outline" size={20} color="#a0d2eb" />
                <Text style={styles.infoLabel}>Email</Text>
              </View>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="person-outline" size={20} color="#a0d2eb" />
                <Text style={styles.infoLabel}>Username</Text>
              </View>
              <Text style={styles.infoValue}>{user.username}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons
                  name="finger-print-outline"
                  size={20}
                  color="#a0d2eb"
                />
                <Text style={styles.infoLabel}>User ID</Text>
              </View>
              <Text
                style={[styles.infoValue, styles.uidText]}
                numberOfLines={1}
              >
                {user.uid}
              </Text>
            </View>

            <View style={[styles.infoRow, styles.lastInfoRow]}>
              <View style={styles.infoLeft}>
                <Ionicons name="calendar-outline" size={20} color="#a0d2eb" />
                <Text style={styles.infoLabel}>Member Since</Text>
              </View>
              <Text style={styles.infoValue}>{formatDate(user.createdAt)}</Text>
            </View>
          </View>

          {/* Last Location */}
          {user.lastLocation && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Last Known Location</Text>

              <View style={[styles.infoRow, styles.lastInfoRow]}>
                <View style={styles.infoLeft}>
                  <Ionicons name="location-outline" size={20} color="#a0d2eb" />
                  <Text style={styles.infoLabel}>Coordinates</Text>
                </View>
                <Text style={styles.infoValue}>
                  {user.lastLocation.latitude.toFixed(4)},{" "}
                  {user.lastLocation.longitude.toFixed(4)}
                </Text>
              </View>
            </View>
          )}

          {/* Other Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Other Options</Text>

            <TouchableOpacity style={[styles.actionButton, styles.lastInfoRow]}>
              <Ionicons name="key-outline" size={20} color="#a0d2eb" />
              <Text style={styles.actionButtonText}>Change Password</Text>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <View style={styles.logoutContainer}>
            <TouchableOpacity onPress={handleLogout} activeOpacity={0.8}>
              <LinearGradient
                colors={["#ff6b6b", "#ee5a6f"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.logoutButton}
              >
                <Ionicons name="log-out-outline" size={20} color="#fff" />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Last updated: {formatDate(user.updatedAt)}
            </Text>
          </View>

          {/* Bottom Accent */}
          <View style={styles.bottomAccent}>
            <LinearGradient
              colors={["transparent", "rgba(132, 88, 179, 0.2)", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.accentLine}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#e5eaf5",
    marginTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#e5eaf5",
  },
  placeholder: {
    width: 40,
  },
  glowContainer: {
    position: "absolute",
    top: 100,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 0,
  },
  glow: {
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  avatarContainer: {
    alignItems: "center",
    paddingVertical: 32,
    marginBottom: 24,
    zIndex: 10,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#8458B3",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  username: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#e5eaf5",
  },
  section: {
    backgroundColor: "rgba(30, 30, 46, 0.8)",
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(160, 210, 235, 0.2)",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#a0d2eb",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(160, 210, 235, 0.1)",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(160, 210, 235, 0.1)",
  },
  lastInfoRow: {
    borderBottomWidth: 0,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: "#e5eaf5",
    marginLeft: 12,
  },
  infoValue: {
    fontSize: 14,
    color: "#f8f9fa",
    fontWeight: "500",
    maxWidth: "50%",
    textAlign: "right",
  },
  uidText: {
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    color: "#d0bdf4",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(160, 210, 235, 0.1)",
  },
  actionButtonText: {
    fontSize: 14,
    color: "#e5eaf5",
    marginLeft: 12,
    flex: 1,
  },
  logoutContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  logoutButton: {
    height: 56,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ff6b6b",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#6b7280",
  },
  bottomAccent: {
    marginTop: 20,
    marginBottom: 40,
  },
  accentLine: {
    height: 2,
    width: "100%",
  },
});

export default ProfileScreen;
