package utils

import (
	"testing"
)

func TestPasswordHashingAndVerification(t *testing.T) {
	rawPassword := "SecureCarPass2026!"

	hashed, err := HashPassword(rawPassword)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}
	if hashed == rawPassword {
		t.Fatal("Hashed password must not match raw password")
	}

	if !CheckPasswordHash(rawPassword, hashed) {
		t.Error("Expected password verification to succeed for correct password")
	}

	if CheckPasswordHash("WrongPassword!", hashed) {
		t.Error("Expected password verification to fail for incorrect password")
	}
}
