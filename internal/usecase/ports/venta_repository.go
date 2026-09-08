package ports

import (
	"context"

	"github.com/google/uuid"

	"github.com/tu-usuario/saas-comercios/internal/domain"
)

type VentaRepository interface {
	Save(ctx context.Context, v *domain.Venta) error
	GetByID(ctx context.Context, id uuid.UUID) (*domain.Venta, error)
	List(ctx context.Context) ([]domain.Venta, error)
}
