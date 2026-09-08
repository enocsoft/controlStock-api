package usecase

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"github.com/tu-usuario/saas-comercios/internal/domain"
	"github.com/tu-usuario/saas-comercios/internal/usecase/ports"
)

type ClienteUsecase struct {
	repo ports.ClienteRepository
}

func NewClienteUsecase(repo ports.ClienteRepository) *ClienteUsecase {
	return &ClienteUsecase{repo: repo}
}

func (u *ClienteUsecase) CrearCliente(ctx context.Context, nombre, cuit, telefono, email string) (*domain.Cliente, error) {
	c, err := domain.NuevoCliente(nombre, cuit, telefono, email)
	if err != nil {
		return nil, fmt.Errorf("no se pudo crear el cliente: %w", err)
	}
	if err := u.repo.Save(ctx, c); err != nil {
		return nil, fmt.Errorf("no se pudo guardar el cliente: %w", err)
	}
	return c, nil
}

func (u *ClienteUsecase) ObtenerCliente(ctx context.Context, id uuid.UUID) (*domain.Cliente, error) {
	return u.repo.GetByID(ctx, id)
}

func (u *ClienteUsecase) ListarClientes(ctx context.Context) ([]domain.Cliente, error) {
	return u.repo.List(ctx)
}

// RegistrarPago busca al cliente, aplica la regla de negocio (que vive en
// domain.Cliente.RegistrarPago) y persiste el nuevo saldo. Mismo patrón
// de orquestación que ReducirStock en ProductoUsecase.
func (u *ClienteUsecase) RegistrarPago(ctx context.Context, id uuid.UUID, monto float64) error {
	c, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("no se encontró el cliente: %w", err)
	}

	if err := c.RegistrarPago(monto); err != nil {
		return err
	}

	if err := u.repo.Update(ctx, c); err != nil {
		return fmt.Errorf("no se pudo actualizar el saldo: %w", err)
	}

	return nil
}

func (u *ClienteUsecase) EliminarCliente(ctx context.Context, id uuid.UUID) error {
	return u.repo.Delete(ctx, id)
}
