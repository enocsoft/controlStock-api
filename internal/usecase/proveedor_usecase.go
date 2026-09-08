package usecase

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"github.com/tu-usuario/saas-comercios/internal/domain"
	"github.com/tu-usuario/saas-comercios/internal/usecase/ports"
)

type ProveedorUsecase struct {
	repo ports.ProveedorRepository
}

func NewProveedorUsecase(repo ports.ProveedorRepository) *ProveedorUsecase {
	return &ProveedorUsecase{repo: repo}
}

func (u *ProveedorUsecase) CrearProveedor(ctx context.Context, nombre, cuit, telefono, email string) (*domain.Proveedor, error) {
	p, err := domain.NuevoProveedor(nombre, cuit, telefono, email)
	if err != nil {
		return nil, fmt.Errorf("no se pudo crear el proveedor: %w", err)
	}
	if err := u.repo.Save(ctx, p); err != nil {
		return nil, fmt.Errorf("no se pudo guardar el proveedor: %w", err)
	}
	return p, nil
}

func (u *ProveedorUsecase) ObtenerProveedor(ctx context.Context, id uuid.UUID) (*domain.Proveedor, error) {
	return u.repo.GetByID(ctx, id)
}

func (u *ProveedorUsecase) ListarProveedores(ctx context.Context) ([]domain.Proveedor, error) {
	return u.repo.List(ctx)
}

func (u *ProveedorUsecase) EliminarProveedor(ctx context.Context, id uuid.UUID) error {
	return u.repo.Delete(ctx, id)
}
