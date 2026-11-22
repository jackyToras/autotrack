package handlers

import (
	"net/http"

	"autotrack/internal/database"
	"autotrack/internal/models"
	"autotrack/internal/utils"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	jwtSecret string
}

func NewAuthHandler(jwtSecret string) *AuthHandler {
	return &AuthHandler{jwtSecret: jwtSecret}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondBadRequest(c, "Invalid input data", err)
		return
	}

	var existing models.User
	if err := database.DB.Where("email = ?", req.Email).First(&existing).Error; err == nil {
		utils.RespondError(c, http.StatusConflict, "Email already registered", "A user with this email address already exists")
		return
	}

	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		utils.RespondInternalError(c, "Failed to hash password", err)
		return
	}

	user := models.User{
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: hashedPassword,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		utils.RespondInternalError(c, "Failed to create user", err)
		return
	}

	token, err := utils.GenerateToken(user.ID, user.Email, h.jwtSecret)
	if err != nil {
		utils.RespondInternalError(c, "Failed to generate authentication token", err)
		return
	}

	utils.RespondSuccess(c, http.StatusCreated, "User registered successfully", models.AuthResponse{
		Token: token,
		User:  user,
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondBadRequest(c, "Invalid login credentials", err)
		return
	}

	var user models.User
	if err := database.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "Invalid credentials", "No account found with this email")
		return
	}

	if !utils.CheckPasswordHash(req.Password, user.PasswordHash) {
		utils.RespondError(c, http.StatusUnauthorized, "Invalid credentials", "Incorrect password")
		return
	}

	token, err := utils.GenerateToken(user.ID, user.Email, h.jwtSecret)
	if err != nil {
		utils.RespondInternalError(c, "Failed to generate authentication token", err)
		return
	}

	utils.RespondSuccess(c, http.StatusOK, "Login successful", models.AuthResponse{
		Token: token,
		User:  user,
	})
}

func (h *AuthHandler) GetProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		utils.RespondError(c, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	var user models.User
	if err := database.DB.Preload("Vehicles").First(&user, userID).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "User not found", err.Error())
		return
	}

	utils.RespondSuccess(c, http.StatusOK, "Profile retrieved successfully", user)
}
