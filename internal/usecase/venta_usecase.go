package usecase

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"github.com/tu-usuario/saas-comercios/internal/domain"
	"github.com/tu-usuario/saas-comercios/internal/usecase/ports"
)

type ItemInput struct {
	ProductoID uuid.UUID
	Cantidad   int
}

type VentaUsecase struct {
	ventaRepo    ports.VentaRepository
	productoRepo ports.ProductoRepository
}

func NewVentaUsecase(ventaRepo ports.VentaRepository, productoRepo ports.ProductoRepository) *VentaUsecase {
	return &VentaUsecase{ventaRepo: ventaRepo, productoRepo: productoRepo}
}

func (u *VentaUsecase) RegistrarVenta(ctx context.Context, usuarioID uuid.UUID, clienteID *uuid.UUID, itemsInput []ItemInput) (*domain.Venta, error) {
	items := make([]domain.VentaItem, 0, len(itemsInput))

	for _, input := range itemsInput {
		producto, err := u.productoRepo.GetByID(ctx, input.ProductoID)
		if err != nil {
			return nil, fmt.Errorf("producto %s: %w", input.ProductoID, err)
		}

		items = append(items, domain.VentaItem{
			ID:             uuid.New(),
			ProductoID:     producto.ID,
			Cantidad:       input.Cantidad,
			PrecioUnitario: producto.PrecioVenta,
		})
	}

	venta, err := domain.NuevaVenta(usuarioID, clienteID, items)
	if err != nil {
		return nil, fmt.Errorf("no se pudo armar la venta: %w", err)
	}

	if err := u.ventaRepo.Save(ctx, venta); err != nil {
		return nil, fmt.Errorf("no se pudo guardar la venta: %w", err)
	}

	return venta, nil
}

func (u *VentaUsecase) ObtenerVenta(ctx context.Context, id uuid.UUID) (*domain.Venta, error) {
	return u.ventaRepo.GetByID(ctx, id)
}

func (u *VentaUsecase) ListarVentas(ctx context.Context) ([]domain.Venta, error) {
	return u.ventaRepo.List(ctx)
}
