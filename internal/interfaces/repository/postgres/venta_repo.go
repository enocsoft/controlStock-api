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

var _ ports.VentaRepository = (*VentaRepo)(nil)

type VentaRepo struct {
	db *pgxpool.Pool
}

func NewVentaRepo(db *pgxpool.Pool) *VentaRepo {
	return &VentaRepo{db: db}
}

func (r *VentaRepo) Save(ctx context.Context, v *domain.Venta) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("iniciar transacción: %w", err)
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx,
		`INSERT INTO ventas (id, cliente_id, usuario_id, fecha, total, estado)
		 VALUES ($1, $2, $3, $4, $5, $6)`,
		v.ID, v.ClienteID, v.UsuarioID, v.Fecha, v.Total, v.Estado,
	)
	if err != nil {
		return fmt.Errorf("insertar venta: %w", err)
	}

	for _, item := range v.Items {
		tag, err := tx.Exec(ctx,
			`UPDATE productos SET stock_actual = stock_actual - $1, updated_at = now()
			 WHERE id = $2 AND stock_actual >= $1`,
			item.Cantidad, item.ProductoID,
		)
		if err != nil {
			return fmt.Errorf("descontar stock: %w", err)
		}

		if tag.RowsAffected() == 0 {
			return fmt.Errorf("producto %s: %w", item.ProductoID, domain.ErrStockInsuficiente)
		}

		_, err = tx.Exec(ctx,
			`INSERT INTO venta_items (id, venta_id, producto_id, cantidad, precio_unitario)
			 VALUES ($1, $2, $3, $4, $5)`,
			item.ID, v.ID, item.ProductoID, item.Cantidad, item.PrecioUnitario,
		)
		if err != nil {
			return fmt.Errorf("insertar item de venta: %w", err)
		}

		_, err = tx.Exec(ctx,
			`INSERT INTO movimientos_stock (id, producto_id, usuario_id, cantidad, tipo, motivo, referencia_id)
			 VALUES ($1, $2, $3, $4, 'venta', 'Venta registrada', $5)`,
			uuid.New(), item.ProductoID, v.UsuarioID, -item.Cantidad, v.ID,
		)
		if err != nil {
			return fmt.Errorf("registrar movimiento de stock: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("confirmar transacción: %w", err)
	}

	return nil
}

func (r *VentaRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Venta, error) {
	var v domain.Venta
	err := r.db.QueryRow(ctx,
		`SELECT id, cliente_id, usuario_id, fecha, total, estado FROM ventas WHERE id = $1`,
		id,
	).Scan(&v.ID, &v.ClienteID, &v.UsuarioID, &v.Fecha, &v.Total, &v.Estado)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrVentaNoEncontrada
		}
		return nil, fmt.Errorf("buscar venta: %w", err)
	}

	rows, err := r.db.Query(ctx,
		`SELECT id, producto_id, cantidad, precio_unitario FROM venta_items WHERE venta_id = $1`,
		id,
	)
	if err != nil {
		return nil, fmt.Errorf("buscar items de venta: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var item domain.VentaItem
		if err := rows.Scan(&item.ID, &item.ProductoID, &item.Cantidad, &item.PrecioUnitario); err != nil {
			return nil, fmt.Errorf("leer item de venta: %w", err)
		}
		v.Items = append(v.Items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterar items de venta: %w", err)
	}

	return &v, nil
}

func (r *VentaRepo) List(ctx context.Context) ([]domain.Venta, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, cliente_id, usuario_id, fecha, total, estado FROM ventas ORDER BY fecha DESC`,
	)
	if err != nil {
		return nil, fmt.Errorf("listar ventas: %w", err)
	}
	defer rows.Close()

	var ventas []domain.Venta
	for rows.Next() {
		var v domain.Venta
		if err := rows.Scan(&v.ID, &v.ClienteID, &v.UsuarioID, &v.Fecha, &v.Total, &v.Estado); err != nil {
			return nil, fmt.Errorf("leer venta: %w", err)
		}
		ventas = append(ventas, v)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterar ventas: %w", err)
	}

	return ventas, nil
}
