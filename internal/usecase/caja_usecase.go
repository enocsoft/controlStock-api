package usecase

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"

	"github.com/tu-usuario/saas-comercios/internal/domain"
	"github.com/tu-usuario/saas-comercios/internal/usecase/ports"
)

type CajaUsecase struct {
	repo ports.CajaRepository
}

func NewCajaUsecase(repo ports.CajaRepository) *CajaUsecase {
	return &CajaUsecase{repo: repo}
}

func (u *CajaUsecase) AbrirCaja(ctx context.Context, usuarioID uuid.UUID, saldoInicial float64) (*domain.Caja, error) {
	_, err := u.repo.ObtenerAbierta(ctx)
	if err == nil {
		return nil, domain.ErrCajaYaAbierta
	}
	if !errors.Is(err, domain.ErrCajaNoEncontrada) {
		return nil, fmt.Errorf("no se pudo verificar cajas abiertas: %w", err)
	}

	c, err := domain.NuevaCaja(usuarioID, saldoInicial)
	if err != nil {
		return nil, fmt.Errorf("no se pudo abrir la caja: %w", err)
	}

	if err := u.repo.AbrirCaja(ctx, c); err != nil {
		return nil, fmt.Errorf("no se pudo guardar la apertura de caja: %w", err)
	}

	return c, nil
}

func (u *CajaUsecase) RegistrarMovimiento(ctx context.Context, cajaID uuid.UUID, tipo string, monto float64, descripcion string) error {
	c, err := u.repo.GetByID(ctx, cajaID)
	if err != nil {
		return fmt.Errorf("no se encontró la caja: %w", err)
	}

	mov, err := c.RegistrarMovimiento(tipo, monto, descripcion)
	if err != nil {
		return err
	}

	if err := u.repo.RegistrarMovimiento(ctx, mov); err != nil {
		return fmt.Errorf("no se pudo guardar el movimiento: %w", err)
	}

	return nil
}

func (u *CajaUsecase) Cerrar(ctx context.Context, cajaID uuid.UUID) (*domain.Caja, error) {
	c, err := u.repo.GetByID(ctx, cajaID)
	if err != nil {
		return nil, fmt.Errorf("no se encontró la caja: %w", err)
	}

	if err := c.Cerrar(); err != nil {
		return nil, err
	}

	if err := u.repo.Cerrar(ctx, c); err != nil {
		return nil, fmt.Errorf("no se pudo cerrar la caja: %w", err)
	}

	return c, nil
}

func (u *CajaUsecase) ObtenerCaja(ctx context.Context, id uuid.UUID) (*domain.Caja, error) {
	return u.repo.GetByID(ctx, id)
}

func (u *CajaUsecase) ListarCajas(ctx context.Context) ([]domain.Caja, error) {
	return u.repo.List(ctx)
}
