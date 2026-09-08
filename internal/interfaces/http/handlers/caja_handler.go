package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/tu-usuario/saas-comercios/internal/domain"
	authmw "github.com/tu-usuario/saas-comercios/internal/interfaces/http/middleware"
	"github.com/tu-usuario/saas-comercios/internal/usecase"
)

type CajaHandler struct {
	usecase *usecase.CajaUsecase
}

func NewCajaHandler(u *usecase.CajaUsecase) *CajaHandler {
	return &CajaHandler{usecase: u}
}

func (h *CajaHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Post("/apertura", h.Abrir)
	r.Post("/{id}/movimientos", h.RegistrarMovimiento)
	r.Post("/{id}/cierre", h.Cerrar)
	r.Get("/", h.Listar)
	r.Get("/{id}", h.ObtenerPorID)
	return r
}

type abrirCajaRequest struct {
	UsuarioID    string  `json:"usuario_id"`
	SaldoInicial float64 `json:"saldo_inicial"`
}

func (h *CajaHandler) Abrir(w http.ResponseWriter, r *http.Request) {
	usuarioID, ok := authmw.UsuarioIDDesdeContexto(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "no autenticado")
		return
	}
	var req abrirCajaRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "body inválido: "+err.Error())
		return
	}

	c, err := h.usecase.AbrirCaja(r.Context(), usuarioID, req.SaldoInicial)
	if err != nil {
		if errors.Is(err, domain.ErrCajaYaAbierta) {
			respondError(w, http.StatusConflict, err.Error())
			return
		}
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, c)
}

type movimientoRequest struct {
	Tipo        string  `json:"tipo"`
	Monto       float64 `json:"monto"`
	Descripcion string  `json:"descripcion"`
}

func (h *CajaHandler) RegistrarMovimiento(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "id inválido")
		return
	}

	var req movimientoRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "body inválido: "+err.Error())
		return
	}

	err = h.usecase.RegistrarMovimiento(r.Context(), id, req.Tipo, req.Monto, req.Descripcion)
	if err != nil {
		if errors.Is(err, domain.ErrCajaYaCerrada) || errors.Is(err, domain.ErrTipoMovimientoInvalido) || errors.Is(err, domain.ErrMontoInvalido) {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}
		if errors.Is(err, domain.ErrCajaNoEncontrada) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}
		respondError(w, http.StatusInternalServerError, "error interno")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *CajaHandler) Cerrar(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "id inválido")
		return
	}

	c, err := h.usecase.Cerrar(r.Context(), id)
	if err != nil {
		if errors.Is(err, domain.ErrCajaYaCerrada) {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}
		if errors.Is(err, domain.ErrCajaNoEncontrada) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}
		respondError(w, http.StatusInternalServerError, "error interno")
		return
	}

	respondJSON(w, http.StatusOK, c)
}

func (h *CajaHandler) ObtenerPorID(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "id inválido")
		return
	}

	c, err := h.usecase.ObtenerCaja(r.Context(), id)
	if err != nil {
		if errors.Is(err, domain.ErrCajaNoEncontrada) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}
		respondError(w, http.StatusInternalServerError, "error interno")
		return
	}

	respondJSON(w, http.StatusOK, c)
}

func (h *CajaHandler) Listar(w http.ResponseWriter, r *http.Request) {
	cajas, err := h.usecase.ListarCajas(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error interno")
		return
	}
	respondJSON(w, http.StatusOK, cajas)
}
