package usecase

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"github.com/tu-usuario/saas-comercios/internal/domain"
	"github.com/tu-usuario/saas-comercios/internal/usecase/ports"
)

// ProductoUsecase contiene la lógica de aplicación del módulo de
// productos. Fijate el tipo del campo "repo": es ports.ProductoRepository,
// LA INTERFAZ que armamos en el paso anterior — no un *postgres.ProductoRepo
// concreto. Este struct nunca va a saber que existe Postgres.
type ProductoUsecase struct {
	repo ports.ProductoRepository
}

// NewProductoUsecase es el constructor. Este patrón — recibir las
// dependencias como parámetros en vez de crearlas adentro — se llama
// "inyección de dependencias", y en Go no hace falta ningún framework
// para lograrlo: es simplemente pasar un valor por parámetro.
//
// Como el parámetro es de tipo interfaz, acá podés pasarle CUALQUIER
// struct que tenga los métodos de ProductoRepository: el real de
// Postgres en producción, o uno falso en memoria cuando escribas tests.
func NewProductoUsecase(repo ports.ProductoRepository) *ProductoUsecase {
	return &ProductoUsecase{repo: repo}
}

// CrearProducto arma un producto nuevo (usando el constructor del
// domain, que valida SKU/nombre/precios) y lo persiste.
func (u *ProductoUsecase) CrearProducto(ctx context.Context, sku, nombre string, precioCosto, precioVenta float64) (*domain.Producto, error) {
	p, err := domain.NuevoProducto(sku, nombre, precioCosto, precioVenta)
	if err != nil {
		// fmt.Errorf con %w "envuelve" el error original. Esto permite
		// que quien reciba el error pueda seguir usando errors.Is/errors.As
		// para chequear la causa raíz, aunque el mensaje tenga más contexto.
		return nil, fmt.Errorf("no se pudo crear el producto: %w", err)
	}

	if err := u.repo.Save(ctx, p); err != nil {
		return nil, fmt.Errorf("no se pudo guardar el producto: %w", err)
	}

	return p, nil
}

// ObtenerProducto busca un producto por ID. Notá que este método es casi
// un simple "pasamanos" al repo — la lógica interesante para este caso
// puntual es mínima, pero mantenemos la capa igual para que el handler
// nunca dependa directamente del repositorio.
func (u *ProductoUsecase) ObtenerProducto(ctx context.Context, id uuid.UUID) (*domain.Producto, error) {
	return u.repo.GetByID(ctx, id)
}

// ListarProductos devuelve todos los productos activos.
func (u *ProductoUsecase) ListarProductos(ctx context.Context) ([]domain.Producto, error) {
	return u.repo.List(ctx)
}

// ActualizarStock es un buen ejemplo de POR QUÉ separamos domain y
// usecase: acá se orquesta el flujo completo (buscar, validar regla de
// negocio, persistir), pero la regla en sí (que el stock no puede quedar
// negativo) vive en el método ReducirStock del domain, no acá.
func (u *ProductoUsecase) ReducirStock(ctx context.Context, id uuid.UUID, cantidad int) error {
	p, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("no se encontró el producto: %w", err)
	}

	// Acá se aplica la regla de negocio del domain. Si no hay stock
	// suficiente, ReducirStock devuelve domain.ErrStockInsuficiente y
	// cortamos ahí — nunca llegamos a tocar la base de datos.
	if err := p.ReducirStock(cantidad); err != nil {
		return err
	}

	if err := u.repo.Update(ctx, p); err != nil {
		return fmt.Errorf("no se pudo actualizar el stock: %w", err)
	}

	return nil
}

// EliminarProducto hace borrado lógico (lo desactiva).
func (u *ProductoUsecase) EliminarProducto(ctx context.Context, id uuid.UUID) error {
	return u.repo.Delete(ctx, id)
}
