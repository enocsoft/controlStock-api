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

type VentaHandler struct {
	usecase *usecase.VentaUsecase
}

func NewVentaHandler(u *usecase.VentaUsecase) *VentaHandler {
	return &VentaHandler{usecase: u}
}

func (h *VentaHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Post("/", h.Registrar)
	r.Get("/", h.Listar)
	r.Get("/{id}", h.ObtenerPorID)
	return r
}

// itemRequest es la forma de cada línea del JSON de entrada.
type itemRequest struct {
	ProductoID string `json:"producto_id"`
	Cantidad   int    `json:"cantidad"`
}

type registrarVentaRequest struct {
	ClienteID *string       `json:"cliente_id"`
	Items     []itemRequest `json:"items"`
}

// El comentario viejo sobre el hueco de seguridad ya no aplica: ahora
// usuarioID sale del token validado por el middleware Auth, nunca del
// body — un cliente de la API ya no puede "declarar" ser otro usuario.
func (h *VentaHandler) Registrar(w http.ResponseWriter, r *http.Request) {
	usuarioID, ok := authmw.UsuarioIDDesdeContexto(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "no autenticado")
		return
	}

	var req registrarVentaRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "body inválido: "+err.Error())
		return
	}

	var clienteID *uuid.UUID
	if req.ClienteID != nil {
		parsed, err := uuid.Parse(*req.ClienteID)
		if err != nil {
			respondError(w, http.StatusBadRequest, "cliente_id inválido")
			return
		}
		clienteID = &parsed
	}

	items := make([]usecase.ItemInput, 0, len(req.Items))
	for _, it := range req.Items {
		productoID, err := uuid.Parse(it.ProductoID)
		if err != nil {
			respondError(w, http.StatusBadRequest, "producto_id inválido: "+it.ProductoID)
			return
		}
		items = append(items, usecase.ItemInput{ProductoID: productoID, Cantidad: it.Cantidad})
	}

	venta, err := h.usecase.RegistrarVenta(r.Context(), usuarioID, clienteID, items)
	if err != nil {
		if errors.Is(err, domain.ErrStockInsuficiente) {
			respondError(w, http.StatusConflict, err.Error()) // 409: el pedido choca con el estado actual del stock
			return
		}
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, venta)
}

func (h *VentaHandler) ObtenerPorID(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "id inválido")
		return
	}

	venta, err := h.usecase.ObtenerVenta(r.Context(), id)
	if err != nil {
		if errors.Is(err, domain.ErrVentaNoEncontrada) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}
		respondError(w, http.StatusInternalServerError, "error interno")
		return
	}

	respondJSON(w, http.StatusOK, venta)
}

func (h *VentaHandler) Listar(w http.ResponseWriter, r *http.Request) {
	ventas, err := h.usecase.ListarVentas(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error interno")
		return
	}
	respondJSON(w, http.StatusOK, ventas)
}
