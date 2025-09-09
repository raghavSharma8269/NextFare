package com.example.backend_NextFare.dto.user;

import com.google.cloud.Timestamp;
import lombok.Data;


@Data
public class UserDTO {
    private String uid;
    private String email;
    private String username;
    private LastLocation lastLocation;
    private Timestamp createdAt;
    private Timestamp updatedAt;
}
