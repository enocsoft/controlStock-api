package ports

import (
	"context"

	"github.com/google/uuid"

	"github.com/tu-usuario/saas-comercios/internal/domain"
)

type UsuarioRepository interface {
	Save(ctx context.Context, u *domain.Usuario) error
	GetByEmail(ctx context.Context, email string) (*domain.Usuario, error)
	GetByID(ctx context.Context, id uuid.UUID) (*domain.Usuario, error)
}
