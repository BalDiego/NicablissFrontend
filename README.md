# Nicabliss Hotel PMS - Frontend de Administracion

Aplicacion web cliente para el Sistema de Gestion Hotelera (Property Management System) de Nicabliss Hotel. Esta plataforma permite la administracion operativa en tiempo real de recepcion, cuentas corrientes, comandas de alimentos, solicitudes de lavanderia, control de arqueos de caja y gestion centralizada de usuarios con control de acceso basado en roles (RBAC).

---

## 1. Descripcion General y Proposito

El frontend de Nicabliss ha sido concebido como una Single Page Application (SPA) modular, reactiva y desacoplada del backend. Su proposito principal es proveer a la recepcion y al personal administrativo de una interfaz fluida, intuitiva y de alto desempeno para la ejecucion de procesos criticos del hotel:

- Registro y control de huespedes en estancias activas, reservas y salidas.
- Facturacion, conciliacion de pagos parciales y estado de cuenta por habitacion.
- Comandas de cocina y pedidos gastronomicos con correlativo de orden.
- Gestion de lavanderia con valoracion automatica por volumen de prendas.
- Apertura, control de movimientos y cierre de turnos de caja chica con arqueo.
- Administracion de cuentas de usuario, asignacion de privilegios y politicas de seguridad.

---

## 2. Tecnologias y Herramientas

El proyecto esta construido sobre un stack de tecnologias web modernas enfocadas en estabilidad, velocidad de compilacion y tipado estricto:

| Componente | Tecnologia | Version | Proposito |
| :--- | :--- | :--- | :--- |
| Libreria Base | React | 19.2.x | Construccion de interfaz basada en componentes funcionales y hooks |
| Tipado Estatico | TypeScript | 6.0.x | Verificacion estricta de tipos e interfaces de datos en tiempo de desarrollo |
| Empaquetador / Bundler | Vite | 8.3.x | Servidor de desarrollo con Hot Module Replacement (HMR) y empaquetado Rollup |
| Cliente HTTP | Fetch API / ApiClient | Nativo ES | Modulo propio con inyeccion de tokens Bearer, interceptores y manejo de errores |
| Estilizado | CSS3 Modular Nativo | Nativo | Variables CSS (Custom Properties), Flexbox, CSS Grid y Media Queries |
| Linter | ESLint | 10.x | Verificacion de calidad de codigo y cumplimiento de buenas practicas |

---

## 3. Estructura del Proyecto

La estructura de carpetas implementa el patron de separacion de responsabilidades, aislando la logica de consumo de API (servicios) de los componentes visuales (vistas y layout):

```text
NicablissFrontend/
|-- public/                      # Recursos estaticos servidos directamente
|-- src/
|   |-- assets/                  # Imagenes, logotipos e isotipos del sistema
|   |-- components/              # Componentes reutilizables de estructura
|   |   |-- AppLayout.tsx        # Shell maestro con sidebar, cabecera y drawer movil
|   |   `-- AppLayout.css        # Estilos y comportamiento responsivo del layout
|   |-- services/                # Capa de consumo y abstraccion de la API REST
|   |   |-- apiClient.ts         # Cliente HTTP centralizado con Bearer Token e interceptores
|   |   |-- auth.service.ts      # Manejador de login, token, sesion y perfil actual
|   |   |-- user.service.ts      # CRUD de usuarios y roles del sistema
|   |   |-- guest.service.ts     # CRUD y actualizacion de estancias de huespedes
|   |   |-- billing.service.ts   # Consulta de cuentas, creacion de cargos y abonos
|   |   |-- foodOrder.service.ts # Registro y seguimiento de pedidos de cocina
|   |   |-- laundry.service.ts   # Solicitudes de lavanderia y calculo por prenda
|   |   |-- cash.service.ts      # Apertura, movimientos y arqueo de caja chica
|   |   |-- dashboard.service.ts # Metricas agregadas y transacciones recientes
|   |   `-- types.ts             # Definiciones de tipos e interfaces TypeScript del backend
|   |-- App.tsx                  # Enrutador principal de pantallas y validacion de sesion
|   |-- App.css                  # Estilos globales de vistas base
|   |-- Dashboard.tsx            # Vista ejecutiva con KPIs y resumen en tiempo real
|   |-- Huespedes.tsx            # Directorio de huespedes, filtros de estado y registro
|   |-- Huespedes.css            # Estilos del modulo de huespedes
|   |-- CuentasCobros.tsx        # Modulo de facturacion, pagos parciales y saldos
|   |-- CuentasCobros.css        # Estilos de cuentas y cobros
|   |-- PedidosAlimentos.tsx     # Modulo de comandas de alimentos y restaurante
|   |-- PedidosAlimentos.css     # Estilos de pedidos de alimentos
|   |-- Lavanderia.tsx           # Modulo de recepcion, costo y entrega de prendas
|   |-- Lavanderia.css           # Estilos de lavanderia
|   |-- CajaCierres.tsx          # Modulo de control de caja chica y arqueos de turno
|   |-- CajaCierres.css          # Estilos de caja y movimientos
|   |-- UsuariosRoles.tsx        # Modulo administrativo de usuarios y roles (RBAC)
|   |-- UsuariosRoles.css        # Estilos y modales del modulo de usuarios
|   |-- Login.css                # Estilos de la pantalla de inicio de sesion
|   |-- index.css                # Variables de diseno global, tipografia y reglas responsivas
|   |-- main.tsx                 # Punto de entrada de la aplicacion React
|   `-- types.ts                 # Tipos generales de navegacion y elementos de menu
|-- .env                         # Variables de entorno locales
|-- .env.example                 # Plantilla de variables de entorno requeridas
|-- index.html                   # HTML base con meta tags de viewport
|-- package.json                 # Metadatos del proyecto, scripts y dependencias
|-- tsconfig.json                # Configuracion base de compilacion TypeScript
|-- tsconfig.app.json            # Reglas especificas para el codigo fuente de la aplicacion
|-- tsconfig.node.json           # Reglas de compilacion para scripts de Node / Vite
```

---

## 4. Configuracion y Variables de Entorno

La aplicacion requiere una variable de entorno para establecer el punto de conexion con el servidor backend de Nicabliss.

### Archivo .env

Crea o edita el archivo `.env` en la raiz del proyecto frontend con la siguiente configuracion:

```env
VITE_API_URL=http://localhost:4000/api/v1
```

| Variable | Descripcion | Valor Predeterminado | Requerido |
| :--- | :--- | :--- | :--- |
| VITE_API_URL | Prefijo base de la API REST del backend | http://localhost:4000/api/v1 | Si |

Nota: El cliente HTTP (`apiClient.ts`) cuenta con un mecanismo de respaldo (fallback) que apunta de manera automatica a `http://localhost:4000/api/v1` si la variable no esta presente en el entorno.

