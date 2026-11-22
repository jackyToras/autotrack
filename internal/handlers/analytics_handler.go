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

type AnalyticsHandler struct {
	analyticsService *services.AnalyticsService
}

func NewAnalyticsHandler(analyticsService *services.AnalyticsService) *AnalyticsHandler {
	return &AnalyticsHandler{analyticsService: analyticsService}
}

func (h *AnalyticsHandler) GetVehicleAnalytics(c *gin.Context) {
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

	summary, err := h.analyticsService.GetVehicleAnalytics(c.Request.Context(), uint(vehicleID))
	if err != nil {
		utils.RespondInternalError(c, "Failed to compute vehicle analytics", err)
		return
	}

	utils.RespondSuccess(c, http.StatusOK, "Vehicle analytics retrieved successfully", summary)
}
