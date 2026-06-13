import { useState, useEffect } from 'react';
import { readStorage, writeStorage } from '@/lib/storage';
import { generateId } from '@/lib/utils';
import type { CalendarEvent } from '@/types';
import {
  formatViewTitle,
  navigateDate,
  format,
  type CalendarView,
} from '@/lib/calendarUtils';
import CalendarToolbar from '@/components/calendar/CalendarToolbar';
import MonthView from '@/components/calendar/MonthView';
import WeekView from '@/components/calendar/WeekView';
import DayView from '@/components/calendar/DayView';
import AgendaListView from '@/components/calendar/AgendaListView';
import EventSidebar from '@/components/calendar/EventSidebar';
import EventFormModal from '@/components/calendar/EventFormModal';

function getDefaultView(): CalendarView {
  if (typeof window === 'undefined') return 'list';
  return window.matchMedia('(min-width: 1200px)').matches ? 'month' : 'list';
}

export default function Agenda() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<CalendarView>(getDefaultView);
  const [focusDate, setFocusDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('09:00');
  const [reminder, setReminder] = useState(true);

  useEffect(() => {
    readStorage<CalendarEvent[]>('events', []).then(setEvents);
  }, []);

  const titleLabel = formatViewTitle(focusDate, view);

  function goToToday() {
    const today = new Date();
    setFocusDate(today);
    setSelectedDate(today);
  }

  function handlePrev() {
    const next = navigateDate(focusDate, view, -1);
    setFocusDate(next);
    if (view === 'day') setSelectedDate(next);
  }

  function handleNext() {
    const next = navigateDate(focusDate, view, 1);
    setFocusDate(next);
    if (view === 'day') setSelectedDate(next);
  }

  function handleSelectDate(date: Date) {
    setSelectedDate(date);
    if (view === 'month') setFocusDate(date);
  }

  function handleViewChange(newView: CalendarView) {
    setView(newView);
    setFocusDate(selectedDate);
  }

  function openNewEvent() {
    setTitle('');
    setDescription('');
    setTime('09:00');
    setReminder(true);
    setShowForm(true);
  }

  async function handleAdd() {
    if (!title.trim()) return;
    const event: CalendarEvent = {
      id: generateId(),
      title: title.trim(),
      description: description.trim(),
      date: format(selectedDate, 'yyyy-MM-dd'),
      time,
      reminder,
      createdAt: new Date().toISOString(),
    };
    const next = [...events, event];
    setEvents(next);
    await writeStorage('events', next);
    setShowForm(false);
    setTitle('');
    setDescription('');
  }

  async function handleDelete(id: string) {
    const next = events.filter((e) => e.id !== id);
    setEvents(next);
    await writeStorage('events', next);
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
      <div className="flex-shrink-0 px-3 pt-3 pb-2 sm:px-4 md:px-6 md:pt-4">
        <CalendarToolbar
          title={titleLabel}
          view={view}
          onViewChange={handleViewChange}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={goToToday}
          onNewEvent={openNewEvent}
        />
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden px-3 pb-3 sm:px-4 md:px-6 md:pb-6 gap-0 min-w-0">
        <div className="flex-1 nova-panel min-h-0 min-w-0 overflow-hidden flex flex-col">
          {view === 'list' && (
            <AgendaListView
              focusDate={focusDate}
              selectedDate={selectedDate}
              events={events}
              onSelectDate={handleSelectDate}
              onDelete={handleDelete}
            />
          )}
          {view === 'month' && (
            <MonthView
              focusDate={focusDate}
              selectedDate={selectedDate}
              events={events}
              onSelectDate={handleSelectDate}
              onEventClick={() => {}}
            />
          )}
          {view === 'week' && (
            <WeekView
              focusDate={focusDate}
              selectedDate={selectedDate}
              events={events}
              onSelectDate={handleSelectDate}
              onEventClick={() => {}}
            />
          )}
          {view === 'day' && (
            <DayView focusDate={focusDate} events={events} onEventClick={() => {}} />
          )}
        </div>

        <EventSidebar
          selectedDate={selectedDate}
          events={events}
          onDelete={handleDelete}
        />
      </div>

      <EventFormModal
        open={showForm}
        date={selectedDate}
        title={title}
        description={description}
        time={time}
        reminder={reminder}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
        onTimeChange={setTime}
        onReminderChange={setReminder}
        onSave={handleAdd}
        onClose={() => setShowForm(false)}
      />
    </div>
  );
}
