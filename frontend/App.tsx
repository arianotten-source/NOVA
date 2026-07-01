import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Notes from './pages/Notes';
import Tasks from './pages/Tasks';
import Agenda from './pages/Agenda';
import Sensors from './pages/Sensors';
import Avatar from './pages/Avatar';
import SystemStatus from './pages/SystemStatus';
import Files from './pages/Files';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="chat" element={<Chat />} />
        <Route path="notes" element={<Notes />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="sensors" element={<Sensors />} />
        <Route path="avatar" element={<Avatar />} />
        <Route path="system" element={<SystemStatus />} />
        <Route path="files" element={<Files />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
