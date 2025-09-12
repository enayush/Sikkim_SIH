import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Linking, Modal, Pressable, ScrollView, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

// Import your events data
const events = require('../data/sikkim_monastery_calendar_with_coords (1).json');

type CalendarEvent = {
  id: number;
  monastery: string;
  monastery_id?: string; // Add monastery_id to match with the monastery detail screen
  event_name: string;
  date_start: string;
  date_end?: string;
  description?: string;
  language_support?: string[];
  media_url?: string;
  booking_link?: string;
  latitude?: number;
  longitude?: number;
};

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

function EventItem({ item, t, variant = 'light' }: EventItemProps) {
  const router = useRouter();
  const isLight = variant === 'light';
  
  const handleViewDetails = () => {
    if (item.monastery_id) {
      router.push(`/monastery/${item.monastery_id}`);
    } else {
      router.push(`/monastery/${encodeURIComponent(item.monastery)}`);
    }
  };

  const handleAddToCalendar = () => {
    const title = encodeURIComponent(item.event_name);
    const details = encodeURIComponent(item.description ?? '');
    const start = new Date(item.date_start).toISOString().replace(/[-:]|\.\d{3}/g, '');
    const end = new Date(item.date_end ?? item.date_start).toISOString().replace(/[-:]|\.\d{3}/g, '');
    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${start}/${end}`;
    Linking.openURL(url);
  };

  return (
    <View
      style={[
        styles.eventItem,
        {
          backgroundColor: 'white',
          borderLeftWidth: 4,
          borderLeftColor: '#ea580c',
          borderRadius: 12,
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
          marginBottom: 10,
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[{
          fontSize: 18,
          fontWeight: '700',
          color: '#1f2937',
          marginBottom: 8,
        }]}>{item.event_name}</Text>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Ionicons 
            name="location-outline" 
            size={18} 
            color="#ea580c"
            style={{ marginRight: 6 }}
          />
          <Text style={{ color: '#4b5563', fontSize: 14, fontWeight: '500' }}>
            {item.monastery}
          </Text>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Ionicons 
            name="calendar-outline" 
            size={16} 
            color="#ea580c"
            style={{ marginRight: 6 }}
          />
          <Text style={{ color: '#4b5563', fontSize: 14, fontWeight: '500' }}>
            {formatDateRange(item.date_start, item.date_end)}
          </Text>
        </View>
        
        {item.description && (
          <Text style={{
            color: '#6b7280',
            fontSize: 12,
            lineHeight: 18,
            marginBottom: 16,
          }}>
            {item.description}
          </Text>
        )}
        
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            onPress={handleViewDetails}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'white',
              paddingVertical: 10,
              borderRadius: 8,
              borderWidth: 1.5,
              borderColor: '#ea580c',
            }}
          >
            <Ionicons 
              name="information-circle-outline" 
              size={18} 
              color="#ea580c"
              style={{ marginRight: 6 }}
            />
            <Text style={{ color: '#ea580c', fontWeight: '600', fontSize: 14 }}>
              {t('Details')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleAddToCalendar}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ea580c',
              paddingVertical: 10,
              borderRadius: 8,
            }}
          >
            <Ionicons 
              name="calendar-outline" 
              size={18} 
              color="white"
              style={{ marginRight: 6 }}
            />
            <Text 
              style={{ 
                color: 'white', 
                fontWeight: '600', 
                fontSize: 12,
                textAlign: 'center',
                flexShrink: 1
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t('Add to Calendar')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function CulturalCalendar() {
  const { t } = useTranslation();
  const router = useRouter();

  const filteredEvents = useMemo(() => {
    const current = (i18n.language || 'en').split('-')[0];
    const fallback = (i18n.options?.fallbackLng as string) || 'en';
    const filtered = events.filter((ev: CalendarEvent) => {
      if (!ev.language_support || ev.language_support.length === 0) return true;
      return ev.language_support.includes(current) || ev.language_support.includes(fallback);
    });
    console.log('Filtered events:', filtered.length, 'for language:', current);
    return filtered;
  }, [i18n.language, i18n.options?.fallbackLng]);

  const [activeTab, setActiveTab] = useState<'calendar' | 'upcoming'>('calendar');
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);

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
      const dayEvents = filteredEvents.filter((ev: CalendarEvent) => dateInRange(d, ev.date_start, ev.date_end));
      days.push({ date: d, inMonth, events: dayEvents });
    }
    return days;
  }, [currentMonth, filteredEvents]);

  const selectedDayEvents = useMemo(() => {
    return filteredEvents.filter((ev: CalendarEvent) => dateInRange(selectedDate, ev.date_start, ev.date_end));
  }, [filteredEvents, selectedDate]);

  const upcomingEvents = useMemo(() => {
    const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const nextMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);

    const upcoming = [...filteredEvents]
      .filter((ev: CalendarEvent) => {
        const eventDate = new Date(ev.date_start);
        return eventDate >= currentMonthStart && eventDate < nextMonthStart;
      })
      .sort((a: CalendarEvent, b: CalendarEvent) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime());

    return upcoming;
  }, [filteredEvents, currentMonth]);

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter((ev: CalendarEvent) => 
      dateInRange(date, ev.date_start, ev.date_end)
    );
  };

  const handleDayPress = (date: Date) => {
    const dayEvents = getEventsForDate(date);
    setSelectedDate(date);
    if (dayEvents.length > 0) {
      setShowEventModal(true);
    }
  };

  const handleMonasteryPress = (eventId: string) => {
    try {
      // Find the event by ID
      const event = events.find((e: CalendarEvent) => e.id.toString() === eventId);
      if (!event) {
        console.error('Event not found:', eventId);
        return;
      }
      
      // Use monastery_id if available, otherwise use the monastery name
      const identifier = event.monastery_id || encodeURIComponent(event.monastery);
      router.push(`/monastery/${identifier}`);
      setShowEventModal(false);
    } catch (error) {
      console.error('Error navigating to monastery:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.calendarContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('Events')}</Text>
          <View style={styles.monthNavigation}>
            <TouchableOpacity
              onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              style={styles.navButton}
            >
              <Text style={styles.navButtonText}>{'‹'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowMonthPicker(true)}
              style={styles.monthButton}
            >
              <Text style={styles.monthButtonText}>{monthLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              style={styles.navButton}
            >
              <Text style={styles.navButtonText}>{'›'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => setActiveTab('calendar')}
            style={[styles.tab, activeTab === 'calendar' && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === 'calendar' && styles.activeTabText]}>
              {t('Calendar')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('upcoming')}
            style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
              {t('Upcoming')}
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'calendar' ? (
          <>
            <View style={styles.weekDays}>
              {daysOfWeek.map((wd) => (
                <View key={wd} style={styles.weekDay}>
                  <Text style={styles.weekDayText}>{wd}</Text>
                </View>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarDays.map(({ date, inMonth, events: dayEvents }) => {
                const isSelected = isSameDate(date, selectedDate);
                const hasEvents = dayEvents.length > 0;
                return (
                  <TouchableOpacity
                    key={date.toISOString()}
                    onPress={() => handleDayPress(date)}
                    style={styles.dayCell}
                  >
                    <View
                      style={[
                        styles.dayContent,
                        isSelected && styles.selectedDay,
                        hasEvents && !isSelected && styles.hasEventsDay,
                      ]}
                    >
                      <Text style={[
                        styles.dayText,
                        !inMonth && styles.otherMonthDay,
                        isSelected && styles.selectedDayText,
                      ]}>
                        {date.getDate()}
                      </Text>
                      <View style={styles.dayEvents}>
                        {dayEvents.slice(0, 2).map((ev, index) => {
                          // Truncate event name to 6-7 characters
                          const truncateName = (name: string) => {
                            if (name.length <= 7) return name;
                            return `${name.substring(0, 6)}...`;
                          };
                          
                          return (
                            <Text
                              key={`${ev.id}-${index}`}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                              style={[
                                styles.dayEventText,
                                isSelected && styles.selectedDayEventText,
                                { 
                                  fontSize: 8, 
                                  marginHorizontal: 1,
                                  fontWeight: '700',
                                  textAlign: 'center',
                                  width: '100%',
                                }
                              ]}
                            >
                              {truncateName(ev.event_name)}
                            </Text>
                          );
                        })}
                        {dayEvents.length > 2 && (
                          <Text 
                            style={[
                              styles.dayEventText,
                              isSelected && styles.selectedDayEventText,
                              { 
                                fontSize: 8, 
                                marginLeft: 2,
                                fontWeight: '700'
                              }
                            ]}
                          >
                            ...
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : (
          <View style={styles.upcomingContainer}>
            <FlatList
              data={upcomingEvents}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <EventItem item={item} t={t} variant="light" />
              )}
              contentContainerStyle={styles.upcomingList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No events this month</Text>
                </View>
              }
            />
          </View>
        )}
      </View>

      {/* Event Details Modal */}
      <Modal
        visible={showEventModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEventModal(false)}
      >
        <Pressable
          onPress={() => setShowEventModal(false)}
          style={styles.modalOverlay}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>
              {selectedDate.toLocaleDateString(i18n.language, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
            <ScrollView style={styles.modalScrollView}>
              {selectedDayEvents.map((ev) => (
                <View key={ev.id} style={styles.modalEvent}>
                  <Text style={styles.modalEventTitle}>{ev.event_name}</Text>
                  <Text style={styles.modalEventLocation}>
                    {ev.monastery}
                  </Text>
                  <Text style={styles.modalEventDate}>
                    {formatDateRange(ev.date_start, ev.date_end)}
                  </Text>
                  {ev.description ? (
                    <Text style={styles.modalEventDescription}>{ev.description}</Text>
                  ) : null}
                  <View style={[styles.modalActions, { justifyContent: 'space-between' }]}>
                    <TouchableOpacity
                      onPress={() => handleMonasteryPress(ev.id.toString())}
                      style={[styles.modalButton, styles.detailsButton, { flex: 1, marginRight: 8 }]}
                    >
                      <Text style={styles.buttonText}>Monastery Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        const title = encodeURIComponent(ev.event_name);
                        const details = encodeURIComponent(ev.description || '');
                        const start = new Date(ev.date_start).toISOString().replace(/[-:]|\.\d{3}/g, '');
                        const end = new Date(ev.date_end || ev.date_start).toISOString().replace(/[-:]|\.\d{3}/g, '');
                        const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${start}/${end}`;
                        Linking.openURL(url);
                      }}
                      style={[styles.modalButton, { 
                        backgroundColor: '#f0f9ff',
                        borderColor: '#bae6fd',
                        flex: 1,
                        marginLeft: 8
                      }]}
                    >
                      <Text style={{ color: '#0284c7', fontWeight: '500' }}>Add to Calendar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowEventModal(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Month/Year Picker Modal */}
      <Modal
        visible={showMonthPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <Pressable
          style={styles.pickerOverlay}
          onPress={() => setShowMonthPicker(false)}
        >
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Select Month and Year</Text>

            {/* Year Picker */}
            <View style={styles.pickerSection}>
              <Text style={styles.pickerLabel}>Year</Text>
              <View style={styles.yearSelector}>
                <TouchableOpacity
                  onPress={() => setShowYearPicker(!showYearPicker)}
                  style={styles.yearSelectorHeader}
                >
                  <Text style={styles.yearSelectorHeaderText}>
                    {selectedYear}
                  </Text>
                  <Text style={styles.yearSelectorHeaderIcon}>▼</Text>
                </TouchableOpacity>

                {showYearPicker && (
                  <View style={styles.yearPicker}>
                    <View style={styles.yearRangeSelector}>
                      <TouchableOpacity
                        onPress={() => handleYearRangeNavigation('prev')}
                        style={styles.yearNavButton}
                      >
                        <Text style={styles.yearNavButtonText}>‹‹</Text>
                      </TouchableOpacity>
                      <Text style={styles.yearRangeText}>
                        {`${displayedYears[0]} - ${displayedYears[displayedYears.length - 1]}`}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleYearRangeNavigation('next')}
                        style={styles.yearNavButton}
                      >
                        <Text style={styles.yearNavButtonText}>››</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.yearGrid}>
                      {displayedYears.map((year) => (
                        <TouchableOpacity
                          key={year}
                          onPress={() => {
                            handleYearSelect(year);
                            setShowYearPicker(false);
                          }}
                          style={[
                            styles.yearButton,
                            year === selectedYear && styles.selectedYearButton
                          ]}
                        >
                          <Text style={[
                            styles.yearButtonText,
                            year === selectedYear && styles.selectedYearButtonText
                          ]}>
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
            <View style={styles.pickerSection}>
              <Text style={styles.pickerLabel}>Month</Text>
              <View style={styles.monthGrid}>
                {months.map((month, index) => (
                  <TouchableOpacity
                    key={month}
                    onPress={() => handleMonthSelect(index)}
                    style={[
                      styles.monthButton,
                      selectedMonth === index && styles.selectedMonthButton
                    ]}
                  >
                    <Text style={[
                      styles.monthButtonText,
                      selectedMonth === index && styles.selectedMonthButtonText
                    ]}>
                      {month.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.pickerActions}>
              <TouchableOpacity
                onPress={() => setShowMonthPicker(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  updateCurrentMonth(selectedYear, selectedMonth);
                  setShowMonthPicker(false);
                }}
                style={styles.confirmButton}
              >
                <Text style={styles.confirmButtonText}>Select</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: '#f5f5f4',
    paddingTop: 8,
  },
  calendarContainer: {
    marginHorizontal: 10,
    marginTop: 20,
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 22,
    overflow: 'hidden',
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 8,
  },

  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal:60,
    paddingVertical: 40,
    borderBottomWidth: 2,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    color: '#0b0b0f',
    fontSize: 19,
    fontWeight: '800',
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    padding: 20,
  },
  navButtonText: {
    color: '#ea580c',
    fontSize: 20,
  },
  monthButton: {
    padding: 8,
  },
  monthButtonText: {
    color: '#0b0b0f',
    fontSize: 17,
    fontWeight: '700',
    marginHorizontal: 0,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#ea580c',
  },
  tabText: {
    color: '#6b7280',
    fontWeight: '700',
  },
  activeTabText: {
    color: '#ea580c',
  },

  // Calendar grid
  weekDays: {
    flexDirection: 'row',
    borderBottomWidth: 3,
    borderBottomColor: '#f3f4f6',
    paddingVertical: 20,
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    color: '#ea580c',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 1,
  },
  dayCell: {
    width: '14.2857%',
    aspectRatio: 1.3,
    padding: 2,
  },
  dayContent: {
    flex: 1,
    borderRadius: 8,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 3,
    height: '100%',
    width: '100%',
    minHeight: 70,
  },
  selectedDay: {
    backgroundColor: '#ea580c',
  },
  hasEventsDay: {
    borderWidth: 2,
    borderColor: '#ea580c',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0b0b0f',
    marginBottom: 6,
  },
  otherMonthDay: {
    color: '#d1d5db',
  },
  selectedDayText: {
    color: 'white',
  },
  dayEvents: {
    width: '100%',
    alignItems: 'center',
  },
  dayEventText: {
    fontSize: 10,
    color: '#ea580c',
    fontWeight: '700',
    maxWidth: '100%',
    textAlign: 'center',
  },
  selectedDayEventText: {
    color: 'white',
  },

  // Upcoming events list
  upcomingContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  upcomingList: {
    paddingBottom: 24,
    paddingHorizontal: 8,
  },
  eventListItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ea580c',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 10,
  },
  emptyStateText: {
    color: '#ea580c',
    fontSize: 16,
    fontWeight: '600',
  },
  // Event item styles
  eventItem: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ea580c',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  eventMonastery: {
    marginTop: 4,
  },
  eventDate: {
    marginTop: 4,
  },
  eventDescription: {
    marginTop: 8,
  },
  eventButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0b0b0f',
    marginBottom: 8,
  },
  modalScrollView: {
    maxHeight: '90%',
  },
  modalEvent: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#fde7d8',
  },
  modalEventTitle: {
    fontWeight: '700',
    color: '#ea580c',
    fontSize: 16,
    marginBottom: 2,
  },
  modalEventLocation: {
    fontSize: 16,
    color: '#1a73e8',
    marginBottom: 10,
  },
  monasteryLink: {
    alignSelf: 'flex-start',
  },
  modalEventDate: {
    color: '#111111',
    marginBottom: 8,
    fontSize: 14,
  },
  modalEventDescription: {
    color: '#111111',
    marginTop: 8,
    marginBottom: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    marginBottom: 8,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#ea580c',
  },
  secondaryButton: {
    backgroundColor: '#111111',
  },
  detailsButton: {
    backgroundColor: '#3b82f6',
    flex: 1,
    paddingVertical: 12,
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  closeButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ea580c',
    fontWeight: '600',
    fontSize: 16,
  },
  
  // Month/Year Picker Modal
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
    color: '#0b0b0f',
  },
  pickerSection: {
    marginBottom: 20,
  },
  pickerLabel: {
    marginBottom: 8,
    color: '#4b5563',
    fontSize: 14,
  },
  yearSelector: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    overflow: 'hidden',
    marginBottom: 8,
  },
  yearSelectorHeader: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  yearSelectorHeaderText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  yearSelectorHeaderIcon: {
    color: '#6b7280',
    fontSize: 12,
  },
  yearPicker: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    padding: 12,
    backgroundColor: 'white',
  },
  yearRangeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  yearNavButton: {
    padding: 4,
  },
  yearNavButtonText: {
    color: '#ea580c',
    fontSize: 16,
  },
  yearRangeText: {
    color: '#4b5563',
    fontWeight: '500',
    fontSize: 14,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  yearButton: {
    width: '30%',
    padding: 10,
    margin: 4,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedYearButton: {
    backgroundColor: '#ea580c',
  },
  yearButtonText: {
    color: '#1f2937',
    fontSize: 14,
  },
  selectedYearButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  // monthButton: {
  //   width: '30%',
  //   padding: 12,
  //   margin: 4,
  //   borderRadius: 8,
  //   backgroundColor: '#f3f4f6',
  //   alignItems: 'center',
  //   justifyContent: 'center',
  // },
  selectedMonthButton: {
    backgroundColor: '#ea580c',
  },
  // monthButtonText: {
  //   color: '#1f2937',
  // },
  selectedMonthButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  pickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  cancelButton: {
    padding: 10,
    paddingHorizontal: 20,
    marginRight: 12,
  },
  cancelButtonText: {
    color: '#ea580c',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#ea580c',
    padding: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
