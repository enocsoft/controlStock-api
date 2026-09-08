package domain

import (
	"errors"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUsuarioNoEncontrado   = errors.New("usuario no encontrado")
	ErrCredencialesInvalidas = errors.New("email o contraseña incorrectos")
	ErrRolInvalido           = errors.New("el rol debe ser 'dueño' o 'empleado'")
)

type Usuario struct {
	ID           uuid.UUID
	Nombre       string
	Email        string
	PasswordHash string
	Rol          string
	Activo       bool
}

func NuevoUsuario(nombre, email, password, rol string) (*Usuario, error) {
	if nombre == "" || email == "" {
		return nil, errors.New("nombre y email son obligatorios")
	}
	if len(password) < 8 {
		return nil, errors.New("la contraseña debe tener al menos 8 caracteres")
	}
	if rol != "dueño" && rol != "empleado" {
		return nil, ErrRolInvalido
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	return &Usuario{
		ID:           uuid.New(),
		Nombre:       nombre,
		Email:        email,
		PasswordHash: string(hash),
		Rol:          rol,
		Activo:       true,
	}, nil
}

func (u *Usuario) VerificarPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
	return err == nil
}
