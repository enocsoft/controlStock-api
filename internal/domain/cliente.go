package domain

import (
	"errors"

	"github.com/google/uuid"
)

var (
	ErrClienteNoEncontrado = errors.New("cliente no encontrado")
	ErrMontoInvalido       = errors.New("el monto debe ser mayor a cero")
)

// Cliente representa un cliente del comercio, incluyendo su saldo de
// cuenta corriente (lo que en Argentina se conoce como "fiado").
type Cliente struct {
	ID                    uuid.UUID
	Nombre                string
	CUIT                  string
	Telefono              string
	Email                 string
	SaldoCuentaCorriente  float64
	Activo                bool
}

func NuevoCliente(nombre, cuit, telefono, email string) (*Cliente, error) {
	if nombre == "" {
		return nil, errors.New("el nombre no puede estar vacío")
	}

	return &Cliente{
		ID:                   uuid.New(),
		Nombre:               nombre,
		CUIT:                 cuit,
		Telefono:             telefono,
		Email:                email,
		SaldoCuentaCorriente: 0,
		Activo:               true,
	}, nil
}

// RegistrarCompraAFiado aumenta la deuda del cliente. Se usa cuando el
// cliente se lleva mercadería sin pagar de contado.
func (c *Cliente) RegistrarCompraAFiado(monto float64) error {
	if monto <= 0 {
		return ErrMontoInvalido
	}
	c.SaldoCuentaCorriente += monto
	return nil
}

// RegistrarPago reduce la deuda. A diferencia de Producto.ReducirStock,
// acá SÍ permitimos que el pago deje el saldo en negativo (el cliente
// pagó de más, queda a favor) en vez de rechazarlo — es una decisión de
// negocio distinta, y por eso el método es distinto aunque la forma se
// parezca a ReducirStock.
func (c *Cliente) RegistrarPago(monto float64) error {
	if monto <= 0 {
		return ErrMontoInvalido
	}
	c.SaldoCuentaCorriente -= monto
	return nil
}
