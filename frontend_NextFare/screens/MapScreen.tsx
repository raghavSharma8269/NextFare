import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import EventInfo from "../components/EventInfo";
import { useEvents } from "../hooks/useEvent";
import { Event } from "../services/EventApiService";

interface LocationType {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// Convert backend Event to EventMarker format for the modal
interface EventMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  endTime: string;
  imageUrl?: string;
  pageUrl?: string;
}

const MapScreen: React.FC = () => {
  const [location, setLocation] = useState<LocationType | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventMarker | null>(null);
  const [showEventInfo, setShowEventInfo] = useState(false);

  // Use the events hook with current location
  const {
    events,
    loading: eventsLoading,
    error: eventsError,
    refreshEvents,
  } = useEvents({
    latitude: location?.latitude,
    longitude: location?.longitude,
    radiusMiles: 10.0,
    autoRefresh: true,
    refreshInterval: 300000, // Refresh every 5 minutes
  });

  // Default location
  const defaultLocation: LocationType = {
    latitude: 40.7128,
    longitude: -74.006,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Location Permission",
          "Location permission is required to show nearby events. Using default location.",
          [{ text: "OK" }]
        );
        setLocation(defaultLocation);
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });

      setLoading(false);
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert(
        "Error",
        "Failed to get your location. Using default location."
      );
      setLocation(defaultLocation);
      setLoading(false);
    }
  };

  const centerOnUser = () => {
    getLocation();
  };

  // Convert backend Event to EventMarker
  const convertToEventMarker = (event: Event): EventMarker => ({
    id: event.id.toString(),
    latitude: event.latitude,
    longitude: event.longitude,
    title: event.eventTitle,
    description: event.eventSummary,
    endTime: new Date(event.eventEndTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    imageUrl: event.eventImageUrl, // Add this
    pageUrl: event.eventPageUrl, // Add this
  });

  const onMarkerPress = (event: Event) => {
    const eventMarker = convertToEventMarker(event);
    setSelectedEvent(eventMarker);
    setShowEventInfo(true);
  };

  const closeEventInfo = () => {
    setShowEventInfo(false);
    setSelectedEvent(null);
  };

  const handleRefresh = () => {
    refreshEvents();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {location && (
          <MapView
            style={styles.map}
            provider={undefined}
            initialRegion={location}
            showsUserLocation={true}
            showsMyLocationButton={false}
            followsUserLocation={false}
            showsCompass={false}
            showsScale={false}
            showsTraffic={false}
            showsIndoors={false}
            showsBuildings={false}
            pitchEnabled={false}
            mapType="standard"
          >
            {events.map((event) => (
              <Marker
                key={event.id}
                coordinate={{
                  latitude: event.latitude,
                  longitude: event.longitude,
                }}
                title={event.eventTitle}
                description={event.eventSummary}
                onPress={() => onMarkerPress(event)}
                pinColor="#FF6B6B"
              />
            ))}
          </MapView>
        )}

        {/* Floating Action Buttons */}
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={[styles.fab, styles.refreshFab]}
            onPress={handleRefresh}
            disabled={eventsLoading}
          >
            {eventsLoading ? (
              <ActivityIndicator size={20} color="#fff" />
            ) : (
              <Ionicons name="refresh" size={24} color="#fff" />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.fab} onPress={centerOnUser}>
            <Ionicons name="locate" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Event Counter */}
        <View style={styles.eventCounter}>
          <Text style={styles.eventCountText}>
            {eventsLoading ? "Loading..." : `${events.length} events nearby`}
          </Text>
          {eventsError && <Text style={styles.errorText}>{eventsError}</Text>}
        </View>

        {/* Event Info Modal */}
        <EventInfo
          visible={showEventInfo}
          event={selectedEvent}
          onClose={closeEventInfo}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  map: {
    flex: 1,
  },
  fabContainer: {
    position: "absolute",
    bottom: 100,
    right: 20,
    gap: 12,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  refreshFab: {
    backgroundColor: "#4CAF50",
  },
  eventCounter: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
  },
  eventCountText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  errorText: {
    fontSize: 12,
    color: "#f44336",
    marginTop: 4,
  },
});

export default MapScreen;
