package domain

import (
	"errors"

	"github.com/google/uuid"
)

// ErrStockInsuficiente se devuelve cuando se intenta descontar más stock
// del que hay disponible. Definirlo como variable de paquete permite que
// otras capas (usecase, handler) lo comparen con errors.Is() para decidir
// qué código HTTP devolver, sin depender del texto del mensaje.
var ErrStockInsuficiente = errors.New("stock insuficiente")

// ErrProductoNoEncontrado se devuelve cuando se busca un producto por ID
// y no existe. El repo (postgres) es quien lo genera, pero vive acá en
// domain porque es un concepto de negocio, no un detalle de Postgres —
// mañana podríamos cambiar de base de datos y este error seguiría
// significando lo mismo.
var ErrProductoNoEncontrado = errors.New("producto no encontrado")

// Producto representa un producto del inventario de un comercio.
// Los nombres empiezan con mayúscula (SKU, Nombre, StockActual) porque en
// Go eso es lo que hace que un campo sea "exportado": visible desde otros
// paquetes (usecase, repository, handlers). Si empezara con minúscula,
// solo se podría usar dentro del paquete domain.
type Producto struct {
	ID          uuid.UUID
	SKU         string
	Nombre      string
	Categoria   string
	PrecioCosto float64
	PrecioVenta float64
	StockActual int
	StockMinimo int
	Activo      bool
}

// NuevoProducto es un "constructor": una función normal que arma un
// Producto válido. Go no tiene constructores como otros lenguajes (no hay
// "new Producto(...)"), así que la convención es una función New* que
// hace las validaciones iniciales antes de devolver el struct.
func NuevoProducto(sku, nombre string, precioCosto, precioVenta float64) (*Producto, error) {
	if sku == "" {
		return nil, errors.New("el SKU no puede estar vacío")
	}
	if nombre == "" {
		return nil, errors.New("el nombre no puede estar vacío")
	}
	if precioVenta < 0 || precioCosto < 0 {
		return nil, errors.New("los precios no pueden ser negativos")
	}

	return &Producto{
		ID:          uuid.New(),
		SKU:         sku,
		Nombre:      nombre,
		PrecioCosto: precioCosto,
		PrecioVenta: precioVenta,
		StockActual: 0,
		Activo:      true,
	}, nil
}

// ReducirStock es un "método" de Producto: una función asociada al struct.
// El "(p *Producto)" antes del nombre es el "receiver" — dice "este método
// pertenece a Producto". Usamos *Producto (puntero) y no Producto (valor)
// porque necesitamos MODIFICAR el StockActual original, no una copia.
//
// Esta es la regla de negocio central del módulo: el stock nunca puede
// quedar negativo, y esa validación vive ACÁ — no en el handler, no en el
// repo — así que es imposible saltearla sin pasar por este método.
func (p *Producto) ReducirStock(cantidad int) error {
	if cantidad <= 0 {
		return errors.New("la cantidad a reducir debe ser mayor a cero")
	}
	if cantidad > p.StockActual {
		return ErrStockInsuficiente
	}
	p.StockActual -= cantidad
	return nil
}

// AumentarStock se usa al recibir mercadería de un proveedor.
func (p *Producto) AumentarStock(cantidad int) error {
	if cantidad <= 0 {
		return errors.New("la cantidad a aumentar debe ser mayor a cero")
	}
	p.StockActual += cantidad
	return nil
}

// TieneStockBajo compara contra el mínimo configurado. Es una función que
// solo LEE el struct (no lo modifica), por eso podría recibir "p Producto"
// en vez de "p *Producto" — pero mantenemos puntero por consistencia con
// los demás métodos del mismo struct.
func (p *Producto) TieneStockBajo() bool {
	return p.StockActual <= p.StockMinimo
}
