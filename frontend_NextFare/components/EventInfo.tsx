import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface EventMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  endTime: string;
  imageUrl?: string;
  pageUrl?: string;
  estimatedAttendance?: number;
}

interface EventInfoProps {
  visible: boolean;
  event: EventMarker | null;
  onClose: () => void;
}

const EventInfo: React.FC<EventInfoProps> = ({ visible, event, onClose }) => {
  if (!event) return null;

  const handleNavigate = () => {
    const { latitude, longitude, title } = event;

    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${encodeURIComponent(
      title
    )}`;
    const appleMapsUrl = `http://maps.apple.com/?daddr=${latitude},${longitude}&q=${encodeURIComponent(
      title
    )}`;

    const defaultUrl = Platform.OS === "ios" ? appleMapsUrl : googleMapsUrl;

    Alert.alert("Navigate to Event", "Choose your navigation app:", [
      {
        text: "Google Maps",
        onPress: () => openURL(googleMapsUrl),
      },
      {
        text: Platform.OS === "ios" ? "Apple Maps" : "Default Maps",
        onPress: () => openURL(defaultUrl),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const handleOpenEventPage = () => {
    if (event.pageUrl) {
      openURL(event.pageUrl);
    } else {
      Alert.alert("No Link", "This event doesn't have a source link available");
    }
  };

  const openURL = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Unable to open link");
      }
    } catch (error) {
      console.error("Error opening URL:", error);
      Alert.alert("Error", "Failed to open link");
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? "PM" : "AM";
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.modalContent}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Event Image */}
            {event.imageUrl && (
              <Image
                source={{ uri: event.imageUrl }}
                style={styles.eventImage}
                resizeMode="cover"
              />
            )}

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Ionicons name="location" size={24} color="#2196F3" />
                <Text style={styles.title}>{event.title}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Event Details */}
            <View style={styles.content}>
              <View style={styles.detailRow}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="#666"
                />
                <Text style={styles.detailText}>{event.description}</Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={20} color="#666" />
                <Text style={styles.detailText}>
                  Ends at {formatTime(event.endTime)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={20} color="#666" />
                <Text style={styles.detailText}>
                  Estimated Attendance: {event.estimatedAttendance}
                </Text>
              </View>

              {/* Coordinates */}
              <View style={styles.coordinatesContainer}>
                <Text style={styles.coordinatesText}>
                  {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.navigateButton}
                onPress={handleNavigate}
              >
                <Ionicons name="navigate" size={20} color="#fff" />
                <Text style={styles.navigateButtonText}>Navigate</Text>
              </TouchableOpacity>

              {event.pageUrl && (
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={handleOpenEventPage}
                >
                  <Ionicons name="link-outline" size={20} color="#fff" />
                  <Text style={styles.linkButtonText}>Event Page</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 34,
    maxHeight: "80%",
  },
  eventImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 10,
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  content: {
    marginBottom: 30,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  detailText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 15,
    flex: 1,
  },
  coordinatesContainer: {
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  coordinatesText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  navigateButton: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#2196F3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 10,
    gap: 8,
  },
  navigateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  linkButton: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#FF6B6B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 10,
    gap: 8,
  },
  linkButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    width: "100%",
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 5,
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default EventInfo;
