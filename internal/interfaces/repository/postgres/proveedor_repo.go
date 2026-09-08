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

var _ ports.ProveedorRepository = (*ProveedorRepo)(nil)

type ProveedorRepo struct {
	db *pgxpool.Pool
}

func NewProveedorRepo(db *pgxpool.Pool) *ProveedorRepo {
	return &ProveedorRepo{db: db}
}

func (r *ProveedorRepo) Save(ctx context.Context, p *domain.Proveedor) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO proveedores (id, nombre, cuit, telefono, email, activo)
		 VALUES ($1, $2, $3, $4, $5, $6)`,
		p.ID, p.Nombre, p.CUIT, p.Telefono, p.Email, p.Activo,
	)
	if err != nil {
		return fmt.Errorf("insertar proveedor: %w", err)
	}
	return nil
}

func (r *ProveedorRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Proveedor, error) {
	var p domain.Proveedor

	err := r.db.QueryRow(ctx,
		`SELECT id, nombre, cuit, telefono, email, activo FROM proveedores WHERE id = $1`,
		id,
	).Scan(&p.ID, &p.Nombre, &p.CUIT, &p.Telefono, &p.Email, &p.Activo)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrProveedorNoEncontrado
		}
		return nil, fmt.Errorf("buscar proveedor: %w", err)
	}

	return &p, nil
}

func (r *ProveedorRepo) List(ctx context.Context) ([]domain.Proveedor, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, nombre, cuit, telefono, email, activo FROM proveedores WHERE activo = true ORDER BY nombre`,
	)
	if err != nil {
		return nil, fmt.Errorf("listar proveedores: %w", err)
	}
	defer rows.Close()

	var proveedores []domain.Proveedor
	for rows.Next() {
		var p domain.Proveedor
		if err := rows.Scan(&p.ID, &p.Nombre, &p.CUIT, &p.Telefono, &p.Email, &p.Activo); err != nil {
			return nil, fmt.Errorf("leer proveedor: %w", err)
		}
		proveedores = append(proveedores, p)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterar proveedores: %w", err)
	}

	return proveedores, nil
}

func (r *ProveedorRepo) Update(ctx context.Context, p *domain.Proveedor) error {
	_, err := r.db.Exec(ctx,
		`UPDATE proveedores
		 SET nombre = $1, cuit = $2, telefono = $3, email = $4, activo = $5, updated_at = now()
		 WHERE id = $6`,
		p.Nombre, p.CUIT, p.Telefono, p.Email, p.Activo, p.ID,
	)
	if err != nil {
		return fmt.Errorf("actualizar proveedor: %w", err)
	}
	return nil
}

func (r *ProveedorRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx,
		`UPDATE proveedores SET activo = false, updated_at = now() WHERE id = $1`,
		id,
	)
	if err != nil {
		return fmt.Errorf("eliminar proveedor: %w", err)
	}
	return nil
}
