import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import CreateAlert from './pages/CreateAlert';
import AlertList from './pages/AlertList';

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-background text-foreground">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-muted/10">
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
