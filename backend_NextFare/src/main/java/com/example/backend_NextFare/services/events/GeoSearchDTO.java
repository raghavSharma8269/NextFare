package com.example.backend_NextFare.services.events;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class GeoSearchDTO {
    private double north;
    private double south;
    private double east;
    private double west;
    private LocalDateTime now;
    private LocalDateTime startOfTimeRange;
    private LocalDateTime endOfTimeRange;
}
