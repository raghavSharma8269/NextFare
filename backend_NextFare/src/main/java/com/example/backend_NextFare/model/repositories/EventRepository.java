package com.example.backend_NextFare.model.repositories;

import com.example.backend_NextFare.model.entities.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    @Query("SELECT e FROM Event e WHERE e.eventEndTime > :now ORDER BY e.eventEndTime ASC")
    List<Event> findActiveEvents(@Param("now") LocalDateTime now);
}
