package com.example.backend_NextFare.services.events;

import com.example.backend_NextFare.model.entities.Event;
import com.example.backend_NextFare.model.repositories.EventRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
public class EventService {

    private final EventRepository eventRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String CACHE_PREFIX = "events:bounds:";
    private static final Duration CACHE_TTL = Duration.ofMinutes(15);

    public EventService(
            EventRepository eventRepository,
            RedisTemplate<String, Object> redisTemplate
    ) {
        this.eventRepository = eventRepository;
        this.redisTemplate = redisTemplate;
    }

    public ResponseEntity<List<Event>> getAllActiveEvents() {
        return ResponseEntity.ok(eventRepository.findActiveEvents(LocalDateTime.now()));
    }

    public ResponseEntity<List<Event>> getActiveEventsInBound(GeoSearchDTO geoSearchDTO) {

        double north = geoSearchDTO.getNorth();
        double south = geoSearchDTO.getSouth();
        double east = geoSearchDTO.getEast();
        double west = geoSearchDTO.getWest();

        log.info("Getting active events in bounds: north={}, south={}, east={}, west={}",
                north,
                south,
                east,
                west
        );

        // Validate bounds
        if (north <= south) {
            throw new IllegalArgumentException("North latitude must be greater than south latitude");
        }
        if (east <= west) {
            throw new IllegalArgumentException("East longitude must be greater than west longitude");
        }

        // Basic sanity check for NYC area (rough bounds)
        if (!isInNYCBounds(north, south, east, west)) {
            log.warn("Bounds seem outside NYC area: north={}, south={}, east={}, west={}",
                    north, south, east, west);
        }

        List<Event> events = eventRepository.geoSearchActiveEvents(north, south, east, west, LocalDateTime.now());

        log.info("Found {} active events in bounds", events.size());
        return ResponseEntity.ok(events);

    }

    /**
     * Get active events within a radius from a center point (for default user experience)
     */
    public ResponseEntity<List<Event>> getActiveEventsWithinRadius(double centerLat, double centerLng, double radiusMiles) {

        log.info("Getting active events within {} miles of {}, {}", radiusMiles, centerLat, centerLng);

        // Convert miles to approximate degrees
        double latDegreePerMile = 1.0 / 69.0; // Roughly 69 miles per degree of latitude
        double lngDegreePerMile = 1.0 / (69.0 * Math.cos(Math.toRadians(centerLat))); // Adjust for longitude

        double latOffset = radiusMiles * latDegreePerMile;
        double lngOffset = radiusMiles * lngDegreePerMile;

        double north = centerLat + latOffset;
        double south = centerLat - latOffset;
        double east = centerLng + lngOffset;
        double west = centerLng - lngOffset;

        GeoSearchDTO geoSearchDTO = new GeoSearchDTO();

        geoSearchDTO.setNorth(north);
        geoSearchDTO.setSouth(south);
        geoSearchDTO.setEast(east);
        geoSearchDTO.setWest(west);

        log.info("Converted to bounds: north={}, south={}, east={}, west={}", north, south, east, west);

        return getActiveEventsInBound(geoSearchDTO);
    }

    /**
     * Basic validation that coordinates are roughly in NYC area
     */
    private boolean isInNYCBounds(double north, double south, double east, double west) {
        // Very loose bounds for NYC metro area
        double nycNorthLimit = 41.0;   // Well north of NYC
        double nycSouthLimit = 40.4;   // Well south of NYC
        double nycEastLimit = -73.5;   // Well east of NYC
        double nycWestLimit = -74.5;   // Well west of NYC

        return north <= nycNorthLimit && south >= nycSouthLimit &&
                east <= nycEastLimit && west >= nycWestLimit;
    }
}
