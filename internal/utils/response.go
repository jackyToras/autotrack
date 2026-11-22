package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   interface{} `json:"error,omitempty"`
}

func RespondSuccess(c *gin.Context, statusCode int, message string, data interface{}) {
	c.JSON(statusCode, APIResponse{
		Success: true,
		Message: message,
		Data:    data,
	})
}

func RespondError(c *gin.Context, statusCode int, message string, err interface{}) {
	c.JSON(statusCode, APIResponse{
		Success: false,
		Message: message,
		Error:   err,
	})
}

func RespondBadRequest(c *gin.Context, message string, err error) {
	errStr := ""
	if err != nil {
		errStr = err.Error()
	}
	RespondError(c, http.StatusBadRequest, message, errStr)
}

func RespondInternalError(c *gin.Context, message string, err error) {
	errStr := ""
	if err != nil {
		errStr = err.Error()
	}
	RespondError(c, http.StatusInternalServerError, message, errStr)
}
