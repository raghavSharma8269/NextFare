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
import { LinearGradient } from "expo-linear-gradient";
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

const DEFAULT_MARKER = {
  id: "default-home-base",
  latitude: 40.742421,
  longitude: -73.677674,
  title: "Home Base",
  description: "Your default pickup location",
  estimatedAttendance: undefined,
  pinColor: "#4CAF50",
};

const MapScreen: React.FC = () => {
  const [location, setLocation] = useState<LocationType | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventMarker | null>(null);
  const [showEventInfo, setShowEventInfo] = useState(false);

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
    refreshInterval: 300000,
  });

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

  const convertToEventMarker = (event: Event): EventMarker => ({
    id: event.id.toString(),
    latitude: event.latitude,
    longitude: event.longitude,
    title: event.eventTitle,
    description: event.eventSummary,
    endTime: event.eventEndTime,
    imageUrl: event.eventImageUrl,
    pageUrl: event.eventPageUrl,
    estimatedAttendance: event.ticketsSold,
  });

  const onMarkerPress = (event: Event) => {
    const eventMarker = convertToEventMarker(event);
    setSelectedEvent(eventMarker);
    setShowEventInfo(true);
  };

  const onDefaultMarkerPress = () => {
    const defaultEventMarker: EventMarker = {
      id: DEFAULT_MARKER.id,
      latitude: DEFAULT_MARKER.latitude,
      longitude: DEFAULT_MARKER.longitude,
      title: DEFAULT_MARKER.title,
      description: DEFAULT_MARKER.description,
      endTime: "",
      estimatedAttendance: undefined,
    };
    setSelectedEvent(defaultEventMarker);
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
        <LinearGradient
          colors={["#0f0f15", "#1a1a24"]}
          style={styles.loadingContainer}
        >
          <ActivityIndicator size="large" color="#a0d2eb" />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </LinearGradient>
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
            userInterfaceStyle="dark"
          >
            <Marker
              key={DEFAULT_MARKER.id}
              coordinate={{
                latitude: DEFAULT_MARKER.latitude,
                longitude: DEFAULT_MARKER.longitude,
              }}
              onPress={onDefaultMarkerPress}
              pinColor={DEFAULT_MARKER.pinColor}
            />

            {events.map((event) => (
              <Marker
                key={event.id}
                coordinate={{
                  latitude: event.latitude,
                  longitude: event.longitude,
                }}
                onPress={() => onMarkerPress(event)}
                pinColor="#FF6B6B"
              />
            ))}
          </MapView>
        )}

        {/* Event Counter */}
        <LinearGradient
          colors={["rgba(26, 26, 36, 0.95)", "rgba(30, 30, 46, 0.95)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.eventCounter}
        >
          <View style={styles.counterContent}>
            <Ionicons name="calendar-outline" size={18} color="#a0d2eb" />
            <Text style={styles.eventCountText}>
              {eventsLoading ? "Loading..." : `${events.length} events nearby`}
            </Text>
          </View>
          {eventsError && <Text style={styles.errorText}>{eventsError}</Text>}
        </LinearGradient>

        {/* Floating Action Buttons */}
        <View style={styles.fabContainer}>
          <TouchableOpacity
            onPress={handleRefresh}
            disabled={eventsLoading}
            activeOpacity={0.8}
          >
            <LinearGradient colors={["#4CAF50", "#45a049"]} style={styles.fab}>
              {eventsLoading ? (
                <ActivityIndicator size={24} color="#fff" />
              ) : (
                <Ionicons name="refresh" size={24} color="#fff" />
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={centerOnUser} activeOpacity={0.8}>
            <LinearGradient colors={["#a0d2eb", "#8458B3"]} style={styles.fab}>
              <Ionicons name="locate" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

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
    backgroundColor: "#0f0f15",
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
    fontFamily: "Sansation-Regular",
    color: "#e5eaf5",
  },
  map: {
    flex: 1,
  },
  eventCounter: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(160, 210, 235, 0.3)",
    shadowColor: "#8458B3",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  counterContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  eventCountText: {
    fontSize: 14,
    fontFamily: "Sansation-Bold",
    fontWeight: "600",
    color: "#f8f9fa",
  },
  errorText: {
    fontSize: 12,
    fontFamily: "Sansation-Regular",
    color: "#ff6b6b",
    textAlign: "center",
    paddingBottom: 8,
  },
  fabContainer: {
    position: "absolute",
    bottom: 100,
    right: 20,
    gap: 16,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default MapScreen;
