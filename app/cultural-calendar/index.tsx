import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Linking, Modal, Pressable, ScrollView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

type CalendarEvent = {
  id: number;
  monastery: string;
  event_name: string;
  date_start: string; // ISO string
  date_end?: string; // ISO string
  description?: string;
  language_support?: string[];
  media_url?: string;
  booking_link?: string;
};

// NOTE: Metro can import JSON from project files
// eslint-disable-next-line @typescript-eslint/no-var-requires
const events: CalendarEvent[] = require('../../data/sikkim_monastery_calendar_full.json');



function formatDateRange(startIso: string, endIso?: string) {
  const start = new Date(startIso);
  const end = endIso ? new Date(endIso) : undefined;
  const sameDay = end && start.toDateString() === end.toDateString();
  const fmt: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  if (!end) return start.toLocaleDateString(undefined, fmt);
  if (sameDay) return start.toLocaleDateString(undefined, fmt);
  return `${start.toLocaleDateString(undefined, fmt)} - ${end?.toLocaleDateString(undefined, fmt)}`;
}

function isSameDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dateInRange(target: Date, startIso: string, endIso?: string) {
  const start = new Date(startIso);
  const end = endIso ? new Date(endIso) : start;
  const t = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  return t >= s && t <= e;
}

function truncateLabel(name: string): string {
  const clean = name.split('(')[0].trim();
  if (clean.length <= 12) return clean;
  return `${clean.slice(0, 12)}…`;
}

type EventItemProps = { item: CalendarEvent; t: (key: string) => string; variant?: 'dark' | 'light' };

