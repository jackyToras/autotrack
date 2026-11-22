package models

import (
	"time"
)

type User struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Name         string    `gorm:"size:100;not null" json:"name"`
	Email        string    `gorm:"size:150;uniqueIndex;not null" json:"email"`
	PasswordHash string    `gorm:"size:255;not null" json:"-"`
	Vehicles     []Vehicle `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"vehicles,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Vehicle struct {
	ID              uint         `gorm:"primaryKey" json:"id"`
	UserID          uint         `gorm:"index;not null" json:"user_id"`
	Make            string       `gorm:"size:60;not null" json:"make"`
	Model           string       `gorm:"size:60;not null" json:"model"`
	Year            int          `gorm:"not null" json:"year"`
	LicensePlate    string       `gorm:"size:30;index" json:"license_plate"`
	VIN             string       `gorm:"size:50" json:"vin,omitempty"`
	CurrentOdometer int          `gorm:"default:0" json:"current_odometer"`
	ServiceLogs     []ServiceLog `gorm:"foreignKey:VehicleID;constraint:OnDelete:CASCADE" json:"service_logs,omitempty"`
	CreatedAt       time.Time    `json:"created_at"`
	UpdatedAt       time.Time    `json:"updated_at"`
}

type ServiceLog struct {
	ID                uint      `gorm:"primaryKey" json:"id"`
	VehicleID         uint      `gorm:"index;not null" json:"vehicle_id"`
	ServiceType       string    `gorm:"size:100;not null" json:"service_type"`
	Description       string    `gorm:"type:text" json:"description"`
	Cost              float64   `gorm:"type:decimal(10,2);default:0" json:"cost"`
	OdometerAtService int       `gorm:"not null" json:"odometer_at_service"`
	ServiceDate       time.Time `gorm:"not null" json:"service_date"`
	PerformedBy       string    `gorm:"size:120" json:"performed_by"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

type ServiceAlert struct {
	ID          uint       `gorm:"primaryKey" json:"id"`
	VehicleID   uint       `gorm:"index;not null" json:"vehicle_id"`
	Title       string     `gorm:"size:120;not null" json:"title"`
	Description string     `gorm:"size:255" json:"description"`
	DueMileage  int        `json:"due_mileage"`
	DueDate     *time.Time `json:"due_date,omitempty"`
	IsCompleted bool       `gorm:"default:false" json:"is_completed"`
	CreatedAt   time.Time  `json:"created_at"`
}

type RegisterRequest struct {
	Name     string `json:"name" binding:"required,min=2,max=100"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type CreateVehicleRequest struct {
	Make            string `json:"make" binding:"required"`
	Model           string `json:"model" binding:"required"`
	Year            int    `json:"year" binding:"required,min=1970,max=2030"`
	LicensePlate    string `json:"license_plate" binding:"required"`
	VIN             string `json:"vin"`
	CurrentOdometer int    `json:"current_odometer" binding:"gte=0"`
}

type UpdateVehicleRequest struct {
	Make            string `json:"make"`
	Model           string `json:"model"`
	Year            int    `json:"year" binding:"omitempty,min=1970,max=2030"`
	LicensePlate    string `json:"license_plate"`
	VIN             string `json:"vin"`
	CurrentOdometer int    `json:"current_odometer" binding:"omitempty,gte=0"`
}

type CreateServiceLogRequest struct {
	ServiceType       string    `json:"service_type" binding:"required"`
	Description       string    `json:"description"`
	Cost              float64   `json:"cost" binding:"gte=0"`
	OdometerAtService int       `json:"odometer_at_service" binding:"required,gte=0"`
	ServiceDate       time.Time `json:"service_date" binding:"required"`
	PerformedBy       string    `json:"performed_by"`
}

type VehicleAnalyticsSummary struct {
	VehicleID              uint           `json:"vehicle_id"`
	TotalServiceCount      int            `json:"total_service_count"`
	TotalCostSpent         float64        `json:"total_cost_spent"`
	AverageCostPerService  float64        `json:"average_cost_per_service"`
	LastServiceDate        *time.Time     `json:"last_service_date"`
	LastServiceOdometer    int            `json:"last_service_odometer"`
	EstimatedDailyMileage  float64        `json:"estimated_daily_mileage"`
	NextServiceDueMileage  int            `json:"next_service_due_mileage"`
	NextServiceDueEstimate *time.Time     `json:"next_service_due_estimate"`
	Alerts                 []ServiceAlert `json:"alerts"`
	CachedAt               time.Time      `json:"cached_at"`
}
