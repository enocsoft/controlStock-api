package ports

import (
	"context"

	"github.com/google/uuid"

	"github.com/tu-usuario/saas-comercios/internal/domain"
)

type ClienteRepository interface {
	Save(ctx context.Context, c *domain.Cliente) error
	GetByID(ctx context.Context, id uuid.UUID) (*domain.Cliente, error)
	List(ctx context.Context) ([]domain.Cliente, error)
	Update(ctx context.Context, c *domain.Cliente) error
	Delete(ctx context.Context, id uuid.UUID) error
}
