package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

var (
	ErrCajaNoEncontrada       = errors.New("caja no encontrada")
	ErrCajaYaCerrada          = errors.New("la caja ya está cerrada")
	ErrCajaYaAbierta          = errors.New("ya hay una caja abierta")
	ErrTipoMovimientoInvalido = errors.New("el tipo de movimiento debe ser 'ingreso' o 'egreso'")
)

type MovimientoCaja struct {
	ID          uuid.UUID
	CajaID      uuid.UUID
	Monto       float64
	Tipo        string // "ingreso" o "egreso"
	Descripcion string
	CreatedAt   time.Time
}

type Caja struct {
	ID            uuid.UUID
	UsuarioID     uuid.UUID
	FechaApertura time.Time
	FechaCierre   *time.Time
	SaldoInicial  float64
	SaldoFinal    *float64
	Estado        string // "abierta" o "cerrada"
	Movimientos   []MovimientoCaja
}

func NuevaCaja(usuarioID uuid.UUID, saldoInicial float64) (*Caja, error) {
	if saldoInicial < 0 {
		return nil, errors.New("el saldo inicial no puede ser negativo")
	}

	return &Caja{
		ID:            uuid.New(),
		UsuarioID:     usuarioID,
		FechaApertura: time.Now(),
		SaldoInicial:  saldoInicial,
		Estado:        "abierta",
	}, nil
}

func (c *Caja) RegistrarMovimiento(tipo string, monto float64, descripcion string) (*MovimientoCaja, error) {
	if c.Estado != "abierta" {
		return nil, ErrCajaYaCerrada
	}
	if tipo != "ingreso" && tipo != "egreso" {
		return nil, ErrTipoMovimientoInvalido
	}
	if monto <= 0 {
		return nil, ErrMontoInvalido
	}

	mov := MovimientoCaja{
		ID:          uuid.New(),
		CajaID:      c.ID,
		Monto:       monto,
		Tipo:        tipo,
		Descripcion: descripcion,
		CreatedAt:   time.Now(),
	}
	c.Movimientos = append(c.Movimientos, mov)
	return &mov, nil
}

func (c *Caja) Cerrar() error {
	if c.Estado != "abierta" {
		return ErrCajaYaCerrada
	}

	saldo := c.SaldoInicial
	for _, m := range c.Movimientos {
		if m.Tipo == "ingreso" {
			saldo += m.Monto
		} else {
			saldo -= m.Monto
		}
	}

	ahora := time.Now()
	c.FechaCierre = &ahora
	c.SaldoFinal = &saldo
	c.Estado = "cerrada"
	return nil
}
