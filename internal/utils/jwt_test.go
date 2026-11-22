package utils

import (
	"testing"
)

func TestJWTTokenGenerationAndValidation(t *testing.T) {
	secret := "test-secret-key-12345"
	userID := uint(42)
	email := "utkarsh@example.com"

	token, err := GenerateToken(userID, email, secret)
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}
	if token == "" {
		t.Fatal("Generated token is empty")
	}

	claims, err := ValidateToken(token, secret)
	if err != nil {
		t.Fatalf("Failed to validate valid token: %v", err)
	}
	if claims.UserID != userID {
		t.Errorf("Expected userID %d, got %d", userID, claims.UserID)
	}
	if claims.Email != email {
		t.Errorf("Expected email %s, got %s", email, claims.Email)
	}

	_, err = ValidateToken(token, "wrong-secret-key")
	if err == nil {
		t.Error("Expected error when validating with wrong secret, got nil")
	}

	_, err = ValidateToken("malformed.jwt.token", secret)
	if err == nil {
		t.Error("Expected error when validating malformed token, got nil")
	}
}
