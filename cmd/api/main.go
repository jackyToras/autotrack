package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"autotrack/internal/cache"
	"autotrack/internal/config"
	"autotrack/internal/database"
	"autotrack/internal/handlers"
	"autotrack/internal/middleware"
	"autotrack/internal/services"
	"autotrack/internal/utils"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.LoadConfig()

	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	db, err := database.InitDB(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Fatal: Database initialization failed: %v", err)
	}
	_ = db

	cache.InitRedis(cfg.RedisURL)

	analyticsService := services.NewAnalyticsService()

	authHandler := handlers.NewAuthHandler(cfg.JWTSecret)
	vehicleHandler := handlers.NewVehicleHandler(analyticsService)
	serviceLogHandler := handlers.NewServiceLogHandler(analyticsService)
	analyticsHandler := handlers.NewAnalyticsHandler(analyticsService)

	router := gin.Default()
	router.Use(middleware.CORSMiddleware(cfg.AllowOrigins))

	router.GET("/health", func(c *gin.Context) {
		utils.RespondSuccess(c, http.StatusOK, "AutoTrack API is healthy", gin.H{
			"status":      "online",
			"environment": cfg.Environment,
			"timestamp":   time.Now().UTC(),
		})
	})

	v1 := router.Group("/api/v1")
	{
		auth := v1.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
		}

		protected := v1.Group("")
		protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))
		{
			protected.GET("/auth/profile", authHandler.GetProfile)

			vehicles := protected.Group("/vehicles")
			{
				vehicles.POST("", vehicleHandler.CreateVehicle)
				vehicles.GET("", vehicleHandler.ListVehicles)
				vehicles.GET("/:id", vehicleHandler.GetVehicle)
				vehicles.PUT("/:id", vehicleHandler.UpdateVehicle)
				vehicles.DELETE("/:id", vehicleHandler.DeleteVehicle)

				vehicles.POST("/:id/services", serviceLogHandler.CreateServiceLog)
				vehicles.GET("/:id/services", serviceLogHandler.ListServiceLogs)
				vehicles.DELETE("/:id/services/:logId", serviceLogHandler.DeleteServiceLog)

				vehicles.GET("/:id/analytics", analyticsHandler.GetVehicleAnalytics)
			}
		}
	}

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	go func() {
		log.Printf("AutoTrack API server listening on port %s (%s mode)", cfg.Port, cfg.Environment)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %s\n", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down AutoTrack API gracefully...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("AutoTrack API exited successfully.")
}
