package utils

import (
	"math"
	"strconv"
	"testing"
	"time"
)

type MockServiceLog struct {
	OdometerAtService int
	ServiceDate       time.Time
	Cost              float64
}

func BenchmarkGenerateJWT(b *testing.B) {
	secret := "production-grade-benchmark-jwt-secret-key"
	userID := uint(101)
	email := "operator@autotrack.io"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = GenerateToken(userID, email, secret)
	}
}

func BenchmarkValidateJWT(b *testing.B) {
	secret := "production-grade-benchmark-jwt-secret-key"
	userID := uint(101)
	email := "operator@autotrack.io"
	token, _ := GenerateToken(userID, email, secret)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = ValidateToken(token, secret)
	}
}

func BenchmarkPasswordHashVerification(b *testing.B) {
	rawPassword := "SecurePass123!"
	hashed, _ := HashPassword(rawPassword)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = CheckPasswordHash(rawPassword, hashed)
	}
}

func runPredictiveAlgorithm(currentOdo int, logs []MockServiceLog) (int, float64, time.Time, bool) {
	totalCount := len(logs)
	if totalCount == 0 {
		return currentOdo + 5000, 30.0, time.Now().AddDate(0, 6, 0), false
	}

	latestLog := logs[0]
	oldestLog := logs[0]
	var totalCost float64

	for _, l := range logs {
		totalCost += l.Cost
		if l.ServiceDate.After(latestLog.ServiceDate) {
			latestLog = l
		}
		if l.ServiceDate.Before(oldestLog.ServiceDate) {
			oldestLog = l
		}
	}

	daysDiff := latestLog.ServiceDate.Sub(oldestLog.ServiceDate).Hours() / 24
	kmDiff := float64(latestLog.OdometerAtService - oldestLog.OdometerAtService)

	dailyMileage := 35.0
	if daysDiff >= 7 && kmDiff > 0 {
		dailyMileage = kmDiff / daysDiff
	}
	dailyMileage = math.Round(dailyMileage*10) / 10

	nextServiceDue := latestLog.OdometerAtService + 5000
	remainingKm := float64(nextServiceDue - currentOdo)
	if remainingKm < 0 {
		remainingKm = 0
	}

	daysUntilNext := remainingKm / dailyMileage
	if daysUntilNext > 365 {
		daysUntilNext = 180
	}

	baseDate := latestLog.ServiceDate
	drivenSince := float64(currentOdo - latestLog.OdometerAtService)
	if drivenSince > 0 {
		daysDriven := drivenSince / dailyMileage
		baseDate = baseDate.Add(time.Duration(daysDriven*24) * time.Hour)
	}

	dueDate := baseDate.Add(time.Duration(daysUntilNext*24) * time.Hour)
	alertTriggered := currentOdo >= (nextServiceDue - 500)

	return nextServiceDue, dailyMileage, dueDate, alertTriggered
}

func BenchmarkPredictiveAlgorithmSmall(b *testing.B) {
	baseTime := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	logs := []MockServiceLog{
		{OdometerAtService: 30000, ServiceDate: baseTime, Cost: 2500},
		{OdometerAtService: 35000, ServiceDate: baseTime.AddDate(0, 1, 15), Cost: 1800},
		{OdometerAtService: 40000, ServiceDate: baseTime.AddDate(0, 3, 0), Cost: 3200},
		{OdometerAtService: 45000, ServiceDate: baseTime.AddDate(0, 4, 20), Cost: 2100},
	}
	currentOdo := 48500

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _, _, _ = runPredictiveAlgorithm(currentOdo, logs)
	}
}

func BenchmarkPredictiveAlgorithmLarge(b *testing.B) {
	baseTime := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	logs := make([]MockServiceLog, 500)
	for i := 0; i < 500; i++ {
		logs[i] = MockServiceLog{
			OdometerAtService: 10000 + i*1000,
			ServiceDate:       baseTime.Add(time.Duration(i*7*24) * time.Hour),
			Cost:              float64(1500 + (i%5)*200),
		}
	}
	currentOdo := 509600

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _, _, _ = runPredictiveAlgorithm(currentOdo, logs)
	}
}

func BenchmarkServiceCostEfficiencyAggregation(b *testing.B) {
	costs := make([]float64, 100)
	for i := 0; i < 100; i++ {
		costs[i] = 1500.50 + float64(i*25)
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		var sum float64
		for _, c := range costs {
			sum += c
		}
		_ = sum / float64(len(costs))
	}
}

func TestEvalsAccuracy(t *testing.T) {
	baseTime := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	logs := []MockServiceLog{
		{OdometerAtService: 30000, ServiceDate: baseTime, Cost: 2500},
		{OdometerAtService: 45000, ServiceDate: baseTime.AddDate(0, 3, 0), Cost: 3000},
	}

	due, velocity, _, alert := runPredictiveAlgorithm(49600, logs)
	if due != 50000 {
		t.Errorf("Expected due 50000, got %d", due)
	}
	if velocity <= 0 {
		t.Errorf("Expected positive velocity, got %f", velocity)
	}
	if !alert {
		t.Errorf("Expected threshold alert at 49600 for 50000 milestone, got false")
	}

	_ = strconv.Itoa(due)
}
