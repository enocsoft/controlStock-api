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

type ClienteHandler struct {
	usecase *usecase.ClienteUsecase
}

func NewClienteHandler(u *usecase.ClienteUsecase) *ClienteHandler {
	return &ClienteHandler{usecase: u}
}

func (h *ClienteHandler) Routes() chi.Router {
	r := chi.NewRouter()

	r.Post("/", h.Crear)
	r.Get("/", h.Listar)
	r.Get("/{id}", h.ObtenerPorID)
	r.Post("/{id}/pagos", h.RegistrarPago)
	r.Delete("/{id}", h.Eliminar)

	return r
}

type crearClienteRequest struct {
	Nombre   string `json:"nombre"`
	CUIT     string `json:"cuit"`
	Telefono string `json:"telefono"`
	Email    string `json:"email"`
}

func (h *ClienteHandler) Crear(w http.ResponseWriter, r *http.Request) {
	var req crearClienteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "body inválido: "+err.Error())
		return
	}

	c, err := h.usecase.CrearCliente(r.Context(), req.Nombre, req.CUIT, req.Telefono, req.Email)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, c)
}

func (h *ClienteHandler) ObtenerPorID(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "id inválido")
		return
	}

	c, err := h.usecase.ObtenerCliente(r.Context(), id)
	if err != nil {
		if errors.Is(err, domain.ErrClienteNoEncontrado) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}
		respondError(w, http.StatusInternalServerError, "error interno")
		return
	}

	respondJSON(w, http.StatusOK, c)
}

func (h *ClienteHandler) Listar(w http.ResponseWriter, r *http.Request) {
	clientes, err := h.usecase.ListarClientes(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error interno")
		return
	}
	respondJSON(w, http.StatusOK, clientes)
}

type registrarPagoRequest struct {
	Monto float64 `json:"monto"`
}

// RegistrarPago es un endpoint nuevo que no teníamos en productos: acá se
// ve por qué separar acciones de negocio (POST /{id}/pagos) de un CRUD
// genérico (PUT /{id}) — "registrar un pago" es una operación con
// significado propio, no "reemplazar todos los campos del cliente".
func (h *ClienteHandler) RegistrarPago(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "id inválido")
		return
	}

	var req registrarPagoRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "body inválido: "+err.Error())
		return
	}

	if err := h.usecase.RegistrarPago(r.Context(), id, req.Monto); err != nil {
		if errors.Is(err, domain.ErrClienteNoEncontrado) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}
		if errors.Is(err, domain.ErrMontoInvalido) {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}
		respondError(w, http.StatusInternalServerError, "error interno")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *ClienteHandler) Eliminar(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "id inválido")
		return
	}

	if err := h.usecase.EliminarCliente(r.Context(), id); err != nil {
		respondError(w, http.StatusInternalServerError, "error interno")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
