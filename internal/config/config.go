package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port         string
	DatabaseURL  string
	RedisURL     string
	JWTSecret    string
	Environment  string
	AllowOrigins string
}

func LoadConfig() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	return &Config{
		Port:         getEnv("PORT", "8080"),
		DatabaseURL:  getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/autotrack?sslmode=disable"),
		RedisURL:     getEnv("REDIS_URL", "localhost:6379"),
		JWTSecret:    getEnv("JWT_SECRET", "super-secret-jwt-key-autotrack-2026"),
		Environment:  getEnv("ENV", "development"),
		AllowOrigins: getEnv("ALLOW_ORIGINS", "*"),
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
