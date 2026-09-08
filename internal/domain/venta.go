package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

var (
	ErrVentaNoEncontrada = errors.New("venta no encontrada")
	ErrVentaSinItems     = errors.New("una venta necesita al menos un producto")
)

type VentaItem struct {
	ID             uuid.UUID
	ProductoID     uuid.UUID
	Cantidad       int
	PrecioUnitario float64
}

func (i VentaItem) Subtotal() float64 {
	return float64(i.Cantidad) * i.PrecioUnitario
}

type Venta struct {
	ID        uuid.UUID
	ClienteID *uuid.UUID
	UsuarioID uuid.UUID
	Fecha     time.Time
	Total     float64
	Estado    string
	Items     []VentaItem
}

func NuevaVenta(usuarioID uuid.UUID, clienteID *uuid.UUID, items []VentaItem) (*Venta, error) {
	if len(items) == 0 {
		return nil, ErrVentaSinItems
	}

	var total float64
	for _, item := range items {
		if item.Cantidad <= 0 {
			return nil, errors.New("la cantidad de cada item debe ser mayor a cero")
		}
		total += item.Subtotal()
	}

	return &Venta{
		ID:        uuid.New(),
		ClienteID: clienteID,
		UsuarioID: usuarioID,
		Fecha:     time.Now(),
		Total:     total,
		Estado:    "confirmada",
		Items:     items,
	}, nil
}
