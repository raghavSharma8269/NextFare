package com.example.backend_NextFare.services.user;

import com.example.backend_NextFare.dto.user.LastLocation;
import com.example.backend_NextFare.dto.user.UserDTO;
import com.example.backend_NextFare.security.FirebaseAuthToken;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class UserService {

    public ResponseEntity<UserDTO> createOrUpdateUser(UserDTO userDTO, Authentication auth) {

        log.info("Executing UserService.createOrUpdateUser \n{}", userDTO.toString());

        try{
            FirebaseAuthToken firebaseAuth = (FirebaseAuthToken) auth;
            String uid = firebaseAuth.getUid();
            String email = firebaseAuth.getEmail();

            Firestore db = FirestoreClient.getFirestore();

            // Check if user profile already exists
            DocumentSnapshot existingProfile = db.collection("users").document(uid).get().get();

            if (!existingProfile.exists()) {
                log.info("Creating new user in firestore with uid: {}", uid);

                // Validate required fields for new user
                if (userDTO.getUsername() == null || userDTO.getUsername().trim().isEmpty()) {
                    log.error("Username is required for new user creation");
                    return ResponseEntity.badRequest().body(null);
                }

                //Create new profile in firestore
                UserDTO newProfile = new UserDTO();
                newProfile.setUid(uid);
                newProfile.setEmail(email);
                newProfile.setUsername(userDTO.getUsername().trim());
                newProfile.setLastLocation(userDTO.getLastLocation()); // Can be null initially
                newProfile.setCreatedAt(Timestamp.now());
                newProfile.setUpdatedAt(Timestamp.now());

                db.collection("users").document(uid).set(newProfile).get();

                log.info("User created successfully with uid: {}", uid);
                return ResponseEntity.ok(newProfile);
            }

            /**
             * For existing users we update only the fields that are provided in the request
             */

            else {
                log.info("Updating existing user in firestore with uid: {}", uid);

                Map<String, Object> updates = new HashMap<>();
                boolean hasUpdates = false;

                // Update location if provided
                if (userDTO.getLastLocation() != null) {
                    updates.put("lastLocation", userDTO.getLastLocation());
                    hasUpdates = true;
                    log.info("Updating location for user: {}", uid);
                }

                // Update username if provided and different
                if (userDTO.getUsername() != null && !userDTO.getUsername().trim().isEmpty()) {
                    UserDTO existingData = existingProfile.toObject(UserDTO.class);
                    if (!userDTO.getUsername().trim().equals(existingData.getUsername())) {
                        updates.put("username", userDTO.getUsername().trim());
                        hasUpdates = true;
                        log.info("Updating username for user: {}", uid);
                    }
                }

                if (hasUpdates) {
                    // Always update the timestamp when making changes
                    updates.put("updatedAt", Timestamp.now());

                    db.collection("users").document(uid).update(updates).get();
                    log.info("User updated successfully with uid: {}", uid);
                } else {
                    log.info("No updates needed for user: {}", uid);
                }

                DocumentSnapshot updatedProfile = db.collection("users").document(uid).get().get();
                UserDTO updatedUser = updatedProfile.toObject(UserDTO.class);
                return ResponseEntity.ok(updatedUser);
            }

        }catch (Exception e) {
            log.error("Error in createOrUpdateUser: {}", e.getMessage());
            return ResponseEntity.status(500).body(null);
        }
    }

    public ResponseEntity<String> updateUserLocation(LastLocation updatedLocation, Authentication auth) {
        log.info("Executing UserService.updateUserLocation");

        try {
            FirebaseAuthToken firebaseAuth = (FirebaseAuthToken) auth;
            String uid = firebaseAuth.getUid();

            Firestore db = FirestoreClient.getFirestore();

            // Create location update map
            Map<String, Object> locationUpdate = new HashMap<>();
            Map<String, Double> location = new HashMap<>();
            location.put("latitude", updatedLocation.getLatitude());
            location.put("longitude", updatedLocation.getLongitude());

            locationUpdate.put("lastLocation", location);
            locationUpdate.put("updatedAt", Timestamp.now());

            db.collection("users").document(uid).update(locationUpdate).get();

            log.info("Location updated successfully for user: {}", uid);
            return ResponseEntity.ok("Location updated successfully");

        } catch (Exception e) {
            log.error("Error updating user location: {}", e.getMessage());
            return ResponseEntity.status(500).body("Failed to update location");
        }
    }

    public ResponseEntity<?> getUser(Authentication auth) {

        log.info("Executing UserService.getUser");

        try {
            FirebaseAuthToken firebaseAuth = (FirebaseAuthToken) auth;
            String uid = firebaseAuth.getPrincipal().toString();

            log.info("Getting user with uid: {}", uid);

            Firestore db = FirestoreClient.getFirestore();
            DocumentSnapshot document = db.collection("users").document(uid).get().get();

            if (document.exists()) {
                UserDTO profile = document.toObject(UserDTO.class);
                return ResponseEntity.ok(profile);
            } else {
                return ResponseEntity.status(404).body("User profile not found");
            }

        } catch (Exception e) {
            log.error("Error getting user: {}", e.getMessage());
            return ResponseEntity.status(500).body(null);
        }
    }
}