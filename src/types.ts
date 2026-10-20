export type Pantalla =
  | "dashboard"
  | "huespedes"
  | "cobros"
  | "pedidos"
  | "lavanderia"
  | "caja"
  | "usuarios";

export type NavItem = {
  id: Pantalla;
  label: string;
  icon: string;
  badge?: number | string;
  badgeColor?: string;
  eyebrow?: string;
};
