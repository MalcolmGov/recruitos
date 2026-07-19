import {
  BarChart3,
  Briefcase,
  Building2,
  CreditCard,
  Handshake,
  KanbanSquare,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  /** permission resource gating visibility; checked against member role */
  resource?: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

/**
 * Single source of truth for module navigation — consumed by the sidebar and
 * the command palette. New modules register here (and later in the module
 * registry) so navigation, search and licensing stay in sync.
 */
export const navigation: NavGroup[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Recruitment",
    items: [
      { title: "Jobs", href: "/jobs", icon: Briefcase, resource: "job" },
      { title: "Candidates", href: "/candidates", icon: Users, resource: "candidate" },
      { title: "Pipeline", href: "/pipeline", icon: KanbanSquare, resource: "pipeline" },
      { title: "Placements", href: "/placements", icon: Handshake, resource: "placement" },
    ],
  },
  {
    label: "Relationships",
    items: [{ title: "Clients", href: "/clients", icon: Building2, resource: "client" }],
  },
  {
    label: "Insights",
    items: [{ title: "Reports", href: "/reports", icon: BarChart3, resource: "report" }],
  },
  {
    label: "System",
    items: [
      { title: "Billing", href: "/billing", icon: CreditCard, resource: "billing" },
      { title: "Settings", href: "/settings", icon: Settings, resource: "settings" },
    ],
  },
];
