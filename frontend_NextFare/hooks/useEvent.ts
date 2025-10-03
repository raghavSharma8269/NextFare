import { useState, useEffect } from "react";
import { EventsApiService, Event } from "../services/EventApiService";

interface UseEventsProps {
  latitude?: number;
  longitude?: number;
  radiusMiles?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useEvents = ({
  latitude,
  longitude,
  radiusMiles = 2.0,
  autoRefresh = false,
  refreshInterval = 60000,
}: UseEventsProps = {}) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);

    try {
      let fetchedEvents: Event[];

      if (latitude && longitude) {
        fetchedEvents = await EventsApiService.getEventsWithinRadius(
          latitude,
          longitude,
          radiusMiles
        );
      } else {
        fetchedEvents = await EventsApiService.getAllActiveEvents();
      }

      setEvents(fetchedEvents);
      setLastFetch(new Date());
      console.log(`Fetched ${fetchedEvents.length} events`);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  const refreshEvents = () => {
    fetchEvents();
  };

  useEffect(() => {
    fetchEvents();
  }, [latitude, longitude, radiusMiles]);

  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchEvents, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  return {
    events,
    loading,
    error,
    lastFetch,
    refreshEvents,
    fetchEvents,
  };
};
