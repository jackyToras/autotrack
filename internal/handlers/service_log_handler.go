package handlers

import (
	"net/http"
	"strconv"

	"autotrack/internal/database"
	"autotrack/internal/models"
	"autotrack/internal/services"
	"autotrack/internal/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ServiceLogHandler struct {
	analyticsService *services.AnalyticsService
}

func NewServiceLogHandler(analyticsService *services.AnalyticsService) *ServiceLogHandler {
	return &ServiceLogHandler{analyticsService: analyticsService}
}

func (h *ServiceLogHandler) CreateServiceLog(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	vehicleID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondBadRequest(c, "Invalid vehicle ID", err)
		return
	}

	var req models.CreateServiceLogRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondBadRequest(c, "Invalid service log payload", err)
		return
	}

	var vehicle models.Vehicle
	if err := database.DB.Where("id = ? AND user_id = ?", vehicleID, userID).First(&vehicle).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vehicle not found", nil)
		return
	}

	var serviceLog models.ServiceLog

	err = database.DB.Transaction(func(tx *gorm.DB) error {
		serviceLog = models.ServiceLog{
			VehicleID:         uint(vehicleID),
			ServiceType:       req.ServiceType,
			Description:       req.Description,
			Cost:              req.Cost,
			OdometerAtService: req.OdometerAtService,
			ServiceDate:       req.ServiceDate,
			PerformedBy:       req.PerformedBy,
		}

		if err := tx.Create(&serviceLog).Error; err != nil {
			return err
		}

		if req.OdometerAtService > vehicle.CurrentOdometer {
			vehicle.CurrentOdometer = req.OdometerAtService
			if err := tx.Save(&vehicle).Error; err != nil {
				return err
			}
		}

		if err := tx.Model(&models.ServiceAlert{}).
			Where("vehicle_id = ? AND is_completed = false AND due_mileage <= ?", vehicleID, req.OdometerAtService).
			Update("is_completed", true).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		utils.RespondInternalError(c, "Failed to record service log", err)
		return
	}

	h.analyticsService.AsyncRecompute(uint(vehicleID))

	utils.RespondSuccess(c, http.StatusCreated, "Service log recorded successfully", serviceLog)
}

func (h *ServiceLogHandler) ListServiceLogs(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	vehicleID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondBadRequest(c, "Invalid vehicle ID", err)
		return
	}

	var vehicle models.Vehicle
	if err := database.DB.Where("id = ? AND user_id = ?", vehicleID, userID).First(&vehicle).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vehicle not found", nil)
		return
	}

	var logs []models.ServiceLog
	if err := database.DB.Where("vehicle_id = ?", vehicleID).Order("service_date desc").Find(&logs).Error; err != nil {
		utils.RespondInternalError(c, "Failed to retrieve service logs", err)
		return
	}

	utils.RespondSuccess(c, http.StatusOK, "Service logs retrieved successfully", logs)
}

func (h *ServiceLogHandler) DeleteServiceLog(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	vehicleID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondBadRequest(c, "Invalid vehicle ID", err)
		return
	}
	logID, err := strconv.ParseUint(c.Param("logId"), 10, 32)
	if err != nil {
		utils.RespondBadRequest(c, "Invalid service log ID", err)
		return
	}

	var vehicle models.Vehicle
	if err := database.DB.Where("id = ? AND user_id = ?", vehicleID, userID).First(&vehicle).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vehicle not found", nil)
		return
	}

	res := database.DB.Where("id = ? AND vehicle_id = ?", logID, vehicleID).Delete(&models.ServiceLog{})
	if res.Error != nil {
		utils.RespondInternalError(c, "Failed to delete service log", res.Error)
		return
	}
	if res.RowsAffected == 0 {
		utils.RespondError(c, http.StatusNotFound, "Service log not found", nil)
		return
	}

	h.analyticsService.AsyncRecompute(uint(vehicleID))

	utils.RespondSuccess(c, http.StatusOK, "Service log deleted successfully", nil)
}
