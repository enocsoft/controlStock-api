package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/tu-usuario/saas-comercios/internal/domain"
	"github.com/tu-usuario/saas-comercios/internal/usecase/ports"
)

var _ ports.CajaRepository = (*CajaRepo)(nil)

type CajaRepo struct {
	db *pgxpool.Pool
}

func NewCajaRepo(db *pgxpool.Pool) *CajaRepo {
	return &CajaRepo{db: db}
}

func (r *CajaRepo) AbrirCaja(ctx context.Context, c *domain.Caja) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO cajas (id, usuario_id, fecha_apertura, saldo_inicial, estado)
		 VALUES ($1, $2, $3, $4, $5)`,
		c.ID, c.UsuarioID, c.FechaApertura, c.SaldoInicial, c.Estado,
	)
	if err != nil {
		return fmt.Errorf("insertar caja: %w", err)
	}
	return nil
}

func (r *CajaRepo) ObtenerAbierta(ctx context.Context) (*domain.Caja, error) {
	var c domain.Caja
	err := r.db.QueryRow(ctx,
		`SELECT id, usuario_id, fecha_apertura, fecha_cierre, saldo_inicial, saldo_final, estado
		 FROM cajas WHERE estado = 'abierta' LIMIT 1`,
	).Scan(&c.ID, &c.UsuarioID, &c.FechaApertura, &c.FechaCierre, &c.SaldoInicial, &c.SaldoFinal, &c.Estado)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrCajaNoEncontrada
		}
		return nil, fmt.Errorf("buscar caja abierta: %w", err)
	}

	return &c, nil
}

func (r *CajaRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Caja, error) {
	var c domain.Caja
	err := r.db.QueryRow(ctx,
		`SELECT id, usuario_id, fecha_apertura, fecha_cierre, saldo_inicial, saldo_final, estado
		 FROM cajas WHERE id = $1`,
		id,
	).Scan(&c.ID, &c.UsuarioID, &c.FechaApertura, &c.FechaCierre, &c.SaldoInicial, &c.SaldoFinal, &c.Estado)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrCajaNoEncontrada
		}
		return nil, fmt.Errorf("buscar caja: %w", err)
	}

	rows, err := r.db.Query(ctx,
		`SELECT id, caja_id, monto, tipo, descripcion, created_at
		 FROM movimientos_caja WHERE caja_id = $1 ORDER BY created_at`,
		id,
	)
	if err != nil {
		return nil, fmt.Errorf("buscar movimientos de caja: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var m domain.MovimientoCaja
		if err := rows.Scan(&m.ID, &m.CajaID, &m.Monto, &m.Tipo, &m.Descripcion, &m.CreatedAt); err != nil {
			return nil, fmt.Errorf("leer movimiento de caja: %w", err)
		}
		c.Movimientos = append(c.Movimientos, m)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterar movimientos de caja: %w", err)
	}

	return &c, nil
}

func (r *CajaRepo) List(ctx context.Context) ([]domain.Caja, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, usuario_id, fecha_apertura, fecha_cierre, saldo_inicial, saldo_final, estado
		 FROM cajas ORDER BY fecha_apertura DESC`,
	)
	if err != nil {
		return nil, fmt.Errorf("listar cajas: %w", err)
	}
	defer rows.Close()

	var cajas []domain.Caja
	for rows.Next() {
		var c domain.Caja
		if err := rows.Scan(&c.ID, &c.UsuarioID, &c.FechaApertura, &c.FechaCierre, &c.SaldoInicial, &c.SaldoFinal, &c.Estado); err != nil {
			return nil, fmt.Errorf("leer caja: %w", err)
		}
		cajas = append(cajas, c)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterar cajas: %w", err)
	}

	return cajas, nil
}

func (r *CajaRepo) RegistrarMovimiento(ctx context.Context, m *domain.MovimientoCaja) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO movimientos_caja (id, caja_id, monto, tipo, descripcion)
		 VALUES ($1, $2, $3, $4, $5)`,
		m.ID, m.CajaID, m.Monto, m.Tipo, m.Descripcion,
	)
	if err != nil {
		return fmt.Errorf("insertar movimiento de caja: %w", err)
	}
	return nil
}

func (r *CajaRepo) Cerrar(ctx context.Context, c *domain.Caja) error {
	_, err := r.db.Exec(ctx,
		`UPDATE cajas SET fecha_cierre = $1, saldo_final = $2, estado = $3 WHERE id = $4`,
		c.FechaCierre, c.SaldoFinal, c.Estado, c.ID,
	)
	if err != nil {
		return fmt.Errorf("cerrar caja: %w", err)
	}
	return nil
}
