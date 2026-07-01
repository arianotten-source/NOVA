import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import FullscreenLayout from './layouts/FullscreenLayout';
import SplashGate from './components/experience/SplashGate';
import AvatarHome from './pages/AvatarHome';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Notes from './pages/Notes';
import Tasks from './pages/Tasks';
import Agenda from './pages/Agenda';
import Sensors from './pages/Sensors';
import SystemStatus from './pages/SystemStatus';
import Files from './pages/Files';
import Settings from './pages/Settings';

export default function App() {
  return (
    <SplashGate>
      <Routes>
        <Route element={<FullscreenLayout />}>
          <Route index element={<AvatarHome />} />
        </Route>

        <Route element={<MainLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="chat" element={<Chat />} />
          <Route path="notes" element={<Notes />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="sensors" element={<Sensors />} />
          <Route path="system" element={<SystemStatus />} />
          <Route path="files" element={<Files />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </SplashGate>
  );
}
