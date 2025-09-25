package com.example.backend_NextFare.controllers;

import com.example.backend_NextFare.model.entities.Event;
import com.example.backend_NextFare.services.events.EventService;
import com.example.backend_NextFare.services.events.GeoSearchDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
            @RequestParam(defaultValue = "2.0") double radiusInMiles)
    {
        log.info("/events/within-radius hit");
        return eventService.getActiveEventsWithinRadius(lat, lng, radiusInMiles);
    }
}
