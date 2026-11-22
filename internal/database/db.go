package database

import (
	"log"
	"time"

	"autotrack/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB(databaseURL string) (*gorm.DB, error) {
	log.Println("Connecting to PostgreSQL database...")

	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, err
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(50)
	sqlDB.SetConnMaxLifetime(time.Hour)

	log.Println("Running database auto-migrations...")
	err = db.AutoMigrate(
		&models.User{},
		&models.Vehicle{},
		&models.ServiceLog{},
		&models.ServiceAlert{},
	)
	if err != nil {
		return nil, err
	}

	DB = db
	log.Println("PostgreSQL database initialized and migrated successfully.")
	return DB, nil
}
