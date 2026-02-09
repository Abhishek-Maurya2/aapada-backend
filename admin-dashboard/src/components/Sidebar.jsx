import { NavLink } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, List } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function Sidebar() {
    return (
        <aside className="w-64 min-h-screen bg-card border-r border-border flex flex-col">
            <div className="p-6 border-b border-border">
                <h2 className="text-2xl font-bold tracking-tight">Aapada</h2>
                <span className="text-sm text-muted-foreground">Admin Panel</span>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                <NavLink
                    to="/"
                    className={({ isActive }) => cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                        isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                    )}
                    end
                >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                </NavLink>
                <NavLink
                    to="/create-alert"
                    className={({ isActive }) => cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                        isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                    )}
                >
                    <AlertTriangle className="h-4 w-4" />
                    Create Alert
                </NavLink>
                <NavLink
                    to="/alerts"
                    className={({ isActive }) => cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                        isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                    )}
                >
                    <List className="h-4 w-4" />
                    All Alerts
                </NavLink>
            </nav>
        </aside>
    );
}
