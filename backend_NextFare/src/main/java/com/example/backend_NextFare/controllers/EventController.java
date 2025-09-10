package com.example.backend_NextFare.controllers;

import com.example.backend_NextFare.model.entities.Event;
import com.example.backend_NextFare.services.events.EventService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService eventService;


    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping("/active")
    public ResponseEntity<List<Event>> getAllEvents() {
        return eventService.getAllActiveEvents();
    }
}
