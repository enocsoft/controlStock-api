package domain

import (
	"errors"

	"github.com/google/uuid"
)

var ErrProveedorNoEncontrado = errors.New("proveedor no encontrado")

type Proveedor struct {
	ID       uuid.UUID
	Nombre   string
	CUIT     string
	Telefono string
	Email    string
	Activo   bool
}

func NuevoProveedor(nombre, cuit, telefono, email string) (*Proveedor, error) {
	if nombre == "" {
		return nil, errors.New("el nombre no puede estar vacío")
	}

	return &Proveedor{
		ID:       uuid.New(),
		Nombre:   nombre,
		CUIT:     cuit,
		Telefono: telefono,
		Email:    email,
		Activo:   true,
	}, nil
}
