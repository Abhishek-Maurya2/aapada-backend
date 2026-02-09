import { NavLink } from 'react-router-dom';
import './Sidebar.css';

export default function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="logo">
                <h2>Aapada</h2>
                <span>Admin Panel</span>
            </div>
            <nav className="nav-menu">
                <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} end>
                    <span className="icon">📊</span>
                    Dashboard
                </NavLink>
                <NavLink to="/create-alert" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <span className="icon">🚨</span>
                    Create Alert
                </NavLink>
                <NavLink to="/alerts" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <span className="icon">📋</span>
                    All Alerts
                </NavLink>
            </nav>
        </aside>
    );
}
