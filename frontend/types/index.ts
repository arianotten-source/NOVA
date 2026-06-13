export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  reminder: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface SensorData {
  id: string;
  name: string;
  type: 'temperature' | 'humidity' | 'status';
  value: number | string;
  unit: string;
  online: boolean;
  lastUpdate: string;
}

export interface AppSettings {
  userName: string;
  language: string;
  theme: 'dark' | 'light';
  aiProvider: 'local' | 'openai' | 'none';
  aiModel: string;
  voiceEnabled: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  userName: 'Gebruiker',
  language: 'nl',
  theme: 'dark',
  aiProvider: 'none',
  aiModel: 'local',
  voiceEnabled: true,
};
