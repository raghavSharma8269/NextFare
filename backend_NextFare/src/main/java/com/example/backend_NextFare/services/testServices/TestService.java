package com.example.backend_NextFare.services.testServices;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.concurrent.ExecutionException;

@Service
public class TestService {
    public ResponseEntity<String> getTestMessage() {
        return ResponseEntity.ok("Test message from TestGetService");
    }

    public ResponseEntity<String> create(TestDTO testDTO) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();

        DocumentReference docRef = db.collection("users").document();

        ApiFuture<WriteResult> collectionsApiFuture = docRef.set(testDTO);

        return ResponseEntity.ok(collectionsApiFuture.get().getUpdateTime().toString());
    }

    public ResponseEntity<TestDTO> get(String documentId) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();

        System.out.println("Looking for document ID: " + documentId);
        DocumentReference docRef = db.collection("users").document(documentId);

        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot document = future.get();

        System.out.println("Document exists: " + document.exists());
        System.out.println("Document data: " + document.getData());

        if (document.exists()) {
            TestDTO testDTO = document.toObject(TestDTO.class);
            return ResponseEntity.ok(testDTO);
        }

        return ResponseEntity.notFound().build();
    }

    public ResponseEntity<String> delete(String documentId) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<WriteResult> writeResult = db.collection("users").document(documentId).delete();

        return ResponseEntity.ok("Document with ID " + documentId + " deleted at " + writeResult.get().getUpdateTime());
    }

    public ResponseEntity<String> debugConnection() throws ExecutionException, InterruptedException {
        try {
            Firestore db = FirestoreClient.getFirestore();

            // Test 1: Try to read the specific document
            DocumentSnapshot doc = db.collection("users").document("1").get().get();
            String result = "Document '1' exists: " + doc.exists() + "\n";

            if (doc.exists()) {
                result += "Document data: " + doc.getData() + "\n";
            }

            // Test 2: Try to list all documents in users collection
            QuerySnapshot allDocs = db.collection("users").get().get();
            result += "Total documents in 'users' collection: " + allDocs.size() + "\n";

            for (DocumentSnapshot document : allDocs.getDocuments()) {
                result += "Found document ID: " + document.getId() + "\n";
            }

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.ok("Error: " + e.getMessage() + "\nCause: " + e.getCause());
        }
    }
}
