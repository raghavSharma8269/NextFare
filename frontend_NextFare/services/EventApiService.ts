import apiClient from "../types/client";

// ===== TYPE DEFINITIONS =====
export interface Event {
  id: number;
  eventTitle: string;
  eventDateTime: string;
  eventSummary: string;
  eventAddress: string;
  eventImageUrl: string;
  eventPageUrl: string;
  latitude: number;
  longitude: number;
  ticketsSold: number;
  eventStartTime: string;
  eventEndTime: string;
  eventSource: string;
  timeAdded: string;
  timeUpdated: string;
}

export interface GeoSearchRequest {
  north: number;
  south: number;
  east: number;
  west: number;
  now?: string;
}

// ===== EVENTS SERVICE CLASS =====
export class EventsApiService {
  /**
   * Get all active events
   */
  static async getAllActiveEvents(): Promise<Event[]> {
    const response = await apiClient.get<Event[]>("/api/events/active");
    return response.data;
  }

  /**
   * Get events within geographic bounds
   */
  static async getEventsInBounds(bounds: GeoSearchRequest): Promise<Event[]> {
    const response = await apiClient.get<Event[]>(
      "/api/events/active-in-bounds",
      {
        data: bounds,
      }
    );
    return response.data;
  }

  /**
   * Get events within radius of a point
   */
  static async getEventsWithinRadius(
    latitude: number,
    longitude: number,
    radiusMiles: number = 2.0
  ): Promise<Event[]> {
    const response = await apiClient.get<Event[]>("/api/events/within-radius", {
      params: {
        lat: latitude,
        lng: longitude,
        radiusInMiles: radiusMiles, //default 2 miles
      },
    });
    return response.data;
  }
}
