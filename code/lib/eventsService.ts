import { supabase } from './supabase';

export type CalendarEvent = {
  id: string;
  monastery_id: string;
  monastery_name: string;
  event_name: string;
  date_start: string;
  date_end: string | null;
  description: string | null;
  created_at: string;
};

// Helper: centralize the columns we want
const EVENT_COLUMNS = `
  id,
  monastery_id,
  monastery_name,
  event_name,
  date_start,
  date_end,
  description,
  created_at
`;

// Helper: consistent error handling
const handleError = (error: any, context: string) => {
  if (error) {
    console.error(`Error ${context}:`, error);
    throw error;
  }
};

export const eventsService = {
  // Fetch all events from the database
  async getAllEvents(): Promise<CalendarEvent[]> {
    const { data, error } = await supabase
      .from('events')
      .select(EVENT_COLUMNS)
      .order('date_start', { ascending: true });

    handleError(error, 'fetching all events');
    return data || [];
  },

  // Fetch events for a specific date range
  async getEventsInDateRange(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    const { data, error } = await supabase
      .from('events')
      .select(EVENT_COLUMNS)
      .or(
        `and(date_start.gte.${startDate},date_start.lte.${endDate}),
         and(date_end.gte.${startDate},date_end.lte.${endDate}),
         and(date_start.lte.${startDate},date_end.gte.${endDate})`
      )
      .order('date_start', { ascending: true });

    handleError(error, 'fetching events in date range');
    return data || [];
  },

  // Fetch events for a specific monastery
  async getEventsByMonastery(monasteryId: string): Promise<CalendarEvent[]> {
    const { data, error } = await supabase
      .from('events')
      .select(EVENT_COLUMNS)
      .eq('monastery_id', monasteryId)
      .order('date_start', { ascending: true });

    handleError(error, 'fetching events by monastery');
    return data || [];
  },

  // Fetch upcoming events (from today onwards)
  async getUpcomingEvents(limit?: number): Promise<CalendarEvent[]> {
    const today = new Date().toISOString().split('T')[0];

    let query = supabase
      .from('events')
      .select(EVENT_COLUMNS)
      .gte('date_start', today)
      .order('date_start', { ascending: true });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    handleError(error, 'fetching upcoming events');
    return data || [];
  },

  // Get events for a specific date
  async getEventsForDate(date: string): Promise<CalendarEvent[]> {
    const { data, error } = await supabase
      .from('events')
      .select(EVENT_COLUMNS)
      .or(
        `and(date_start.lte.${date},date_end.gte.${date}),
         and(date_start.eq.${date},date_end.is.null)`
      )
      .order('date_start', { ascending: true });

    handleError(error, 'fetching events for date');
    return data || [];
  }
};
