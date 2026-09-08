package config

import (
	"fmt"
	"os"
)

// Config agrupa toda la configuración de la aplicación cargada desde
// variables de entorno.
type Config struct {
	Port      string
	DBHost    string
	DBPort    string
	DBUser    string
	DBPass    string
	DBName    string
	JWTSecret string
}

// Load lee las variables de entorno y arma el Config. Usa valores por
// defecto razonables para desarrollo local.
func Load() Config {
	return Config{
		Port:      getEnv("PORT", "8080"),
		DBHost:    getEnv("DB_HOST", "localhost"),
		DBPort:    getEnv("DB_PORT", "5432"),
		DBUser:    getEnv("DB_USER", "comercios"),
		DBPass:    getEnv("DB_PASSWORD", "comercios"),
		DBName:    getEnv("DB_NAME", "comercios"),
		JWTSecret: getEnv("JWT_SECRET", "cambiar-en-produccion"),
	}
}

// DSN arma el connection string de Postgres para pgx.
func (c Config) DSN() string {
	return fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=disable",
		c.DBUser, c.DBPass, c.DBHost, c.DBPort, c.DBName,
	)
}

func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}
