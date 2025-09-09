package com.example.backend_NextFare.configs;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;

@Component
public class FirebaseConfig {

    @PostConstruct
    public void initFirebase() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                InputStream serviceAccount = getClass()
                        .getClassLoader()
                        .getResourceAsStream("FirebaseServiceAccountKey.json");

                if (serviceAccount == null) {
                    throw new IOException("Firebase service account file not found");
                }

                FirebaseOptions options = new FirebaseOptions.Builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                        .setProjectId("next-fare")
                        .build();

                FirebaseApp app = FirebaseApp.initializeApp(options);

                if (app.getOptions().getProjectId() == null) {
                    throw new IOException("Failed to initialize FirebaseApp");
                }

                System.out.println("Firebase initialized with project: " + app.getOptions().getProjectId());
            }
        } catch (IOException e) {
            System.out.println("Error initializing Firebase: " + e.getMessage());
        }
    }
}