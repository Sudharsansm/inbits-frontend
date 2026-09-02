import { Home, Newspaper, Mic, Briefcase, Search, Bell, Menu as MenuIcon } from "lucide-react";

export const bottomNav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/updates", label: "Updates", icon: Newspaper },
  { to: "/stands", label: "Stands", icon: Mic },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
] as const;

export const sideNav = [
  ...bottomNav,
  { to: "/search", label: "Search", icon: Search },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/menu", label: "More", icon: MenuIcon },
] as const;
