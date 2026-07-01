import {
  Home,
  LayoutDashboard,
  Radio,
  Calendar,
  CheckSquare,
  MessageSquare,
  Settings,
  Info,
} from 'lucide-react';

export const overflowMenuItems = [
  { to: '/', icon: Home, label: 'N.O.V.A.' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/sensors', icon: Radio, label: 'Sensoren' },
  { to: '/agenda', icon: Calendar, label: 'Agenda' },
  { to: '/tasks', icon: CheckSquare, label: 'Taken' },
  { to: '/chat', icon: MessageSquare, label: 'Chat' },
  { to: '/settings', icon: Settings, label: 'Instellingen' },
  { to: '/about', icon: Info, label: 'Over' },
];
