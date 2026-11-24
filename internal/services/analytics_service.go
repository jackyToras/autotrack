package services

import (
	"context"
	"fmt"
	"math"
	"time"

	"autotrack/internal/cache"
	"autotrack/internal/database"
	"autotrack/internal/models"
)

type AnalyticsService struct{}

func NewAnalyticsService() *AnalyticsService {
	return &AnalyticsService{}
}

func (s *AnalyticsService) GetVehicleAnalytics(ctx context.Context, vehicleID uint) (*models.VehicleAnalyticsSummary, error) {
	cacheKey := fmt.Sprintf("vehicle:analytics:%d", vehicleID)

	var cachedSummary models.VehicleAnalyticsSummary
	if hit, err := cache.Cache.GetJSON(ctx, cacheKey, &cachedSummary); err == nil && hit {
		return &cachedSummary, nil
	}

	summary, err := s.ComputeVehicleAnalytics(vehicleID)
	if err != nil {
		return nil, err
	}

	_ = cache.Cache.SetJSON(ctx, cacheKey, summary, 15*time.Minute)

	return summary, nil
}

func (s *AnalyticsService) ComputeVehicleAnalytics(vehicleID uint) (*models.VehicleAnalyticsSummary, error) {
	var vehicle models.Vehicle
	if err := database.DB.Preload("ServiceLogs").First(&vehicle, vehicleID).Error; err != nil {
		return nil, err
	}

	logs := vehicle.ServiceLogs
	totalCount := len(logs)
	var totalCost float64 = 0

	summary := &models.VehicleAnalyticsSummary{
		VehicleID:             vehicleID,
		TotalServiceCount:     totalCount,
		TotalCostSpent:        0,
		AverageCostPerService: 0,
		CachedAt:              time.Now(),
	}

	if totalCount == 0 {
		summary.LastServiceOdometer = vehicle.CurrentOdometer
		summary.NextServiceDueMileage = vehicle.CurrentOdometer + 5000
		estDate := time.Now().AddDate(0, 6, 0)
		summary.NextServiceDueEstimate = &estDate
		summary.EstimatedDailyMileage = 30.0
		return summary, nil
	}

	var latestLog models.ServiceLog = logs[0]
	var oldestLog models.ServiceLog = logs[0]

	for _, l := range logs {
		totalCost += l.Cost
		if l.ServiceDate.After(latestLog.ServiceDate) {
			latestLog = l
		}
		if l.ServiceDate.Before(oldestLog.ServiceDate) {
			oldestLog = l
		}
	}

	summary.TotalCostSpent = math.Round(totalCost*100) / 100
	summary.AverageCostPerService = math.Round((totalCost/float64(totalCount))*100) / 100
	summary.LastServiceDate = &latestLog.ServiceDate
	summary.LastServiceOdometer = latestLog.OdometerAtService

	daysDiff := latestLog.ServiceDate.Sub(oldestLog.ServiceDate).Hours() / 24
	kmDiff := float64(latestLog.OdometerAtService - oldestLog.OdometerAtService)

	dailyMileage := 35.0
	if daysDiff >= 7 && kmDiff > 0 {
		dailyMileage = kmDiff / daysDiff
	}
	summary.EstimatedDailyMileage = math.Round(dailyMileage*10) / 10

	interval := 5000
	summary.NextServiceDueMileage = latestLog.OdometerAtService + interval

	remainingKm := float64(summary.NextServiceDueMileage - vehicle.CurrentOdometer)
	if remainingKm < 0 {
		remainingKm = 0
	}

	daysUntilNext := remainingKm / dailyMileage
	if daysUntilNext > 365 {
		daysUntilNext = 180
	}
	dueDate := time.Now().Add(time.Duration(daysUntilNext*24) * time.Hour)
	summary.NextServiceDueEstimate = &dueDate

	database.DB.Model(&models.ServiceAlert{}).
		Where("vehicle_id = ? AND is_completed = false AND due_mileage < ?", vehicleID, summary.NextServiceDueMileage).
		Update("is_completed", true)

	var alerts []models.ServiceAlert
	database.DB.Where("vehicle_id = ? AND is_completed = false", vehicleID).Find(&alerts)

	if vehicle.CurrentOdometer >= (summary.NextServiceDueMileage - 500) {
		alertTitle := "Routine Scheduled Service Due"
		hasAlert := false
		for _, a := range alerts {
			if a.Title == alertTitle {
				hasAlert = true
				break
			}
		}

		if !hasAlert {
			newAlert := models.ServiceAlert{
				VehicleID:   vehicleID,
				Title:       alertTitle,
				Description: fmt.Sprintf("Vehicle reached %d km. Service recommended at %d km.", vehicle.CurrentOdometer, summary.NextServiceDueMileage),
				DueMileage:  summary.NextServiceDueMileage,
				DueDate:     &dueDate,
				IsCompleted: false,
			}
			database.DB.Create(&newAlert)
			alerts = append(alerts, newAlert)
		}
	}

	summary.Alerts = alerts
	return summary, nil
}

func (s *AnalyticsService) InvalidateCache(ctx context.Context, vehicleID uint) {
	cacheKey := fmt.Sprintf("vehicle:analytics:%d", vehicleID)
	_ = cache.Cache.Delete(ctx, cacheKey)
}

func (s *AnalyticsService) AsyncRecompute(vehicleID uint) {
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		s.InvalidateCache(ctx, vehicleID)
		_, _ = s.GetVehicleAnalytics(ctx, vehicleID)
	}()
}
