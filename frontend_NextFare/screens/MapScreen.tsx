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
  estimatedAttendance?: number;
}

const DEFAULT_MARKER = {
  id: "default-home-base",
  latitude: 40.742421,
  longitude: -73.677674,
  title: "Home Base",
  description:
    "Your default pickup location Want to be part of an accelerator for a day? Join these sessions at DevFest NYC!2:30 PM Accelerate Your Startup with Customer Discovery 3:30 PM Accelerate Your Startup with a Target Pitch 4:15 PM Getting started with Gemini API with AI Studio and Google Colab You need to be registered and approved for Google DevFest NYC 2025 to attend. https://rsvp.withgoogle.com/events/devfest-newyorkcity-2025 Agenda 2:30 PM: Accelerate Your Startup with Customer Discovery Customer Discovery 3:30 PM: Accelerate Your Startup with a Target Pitch Pitch your startup 4:15 PM: Getting started with Gemini API with AI Studio and Google Colab --- Speaker Christelle Scharff Dr. Christelle Scharff is a Professor of Computer Science and Associate Dean at Pace University in NY. She has a Ph.D. in Symbolic Artificial Intelligence (Theorem Proving and Automated Deduction) from INRIA, the French National Institute for Research in Digital Science and Technology. She published more than 30 papers in artificial intelligence, mobile for social change and global software en… Hosted By Anna Nerezova, GDG Organizer Anna Nerezova is a Digital Marketing and Cloud Transformation Consultant with 15 years of experience in data, analytics and optimization. She has built innovative solutions using Google Cloud to solve problems in the media and entertainment, tech, health and non-profit industries Anna is a Google Cloud Engineer Scholar, and is on the 100 Women in Analytics list by Google Analytics. She is also a Google Developer Group NYC lead and a mentor for the Northeast, and a proud Women Techmakers Ambassador. Anna is passionate about using the latest AI/ML technologies to provide solutions and bring growth and better experience for all users. She is a strong advocate for diversity and inclusion, and is committed to helping underrepresented groups become entrepreneurs and financially independent. Bhavik Chopra, Computer Science Graduate Student Hi, I’m Bhavik — a Data Scientist at the Metropolitan Transportation Authority (MTA) and an Organizer for Google Developer Group (GDG) NYC, where I foster a thriving tech community through events like GDG NYC DevFest and Cloud Study Jams on Google Cloud and Terraform. My passion for technology started in childhood, surrounded by computers, software, and games. Although I initially pursued Science-Maths in high school, my true calling emerged when I discovered software development. Since then, I’ve been building projects and exploring cutting-edge technologies. I hold a Master’s in Computer Science from Pace University and a Bachelor’s in Computer Engineering from Silver Oak University, where I actively contributed to the tech community through DSC Silver Oak (Google Developers) and various IEEE leadership roles. Today, I merge my technical expertise with my love for community building—whether through data science innovations at MTA, improving NYC transit for 6M+ daily riders, or empowering developers through GDG NYC events. Let’s connect and create something impactful together! 🚀 Shivika Arora, Executive Director, Product I am currently responsible for driving modernization, innovation and engineer experience agenda in four strategic tech location for JP Morgan - Manhattan, Brooklyn, Silicon Valley and Seattle. Prior to this role, I was the Product and Solutions Lead for Trusts and Estates under Asset Wealth Management, where I was responsible for executing both brokerage op models as well lending framework for the ultra-high net worth clients. Outside of work, I am Google’s WomenTechmaker Ambassador for NYC as well as GDG NYC Organizer; Champion Coach for JPM’s Women On The Move Network' and Fast Forward Small Business Mentor. On a personal front, I love to read, dance to any good music and go on food tours around various cities. Complete your event RSVP here: https://gdg.community.dev/events/details/google-gdg-nyc-presents-accelerate-your-startup-at-devfest-nyc-2025/.",
  estimatedAttendance: 8347,
  pinColor: "#4CAF50",
};

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
      endTime: "", // No end time for default marker
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
            {/* Default permanent marker */}
            <Marker
              key={DEFAULT_MARKER.id}
              coordinate={{
                latitude: DEFAULT_MARKER.latitude,
                longitude: DEFAULT_MARKER.longitude,
              }}
              onPress={onDefaultMarkerPress}
              pinColor={DEFAULT_MARKER.pinColor}
            />

            {/* Event markers from API */}
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
