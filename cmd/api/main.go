package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/tu-usuario/saas-comercios/internal/config"
	"github.com/tu-usuario/saas-comercios/internal/interfaces/repository/postgres"

	httpif "github.com/tu-usuario/saas-comercios/internal/interfaces/http"
	"github.com/tu-usuario/saas-comercios/internal/interfaces/http/handlers"
	"github.com/tu-usuario/saas-comercios/internal/usecase"
)

func main() {
	cfg := config.Load()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	db, err := pgxpool.New(ctx, cfg.DSN())
	if err != nil {
		log.Fatalf("no se pudo conectar a la base de datos: %v", err)
	}
	defer db.Close()

	if err := db.Ping(ctx); err != nil {
		log.Fatalf("ping a la base de datos falló: %v", err)
	}
	log.Println("conexión a la base de datos OK")

	// --- Wiring del módulo de productos ---
	// Este es el ÚNICO lugar de todo el proyecto donde las 4 capas se
	// tocan entre sí. Cada constructor recibe exactamente lo que
	// definimos en su firma, y "db" solo viaja hasta acá — ni el
	// usecase ni el handler lo vuelven a ver.
	productoRepo := postgres.NewProductoRepo(db)
	productoUsecase := usecase.NewProductoUsecase(productoRepo)
	productoHandler := handlers.NewProductoHandler(productoUsecase)

	clienteRepo := postgres.NewClienteRepo(db)
	clienteUsecase := usecase.NewClienteUsecase(clienteRepo)
	clienteHandler := handlers.NewClienteHandler(clienteUsecase)

	provedorRepo := postgres.NewProveedorRepo(db)
	proveedorUsecase := usecase.NewProveedorUsecase(provedorRepo)
	proveedorHandler := handlers.NewProveedorHandler(proveedorUsecase)

	ventaRepo := postgres.NewVentaRepo(db)
	ventaUsecase := usecase.NewVentaUsecase(ventaRepo, productoRepo) // usa dos repos
	ventaHandler := handlers.NewVentaHandler(ventaUsecase)

	cajaRepo := postgres.NewCajaRepo(db)
	cajaUsecase := usecase.NewCajaUsecase(cajaRepo)
	cajaHandler := handlers.NewCajaHandler(cajaUsecase)

	usuarioRepo := postgres.NewUsuarioRepo(db)
	authUsecase := usecase.NewAuthUsecase(usuarioRepo, cfg.JWTSecret)
	authHandler := handlers.NewAuthHandler(authUsecase)

	router := httpif.NewRouter(httpif.Handlers{
		Auth:      authHandler,
		Producto:  productoHandler,
		Cliente:   clienteHandler,
		Proveedor: proveedorHandler,
		Venta:     ventaHandler,
		Caja:      cajaHandler,
	}, cfg.JWTSecret)

	log.Printf("servidor escuchando en :%s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, router); err != nil {
		log.Fatalf("error en el servidor: %v", err)
	}
}
