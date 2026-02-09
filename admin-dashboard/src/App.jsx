import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import CreateAlert from './pages/CreateAlert';
import AlertList from './pages/AlertList';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create-alert" element={<CreateAlert />} />
            <Route path="/alerts" element={<AlertList />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
