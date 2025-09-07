package com.example.backend_NextFare;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.IOException;
import java.io.InputStream;

@SpringBootApplication
public class BackendNextFareApplication {

	private final Logger logger = LoggerFactory.getLogger(BackendNextFareApplication.class);

	public static void main(String[] args) {
		try {
			InputStream serviceAccount = BackendNextFareApplication.class
					.getClassLoader()
					.getResourceAsStream("FirebaseServiceAccountKey.json");

			FirebaseOptions options = new FirebaseOptions.Builder()
					.setCredentials(GoogleCredentials.fromStream(serviceAccount))
					.build();

			FirebaseApp.initializeApp(options);
			System.out.println("Firebase initialized successfully.");

		} catch (IOException e) {
			System.out.println("Firebase initialization error: " + e.getMessage());
		}

		SpringApplication.run(BackendNextFareApplication.class, args);
		System.out.println("BackendNextFareApplication started successfully!!!");
	}
	// This method logs memory usage info
	@PostConstruct
	public void logMemorySettings() {
		Runtime runtime = Runtime.getRuntime();
		long maxMemory = runtime.maxMemory() / 1024 / 1024;
		long totalMemory = runtime.totalMemory() / 1024 / 1024;
		long freeMemory = runtime.freeMemory() / 1024 / 1024;
		long usedMemory = totalMemory - freeMemory;

		System.out.println("=== JVM Memory Settings ===");
		logger.info("Max memory (ceiling): {}MB", maxMemory);
		logger.info("Total memory (current allocation): {}MB", totalMemory);
		logger.info("Used memory (actually in use): {}MB", usedMemory);
		logger.info("Free memory (available): {}MB", freeMemory);
		System.out.println("==========================");
	}

}
