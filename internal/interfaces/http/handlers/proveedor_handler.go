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

type ProveedorHandler struct {
	usecase *usecase.ProveedorUsecase
}

func NewProveedorHandler(u *usecase.ProveedorUsecase) *ProveedorHandler {
	return &ProveedorHandler{usecase: u}
}

func (h *ProveedorHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Post("/", h.Crear)
	r.Get("/", h.Listar)
	r.Get("/{id}", h.ObtenerPorID)
	r.Delete("/{id}", h.Eliminar)
	return r
}

type crearProveedorRequest struct {
	Nombre   string `json:"nombre"`
	CUIT     string `json:"cuit"`
	Telefono string `json:"telefono"`
	Email    string `json:"email"`
}

func (h *ProveedorHandler) Crear(w http.ResponseWriter, r *http.Request) {
	var req crearProveedorRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "body inválido: "+err.Error())
		return
	}

	p, err := h.usecase.CrearProveedor(r.Context(), req.Nombre, req.CUIT, req.Telefono, req.Email)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, p)
}

func (h *ProveedorHandler) ObtenerPorID(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "id inválido")
		return
	}

	p, err := h.usecase.ObtenerProveedor(r.Context(), id)
	if err != nil {
		if errors.Is(err, domain.ErrProveedorNoEncontrado) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}
		respondError(w, http.StatusInternalServerError, "error interno")
		return
	}

	respondJSON(w, http.StatusOK, p)
}

func (h *ProveedorHandler) Listar(w http.ResponseWriter, r *http.Request) {
	proveedores, err := h.usecase.ListarProveedores(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error interno")
		return
	}
	respondJSON(w, http.StatusOK, proveedores)
}

func (h *ProveedorHandler) Eliminar(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "id inválido")
		return
	}

	if err := h.usecase.EliminarProveedor(r.Context(), id); err != nil {
		respondError(w, http.StatusInternalServerError, "error interno")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
