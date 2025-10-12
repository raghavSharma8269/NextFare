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
import org.springframework.http.HttpStatus;
import com.google.cloud.firestore.DocumentReference;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class UserService {

    public ResponseEntity<UserDTO> createOrUpdateUser(UserDTO userDTO, Authentication auth) {
        log.info("Executing UserService.createOrUpdateUser \n{}", userDTO.toString());

        try {
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

                // make all usernames case insensitive by storing them in lowercase
                String normalizedUsername = userDTO.getUsername().trim().toLowerCase();

                DocumentReference usernameDoc = db.collection("usernames")
                        .document(normalizedUsername);

                DocumentSnapshot usernameSnapshot = usernameDoc.get().get();

                if (usernameSnapshot.exists()) {
                    log.error("Username already taken: {}", userDTO.getUsername());
                    return ResponseEntity.status(HttpStatus.CONFLICT).body(null);
                }

                // Create new profile in firestore
                UserDTO newProfile = new UserDTO();
                newProfile.setUid(uid);
                newProfile.setEmail(email);
                newProfile.setUsername(userDTO.getUsername().trim());
                newProfile.setLastLocation(userDTO.getLastLocation()); // Can be null initially
                newProfile.setCreatedAt(Timestamp.now());
                newProfile.setUpdatedAt(Timestamp.now());

                // Save user profile
                db.collection("users").document(uid).set(newProfile).get();

                // Reserve username in index collection
                Map<String, Object> usernameData = new HashMap<>();
                usernameData.put("uid", uid);
                usernameData.put("createdAt", Timestamp.now());
                usernameDoc.set(usernameData).get();

                log.info("User created successfully with uid: {}", uid);
                return ResponseEntity.ok(newProfile);
            }

            // *** EXISTING USER UPDATE LOGIC ***
            log.info("Updating existing user with uid: {}", uid);

            UserDTO updatedProfile = existingProfile.toObject(UserDTO.class);

            // Update username if provided and different
            if (userDTO.getUsername() != null && !userDTO.getUsername().trim().isEmpty()) {
                String newNormalizedUsername = userDTO.getUsername().trim().toLowerCase();
                String currentNormalizedUsername = updatedProfile.getUsername().toLowerCase();

                // Only check uniqueness if username is changing
                if (!newNormalizedUsername.equals(currentNormalizedUsername)) {
                    DocumentReference newUsernameDoc = db.collection("usernames")
                            .document(newNormalizedUsername);

                    DocumentSnapshot newUsernameSnapshot = newUsernameDoc.get().get();

                    if (newUsernameSnapshot.exists()) {
                        log.error("Username already taken: {}", userDTO.getUsername());
                        return ResponseEntity.status(HttpStatus.CONFLICT).body(null);
                    }

                    // Remove old username reservation
                    db.collection("usernames").document(currentNormalizedUsername).delete().get();

                    // Reserve new username
                    Map<String, Object> usernameData = new HashMap<>();
                    usernameData.put("uid", uid);
                    usernameData.put("createdAt", Timestamp.now());
                    newUsernameDoc.set(usernameData).get();

                    // Update username in profile
                    updatedProfile.setUsername(userDTO.getUsername().trim());
                }
            }

            // Update location if provided
            if (userDTO.getLastLocation() != null) {
                updatedProfile.setLastLocation(userDTO.getLastLocation());
            }

            updatedProfile.setUpdatedAt(Timestamp.now());

            // Save updated profile
            db.collection("users").document(uid).set(updatedProfile).get();

            log.info("User updated successfully with uid: {}", uid);
            return ResponseEntity.ok(updatedProfile);

        } catch (Exception e) {
            log.error("Error in createOrUpdateUser", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
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