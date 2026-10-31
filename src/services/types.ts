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
  category?: string;
  description?: string;
  pricePerNight: number;
  active: boolean;
  available: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Reservation {
  id: number;
  codigoReserva: string;
  customerId: number;
  customerName: string;
  customerDocument: string;
  roomId: number;
  habitacion: string;
  roomCategory?: string;
  fechaEntrada: string;
  fechaSalida: string;
  nights: number;
  roomPricePerNight: number;
  lodgingTotal: number;
  totalReserva: number;
  depositType: "PERCENTAGE" | "FIXED";
  depositValue: number;
  depositoRequerido: number;
  abonado: number;
  saldo: number;
  estado: ReservationStatus;
  checkInAt?: string;
  checkOutAt?: string;
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
  invoiceId?: number;
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
  customerId?: number;
  reservationId?: number;
  reservationCode?: string;
  stayId?: number;
  serviceConsumptionId?: number;
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
  customerId?: number;
  stayId?: number;
  serviceConsumptionId?: number;
}

export type StayStatus = "Activa" | "Finalizada" | "Cancelada";

export interface Stay {
  id: number;
  reservationId: number;
  reservationCode: string;
  customerId: number;
  customerName: string;
  customerDocument: string;
  roomId: number;
  habitacion: string;
  checkInAt: string;
  checkOutAt?: string;
  estado: StayStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface StayPayment {
  id: number;
  paymentNumber: string;
  amount: number;
  paymentMethod: MetodoPago;
  reference?: string;
  kind: "PAYMENT" | "REVERSAL";
  status: "POSTED" | "REVERSED";
  paymentDate: string;
  invoiceId?: number;
  receivedByName: string;
}

export interface StayAccount {
  stayId: number;
  reservationId: number;
  reservationCode: string;
  reservationStatus: ReservationStatus;
  customerId: number;
  customerName: string;
  customerDocument: string;
  roomId: number;
  habitacion: string;
  checkInAt: string;
  checkOutAt?: string;
  status: StayStatus;
  lodging: number;
  services: number;
  pendingServicesAmount: number;
  total: number;
  paid: number;
  balance: number;
  billableServiceCount: number;
  pendingServiceCount: number;
  payments: StayPayment[];
}

export interface ReservationAccountInvoice {
  id: number;
  invoiceNumber: string;
  status: InvoiceStatus;
  total: number;
  paidAmount: number;
  balance: number;
}

export interface ReservationAccount {
  stayId?: number;
  reservationId: number;
  reservationCode: string;
  reservationStatus: ReservationStatus;
  customerId: number;
  customerName: string;
  customerDocument: string;
  roomId: number;
  habitacion: string;
  roomCategory?: string;
  fechaEntrada: string;
  fechaSalida: string;
  nights: number;
  roomPricePerNight: number;
  checkInAt?: string;
  checkOutAt?: string;
  status: StayStatus | ReservationStatus;
  lodging: number;
  services: number;
  pendingServicesAmount: number;
  total: number;
  paid: number;
  balance: number;
  billableServiceCount: number;
  pendingServiceCount: number;
  consumptions: ServiceConsumption[];
  payments: StayPayment[];
  invoice?: ReservationAccountInvoice;
}

export interface CustomerHistorySummary {
  stayCount: number;
  activeStayCount: number;
  totalCharged: number;
  totalPaid: number;
  outstandingBalance: number;
}

export interface CustomerHistory {
  customer: Customer;
  activeStay: StayAccount | null;
  stays: StayAccount[];
  summary: CustomerHistorySummary;
}

export type ServiceCategory =
  | "Alimentos"
  | "Lavandería"
  | "Hospedaje"
  | "Minibar"
  | "Transporte"
  | "Otro";

export type ConsumptionStatus =
  | "Registrado"
  | "EnProceso"
  | "Entregado"
  | "Consumido"
  | "Cancelado";

export interface ServiceCatalog {
  id: number;
  nombre: string;
  categoria: ServiceCategory;
  descripcion?: string;
  precio: number;
  impuesto: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceConsumption {
  id: number;
  stayId: number;
  customerId: number;
  serviceId: number;
  serviceName: string;
  categoria: ServiceCategory;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  estado: ConsumptionStatus;
  observaciones?: string;
  sourceType: "DIRECT" | "FOOD_ORDER" | "LAUNDRY_ORDER";
  sourceId?: number;
  consumedAt: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = "Borrador" | "Emitida" | "Parcial" | "Pagada" | "Anulada";

export interface InvoiceItem {
  id: number;
  invoiceId: number;
  serviceType: "LODGING" | "SERVICE";
  sourceId: number;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  customerId: number;
  customerName: string;
  customerDocument: string;
  reservationId: number;
  reservationCode: string;
  stayId: number;
  room: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paidAmount: number;
  balance: number;
  status: InvoiceStatus;
  issuedAt?: string;
  issuedBy?: string;
  issuedByName?: string;
  voidedAt?: string;
  voidedBy?: string;
  voidReason?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  items: InvoiceItem[];
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
  paymentId?: number;
  customerId?: number;
  reservationId?: number;
  invoiceId?: number;
  createdBy?: string;
  createdByName?: string;
  source?: "MANUAL" | "PAYMENT" | "REVERSAL" | "MIGRATION";
}

export interface CashSession {
  id: number;
  responsable: string;
  openedBy?: string;
  openedByName?: string;
  closedBy?: string;
  closedByName?: string;
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

export type ReconciliationIssue =
  | "MISSING_MOVEMENT"
  | "MOVEMENT_WRONG_SESSION"
  | "AMOUNT_MISMATCH"
  | "DIRECTION_MISMATCH"
  | "METHOD_MISMATCH"
  | "USER_MISMATCH";

export interface CashReconciliationItem {
  paymentId: number;
  paymentNumber: string;
  kind: "PAYMENT" | "REVERSAL";
  status: "POSTED" | "REVERSED";
  method: MetodoPago;
  paymentDate: string;
  userId: string;
  userName: string;
  expectedAmount: number;
  movementId?: number;
  movementAmount: number;
  difference: number;
  issues: ReconciliationIssue[];
}

export interface CashReconciliation {
  session: {
    id: number;
    responsable: string;
    apertura: string;
    cierre?: string;
    isClosed: boolean;
    fondoInicial: number;
  };
  filters: { method?: MetodoPago; userId?: string };
  totals: CashReconciliationTotals;
  sessionIntegrity: {
    storedCashIncome: number;
    computedCashIncome: number;
    cashIncomeDifference: number;
    storedDigitalIncome: number;
    computedDigitalIncome: number;
    digitalIncomeDifference: number;
    storedCashOutput: number;
    computedCashOutput: number;
    cashOutputDifference: number;
    storedExpectedCash: number;
    computedExpectedCash: number;
    expectedCashDifference: number;
    balanced: boolean;
  };
  mismatchCount: number;
  missingMovementCount: number;
  orphanMovementCount: number;
  balanced: boolean;
  items: CashReconciliationItem[];
  orphanMovements: Array<{
    movementId: number;
    paymentId?: number;
    paymentNumber?: string;
    method: MetodoPago;
    userId?: string;
    userName?: string;
    amount: number;
    source: "PAYMENT" | "REVERSAL";
  }>;
}

export interface CashReconciliationTotals {
  paymentCount: number;
  payments: number;
  reversals: number;
  netPayments: number;
  automaticMovementCount: number;
  movementIncome: number;
  movementReversals: number;
  netMovements: number;
  difference: number;
  manualIncome: number;
  manualOutput: number;
}

export interface CashByMethodRow extends CashReconciliationTotals {
  method: MetodoPago;
  mismatchCount: number;
  orphanMovementCount: number;
  balanced: boolean;
}

export interface CashByUserRow extends CashReconciliationTotals {
  userId: string;
  userName: string;
  mismatchCount: number;
  orphanMovementCount: number;
  balanced: boolean;
}

export interface CashByMethodReport {
  sessionId: number;
  userId?: string;
  rows: CashByMethodRow[];
}

export interface CashByUserReport {
  sessionId: number;
  method?: MetodoPago;
  rows: CashByUserRow[];
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

export interface DailyDashboardReport {
  date: string;
  filters: { method?: MetodoPago; category?: string };
  income: { collected: number; invoiced: number; pending: number; advances: number };
  byMethod: Array<{ method: MetodoPago; amount: number; operationCount: number }>;
  byCategory: Array<{ category: string; amount: number }>;
  activeCustomers: number;
  reservations: { created: number; arrivals: number; departures: number };
  receivables: { count: number; amount: number };
  cash: { open: boolean; sessionId?: number; responsible?: string; openedAt?: string };
  recentPayments: Array<{
    paymentNumber: string;
    customerName: string;
    reservationCode?: string;
    method: MetodoPago;
    kind: "PAYMENT" | "REVERSAL";
    amount: number;
    paymentDate: string;
  }>;
  updatedAt: string;
}

export interface ServicesReport {
  from: string;
  to: string;
  category?: string;
  totals: { consumptionCount: number; quantity: number; revenue: number };
  items: Array<{
    category: string;
    serviceName: string;
    consumptionCount: number;
    quantity: number;
    revenue: number;
  }>;
}

export interface MonthlyRevenueReportData {
  year: number;
  totals: { invoiced: number; collected: number; pending: number };
  months: Array<{ month: number; invoiced: number; collected: number; pending: number }>;
}

export interface ReceivablesReportData {
  totals: { count: number; balance: number };
  items: Array<{
    invoiceId: number;
    invoiceNumber: string;
    customerId: number;
    customerName: string;
    customerDocument: string;
    reservationCode: string;
    room: string;
    total: number;
    paid: number;
    balance: number;
    status: string;
    issuedAt: string;
    ageDays: number;
  }>;
}

export interface RevenueCategoriesReport {
  from: string;
  to: string;
  category?: string;
  total: number;
  items: Array<{ category: string; lineCount: number; invoiced: number }>;
}

export type AttendanceStatus = "Presente" | "Tarde" | "Ausente" | "Permiso" | "Incapacidad";
export interface AttendanceRecord { id: number; userId: string; userName: string; attendanceDate: string; checkIn?: string; checkOut?: string; status: AttendanceStatus; justification?: string; registeredBy: string; createdAt: string; updatedAt: string; }
export interface StaffSchedule { id: number; userId: string; userName: string; dayOfWeek: number; startTime: string; endTime: string; active: boolean; }
export interface AttendanceReportData { totals: { records: number; late: number; absences: number }; users: Array<{ userId: string; userName: string; presente: number; tarde: number; ausente: number; permiso: number; incapacidad: number; total: number }>; records: AttendanceRecord[]; }

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

export interface HistoricalAccount {
  id: number;
  sourceTable: string;
  sourceId: string;
  customerId?: number;
  reservationId?: number;
  stayId?: number;
  guestName: string;
  roomName: string;
  concept: string;
  total: number;
  paid: number;
  balance: number;
  legacyStatus: string;
  legacyDate: string;
  historicalPaymentMethod?: string;
  historicalPaymentRecordedAt?: string;
  paymentDateBasis?: string;
  needsReview: boolean;
  reviewNotes?: string;
  migratedAt: string;
}

export interface HistoricalAccountSummary {
  accountCount: number;
  openCount: number;
  total: number;
  paid: number;
  balance: number;
}

export interface LegacyReview {
  id: number;
  sourceTable: string;
  sourceId: string;
  targetTable?: string;
  targetId?: string;
  status: "REVIEW" | "SKIPPED";
  notes?: string;
  resolution?: "ACCEPTED_UNLINKED";
  resolvedBy?: string;
  resolvedAt?: string;
  sourceData?: Record<string, unknown>;
}
