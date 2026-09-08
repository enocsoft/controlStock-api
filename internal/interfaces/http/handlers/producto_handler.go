package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/tu-usuario/saas-comercios/internal/domain"
	"github.com/tu-usuario/saas-comercios/internal/usecase"
)

// ProductoHandler traduce HTTP <-> llamadas al usecase. Fijate que el
// tipo del campo es *usecase.ProductoUsecase (un struct concreto, no una
// interfaz) — a esta altura de las capas ya no necesitamos la
// flexibilidad de una interfaz, porque el handler es la capa más externa:
// nadie más va a "reemplazar" al usecase por otra cosa.
type ProductoHandler struct {
	usecase *usecase.ProductoUsecase
}

func NewProductoHandler(u *usecase.ProductoUsecase) *ProductoHandler {
	return &ProductoHandler{usecase: u}
}

// Routes arma el sub-router de este módulo. chi.NewRouter() crea un
// router "hijo" que después se monta en el router principal con
// r.Mount("/productos", handler.Routes()) — así cada módulo queda
// autocontenido y router.go no se llena de rutas de todos los módulos.
func (h *ProductoHandler) Routes() chi.Router {
	r := chi.NewRouter()

	r.Post("/", h.Crear)
	r.Get("/", h.Listar)
	r.Get("/{id}", h.ObtenerPorID)
	r.Delete("/{id}", h.Eliminar)

	return r
}

// crearProductoRequest es el "DTO" (Data Transfer Object) del body JSON
// que esperamos en el POST. Lo separamos del domain.Producto a propósito:
// el request no trae ID (lo genera el servidor) ni Activo (siempre
// arranca en true) — son formas distintas del mismo concepto para
// distintos propósitos.
type crearProductoRequest struct {
	SKU         string  `json:"sku"`
	Nombre      string  `json:"nombre"`
	PrecioCosto float64 `json:"precio_costo"`
	PrecioVenta float64 `json:"precio_venta"`
}

// Los backticks después de cada campo (`json:"sku"`) son un "struct tag":
// metadata que le dice al paquete encoding/json cómo mapear el campo Go
// (SKU, en mayúscula, exportado) al nombre de la clave JSON (sku, en
// minúscula, como es convención en APIs REST).

func (h *ProductoHandler) Crear(w http.ResponseWriter, r *http.Request) {
	var req crearProductoRequest
	// json.NewDecoder(r.Body).Decode(&req) lee el body del request y lo
	// parsea directo al struct. El "&" es necesario porque Decode
	// necesita un puntero para poder escribir el resultado adentro.
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "body inválido: "+err.Error())
		return
	}

	p, err := h.usecase.CrearProducto(r.Context(), req.SKU, req.Nombre, req.PrecioCosto, req.PrecioVenta)
	if err != nil {
		// Acá no distinguimos más el tipo de error: en la creación,
		// cualquier falla (validación del domain o error de DB) es un
		// 400 razonable, porque el problema está en los datos que
		// mandó el cliente.
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, p)
}

func (h *ProductoHandler) ObtenerPorID(w http.ResponseWriter, r *http.Request) {
	// chi.URLParam extrae el {id} de la ruta "/{id}" definida en Routes().
	idParam := chi.URLParam(r, "id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		respondError(w, http.StatusBadRequest, "id inválido")
		return
	}

	p, err := h.usecase.ObtenerProducto(r.Context(), id)
	if err != nil {
		// Este es el ejemplo concreto que armamos el error centinela
		// para poder hacer: si la causa es "no encontrado", 404;
		// cualquier otra cosa, 500 (error nuestro, no del cliente).
		if errors.Is(err, domain.ErrProductoNoEncontrado) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}
		respondError(w, http.StatusInternalServerError, "error interno")
		return
	}

	respondJSON(w, http.StatusOK, p)
}

func (h *ProductoHandler) Listar(w http.ResponseWriter, r *http.Request) {
	productos, err := h.usecase.ListarProductos(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error interno")
		return
	}
	respondJSON(w, http.StatusOK, productos)
}

func (h *ProductoHandler) Eliminar(w http.ResponseWriter, r *http.Request) {
	idParam := chi.URLParam(r, "id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		respondError(w, http.StatusBadRequest, "id inválido")
		return
	}

	if err := h.usecase.EliminarProducto(r.Context(), id); err != nil {
		respondError(w, http.StatusInternalServerError, "error interno")
		return
	}

	w.WriteHeader(http.StatusNoContent) // 204: éxito, sin body de respuesta
}

// --- helpers de respuesta, compartidos por todos los métodos de arriba ---

func respondJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}