function EventItem({ item, t, variant = 'dark' }: EventItemProps) {
  const isLight = variant === 'light';
  return (
    <View
      style={{
        padding: 12,
        borderRadius: 12,
        backgroundColor: isLight ? 'white' : '#101012',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: isLight ? '#fed7aa' : '#2a2a2f',
      }}
    >
      <Text style={{ color: isLight ? '#ea580c' : 'white', fontSize: 16, fontWeight: '700' }}>{item.event_name}</Text>
      <Text style={{ color: isLight ? '#111111' : '#a1a1aa', marginTop: 4 }}>{item.monastery}</Text>
      <Text style={{ color: isLight ? '#111111' : '#d4d4d8', marginTop: 4 }}>{formatDateRange(item.date_start, item.date_end)}</Text>
      {item.description ? <Text style={{ color: isLight ? '#111111' : '#a1a1aa', marginTop: 8 }}>{item.description}</Text> : null}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
        {item.booking_link ? (
          <TouchableOpacity onPress={() => Linking.openURL(item.booking_link!)} style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#ea580c', borderRadius: 8 }}>
            <Text style={{ color: 'white', fontWeight: '700' }}>{t('rsvp')}</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          onPress={() => {
            const title = encodeURIComponent(item.event_name);
            const details = encodeURIComponent(item.description ?? '');
            const start = new Date(item.date_start).toISOString().replace(/[-:]|\.\d{3}/g, '');
            const end = new Date(item.date_end ?? item.date_start).toISOString().replace(/[-:]|\.\d{3}/g, '');
            const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${start}/${end}`;
            Linking.openURL(url);
          }}
          style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: isLight ? '#111111' : '#374151', borderRadius: 8 }}
        >
          <Text style={{ color: 'white', fontWeight: '700' }}>{t('addToCalendar')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CulturalCalendar() {
  const { t, i18n } = useTranslation();

  const filteredEvents = useMemo(() => {
    const current = (i18n.language || 'en').split('-')[0];
    const fallback = (i18n.options?.fallbackLng as string) || 'en';
    const filtered = events.filter((ev) => {
      if (!ev.language_support || ev.language_support.length === 0) return true;
      return ev.language_support.includes(current) || ev.language_support.includes(fallback);
    });
    console.log('Filtered events:', filtered.length, 'for language:', current);
    return filtered;
  }, [i18n.language]);

  const [activeTab, setActiveTab] = useState<'calendar' | 'upcoming'>('calendar');

  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [showYearPicker, setShowYearPicker] = useState(false);
  
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  // Generate years for the picker (current year - 4 to current year + 5)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 4 + i);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Generate year ranges for the year picker
  const getYearRange = (centerYear: number) => {
    return Array.from({ length: 10 }, (_, i) => centerYear - 4 + i);
  };
  
  const [displayedYears, setDisplayedYears] = useState<number[]>(getYearRange(currentYear));
  
  const handleYearRangeNavigation = (direction: 'prev' | 'next') => {
    const newCenterYear = direction === 'prev' 
      ? displayedYears[0] - 5 
      : displayedYears[displayedYears.length - 1] + 6;
    setDisplayedYears(getYearRange(newCenterYear));
  };

  const handleMonthChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      setTempDate(newDate);
      
      if (Platform.OS === 'android') {
        setShowMonthPicker(false);
        if (event.type === 'dismissed') return;
        updateCurrentMonth(newDate.getFullYear(), newDate.getMonth());
      }
    }
  };

  const updateCurrentMonth = (year: number, month: number) => {
    const newMonth = new Date(year, month, 1);
    setCurrentMonth(newMonth);
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  const confirmDate = () => {
    updateCurrentMonth(tempDate.getFullYear(), tempDate.getMonth());
    setShowMonthPicker(false);
  };

  const handleMonthSelect = (monthIndex: number) => {
    setSelectedMonth(monthIndex);
    updateCurrentMonth(selectedYear, monthIndex);
    setShowMonthPicker(false);
  };

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    updateCurrentMonth(year, selectedMonth);
    setShowMonthPicker(false);
  };
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [modalVisible, setModalVisible] = useState(false);

  const monthLabel = useMemo(() => {
    return currentMonth.toLocaleDateString(i18n.language, { year: 'numeric', month: 'long' });
  }, [currentMonth, i18n.language]);

  const daysOfWeek = useMemo(() => {
    const base = new Date(2021, 7, 1); // Sunday
    return [...Array(7)].map((_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d.toLocaleDateString(i18n.language, { weekday: 'short' });
    });
  }, [i18n.language]);

  const calendarDays = useMemo(() => {
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const startDay = start.getDay(); // 0-6 Sun-Sat
    const gridStart = new Date(start);
    gridStart.setDate(start.getDate() - startDay);

    const days: { date: Date; inMonth: boolean; events: CalendarEvent[] }[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      const inMonth = d.getMonth() === currentMonth.getMonth();
      const dayEvents = filteredEvents.filter((ev) => dateInRange(d, ev.date_start, ev.date_end));
      days.push({ date: d, inMonth, events: dayEvents });
    }
    return days;
  }, [currentMonth, filteredEvents]);

  const selectedDayEvents = useMemo(() => {
    return filteredEvents.filter((ev) => dateInRange(selectedDate, ev.date_start, ev.date_end));
  }, [filteredEvents, selectedDate]);

  const upcomingEvents = useMemo(() => {
    const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const nextMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    
    const upcoming = [...filteredEvents]
      .filter(ev => {
        const eventDate = new Date(ev.date_start);
        return eventDate >= currentMonthStart && eventDate < nextMonthStart;
      })
      .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime());
    
    // console.log('Upcoming events for', currentMonth.toLocaleDateString(), ':', upcoming.length);
    return upcoming;
  }, [filteredEvents, currentMonth]);


  
  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f4', paddingTop: 23 }}>
      <View style={{ 
        marginHorizontal: 12, 
        marginTop: 12, 
        marginBottom: 16,
        backgroundColor: 'white', 
        borderRadius: 10, 
        overflow: 'hidden', 
        flex: 1,
        borderWidth: 1,
        borderColor: '#e5e7eb'
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal:50, paddingVertical: 20 }}>
          <Text style={{ color: '#0b0b0f', fontSize: 18, fontWeight: '700' }}>{t('events')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} style={{ padding: 8 }}>
              <Text style={{ color: '#ea580c', fontSize: 20 }}>{'‹'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setShowMonthPicker(true)}
              style={{ padding: 8 }}
            >
              <Text style={{ color: '#0b0b0f', fontSize: 17, fontWeight: '700', marginHorizontal: 10 }}>
                {monthLabel}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} style={{ padding: 8 }}>
              <Text style={{ color: '#ea580c', fontSize: 20 }}>{'›'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center' , marginBottom: 10 }}>
      <TouchableOpacity
        onPress={() => setActiveTab('calendar')}
        style={{
          paddingBottom: 10,
          marginRight: 16,
          borderBottomWidth: activeTab === 'calendar' ? 3 : 0,
          borderBottomColor: '#ea580c',
        }}
      >
        <Text
          style={{
            color: activeTab === 'calendar' ? '#ea580c' : '#6b7280',
            fontWeight: '700',
          }}
        >
          {t('calendar')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setActiveTab('upcoming')}
        style={{
          paddingBottom: 10,
          borderBottomWidth: activeTab === 'upcoming' ? 3 : 0,
          borderBottomColor: '#ea580c',
        }}
      >
        <Text
          style={{
            color: activeTab === 'upcoming' ? '#ea580c' : '#6b7280',
            fontWeight: '700',
          }}
        >
          {t('upcoming')}
        </Text>
      </TouchableOpacity>
      </View>

        {activeTab === 'calendar' ? (
          <>
            <View style={{ flexDirection: 'row', marginTop: 10, paddingHorizontal: 16 }}>
              {daysOfWeek.map((wd) => (
                <View key={wd} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ color: '#ea580c', fontWeight: '700' }}>{wd}</Text>
                </View>
              ))}
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, paddingTop: 14, paddingBottom: 16 }}>
              {calendarDays.map(({ date, inMonth, events: dayEvents }) => {
                const isSelected = isSameDate(date, selectedDate);
                const hasEvents = dayEvents.length > 0;
                return (
                  <TouchableOpacity
                    key={date.toISOString()}
                    onPress={() => {
                      setSelectedDate(new Date(date));
                      if (hasEvents) setModalVisible(true);
                    }}
                    style={{ width: `${100 / 7}%`, padding: 4 }}
                  >
                    <View
                      style={{
                        borderRadius: 12,
                        paddingVertical: 10,
                        alignItems: 'center',
                        backgroundColor: isSelected ? '#ea580c' : 'transparent',
                        borderWidth: !isSelected && hasEvents ? 2 : 0,
                        borderColor: hasEvents ? '#ea580c' : 'transparent',
                        minHeight: 58,
                      }}
                    >
                      <Text style={{ color: isSelected ? 'white' : inMonth ? '#0b0b0f' : '#d1d5db', fontWeight: '800', fontSize: 16 }}>{date.getDate()}</Text>
                      <View style={{ marginTop: 4, alignItems: 'center', paddingHorizontal: 2 }}>
                        {dayEvents.slice(0, 2).map((ev) => (
                          <Text key={ev.id} numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 10, color: isSelected ? 'white' : '#ea580c', fontWeight: '700', maxWidth: '100%' }}>
                            {truncateLabel(ev.event_name)}
                          </Text>
                        ))}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : (
          <View style={{ flex: 1 }}>
            <FlatList
              data={upcomingEvents}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
                  <EventItem item={item} t={t} variant="light" />
                </View>
              )}
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#6b7280' }}>No events this month</Text>
                </View>
              }
            />
          </View>
        )}
      </View>

    

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <Pressable onPress={() => setModalVisible(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: 'white', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '70%', padding: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0b0b0f', marginBottom: 8 }}>
              {selectedDate.toLocaleDateString(i18n.language, { year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
            <ScrollView>
              {selectedDayEvents.map((ev) => (
                <View key={ev.id} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#fde7d8' }}>
                  <Text style={{ fontWeight: '700', color: '#ea580c' }}>{ev.event_name}</Text>
                  <Text style={{ color: '#111111', marginTop: 2 }}>{ev.monastery}</Text>
                  <Text style={{ color: '#111111', marginTop: 2 }}>{formatDateRange(ev.date_start, ev.date_end)}</Text>
                  {ev.description ? <Text style={{ color: '#111111', marginTop: 25 }}>{ev.description}</Text> : null}
                  <View style={{ flexDirection: 'row', gap: 10, marginTop:40 }}>
                    {ev.booking_link ? (
                      <TouchableOpacity onPress={() => Linking.openURL(ev.booking_link!)} style={{ paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#ea580c', borderRadius: 8 }}>
                        <Text style={{ color: 'white', fontWeight: '700' }}>{t('rsvp')}</Text>
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                      onPress={() => {
                        const title = encodeURIComponent(ev.event_name);
                        const details = encodeURIComponent(ev.description ?? '');
                        const start = new Date(ev.date_start).toISOString().replace(/[-:]|\.\d{3}/g, '');
                        const end = new Date(ev.date_end ?? ev.date_start).toISOString().replace(/[-:]|\.\d{3}/g, '');
                        const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${start}/${end}`;
                        Linking.openURL(url);
                      }}
                      style={{ paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#111111', borderRadius: 8 }}
                    >
                      <Text style={{ color: 'white', fontWeight: '700' }}>{t('addToCalendar')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Custom Month/Year Picker Modal */}
      <Modal
        visible={showMonthPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <Pressable 
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => setShowMonthPicker(false)}
        >
          <View 
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 20,
              width: '90%',
              maxWidth: 400,
            }}
          >
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '600', 
              marginBottom: 20, 
              textAlign: 'center',
              color: '#0b0b0f'
            }}>
              Select Month and Year
            </Text>
            
            {/* Year Picker */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ marginBottom: 8, color: '#4b5563' }}>Year</Text>
              <View style={{ 
                borderWidth: 1, 
                borderColor: '#d1d5db', 
                borderRadius: 8,
                backgroundColor: '#f9fafb',
                overflow: 'hidden'
              }}>
                
                <TouchableOpacity 
                  onPress={() => setShowYearPicker(!showYearPicker)}
                  style={{ 
                    padding: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ 
                    fontSize: 16, 
                    color: '#1f2937',
                    fontWeight: '500'
                  }}>
                    {selectedYear}
                  </Text>
                  <Text style={{ color: '#6b7280' }}>▼</Text>
                </TouchableOpacity>
                
                {showYearPicker && (
                  <View style={{
                    borderTopWidth: 1,
                    borderTopColor: '#e5e7eb',
                    padding: 12,
                    backgroundColor: 'white'
                  }}>
                    <View style={{ 
                      flexDirection: 'row', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8
                    }}>
                      <TouchableOpacity 
                        onPress={() => handleYearRangeNavigation('prev')}
                        style={{ padding: 4 }}
                      >
                        <Text style={{ color: '#ea580c', fontSize: 16 }}>‹‹</Text>
                      </TouchableOpacity>
                      <Text style={{ 
                        color: '#4b5563',
                        fontWeight: '500',
                        fontSize: 14
                      }}>
                        {`${displayedYears[0]} - ${displayedYears[displayedYears.length - 1]}`}
                      </Text>
                      <TouchableOpacity 
                        onPress={() => handleYearRangeNavigation('next')}
                        style={{ padding: 4 }}
                      >
                        <Text style={{ color: '#ea580c', fontSize: 16 }}>››</Text>
                      </TouchableOpacity>
                    </View>
                    
                    <View style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between'
                    }}>
                      {displayedYears.map((year) => (
                        <TouchableOpacity
                          key={year}
                          onPress={() => {
                            handleYearSelect(year);
                            setShowYearPicker(false);
                          }}
                          style={{
                            width: '30%',
                            padding: 10,
                            margin: 4,
                            borderRadius: 6,
                            backgroundColor: year === selectedYear ? '#ea580c' : '#f3f4f6',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Text style={{ 
                            color: year === selectedYear ? 'white' : '#1f2937',
                            fontWeight: year === selectedYear ? '600' : '400',
                            fontSize: 14
                          }}>
                            {year}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>
            
            {/* Month Picker */}
            <View>
              <Text style={{ marginBottom: 8, color: '#4b5563' }}>Month</Text>
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                marginBottom: 20
              }}>
                {months.map((month, index) => (
                  <TouchableOpacity
                    key={month}
                    onPress={() => handleMonthSelect(index)}
                    style={{
                      width: '30%',
                      padding: 12,
                      margin: 4,
                      borderRadius: 8,
                      backgroundColor: selectedMonth === index ? '#ea580c' : '#f3f4f6',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Text style={{ 
                      color: selectedMonth === index ? 'white' : '#1f2937',
                      fontWeight: selectedMonth === index ? '600' : '400'
                    }}>
                      {month.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Action Buttons */}
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'flex-end',
              marginTop: 16
            }}>
              <TouchableOpacity 
                onPress={() => setShowMonthPicker(false)}
                style={{ 
                  padding: 10, 
                  paddingHorizontal: 20,
                  marginRight: 12
                }}
              >
                <Text style={{ 
                  color: '#ea580c', 
                  fontSize: 16, 
                  fontWeight: '600' 
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  updateCurrentMonth(selectedYear, selectedMonth);
                  setShowMonthPicker(false);
                }}
                style={{ 
                  backgroundColor: '#ea580c', 
                  padding: 10, 
                  paddingHorizontal: 24, 
                  borderRadius: 8,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2
                }}
              >
                <Text style={{ 
                  color: 'white', 
                  fontSize: 16, 
                  fontWeight: '600' 
                }}>
                  Select
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
