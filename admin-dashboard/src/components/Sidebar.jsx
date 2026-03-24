import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BellRing, 
  Settings, 
  ShieldAlert,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: BellRing, label: 'Create Alert', path: '/create-alert' },
    { icon: ShieldAlert, label: 'All Alerts', path: '/alerts' },
  ];

  return (
    <aside className="w-64 glass-dark h-screen border-r border-white/10 flex flex-col p-4">
      <div className="flex items-center gap-3 px-2 py-6 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center glow-primary">
          <ShieldAlert className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">AAPADA</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Admin Panel</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group",
                isActive 
                  ? "bg-primary/10 text-primary border border-primary/20" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn(
                  "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                  isActive ? "text-primary" : "text-muted-foreground"
                )} />
                <span className="font-medium">{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-4 h-4" />}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/5">
        <button className="flex items-center gap-3 px-4 py-3 w-full text-muted-foreground hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
