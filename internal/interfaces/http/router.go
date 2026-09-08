package http

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"

	"github.com/tu-usuario/saas-comercios/internal/interfaces/http/handlers"
	authmw "github.com/tu-usuario/saas-comercios/internal/interfaces/http/middleware"
)

type Handlers struct {
	Auth      *handlers.AuthHandler
	Producto  *handlers.ProductoHandler
	Cliente   *handlers.ClienteHandler
	Proveedor *handlers.ProveedorHandler
	Venta     *handlers.VentaHandler
	Caja      *handlers.CajaHandler
}

func NewRouter(h Handlers, jwtSecret string) http.Handler {
	r := chi.NewRouter()

	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	r.Mount("/auth", h.Auth.Routes())

	r.Route("/api/v1", func(r chi.Router) {
		r.Use(authmw.Auth(jwtSecret))

		r.Mount("/productos", h.Producto.Routes())
		r.Mount("/clientes", h.Cliente.Routes())
		r.Mount("/proveedores", h.Proveedor.Routes())
		r.Mount("/ventas", h.Venta.Routes())
		r.Mount("/caja", h.Caja.Routes())
	})

	return r
}
