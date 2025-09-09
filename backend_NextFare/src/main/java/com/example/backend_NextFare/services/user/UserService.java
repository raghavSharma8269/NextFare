package com.example.backend_NextFare.services.user;

import com.example.backend_NextFare.dto.user.UserDTO;
import com.example.backend_NextFare.security.FirebaseAuthToken;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    public ResponseEntity<UserDTO> createOrUpdateUser(UserDTO userDTO, Authentication auth) {
        try{
            FirebaseAuthToken firebaseAuth = (FirebaseAuthToken) auth;
            String uid = firebaseAuth.getUid();
            String email = firebaseAuth.getEmail();

            Firestore db = FirestoreClient.getFirestore();

            // Check if user profile already exists
            DocumentSnapshot existingProfile = db.collection("users").document(uid).get().get();

            if (!existingProfile.exists()) {
                //Create new profile in firestore
                UserDTO newProfile = new UserDTO();
                newProfile.setUid(uid);
                newProfile.setEmail(email);
                newProfile.setUsername(userDTO.getUsername());
                newProfile.setCreatedAt(Timestamp.now());
                newProfile.setUpdatedAt(Timestamp.now());

                db.collection("users").document(uid).set(newProfile).get();
                return ResponseEntity.ok(newProfile);
            }
            else {
                // Update existing profile
                UserDTO existingData = existingProfile.toObject(UserDTO.class);

                if (userDTO.getLastLocation() != null) {
                    existingData.setLastLocation(userDTO.getLastLocation());
                }

                db.collection("users").document(uid).set(existingData).get();
                return ResponseEntity.ok(existingData);
            }

        }catch (Exception e) {
            System.out.println(e.getMessage());
            return ResponseEntity.status(500).body(null);
        }
    }

    public ResponseEntity<?> getUser(Authentication auth) {

        System.out.println("Getting user profile...");

        try {
            FirebaseAuthToken firebaseAuth = (FirebaseAuthToken) auth;
            String uid = firebaseAuth.getPrincipal().toString();

            Firestore db = FirestoreClient.getFirestore();
            DocumentSnapshot document = db.collection("users").document(uid).get().get();

            if (document.exists()) {
                UserDTO profile = document.toObject(UserDTO.class);
                return ResponseEntity.ok(profile);
            } else {
                return ResponseEntity.status(404).body("User profile not found");
            }

        } catch (Exception e) {
            System.out.println("Error Getting User:" + e.getMessage());
            return ResponseEntity.status(500).body(null);
        }
    }
}
