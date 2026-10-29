import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const apiUrl = "http://127.0.0.1:4100/api/v1";

test.describe.serial("flujos críticos del PMS", () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  async function token(): Promise<string> {
    const value = await page.evaluate(() => localStorage.getItem("nicabliss_token"));
    if (!value) throw new Error("No existe un token autenticado para preparar el flujo E2E");
    return value;
  }

  async function api(path: string, options: { method?: string; data?: unknown } = {}) {
    const response = await context.request.fetch(`${apiUrl}${path}`, {
      method: options.method ?? "GET",
      data: options.data,
      headers: { Authorization: `Bearer ${await token()}` },
    });
    expect(response.ok(), `${options.method ?? "GET"} ${path}: ${await response.text()}`).toBeTruthy();
    return response.json();
  }

  async function confirmOperation() {
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Confirmar" }).click();
  }

  test("Login → Crear reserva → Registrar anticipo → Check-in", async () => {
    await page.goto("/login");
    await page.getByLabel("Usuario").fill("admin");
    await page.getByLabel("Contraseña").fill("12345");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page.getByRole("heading", { name: "Resumen financiero diario" })).toBeVisible();

    await api("/cash-register/open", {
      method: "POST",
      data: { fondoInicial: 100 },
    });

    await page.goto("/customers");
    await page.getByRole("button", { name: "+ Nuevo cliente" }).click();
    const customerDialog = page.getByRole("dialog");
    await customerDialog.getByLabel("Nombre *").fill("Cliente E2E");
    await customerDialog.getByLabel("Apellido").fill("Playwright");
    await customerDialog.getByLabel("Documento *").fill("E2E-2026-001");
    await customerDialog.getByRole("button", { name: "Guardar cliente" }).click();
    await expect(page.getByRole("heading", { name: "Cliente E2E Playwright" })).toBeVisible();

    await page.getByRole("link", { name: "Crear reserva" }).click();
    await page.getByLabel("Total de reserva (USD) *").fill("200");
    await page.getByLabel("Entrada *").fill("2035-06-10");
    await page.getByLabel("Salida *").fill("2035-06-12");
    await expect(page.getByLabel("Habitación disponible *").locator("option")).not.toHaveCount(1);
    await page.getByLabel("Habitación disponible *").selectOption({ index: 1 });
    await expect(page.getByText("Anticipo estimado: $100.00")).toBeVisible();
    await page.getByRole("button", { name: "Crear reserva" }).click();
    await expect(page.getByText("Anticipo requerido")).toBeVisible();
    await expect(page.getByText("Pendiente", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Registrar pago" }).click();
    const paymentDialog = page.getByRole("dialog");
    await paymentDialog.getByLabel("Monto (USD) *").fill("100");
    await paymentDialog.getByLabel("Método *").selectOption("Transferencia");
    await paymentDialog.getByLabel("Referencia *").fill("E2E-ANTICIPO-001");
    await paymentDialog.getByRole("button", { name: "Confirmar pago" }).click();
    await expect(page.getByRole("button", { name: "Registrar check-in" })).toBeVisible();

    await page.getByRole("button", { name: "Registrar check-in" }).click();
    await confirmOperation();
    await expect(page.getByText("Estado").first()).toBeVisible();
    await expect(page.getByText("Activa", { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/stays\/\d+$/);
  });

  test("Check-in → Agregar servicio → Emitir factura → Registrar saldo", async () => {
    await page.getByRole("link", { name: "Gestionar servicios" }).click();
    await page.getByRole("button", { name: "+ Agregar servicio" }).click();
    const serviceDialog = page.getByRole("dialog");
    await serviceDialog.getByLabel("Servicio *").selectOption("1");
    await serviceDialog.getByLabel("Cantidad *").fill("2");
    await serviceDialog.getByLabel("Precio unitario especial (opcional)").fill("12.50");
    await serviceDialog.getByLabel("Observaciones").fill("Servicio E2E entregado");
    await serviceDialog.getByRole("button", { name: "Agregar servicio" }).click();
    const serviceRow = page.getByRole("row").filter({ hasText: "Pedido de alimentos" });
    await expect(serviceRow).toContainText("$25.00");
    await serviceRow.getByRole("combobox").selectOption("Entregado");
    await expect(serviceRow.getByRole("combobox")).toHaveValue("Entregado");

    await page.getByRole("link", { name: "← Volver a la estancia" }).click();
    await page.getByRole("button", { name: "Ver cuenta / facturar" }).click();
    await expect(page.getByText("COMPROBANTE INTERNO · NO ES FACTURA FISCAL")).toBeVisible();
    await expect(page.locator(".invoice-total")).toContainText("$225.00");
    await page.getByRole("button", { name: "Emitir" }).click();
    await confirmOperation();
    await expect(page.locator(".invoice-preview-header")).toContainText("Parcial");

    await page.getByRole("button", { name: "Registrar pago" }).click();
    const invoicePayment = page.getByRole("dialog");
    await expect(invoicePayment.getByLabel("Monto (USD) *")).toHaveValue("125.00");
    await invoicePayment.getByLabel("Método *").selectOption("Tarjeta");
    await invoicePayment.getByLabel("Referencia *").fill("E2E-SALDO-001");
    await invoicePayment.getByRole("button", { name: "Confirmar pago" }).click();
    await expect(page.locator(".invoice-preview-header")).toContainText("Pagada");
    await expect(page.locator(".invoice-balance")).toContainText("$0.00");
  });

  test("Abrir caja → Recibir pago → Cerrar caja", async () => {
    const current = await api("/cash-register/current");
    await api("/cash-register/close", {
      method: "POST",
      data: { efectivoContado: current.data.efectivoEsperado, observaciones: "Fin de precondición E2E" },
    });

    await page.goto("/cash");
    await expect(page.getByRole("heading", { name: "Caja cerrada" })).toBeVisible();
    await page.getByRole("button", { name: "+ Abrir caja" }).click();
    await expect(page.getByRole("dialog").getByText("Administrador Nicabliss")).toBeVisible();
    await page.getByLabel("Fondo inicial ($)").fill("50");
    await page.getByRole("button", { name: "Abrir caja", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Caja abierta" })).toBeVisible();

    await page.getByRole("button", { name: "+ Registrar movimiento" }).click();
    await page.getByLabel("Descripción").fill("Pago manual E2E");
    await page.getByLabel("Monto ($)").fill("10");
    await page.getByRole("button", { name: "Guardar movimiento" }).click();
    await expect(page.getByText("Pago manual E2E")).toBeVisible();

    await page.getByRole("button", { name: "Realizar cierre" }).click();
    await expect(page.getByText("Conciliación correcta")).toBeVisible();
    await page.getByLabel("Efectivo contado ($)").fill("60");
    await page.getByLabel("Observaciones del cierre").fill("Cierre completo E2E");
    await page.getByRole("button", { name: "Confirmar cierre" }).click();
    await confirmOperation();
    await expect(page.getByRole("heading", { name: "Caja cerrada" })).toBeVisible();
  });

  test("Consultar dashboard → Filtrar ingresos mensuales", async () => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Resumen financiero diario" })).toBeVisible();
    await expect(page.getByText("Cobrado", { exact: true }).first()).toBeVisible();
    await page.getByRole("button", { name: "Ver reportes" }).click();
    await page.getByRole("button", { name: "Mensual" }).click();
    const year = page.getByLabel("Año");
    await year.fill("2025");
    await year.fill("2026");
    await expect(page.getByRole("heading", { name: "Ingresos mensuales · 2026" })).toBeVisible();
    await expect(page.getByRole("row", { name: /Octubre/ })).toBeVisible();
    await expect(page.getByLabel("Categoría")).toHaveCount(0);
    await expect(page.getByLabel("Método de cobro")).toHaveCount(0);

    await page.getByRole("button", { name: "Servicios" }).click();
    await expect(page.getByLabel("Categoría")).toBeVisible();
    await expect(page.getByLabel("Método de cobro")).toHaveCount(0);

    await page.getByRole("button", { name: "Cuentas pendientes" }).click();
    await expect(page.getByLabel("Desde")).toHaveCount(0);
    await expect(page.getByLabel("Categoría")).toHaveCount(0);
    await expect(page.getByLabel("Método de cobro")).toHaveCount(0);

    await page.getByRole("button", { name: "Diario" }).click();
    await page.getByLabel("Categoría").selectOption("Alimentos");
    await page.getByLabel("Método de cobro").selectOption("Transferencia");
    await expect(page.getByText("Categoría Alimentos aplicada a facturación")).toBeVisible();
    await expect(page.getByText("Método Transferencia aplicado solo a cobros y anticipos")).toBeVisible();

    await page.getByLabel("Periodo").selectOption("daily");
    const [dailyDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Descargar Excel" }).click(),
    ]);
    expect(dailyDownload.suggestedFilename()).toMatch(/nicabliss-reporte-diario-\d{4}-\d{2}-\d{2}\.xlsx/);

    await page.getByLabel("Periodo").selectOption("weekly");
    const [weeklyDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Descargar Excel" }).click(),
    ]);
    expect(weeklyDownload.suggestedFilename()).toMatch(/nicabliss-reporte-semanal-\d{4}-\d{2}-\d{2}-a-\d{4}-\d{2}-\d{2}\.xlsx/);

    await page.getByLabel("Periodo").selectOption("monthly");
    await page.getByLabel("Mes a exportar").fill("2026-10");
    const [monthlyDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Descargar Excel" }).click(),
    ]);
    expect(monthlyDownload.suggestedFilename()).toBe("nicabliss-reporte-mensual-2026-10.xlsx");
  });

  test("Registrar entrada → Registrar salida", async () => {
    await page.goto("/attendance");
    await page.getByRole("button", { name: "Registrar entrada" }).click();
    await confirmOperation();
    await expect(page.getByText("Entrada registrada")).toBeVisible();
    await page.getByRole("button", { name: "Registrar salida" }).click();
    await confirmOperation();
    await expect(page.getByText("Salida registrada")).toBeVisible();
    await expect(page.getByRole("button", { name: "Registrar entrada" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Registrar salida" })).toBeDisabled();
    await expect(page.getByText("Pendiente", { exact: true })).toHaveCount(0);
  });

  test("Administrador → Consultar conciliación heredada", async () => {
    await page.goto("/legacy-administration");
    await expect(page.getByRole("heading", { name: "Conciliación de datos heredados" })).toBeVisible();
    await expect(page.getByText("Saldo histórico")).toBeVisible();
    await page.getByRole("button", { name: /Revisiones/ }).click();
    await expect(page.getByText("No hay revisiones pendientes.")).toBeVisible();
  });
});
