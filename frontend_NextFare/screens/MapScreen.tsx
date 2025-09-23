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
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import EventInfo from "../components/EventInfo";

interface LocationType {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface EventMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  endTime: string;
}

const MapScreen: React.FC = () => {
  const [location, setLocation] = useState<LocationType | null>(null);
  const [loading, setLoading] = useState(true);
  const [eventMarkers, setEventMarkers] = useState<EventMarker[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventMarker | null>(null);
  const [showEventInfo, setShowEventInfo] = useState(false);

  // Default location (New York City)
  const defaultLocation: LocationType = {
    latitude: 40.7128,
    longitude: -74.006,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  // Sample event data
  const sampleEvents: EventMarker[] = [
    {
      id: "1",
      latitude: 40.7589,
      longitude: -73.9851,
      title: "Concert at Central Park",
      description: "Large concert ending at 11 PM",
      endTime: "23:00",
    },
    {
      id: "2",
      latitude: 40.7505,
      longitude: -73.9934,
      title: "Broadway Show",
      description: "Theater show ending at 10:30 PM",
      endTime: "22:30",
    },
    {
      id: "3",
      latitude: 40.7282,
      longitude: -74.0776,
      title: "Sports Game",
      description: "Basketball game ending at midnight",
      endTime: "00:00",
    },
  ];

  useEffect(() => {
    getLocation();
    setEventMarkers(sampleEvents);
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

  const onMarkerPress = (event: EventMarker) => {
    setSelectedEvent(event);
    setShowEventInfo(true);
  };

  const closeEventInfo = () => {
    setShowEventInfo(false);
    setSelectedEvent(null);
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
            showsCompass={true}
            showsScale={true}
            showsTraffic={true}
          >
            {eventMarkers.map((event) => (
              <Marker
                key={event.id}
                coordinate={{
                  latitude: event.latitude,
                  longitude: event.longitude,
                }}
                title={event.title}
                description={event.description}
                onPress={() => onMarkerPress(event)}
                pinColor="#FF6B6B"
              />
            ))}
          </MapView>
        )}

        {/* Floating Action Buttons */}
        <View style={styles.fabContainer}>
          <TouchableOpacity style={styles.fab} onPress={centerOnUser}>
            <Ionicons name="locate" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Event Counter */}
        <View style={styles.eventCounter}>
          <Text style={styles.eventCountText}>
            {eventMarkers.length} Events Nearby
          </Text>
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
});

export default MapScreen;