---

## 5. Scripts de Ejecucion y Compilacion

En la raiz del directorio del frontend, se pueden ejecutar los siguientes comandos mediante Node.js y npm:

### Instalacion de dependencias
```bash
npm install
```

### Entorno de desarrollo
Inicia el servidor local de desarrollo con recarga automatica en caliente:
```bash
npm run dev
```
Por defecto, la aplicacion estara accesible en:
```text
http://localhost:5173
```

### Compilacion para produccion
Realiza el chequeo de tipos con TypeScript (`tsc -b`) y compila el paquete optimizado en la carpeta `dist/`:
```bash
npm run build
```

### Previsualizacion local de produccion
Ejecuta un servidor web estatico local que sirve el contenido compilado en `dist/`:
```bash
npm run preview
```

### Verificacion de sintaxis y calidad de codigo
Ejecuta el linter ESLint sobre todos los archivos del codigo fuente:
```bash
npm run lint
```

---

## 6. Arquitectura de Servicios y Comunicacion con el Backend

El frontend implementa una capa de abstraccion de red centralizada a traves de `ApiClient` en `src/services/apiClient.ts`:

### 1. Inyeccion Automatica de Autenticacion
Cada peticion HTTP saliente verifica la existencia de un token JWT en el almacenamiento local (`localStorage.getItem("nicabliss_token")`). De existir, inyecta la cabecera correspondiente:
```http
Authorization: Bearer <token_jwt>
```

### 2. Manejo de Expiracion de Sesion (HTTP 401)
Si el servidor backend responde con codigo de estado `401 Unauthorized` (token expirado o invalido), el cliente HTTP:
1. Elimina las claves `nicabliss_token` y `nicabliss_user` del `localStorage`.
2. Emite un evento global en la ventana: `window.dispatchEvent(new CustomEvent("nicabliss:session-expired"))`.
3. El componente `App.tsx` captura el evento y redirige de inmediato al usuario al formulario de autenticacion con el mensaje correspondiente.

### 3. Excepciones de Red Tipadas (ApiError)
Los errores provenientes del servidor o de desconexion de red se procesan mediante la clase `ApiError`, extrayendo el mensaje semantico y el codigo interno devuelto por la API para presentarlo de manera limpia en la interfaz.

---

## 7. Modulos Funcionales del Sistema

### 1. Modulo de Autenticacion (src/App.tsx, src/Login.css)
- Autenticacion mediante credenciales (nombre de usuario y contrasena).
- Mantenimiento de estado persistente durante recargas de pagina mediante verificacion asincrona contra el endpoint `/auth/me`.
- Cierre de sesion seguro con revocacion de tokens locales.

