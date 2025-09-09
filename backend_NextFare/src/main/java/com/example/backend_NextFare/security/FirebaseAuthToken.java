package com.example.backend_NextFare.security;

import com.google.firebase.auth.FirebaseToken;
import lombok.Getter;
import org.springframework.security.authentication.AbstractAuthenticationToken;

import java.util.Collections;

@Getter
public class FirebaseAuthToken extends AbstractAuthenticationToken {
    private final String uid;
    private final String email;
    private final FirebaseToken firebaseToken;

    public FirebaseAuthToken(String uid, String email, FirebaseToken firebaseToken) {
        super(Collections.emptyList());
        this.uid = uid;
        this.email = email;
        this.firebaseToken = firebaseToken;
        setAuthenticated(true);
    }

    @Override
    public Object getCredentials() {
        return firebaseToken;
    }

    @Override
    public Object getPrincipal() {
        return uid;
    }

}