package com.example.backend_NextFare.services.events;

import com.example.backend_NextFare.model.entities.Event;
import com.example.backend_NextFare.model.repositories.EventRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class EventService {

    private final EventRepository eventRepository;

    public EventService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    public ResponseEntity<List<Event>> getAllActiveEvents() {
        return ResponseEntity.ok(eventRepository.findActiveEvents(LocalDateTime.now()));
    }
}
