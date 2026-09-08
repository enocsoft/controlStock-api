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

var _ ports.ClienteRepository = (*ClienteRepo)(nil)

type ClienteRepo struct {
	db *pgxpool.Pool
}

func NewClienteRepo(db *pgxpool.Pool) *ClienteRepo {
	return &ClienteRepo{db: db}
}

func (r *ClienteRepo) Save(ctx context.Context, c *domain.Cliente) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO clientes (id, nombre, cuit, telefono, email, saldo_cuenta_corriente, activo)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		c.ID, c.Nombre, c.CUIT, c.Telefono, c.Email, c.SaldoCuentaCorriente, c.Activo,
	)
	if err != nil {
		return fmt.Errorf("insertar cliente: %w", err)
	}
	return nil
}

func (r *ClienteRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Cliente, error) {
	var c domain.Cliente

	err := r.db.QueryRow(ctx,
		`SELECT id, nombre, cuit, telefono, email, saldo_cuenta_corriente, activo
		 FROM clientes WHERE id = $1`,
		id,
	).Scan(&c.ID, &c.Nombre, &c.CUIT, &c.Telefono, &c.Email, &c.SaldoCuentaCorriente, &c.Activo)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrClienteNoEncontrado
		}
		return nil, fmt.Errorf("buscar cliente: %w", err)
	}

	return &c, nil
}

func (r *ClienteRepo) List(ctx context.Context) ([]domain.Cliente, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, nombre, cuit, telefono, email, saldo_cuenta_corriente, activo
		 FROM clientes WHERE activo = true ORDER BY nombre`,
	)
	if err != nil {
		return nil, fmt.Errorf("listar clientes: %w", err)
	}
	defer rows.Close()

	var clientes []domain.Cliente
	for rows.Next() {
		var c domain.Cliente
		if err := rows.Scan(&c.ID, &c.Nombre, &c.CUIT, &c.Telefono, &c.Email, &c.SaldoCuentaCorriente, &c.Activo); err != nil {
			return nil, fmt.Errorf("leer cliente: %w", err)
		}
		clientes = append(clientes, c)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterar clientes: %w", err)
	}

	return clientes, nil
}

func (r *ClienteRepo) Update(ctx context.Context, c *domain.Cliente) error {
	_, err := r.db.Exec(ctx,
		`UPDATE clientes
		 SET nombre = $1, cuit = $2, telefono = $3, email = $4,
		     saldo_cuenta_corriente = $5, activo = $6, updated_at = now()
		 WHERE id = $7`,
		c.Nombre, c.CUIT, c.Telefono, c.Email, c.SaldoCuentaCorriente, c.Activo, c.ID,
	)
	if err != nil {
		return fmt.Errorf("actualizar cliente: %w", err)
	}
	return nil
}

func (r *ClienteRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx,
		`UPDATE clientes SET activo = false, updated_at = now() WHERE id = $1`,
		id,
	)
	if err != nil {
		return fmt.Errorf("eliminar cliente: %w", err)
	}
	return nil
}
