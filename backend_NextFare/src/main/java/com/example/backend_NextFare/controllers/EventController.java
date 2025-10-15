package com.example.backend_NextFare.controllers;

import com.example.backend_NextFare.model.entities.Event;
import com.example.backend_NextFare.services.events.EventService;
import com.example.backend_NextFare.services.events.GeoSearchDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/events")
@Slf4j
public class EventController {

    private final EventService eventService;


    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping("/active")
    public ResponseEntity<List<Event>> getAllEvents() {
        log.info("/events/active hit");
        return eventService.getAllActiveEvents();
    }

    @GetMapping("/active-in-bounds")
    public ResponseEntity<List<Event>> getActiveEventsInBound(@RequestBody GeoSearchDTO geoSearchDTO) {
        log.info("/events/active-in-bounds hit");
        return eventService.getActiveEventsInBound(geoSearchDTO);
    }

    @GetMapping("/within-radius")
    public ResponseEntity<List<Event>> getActiveEventsWithinRadius(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "2.0") double radiusInMiles,
            @RequestParam(required = false)  @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime startOfTimeRange,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime endOfTimeRange
            )
    {
        log.info("/events/within-radius hit");
        if (startOfTimeRange == null) {
            startOfTimeRange = LocalDateTime.now();
        }
        if (endOfTimeRange == null) {
            endOfTimeRange = LocalDateTime.now().toLocalDate().plusDays(1).atStartOfDay(); // sets default end time to midnight same day
        }
        return eventService.getActiveEventsWithinRadius(lat, lng, radiusInMiles, startOfTimeRange, endOfTimeRange);
    }
}
