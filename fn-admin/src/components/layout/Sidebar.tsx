import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Store,
  LogOut,
  ShieldCheck,
  Flag,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/users", icon: Users, label: "Người dùng" },
  { to: "/products", icon: Package, label: "Sản phẩm" },
  { to: "/orders", icon: ShoppingCart, label: "Giao Dịch" },
  { to: "/stores", icon: Store, label: "Cửa hàng" },
  { to: "/reports", icon: Flag, label: "Báo cáo vi phạm" },
  { to: "/wallet", icon: Wallet, label: "Ví của tôi" },
];


export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside
      className="flex flex-col w-60 min-h-screen border-r"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      <div
        className="flex items-center gap-2 px-5 py-5 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{ background: "var(--accent)" }}
        >
          <ShieldCheck size={16} color="white" />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Lumine Admin
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Control Panel
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isActive
                  ? "font-medium"
                  : "hover:bg-white/5"
              )
            }
            style={({ isActive }) =>
              isActive
                ? {
                    background: "var(--accent-subtle)",
                    color: "var(--accent)",
                  }
                : { color: "var(--text-secondary)" }
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div
        className="px-3 py-4 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="px-3 py-2 mb-2">
          <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
            {user?.fullName ?? "Admin"}
          </p>
          <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
            {user?.email}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-white/5"
          style={{ color: "var(--danger)" }}
        >
          <LogOut size={16} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
