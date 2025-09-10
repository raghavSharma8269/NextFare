package com.example.backend_NextFare.controllers;

import com.example.backend_NextFare.dto.user.LastLocation;
import com.example.backend_NextFare.dto.user.UserDTO;
import com.example.backend_NextFare.services.user.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Authentication auth) {
        return userService.getUser(auth);
    }

    @PostMapping("/profile")
    public ResponseEntity<UserDTO> createOrUpdateProfile(
            Authentication auth,
            @RequestBody UserDTO userDTO) {
        return userService.createOrUpdateUser(userDTO, auth);
    }

    @PostMapping("/profile/location")
    public ResponseEntity<String> updateLastLocation(
            Authentication auth,
            @RequestBody LastLocation updatedLocation) {
        return userService.updateUserLocation(updatedLocation, auth);
    }

}