### 2. Modulo de Dashboard Ejecutivo (src/Dashboard.tsx)
- Visualizacion en tiempo real de 4 indicadores de desempeno: Ingresos del dia, Cuentas abiertas, Pedidos pendientes y Solicitudes de lavanderia.
- Lista interactiva de las transacciones financieras mas recientes.
- Visualizacion y seguimiento de estado de comandas gastronómicas pendientes de entrega.
- Acceso directo a generacion de reportes e impresion.

### 3. Modulo de Huespedes y Estancias (src/Huespedes.tsx)
- Cuadricula de estado de estancias: Total de registros, Estancias activas, Reservados y Finalizados.
- Pestañas de filtrado rapido por estado con conteo en vivo.
- Filtro de busqueda reactiva por nombre de huesped, numero de identificacion o habitacion.
- Registro de nuevos huespedes con asignacion de habitacion y validacion estricta de coherencia temporal (fecha de salida posterior o igual a la de entrada).
- Modificacion de estados de estancia mediante selector con alto contraste.

### 4. Modulo de Cuentas y Cobros (src/CuentasCobros.tsx)
- Indicadores contables: Total Facturado, Total Cobrado y Saldo Global Pendiente.
- Alta de nuevas cuentas o cargos asignados a un huesped y habitacion.
- Registro de abonos parciales y liquidacion completa de saldo pendiente.
- Calculo y actualizacion automatica de estados de cobro: Pendiente, Parcial o Pagado.

### 5. Modulo de Comandas y Restaurante (src/PedidosAlimentos.tsx)
- Control del ciclo de vida del pedido: Pendiente, En preparacion, En camino, Entregado y Cancelado.
- Generacion automatica de identificador correlativo de pedido (ejemplo: #PED-024).
- Desglose de productos solicitados, habitacion de entrega y monto total.

### 6. Modulo de Lavanderia (src/Lavanderia.tsx)
- Registro de solicitudes con desglose tipado por prenda (Camisas, Pantalones, Ropa interior, Toallas, etc.).
- Calculo automatico del total de prendas y cotizacion exacta segun la tarifa fija de $0.50 por prenda.
- Seguimiento de estados del proceso de lavado y observaciones tecnicas de planchado.

### 7. Modulo de Caja Chica y Turnos (src/CajaCierres.tsx)
- Control estricto de turnos: impide la apertura concurrente de multiples sesiones de caja.
- Registro de movimientos tipados de entrada (Ingreso) y salida (Egreso) clasificados por concepto contable (Hospedaje, Alimentos, Lavanderia, Gastos Operativos) y forma de pago (Efectivo, Tarjeta, Transferencia).
- Arqueo final de turno con calculo automatico de diferencia entre efectivo esperado segun balance y efectivo contado declarado.

### 8. Modulo de Gestion de Usuarios y Roles (src/UsuariosRoles.tsx)
- Modulo administrativo de acceso exclusivo para usuarios con rol ADMIN.
- Metricas por nivel de acceso: Administradores, Recepcionistas y Personal de Staff.
- Directorio de usuarios con filtros por rol y busqueda por nombre, @username o correo electronico.
- Formulario de alta con asignacion de rol y cifrado de credenciales.
- Formulario de edicion para actualizacion de perfiles y reasignacion de contrasenas.
- Politicas de seguridad integradas:
  - Proteccion de la cuenta del Administrador Principal contra eliminacion o degradacion de rol.
  - Bloqueo de autoeliminacion de la cuenta que mantiene la sesion activa.

---

## 8. Diseno Responsivo y Accesibilidad

El sistema implementa una adaptacion fluida para diferentes factores de forma:

- **Dispositivos de Escritorio (ancho mayor a 1024px):** Disposicion de metricas en cuatro columnas, barra lateral fija expandible/colapsable y tablas con visualizacion completa de datos.
- **Tablets (ancho entre 769px y 1024px):** Cuadriculas adaptadas a dos columnas simetricas y reordenamiento de controles.
- **Dispositivos Moviles (ancho menor o igual a 768px):**
  - Barra lateral oculta convertible en menu tipo drawer deslizable mediante boton hamburguesa en cabecera.
  - Cierre automatico del menu al seleccionar una opcion o al tocar el fondo desenfocado (backdrop).
  - Apilamiento vertical de formularios en una sola columna.
  - Dimensionamiento de fuentes en inputs a 16px para prevenir el zoom automatico en navegadores iOS Safari.
  - Contenedores de modales con limite de altura (`max-height: calc(100dvh - 32px)`), posicionamiento centrado seguro y desplazamiento vertical interno (`overflow-y: auto`), evitando cualquier recorte en pantallas de baja altura.
  - Tablas con desplazamiento horizontal suave (`-webkit-overflow-scrolling: touch`).
