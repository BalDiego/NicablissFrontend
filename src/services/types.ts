export type UserRole = "ADMIN" | "RECEPTIONIST" | "STAFF";

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Customer {
  id: number;
  nombre: string;
  apellido?: string;
  documento: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReservationStatus =
  | "Pendiente"
  | "Confirmada"
  | "Cancelada"
  | "CheckIn"
  | "Finalizada"
  | "NoShow";

export interface Room {
  id: number;
  code: string;
  name: string;
  active: boolean;
  available: boolean;
}

export interface Reservation {
  id: number;
  codigoReserva: string;
  customerId: number;
  customerName: string;
  customerDocument: string;
  roomId: number;
  habitacion: string;
  fechaEntrada: string;
  fechaSalida: string;
  totalReserva: number;
  depositType: "PERCENTAGE" | "FIXED";
  depositValue: number;
  depositoRequerido: number;
  abonado: number;
  saldo: number;
  estado: ReservationStatus;
  observaciones?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: number;
  paymentNumber: string;
  customerId: number;
  reservationId?: number;
  amount: number;
  paymentMethod: MetodoPago;
  reference?: string;
  kind: "PAYMENT" | "REVERSAL";
  status: "POSTED" | "REVERSED";
  reversesPaymentId?: number;
  paymentDate: string;
  receivedBy: string;
  receivedByName: string;
  cashSessionId: number;
  voidedAt?: string;
  voidReason?: string;
  createdAt: string;
}

export interface PaymentReceipt {
  paymentNumber: string;
  amount: number;
  paymentMethod: MetodoPago;
  reference?: string;
  paymentDate: string;
  kind: "PAYMENT" | "REVERSAL";
  status: "POSTED" | "REVERSED";
  receivedByName: string;
  reservationCode: string;
  room: string;
  customerName: string;
  customerDocument: string;
}

export interface Guest {
  id: number;
  nombre: string;
  documento: string;
  habitacion: string;
  entrada: string;
  salida: string;
  estado: "Activo" | "Finalizado" | "Reservado";
  createdAt?: string;
}

export interface BillingAccount {
  id: number;
  huesped: string;
  habitacion: string;
  concepto: string;
  total: number;
  pagado: number;
  saldo: number;
  estado: "Pagado" | "Pendiente" | "Parcial";
  fecha: string;
}

export interface BillingSummary {
  totalFacturado: number;
  totalCobrado: number;
  saldoPendiente: number;
}

export interface BillingResponse {
  cuentas: BillingAccount[];
  resumen: BillingSummary;
}

export interface FoodOrder {
  id: number;
  orderCode: string;
  huesped: string;
  habitacion: string;
  productos: string;
  total: number;
  estado: "Pendiente" | "En preparación" | "En camino" | "Entregado" | "Cancelado";
  fecha: string;
}

export interface DetallePrenda {
  tipo: string;
  cantidad: number;
}

export interface LaundryOrder {
  id: number;
  huesped: string;
  habitacion: string;
  prendas: DetallePrenda[];
  totalPrendas: number;
  total: number;
  estado: "Pendiente" | "En proceso" | "Listo" | "Entregado" | "Cancelado";
  fecha: string;
  observaciones: string;
}

export type TipoMovimiento = "Ingreso" | "Salida";
export type ConceptoMovimiento =
  | "Hospedaje"
  | "Alimentos"
  | "Lavandería"
  | "Otro ingreso"
  | "Gasto operativo"
  | "Retiro de efectivo";
export type MetodoPago = "Efectivo" | "Transferencia" | "Tarjeta";

export interface CashMovement {
  id: number;
  fecha: string;
  tipo: TipoMovimiento;
  concepto: ConceptoMovimiento;
  descripcion: string;
  metodo: MetodoPago;
  monto: number;
}

export interface CashSession {
  id: number;
  responsable: string;
  apertura: string;
  cierre?: string;
  fondoInicial: number;
  ingresosEfectivo: number;
  ingresosDigitales: number;
  salidasEfectivo: number;
  efectivoEsperado: number;
  efectivoContado?: number;
  diferencia?: number;
  observaciones: string;
  isClosed: boolean;
  movimientos: CashMovement[];
}

export interface DashboardStat {
  label: string;
  value: string;
  detail: string;
  code: string;
  className: string;
}

export interface DashboardMetrics {
  stats: DashboardStat[];
  activeStays: number;
  cashRegisterActive: boolean;
  recentTransactions: {
    guest: string;
    service: string;
    date: string;
    amount: string;
    status: string;
  }[];
}

export interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role?: "ADMIN" | "RECEPTIONIST" | "STAFF";
}

export interface UpdateUserPayload {
  username?: string;
  email?: string;
  password?: string;
  fullName?: string;
  role?: "ADMIN" | "RECEPTIONIST" | "STAFF";
}
