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

// Esta línea es una "aserción de interfaz en tiempo de compilación". No
// hace nada en tiempo de ejecución (el "_" descarta el valor), pero le
// dice al compilador: "chequeá ahora mismo que *ProductoRepo cumple con
// ports.ProductoRepository". Si te olvidás de implementar un método, el
// error va a aparecer ACÁ, en vez de aparecer más adelante y confuso en
// el archivo donde intentes usar el repo. Es opcional, pero muy buena
// práctica — la mayoría de proyectos Go serios la usan.
var _ ports.ProductoRepository = (*ProductoRepo)(nil)

// ProductoRepo implementa ports.ProductoRepository usando Postgres.
// Fijate que en ningún lado dice "implements ProductoRepository" — el
// hecho de tener los métodos Save/GetByID/List/Update/Delete con las
// firmas correctas ya alcanza (lo que vimos antes: duck typing).
type ProductoRepo struct {
	db *pgxpool.Pool
}

// NewProductoRepo es el constructor. Recibe el pool que viene desde
// main.go — este es el ÚNICO lugar del proyecto que va a guardar *db*
// como campo de un struct.
func NewProductoRepo(db *pgxpool.Pool) *ProductoRepo {
	return &ProductoRepo{db: db}
}

func (r *ProductoRepo) Save(ctx context.Context, p *domain.Producto) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO productos (id, sku, nombre, categoria, precio_costo, precio_venta, stock_actual, stock_minimo, activo)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		p.ID, p.SKU, p.Nombre, p.Categoria, p.PrecioCosto, p.PrecioVenta, p.StockActual, p.StockMinimo, p.Activo,
	)
	if err != nil {
		return fmt.Errorf("insertar producto: %w", err)
	}
	return nil
}

func (r *ProductoRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Producto, error) {
	var p domain.Producto

	err := r.db.QueryRow(ctx,
		`SELECT id, sku, nombre, categoria, precio_costo, precio_venta, stock_actual, stock_minimo, activo
		 FROM productos WHERE id = $1`,
		id,
	).Scan(&p.ID, &p.SKU, &p.Nombre, &p.Categoria, &p.PrecioCosto, &p.PrecioVenta, &p.StockActual, &p.StockMinimo, &p.Activo)

	if err != nil {
		// pgx.ErrNoRows es el error específico que devuelve QueryRow
		// cuando la consulta no encontró ninguna fila. Lo comparamos con
		// errors.Is (no con "==") porque el error puede venir envuelto
		// en otras capas de pgx — errors.Is sabe "desenvolver" y
		// comparar la causa real.
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrProductoNoEncontrado
		}
		return nil, fmt.Errorf("buscar producto: %w", err)
	}

	return &p, nil
}

func (r *ProductoRepo) List(ctx context.Context) ([]domain.Producto, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, sku, nombre, categoria, precio_costo, precio_venta, stock_actual, stock_minimo, activo
		 FROM productos WHERE activo = true ORDER BY nombre`,
	)
	if err != nil {
		return nil, fmt.Errorf("listar productos: %w", err)
	}
	defer rows.Close() // clave: libera la conexión de vuelta al pool

	// var productos []domain.Producto arranca en "nil" (un slice vacío
	// especial en Go). append() lo va haciendo crecer de a uno — no hace
	// falta reservar tamaño de antemano como en otros lenguajes.
	var productos []domain.Producto

	for rows.Next() {
		var p domain.Producto
		if err := rows.Scan(&p.ID, &p.SKU, &p.Nombre, &p.Categoria, &p.PrecioCosto, &p.PrecioVenta, &p.StockActual, &p.StockMinimo, &p.Activo); err != nil {
			return nil, fmt.Errorf("leer producto: %w", err)
		}
		productos = append(productos, p)
	}

	// rows.Err() chequea si el bucle terminó por un error de red/conexión
	// a mitad de camino, en vez de terminar naturalmente. Es distinto del
	// error que ya chequeamos en Query() — ese fue solo el error INICIAL.
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterar productos: %w", err)
	}

	return productos, nil
}

func (r *ProductoRepo) Update(ctx context.Context, p *domain.Producto) error {
	_, err := r.db.Exec(ctx,
		`UPDATE productos
		 SET sku = $1, nombre = $2, categoria = $3, precio_costo = $4,
		     precio_venta = $5, stock_actual = $6, stock_minimo = $7,
		     activo = $8, updated_at = now()
		 WHERE id = $9`,
		p.SKU, p.Nombre, p.Categoria, p.PrecioCosto, p.PrecioVenta, p.StockActual, p.StockMinimo, p.Activo, p.ID,
	)
	if err != nil {
		return fmt.Errorf("actualizar producto: %w", err)
	}
	return nil
}

func (r *ProductoRepo) Delete(ctx context.Context, id uuid.UUID) error {
	// Borrado lógico, no DELETE real — un producto puede tener ventas
	// asociadas (foreign key), así que borrarlo de verdad rompería el
	// historial.
	_, err := r.db.Exec(ctx,
		`UPDATE productos SET activo = false, updated_at = now() WHERE id = $1`,
		id,
	)
	if err != nil {
		return fmt.Errorf("eliminar producto: %w", err)
	}
	return nil
}
