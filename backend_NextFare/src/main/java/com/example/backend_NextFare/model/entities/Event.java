package com.example.backend_NextFare.model.entities;

import com.example.backend_NextFare.model.enums.EventSource;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "events")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "event_title")
    private String eventTitle;

    @Column(name = "event_date_time")
    private String eventDateTime;

    @Column(name = "event_summary", columnDefinition = "TEXT")
    private String eventSummary;

    @Column(name = "event_address")
    private String eventAddress;

    @Column(name = "event_image_url")
    private String eventImageUrl;

    @Column(name = "event_page_url")
    private String eventPageUrl;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "tickets_sold")
    private Integer ticketsSold;

    @Column(name = "event_start_time")
    private LocalDateTime eventStartTime;

    @Column(name = "event_end_time")
    private LocalDateTime eventEndTime;

    @Column(name = "event_source")
    private EventSource eventSource;

    @CreationTimestamp
    @Column(name = "time_added", updatable = false)
    private LocalDateTime timeAdded;

    @UpdateTimestamp
    @Column(name = "time_updated")
    private LocalDateTime timeUpdated;

}
