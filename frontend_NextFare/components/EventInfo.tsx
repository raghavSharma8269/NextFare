import React, { useState, useEffect } from "react";
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
import { LinearGradient } from "expo-linear-gradient";

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
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Reset description state whenever the modal becomes visible or event changes
  useEffect(() => {
    if (visible) {
      setShowFullDescription(false);
    }
  }, [visible, event?.id]);

  if (!event) return null;

  const DESCRIPTION_LIMIT = 100;
  const shouldTruncate = event.description.length > DESCRIPTION_LIMIT;
  const displayDescription =
    showFullDescription || !shouldTruncate
      ? event.description
      : `${event.description.substring(0, DESCRIPTION_LIMIT)}...`;

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
    if (!timeString) return "";

    // if  already contains AM/PM, just return
    if (timeString.includes("AM") || timeString.includes("PM")) {
      return timeString;
    }

    const date = new Date(timeString);

    if (isNaN(date.getTime())) {
      const timeParts = timeString.split(":");
      if (timeParts.length < 2) return "";

      const hours = parseInt(timeParts[0]);
      const minutes = timeParts[1];
      const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      const ampm = hours >= 12 ? "PM" : "AM";
      return `${hour12}:${minutes} ${ampm}`;
    }

    // Format using toLocaleTimeString for proper timezone handling
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop - tap to close */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Modal content */}
        <View style={styles.modalContent}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={true}
            contentContainerStyle={styles.scrollContent}
          >
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
                <Ionicons name="location" size={24} color="#8458B3" />
                <Text style={styles.title}>{event.title}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Event Details */}
            <View style={styles.content}>
              {/* Description with Read More */}
              <View style={styles.detailRow}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="#ffffff"
                />
                <View style={styles.descriptionContainer}>
                  <Text style={styles.detailText}>{displayDescription}</Text>
                  {shouldTruncate && (
                    <TouchableOpacity
                      onPress={() =>
                        setShowFullDescription(!showFullDescription)
                      }
                      style={styles.readMoreButton}
                    >
                      <Text style={styles.readMoreText}>
                        {showFullDescription ? "Show Less" : "Read More"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {event.endTime && (
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={20} color="#ffffff" />
                  <Text style={styles.detailText}>
                    Ends at {formatTime(event.endTime)}
                  </Text>
                </View>
              )}

              {event.estimatedAttendance && (
                <View style={styles.detailRow}>
                  <Ionicons name="people-outline" size={20} color="#ffffff" />
                  <Text style={styles.detailText}>
                    Estimated Attendance:{" "}
                    {event.estimatedAttendance.toLocaleString()}
                  </Text>
                </View>
              )}

              {/* Line*/}
              <View style={styles.header}></View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <LinearGradient
                colors={["#a0d2eb", "#8458B3"]}
                style={styles.gradientButton}
              >
                <TouchableOpacity
                  style={styles.navigateButton}
                  onPress={handleNavigate}
                >
                  <Ionicons name="navigate" size={20} color="#fff" />
                  <Text style={styles.navigateButtonText}>Navigate</Text>
                </TouchableOpacity>
              </LinearGradient>

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
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "rgba(30, 30, 46, 0.8)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 34,
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
    color: "#ffffff",
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
    alignItems: "flex-start",
    marginBottom: 15,
  },
  detailText: {
    fontSize: 16,
    color: "#ffffff",
    marginLeft: 15,
    flex: 1,
  },
  descriptionContainer: {
    flex: 1,
    marginLeft: 15,
  },
  readMoreButton: {
    marginTop: 5,
  },
  readMoreText: {
    color: "#2196F3",
    fontSize: 14,
    fontWeight: "600",
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
  gradientButton: {
    flex: 1,
    minWidth: "45%",
    borderRadius: 10,
    overflow: "hidden",
  },
  navigateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
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
    backgroundColor: "#8458B3",
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
    backgroundColor: "#eb0505ff",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 5,
  },
  cancelButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default EventInfo;
