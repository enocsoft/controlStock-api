package ports

import (
	"context"

	"github.com/google/uuid"

	"github.com/tu-usuario/saas-comercios/internal/domain"
)

type ProveedorRepository interface {
	Save(ctx context.Context, p *domain.Proveedor) error
	GetByID(ctx context.Context, id uuid.UUID) (*domain.Proveedor, error)
	List(ctx context.Context) ([]domain.Proveedor, error)
	Update(ctx context.Context, p *domain.Proveedor) error
	Delete(ctx context.Context, id uuid.UUID) error
}
