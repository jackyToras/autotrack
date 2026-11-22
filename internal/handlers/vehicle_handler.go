package handlers

import (
	"net/http"
	"strconv"

	"autotrack/internal/database"
	"autotrack/internal/models"
	"autotrack/internal/services"
	"autotrack/internal/utils"

	"github.com/gin-gonic/gin"
)

type VehicleHandler struct {
	analyticsService *services.AnalyticsService
}

func NewVehicleHandler(analyticsService *services.AnalyticsService) *VehicleHandler {
	return &VehicleHandler{analyticsService: analyticsService}
}

func (h *VehicleHandler) CreateVehicle(c *gin.Context) {
	userID := c.MustGet("userID").(uint)

	var req models.CreateVehicleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondBadRequest(c, "Invalid vehicle payload", err)
		return
	}

	vehicle := models.Vehicle{
		UserID:          userID,
		Make:            req.Make,
		Model:           req.Model,
		Year:            req.Year,
		LicensePlate:    req.LicensePlate,
		VIN:             req.VIN,
		CurrentOdometer: req.CurrentOdometer,
	}

	if err := database.DB.Create(&vehicle).Error; err != nil {
		utils.RespondInternalError(c, "Failed to create vehicle", err)
		return
	}

	utils.RespondSuccess(c, http.StatusCreated, "Vehicle registered successfully", vehicle)
}

func (h *VehicleHandler) ListVehicles(c *gin.Context) {
	userID := c.MustGet("userID").(uint)

	var vehicles []models.Vehicle
	if err := database.DB.Where("user_id = ?", userID).Order("created_at desc").Find(&vehicles).Error; err != nil {
		utils.RespondInternalError(c, "Failed to retrieve vehicles", err)
		return
	}

	utils.RespondSuccess(c, http.StatusOK, "Vehicles retrieved successfully", vehicles)
}

func (h *VehicleHandler) GetVehicle(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	vehicleID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondBadRequest(c, "Invalid vehicle ID format", err)
		return
	}

	var vehicle models.Vehicle
	if err := database.DB.Preload("ServiceLogs").Where("id = ? AND user_id = ?", vehicleID, userID).First(&vehicle).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vehicle not found", "No vehicle matching this ID was found for your account")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, "Vehicle details retrieved successfully", vehicle)
}

func (h *VehicleHandler) UpdateVehicle(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	vehicleID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondBadRequest(c, "Invalid vehicle ID format", err)
		return
	}

	var vehicle models.Vehicle
	if err := database.DB.Where("id = ? AND user_id = ?", vehicleID, userID).First(&vehicle).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vehicle not found", nil)
		return
	}

	var req models.UpdateVehicleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondBadRequest(c, "Invalid update payload", err)
		return
	}

	if req.Make != "" {
		vehicle.Make = req.Make
	}
	if req.Model != "" {
		vehicle.Model = req.Model
	}
	if req.Year > 0 {
		vehicle.Year = req.Year
	}
	if req.LicensePlate != "" {
		vehicle.LicensePlate = req.LicensePlate
	}
	if req.VIN != "" {
		vehicle.VIN = req.VIN
	}
	if req.CurrentOdometer > 0 {
		vehicle.CurrentOdometer = req.CurrentOdometer
	}

	if err := database.DB.Save(&vehicle).Error; err != nil {
		utils.RespondInternalError(c, "Failed to update vehicle", err)
		return
	}

	h.analyticsService.AsyncRecompute(uint(vehicleID))

	utils.RespondSuccess(c, http.StatusOK, "Vehicle updated successfully", vehicle)
}

func (h *VehicleHandler) DeleteVehicle(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	vehicleID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondBadRequest(c, "Invalid vehicle ID format", err)
		return
	}

	res := database.DB.Where("id = ? AND user_id = ?", vehicleID, userID).Delete(&models.Vehicle{})
	if res.Error != nil {
		utils.RespondInternalError(c, "Failed to delete vehicle", res.Error)
		return
	}
	if res.RowsAffected == 0 {
		utils.RespondError(c, http.StatusNotFound, "Vehicle not found", nil)
		return
	}

	h.analyticsService.InvalidateCache(c.Request.Context(), uint(vehicleID))

	utils.RespondSuccess(c, http.StatusOK, "Vehicle deleted successfully", nil)
}
