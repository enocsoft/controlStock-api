package ports

import (
	"context"

	"github.com/google/uuid"

	"github.com/tu-usuario/saas-comercios/internal/domain"
)

// ProductoRepository define QUÉ operaciones de persistencia necesita el
// usecase de productos, sin decir CÓMO se implementan. El usecase solo va
// a conocer esta interfaz — nunca sabrá si detrás hay Postgres, MySQL, o
// un mapa en memoria para tests.
//
// En Go, una interfaz es simplemente una lista de métodos. Cualquier tipo
// que tenga esos métodos "implementa" la interfaz automáticamente — no
// hace falta escribir "implements ProductoRepository" en ningún lado
// (a diferencia de Java/C#/TypeScript). Esto se llama "duck typing
// estructural": si camina como pato y grazna como pato, es un pato.
type ProductoRepository interface {
	// Save inserta un producto nuevo.
	Save(ctx context.Context, p *domain.Producto) error

	// GetByID busca un producto por su ID. Devuelve error si no existe.
	GetByID(ctx context.Context, id uuid.UUID) (*domain.Producto, error)

	// List devuelve todos los productos activos.
	List(ctx context.Context) ([]domain.Producto, error)

	// Update persiste todos los campos editables de un producto ya
	// existente (nombre, precios, stock, etc.).
	Update(ctx context.Context, p *domain.Producto) error

	// Delete hace borrado lógico (activo = false), nunca DELETE real —
	// un producto puede tener ventas asociadas.
	Delete(ctx context.Context, id uuid.UUID) error
}
