import {
  LayoutDashboard,
  MessageSquare,
  StickyNote,
  CheckSquare,
  Calendar,
  Radio,
  Activity,
  FolderOpen,
  Settings,
} from 'lucide-react';

export const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/chat', icon: MessageSquare, label: 'Chat' },
  { to: '/notes', icon: StickyNote, label: 'Notities' },
  { to: '/tasks', icon: CheckSquare, label: 'Taken' },
  { to: '/agenda', icon: Calendar, label: 'Agenda' },
  { to: '/sensors', icon: Radio, label: 'Sensoren' },
  { to: '/system', icon: Activity, label: 'Systeemstatus' },
  { to: '/files', icon: FolderOpen, label: 'Bestanden' },
  { to: '/settings', icon: Settings, label: 'Instellingen' },
];
