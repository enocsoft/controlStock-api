package usecase

import (
	"context"
	"fmt"
	"time"

	"github.com/tu-usuario/saas-comercios/internal/domain"
	"github.com/tu-usuario/saas-comercios/internal/usecase/ports"
	"github.com/tu-usuario/saas-comercios/pkg/jwt"
)

type AuthUsecase struct {
	repo      ports.UsuarioRepository
	jwtSecret string
}

func NewAuthUsecase(repo ports.UsuarioRepository, jwtSecret string) *AuthUsecase {
	return &AuthUsecase{repo: repo, jwtSecret: jwtSecret}
}

func (u *AuthUsecase) Registrar(ctx context.Context, nombre, email, password, rol string) (*domain.Usuario, error) {
	usuario, err := domain.NuevoUsuario(nombre, email, password, rol)
	if err != nil {
		return nil, fmt.Errorf("no se pudo crear el usuario: %w", err)
	}

	if err := u.repo.Save(ctx, usuario); err != nil {
		return nil, fmt.Errorf("no se pudo guardar el usuario: %w", err)
	}

	return usuario, nil
}

func (u *AuthUsecase) Login(ctx context.Context, email, password string) (string, error) {
	usuario, err := u.repo.GetByEmail(ctx, email)
	if err != nil {
		return "", domain.ErrCredencialesInvalidas
	}

	if !usuario.VerificarPassword(password) {
		return "", domain.ErrCredencialesInvalidas
	}

	token, err := jwt.Generar(usuario.ID, usuario.Rol, u.jwtSecret, 24*time.Hour)
	if err != nil {
		return "", fmt.Errorf("no se pudo generar el token: %w", err)
	}

	return token, nil
}
