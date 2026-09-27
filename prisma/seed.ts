// Seed sintético para DESARROLLO y verificación e2e del front.
// NUNCA usar con datos reales. Limpia y recarga la DB de dev (5433):
// usuarios, productos, clientes y proveedores. NO crea cajas ni ventas
// (el walkthrough las abre/crea desde la UI; una caja pre-abierta
// bloquearía la apertura nueva — regla "una sola caja abierta").
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const databaseUrl =
  process.env.DATABASE_URL ?? 'postgresql://comercios:comercios@localhost:5433/comercios?schema=public';

async function main(): Promise<void> {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

  // Limpieza en orden de dependencias (CASCADE no cubre todas las FK declaradas en SQL).
  await prisma.$executeRaw`TRUNCATE TABLE movimientos_caja, movimientos_stock, venta_items, ventas, cajas, compra_items, compras, clientes, proveedores, productos, usuarios CASCADE`;

  const clave = bcrypt.hashSync('clave1234', 10);

  await prisma.usuario.createMany({
    data: [
      { nombre: 'Ana Dueña', email: 'ana@test.local', passwordHash: clave, rol: 'dueño' },
      { nombre: 'Bruno Vendedor', email: 'bruno@test.local', passwordHash: clave, rol: 'empleado' },
      { nombre: 'Carla Cajera', email: 'carla@test.local', passwordHash: clave, rol: 'empleado' },
    ],
  });

  await prisma.producto.createMany({
    data: [
      { sku: 'SKU-001', nombre: 'Café molido 500g', categoria: 'Almacén', precioCosto: 3200, precioVenta: 4800, stockActual: 50, stockMinimo: 10 },
      { sku: 'SKU-002', nombre: 'Azúcar 1kg', categoria: 'Almacén', precioCosto: 1100, precioVenta: 1700, stockActual: 80, stockMinimo: 20 },
      { sku: 'SKU-003', nombre: 'Leche larga vida 1L', categoria: 'Lácteos', precioCosto: 900, precioVenta: 1400, stockActual: 60, stockMinimo: 15 },
      { sku: 'SKU-004', nombre: 'Harina 0000 1kg', categoria: 'Almacén', precioCosto: 800, precioVenta: 1300, stockActual: 40, stockMinimo: 10 },
      { sku: 'SKU-005', nombre: 'Yerba mate 1kg', categoria: 'Almacén', precioCosto: 2600, precioVenta: 3900, stockActual: 30, stockMinimo: 8 },
      { sku: 'SKU-006', nombre: 'Galletitas saladas', categoria: 'Snacks', precioCosto: 700, precioVenta: 1150, stockActual: 0, stockMinimo: 5 },
    ],
  });

  await prisma.cliente.createMany({
    data: [
      { nombre: 'Cliente Corriente', cuit: '20-30111222-3', telefono: '555-0101', email: 'cliente1@test.local' },
      { nombre: 'Casa Mayorista', cuit: '30-40777888-9', telefono: '555-0202', email: 'mayorista@test.local', saldoCuentaCorriente: 1500 },
      { nombre: 'Consumidor Final', cuit: null, telefono: null, email: null },
    ],
  });

  await prisma.proveedor.createMany({
    data: [
      { nombre: 'Distribuidora Central', cuit: '30-12345678-4', telefono: '555-0303', email: 'ventas@central.test' },
      { nombre: 'Fábrica del Sur', cuit: '30-87654321-1', telefono: '555-0404', email: 'contacto@delsur.test' },
    ],
  });

  const conteos = await Promise.all([
    prisma.usuario.count(),
    prisma.producto.count(),
    prisma.cliente.count(),
    prisma.proveedor.count(),
  ]);

  console.log('Seed sintético OK:', {
    usuarios: conteos[0],
    productos: conteos[1],
    clientes: conteos[2],
    proveedores: conteos[3],
  });
  console.log('Credenciales de prueba: ana@test.local / clave1234 (debido), bruno@test.local / clave1234 (empleado).');

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});