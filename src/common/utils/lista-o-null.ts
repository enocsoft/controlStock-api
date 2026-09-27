// Paridad Go: los slices vacíos serializan como null (el Go usa `var x []T`,
// que es nil cuando no hay filas), no como []. Lo aplican los listar de
// recursos y los campos anidados (Items/Movimientos) en listas.
export function listaONull<T>(lista: T[]): T[] | null {
  return lista.length > 0 ? lista : null;
}