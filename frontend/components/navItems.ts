import {
  LayoutDashboard,
  MessageSquare,
  StickyNote,
  CheckSquare,
  Calendar,
  Radio,
  Smile,
  Activity,
  FolderOpen,
  Settings,
} from 'lucide-react';

export const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/chat', icon: MessageSquare, label: 'Chat' },
  { to: '/notes', icon: StickyNote, label: 'Notities' },
  { to: '/tasks', icon: CheckSquare, label: 'Taken' },
  { to: '/agenda', icon: Calendar, label: 'Agenda' },
  { to: '/sensors', icon: Radio, label: 'Sensoren' },
  { to: '/avatar', icon: Smile, label: 'Avatar' },
  { to: '/system', icon: Activity, label: 'Systeemstatus' },
  { to: '/files', icon: FolderOpen, label: 'Bestanden' },
  { to: '/settings', icon: Settings, label: 'Instellingen' },
];
