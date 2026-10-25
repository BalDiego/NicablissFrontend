# Nicabliss PMS Frontend

SPA administrativa de Nicabliss construida con React, TypeScript y Vite. Consume la API del PMS para clientes, reservas, pagos, estancias, servicios, facturación interna, caja, reportes, asistencia y usuarios.

## Requisitos e inicio

- Node.js 20 o superior.
- API Nicabliss disponible.

```bash
npm install
copy .env.example .env
npm run dev
```

En desarrollo, si no se define `VITE_API_URL`, se usa `http://localhost:4000/api/v1`. En producción la variable es obligatoria, debe usar HTTPS y terminar en `/api/v1`.

```env
VITE_API_URL=http://localhost:4000/api/v1
VITE_BUSINESS_TIMEZONE=America/Managua
```

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor Vite local. |
| `npm run build` | TypeScript y bundle de producción. |
| `npm run lint` | ESLint. |
| `npm test` | Pruebas unitarias y de componentes con Vitest. |
| `npm run test:watch` | Vitest en modo interactivo. |
| `npm run test:e2e:install` | Instala Chromium para Playwright. |
| `npm run test:e2e` | Ejecuta los seis flujos críticos contra `file:test.db`. |
| `npm run preview` | Sirve el bundle generado. |

## Módulos

- Dashboard financiero diario.
- Clientes y reservas con anticipo configurable.
- Pagos idempotentes, comprobantes y reversiones.
- Check-in, estancias, servicios y check-out.
- Catálogo de servicios.
- Facturas internas consolidadas y PDF.
- Caja, movimientos, conciliación y cierre.
- Reportes diarios, mensuales, servicios y cuentas pendientes.
- Asistencia, ausencias, horarios y reporte mensual.
- Usuarios y roles.
- Cuentas históricas y conciliación auditada de datos heredados (ADMIN).
- Pantallas 401/403, confirmaciones y mensajes globales.

## Rutas y permisos

| Ruta | ADMIN | RECEPTIONIST | STAFF |
| --- | :---: | :---: | :---: |
| `/dashboard` | Sí | Sí | No |
| `/customers`, `/reservations` | Sí | Sí | No |
| `/invoices`, `/cash`, `/reports` | Sí | Sí | No |
| `/stays`, `/food-orders`, `/laundry` | Sí | Sí | Sí |
| `/attendance` | Sí | Sí | Sí |
| `/service-catalog` | Sí | No | No |
| `/attendance/report`, `/attendance/schedules` | Sí | No | No |
| `/users` | Sí | No | No |
| `/legacy-administration` | Sí | No | No |

La navegación oculta módulos no autorizados y `RoleGuard` redirige intentos directos a `/403`. `STAFF` inicia en asistencia; los demás roles, en dashboard.

## Comportamiento de seguridad y UX

- El token se adjunta como Bearer en el cliente HTTP.
- Una respuesta `401` limpia la sesión y emite `nicabliss:session-expired`.
- Una respuesta `403` conserva la sesión y muestra el error de autorización.
- Operaciones destructivas o irreversibles solicitan confirmación.
- Los formularios críticos bloquean reenvíos mientras están procesando.
- Vistas y botones presentan estados de carga y errores recuperables.
- Los pagos crean una clave de idempotencia por formulario.
- Las fechas operativas usan `America/Managua`, no la fecha UTC del navegador.

## Configuración de producción

Definir en la plataforma de despliegue las variables de `.env.production.example`:

```env
VITE_API_URL=https://<backend-production-domain>/api/v1
VITE_BUSINESS_TIMEZONE=America/Managua
VITE_STRICT_PRODUCTION=true
```

Los builds de CI/Vercel fallan si la API no es HTTPS, apunta a localhost o no termina en `/api/v1`. `VITE_STRICT_PRODUCTION=true` aplica la misma validación en un build manual. Un build local normal puede servirse con `npm run preview` contra la API local sin debilitar la validación de despliegue. El dominio del frontend debe incluirse a su vez en `CORS_ORIGIN` del backend.

El `vercel.json` de la raíz fija el preset Vite, instalación reproducible con `npm ci`, salida `dist`, fallback SPA, cabeceras de seguridad y caché larga solo para archivos versionados de `/assets`.

## Pruebas

### Unitarias y componentes

```bash
npm test
```

Cubren permisos, cliente API, servicios, rutas 403, carga, errores y prevención de doble envío.

### End-to-end

La configuración `playwright.config.ts` inicia automáticamente:

1. la API en `127.0.0.1:4100`, con `NODE_ENV=test` y exactamente `file:test.db`;
2. Vite en `127.0.0.1:4173`, apuntando a esa API.

Cada ejecución elimina y recrea únicamente `nicabliss_api/test.db`, aplica migraciones y carga datos de prueba. El servidor E2E rechaza cualquier otra URL de base.

```bash
npm run test:e2e:install
npm run test:e2e
```

Flujos verificados:

1. Login → crear reserva → registrar anticipo → check-in.
2. Check-in → agregar servicio → emitir factura → registrar saldo.
3. Abrir caja → recibir pago → cerrar caja.
4. Consultar dashboard → filtrar ingresos mensuales.
5. Registrar entrada → registrar salida.
6. Consultar la conciliación heredada con rol ADMIN.

Los artefactos de fallo se escriben en `test-results/` y el reporte HTML en `playwright-report/`; ambos están ignorados por Git.

## Puerta de calidad

```bash
npm test
npm run test:e2e
npm run lint
npm run build
npm audit --omit=dev
```

No se deben usar credenciales ni bases remotas para pruebas automatizadas.
