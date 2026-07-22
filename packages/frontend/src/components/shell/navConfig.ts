export interface NavItem {
  label: string;
  path: string;
  icon: string;
}

export const NAV_STRUCTURE: NavItem[] = [
  { label: "Tasks", path: "/", icon: "dashboard" },
  { label: "Firewall Policy", path: "/tasks/policy", icon: "shield" },
  { label: "Interface Config", path: "/tasks/interface", icon: "network" },
  { label: "Port Assignment", path: "/tasks/port", icon: "sdwan" },
];
