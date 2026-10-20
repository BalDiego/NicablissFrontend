export type Pantalla =
  | "dashboard"
  | "huespedes"
  | "cobros"
  | "pedidos"
  | "lavanderia"
  | "caja";

export type NavItem = {
  id: Pantalla;
  label: string;
  icon: string;
  badge?: number;
  badgeColor?: string;
  eyebrow?: string;
};
