import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "../ui/shadcn/command.jsx";
import { navForRole } from "../../config/navigation.js";
import { useAuth } from "../../hooks/useAuth.js";
import { Search, LayoutDashboard, Briefcase, FileText, ShieldCheck, Wallet, Sparkles, Users, Building2, BarChart3, Cog, Settings, User } from "lucide-react";

const ICONS = {
  grid: LayoutDashboard,
  briefcase: Briefcase,
  document: FileText,
  shield: ShieldCheck,
  wallet: Wallet,
  sparkle: Sparkles,
  users: Users,
  building: Building2,
  chart: BarChart3,
  cog: Cog,
  bell: Search,
  chat: Search,
  plus: Search,
  flag: Search,
  card: Search,
  receipt: Search,
  spark: Search,
  book: Search,
};

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const groups = navForRole(user?.role);

  function run(path) {
    setOpen(false);
    navigate(path);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command className="rounded-card">
        <CommandInput placeholder="Search projects, contracts, pages…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {groups.map((group) => (
            <CommandGroup key={group.section} heading={group.section}>
              {group.items.map((item) => {
                const Icon = ICONS[item.icon] || Search;
                return (
                  <CommandItem key={item.to} onSelect={() => run(item.to)}>
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
          <CommandSeparator />
          <CommandGroup heading="Account">
            <CommandItem onSelect={() => run("/profile")}>
              <User className="h-4 w-4" />
              <span>My profile</span>
            </CommandItem>
            <CommandItem onSelect={() => run("/settings")}>
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}