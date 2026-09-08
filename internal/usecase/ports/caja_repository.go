package ports

import (
	"context"

	"github.com/google/uuid"

	"github.com/tu-usuario/saas-comercios/internal/domain"
)

type CajaRepository interface {
	AbrirCaja(ctx context.Context, c *domain.Caja) error
	ObtenerAbierta(ctx context.Context) (*domain.Caja, error)
	GetByID(ctx context.Context, id uuid.UUID) (*domain.Caja, error)
	List(ctx context.Context) ([]domain.Caja, error)
	RegistrarMovimiento(ctx context.Context, m *domain.MovimientoCaja) error
	Cerrar(ctx context.Context, c *domain.Caja) error
}
