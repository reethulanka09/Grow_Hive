import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Platform,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import styles from "./SchedulePageStyles"; // Ensure this path is correct
import {
  useFonts,
  Poppins_700Bold,
  Poppins_400Regular,
} from "@expo-google-fonts/poppins";
import { COLORS } from "./constants"; // Ensure this path is correct
import * as SecureStore from "expo-secure-store";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";

import UserPickerModal from "./UserPickerModal"; // Ensure this path is correct
import SchedulePartnerModal from "./SchedulePartnerModal"; // Make sure this path and component are correct
import RequestsModal from "./RequestModal"; // Ensure this path is correct
import { IP } from "../Config/config";
// --- API Configuration ---
const API_BASE_URL = `${IP}/api`; // Your backend API base URL

// --- Sample Data & Helpers ---
const getEventDates = (events) => events.map((e) => e.date);
const daysInMonth = (month, year) => new Date(year, month, 0).getDate();

// ==============================================================================
// Processing Overlay Component
// ==============================================================================
const ProcessingOverlay = ({ visible, message = "Processing..." }) => {
  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={overlayStyles.overlayBackground}>
        <View style={overlayStyles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.logoBlue} />
          <Text style={overlayStyles.loadingText}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
};

const overlayStyles = StyleSheet.create({
  overlayBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 150,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
});

// ==============================================================================
// Calendar Grid Component
// ==============================================================================
function CalendarGrid({
  selectedDate,
  setSelectedDate,
  month,
  year,
  eventDates,
  onDateSelectForSchedule,
}) {
  const days = daysInMonth(month, year);
  const firstDay = new Date(year, month - 1, 1).getDay();
  const weeks = [];
  let currentDay = 1 - firstDay;

  for (let w = 0; w < 6; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      if (currentDay > 0 && currentDay <= days) {
        const dateObj = new Date(year, month - 1, currentDay);
        const dateStr = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1)
          .toString()
          .padStart(2, "0")}-${dateObj.getDate().toString().padStart(2, "0")}`;

        let dayStyle = { ...styles.calendarDay };
        let dayTextStyle = { ...styles.calendarDayText };

        if (selectedDate === dateStr) {
          dayStyle = { ...dayStyle, ...styles.calendarDaySelected };
          dayTextStyle = { ...dayTextStyle, ...styles.calendarDayTextSelected };
        } else if (eventDates.includes(dateStr)) {
          dayStyle = { ...dayStyle, ...styles.calendarDayEvent };
          dayTextStyle = { ...dayTextStyle, ...styles.calendarDayTextEvent };
        }

        week.push(
          <TouchableOpacity
            key={d}
            style={dayStyle}
            onPress={() => {
              setSelectedDate(dateStr);
              onDateSelectForSchedule(dateStr);
            }}
            activeOpacity={0.7}
          >
            <Text style={dayTextStyle}>{currentDay}</Text>
          </TouchableOpacity>
        );
      } else {
        week.push(<View key={d} style={styles.calendarDay} />);
      }
      currentDay++;
    }
    weeks.push(
      <View key={w} style={styles.calendarWeek}>
        {week}
      </View>
    );
  }
  return (
    <View>
      <View style={styles.calendarDaysRow}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <Text key={i} style={styles.calendarDayName}>
            {d}
          </Text>
        ))}
      </View>
      {weeks}
    </View>
  );
}

// ==============================================================================
// Time Picker Modal
// ==============================================================================
function TimePicker({ visible, onClose, onSelectTime, selectedDate }) {
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(Platform.OS === "ios");

  useEffect(() => {
    if (visible) {
      setDate(new Date());
    }
  }, [visible]);

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowPicker(Platform.OS === "ios");
    setDate(currentDate);
  };

  const handleConfirmTime = () => {
    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    onSelectTime(formattedTime);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Time for {selectedDate}</Text>

          {showPicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={date}
              mode="time"
              is24Hour={false}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onChange}
            />
          )}

          {Platform.OS === "android" && !showPicker && (
            <TouchableOpacity
              style={styles.selectTimeButton}
              onPress={() => setShowPicker(true)}
            >
              <Text style={styles.selectTimeButtonText}>
                Tap to Select Time
              </Text>
            </TouchableOpacity>
          )}

          <Text style={styles.selectedTimePreview}>
            Selected:{" "}
            {date.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
          </Text>

          <TouchableOpacity
            onPress={handleConfirmTime}
            style={styles.modalConfirmButton}
          >
            <Text style={styles.modalConfirmButtonText}>Confirm Time</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.modalCancelButton}>
            <Text style={styles.modalCancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ==============================================================================
// Filter Dropdown Modal Component
// ==============================================================================
const FilterDropdownModal = ({
  visible,
  onClose,
  onSelectFilter,
  currentFilter,
}) => {
  const filterOptions = [
    { label: "All", value: "all" },
    { label: "Accepted", value: "accepted" },
    { label: "Pending", value: "pending" },
    { label: "Rejected", value: "rejected" },
  ];

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.filterModalOverlay}
        activeOpacity={1}
        onPress={onClose} // Close modal when tapping outside
      >
        <View style={styles.filterModalContent}>
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.filterModalOption,
                currentFilter === option.value &&
                  styles.filterModalOptionActive,
              ]}
              onPress={() => {
                onSelectFilter(option.value);
                onClose();
              }}
            >
              <Text
                style={[
                  styles.filterModalOptionText,
                  currentFilter === option.value &&
                    styles.filterModalOptionTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// ==============================================================================
// Main Schedule Page Component
// ==============================================================================
export default function SchedulePage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const [selectedDate, setSelectedDate] = useState(null);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [scheduleDate, setScheduleDate] = useState(null);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const [partnerModalVisible, setPartnerModalVisible] = useState(false);

  const [yearPickerVisible, setYearPickerVisible] = useState(false); // Unused, consider removing if not implemented

  // --- STATES FOR USER SELECTION DROPDOWN ---
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserForMeeting, setSelectedUserForMeeting] = useState(null);
  const [isUserPickerVisible, setIsUserPickerVisible] = useState(false);

  // --- STATES FOR REQUESTS ---
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [requestsModalVisible, setRequestsModalVisible] = useState(false);

  // --- State for event filtering ---
  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'accepted', 'pending', 'rejected'
  const [isFilterDropdownVisible, setIsFilterDropdownVisible] = useState(false); // New state for dropdown

  let [fontsLoaded] = useFonts({
    Poppins_700Bold,
    Poppins_400Regular,
  });

  const navigation = useNavigation();

  const getAuthToken = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      return token;
    } catch (error) {
      console.error("Error getting auth token from SecureStore:", error);
      return null;
    }
  };

  const fetchEvents = useCallback(async () => {
    const token = await getAuthToken();
    if (!token) {
      console.error(
        "SchedulePage: No authentication token found. User might not be logged in."
      );
      Alert.alert(
        "Authentication Required",
        "Please log in to view your events."
      );
      return;
    }
    try {
      console.log(
        "SchedulePage: Attempting to fetch events from:",
        `${API_BASE_URL}/events`
      );
      const response = await axios.get(`${API_BASE_URL}/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      console.log("SchedulePage: Fetched raw events data from backend:", data);

      const formattedEvents = data.map((event) => ({
        id: event._id,
        ...event,
        icon:
          event.type === "workshop" ? (
            <MaterialIcons
              name="event-note"
              size={24}
              color={COLORS.logoBlue}
            />
          ) : event.type === "accepted_meeting" ||
            event.type === "scheduled_meeting" ||
            event.type === "meeting_request" ||
            event.type === "rejected_meeting" ? (
            <Ionicons name="people" size={24} color={COLORS.logoBlue} />
          ) : (
            <Ionicons
              name="calendar-outline"
              size={24}
              color={COLORS.logoBlue}
            />
          ),
        color: event.color || COLORS.DBEAFE,
      }));
      console.log(
        "SchedulePage: Formatted events ready for state:",
        formattedEvents
      );
      setEvents(formattedEvents);
    } catch (error) {
      console.error(
        "*** ERROR FETCHING EVENTS (FULL AXIOS OBJECT) ***:",
        error
      );
      if (error.response) {
        console.error("Error Status (Events):", error.response.status);
        console.error("Error Data (Events):", error.response.data);
      }
      Alert.alert(
        "Error",
        `Failed to load events. ${
          error.response?.data?.message ||
          error.message ||
          "Please try again later."
        }`
      );
      setEvents([]);
    }
  }, [navigation]);

  const fetchUsers = useCallback(async () => {
    const token = await getAuthToken();
    if (!token) {
      console.error(
        "SchedulePage: No authentication token found to fetch users."
      );
      return;
    }
    try {
      console.log(
        "SchedulePage: Attempting to fetch users from:",
        `${API_BASE_URL}/auth/users`
      );
      const response = await axios.get(`${API_BASE_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      setAvailableUsers(data);
      console.log(
        "SchedulePage: Fetched users successfully. Count:",
        data.length
      );
    } catch (error) {
      console.error("*** ERROR FETCHING USERS (FULL AXIOS OBJECT) ***:", error);
      if (error.response) {
        console.error("Error Status (Users):", error.response.status);
        console.error("Error Data (Users):", error.response.data);
      }
      Alert.alert(
        "Error",
        `Failed to load users: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }, []);

  const fetchIncomingRequests = useCallback(async () => {
    const token = await getAuthToken();
    if (!token) {
      console.error(
        "SchedulePage: No authentication token found to fetch requests."
      );
      return;
    }
    try {
      console.log(
        "SchedulePage: Attempting to fetch incoming requests from:",
        `${API_BASE_URL}/requests/incoming`
      );
      const response = await axios.get(`${API_BASE_URL}/requests/incoming`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      console.log("SchedulePage: Fetched incoming requests:", data);
      setIncomingRequests(data);
    } catch (error) {
      console.error(
        "*** ERROR FETCHING INCOMING REQUESTS (FULL AXIOS OBJECT) ***:",
        error
      );
      if (error.response) {
        console.error("Error Status (Requests):", error.response.status);
        console.error("Error Data (Requests):", error.response.data);
      }
      Alert.alert(
        "Error",
        `Failed to load requests: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }, []);

  // onRefresh handler for Pull-to-Refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setLoading(true); // Ensure loading indicator shows during refresh
    console.log("SchedulePage: Initiating pull-to-refresh...");
    try {
      await Promise.all([fetchEvents(), fetchUsers(), fetchIncomingRequests()]);
    } catch (error) {
      console.error("Error during onRefresh:", error);
    } finally {
      setLoading(false); // Ensure loading indicator hides after refresh
      setRefreshing(false);
    }
  }, [fetchEvents, fetchUsers, fetchIncomingRequests]);

  useEffect(() => {
    console.log("SchedulePage: useEffect for initial data fetch triggered.");
    onRefresh(); // Call onRefresh on initial mount to fetch all data
  }, []);

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 1) {
        setCurrentYear((prevYear) => prevYear - 1);
        return 12;
      }
      return prev - 1;
    });
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 12) {
        setCurrentYear((prevYear) => prevYear + 1);
        return 1;
      }
      return prev + 1;
    });
    setSelectedDate(null);
  };

  const handlePrevYear = () => {
    setCurrentYear((prevYear) => prevYear - 1);
    setSelectedDate(null);
  };
  const handleNextYear = () => {
    setCurrentYear((prevYear) => prevYear + 1);
    setSelectedDate(null);
  };

  const handleDateSelectForSchedule = (date) => {
    setScheduleDate(date);
    setTimePickerVisible(true);
  };
  const handleTimeSelected = (time) => {
    setSelectedTime(time);
    setTimePickerVisible(false);
    setPartnerModalVisible(true);
  };

  const handleScheduleConfirm = async (meetingTitle) => {
    if (!selectedUserForMeeting) {
      Alert.alert(
        "Missing Information",
        "Please select a partner to schedule with."
      );
      return;
    }
    if (!meetingTitle) {
      Alert.alert(
        "Missing Information",
        "Please enter a title for the meeting."
      );
      return;
    }

    setIsProcessingAction(true);
    console.log("SchedulePage: Attempting to send new meeting request.");
    const newRequestData = {
      title: meetingTitle,
      recipientId: selectedUserForMeeting._id,
      date: scheduleDate,
      time: selectedTime,
      type: "meeting_request",
      status: "pending",
    };

    try {
      const token = await getAuthToken();
      if (!token) {
        Alert.alert(
          "Authentication Required",
          "Please log in to send a meeting request."
        );
        return;
      }
      const response = await axios.post(
        `${API_BASE_URL}/events`,
        newRequestData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(
        "SchedulePage: Successfully sent meeting request response from backend:",
        response.data
      );

      onRefresh(); // Use onRefresh to reload all data

      Alert.alert(
        "Request Sent",
        `Your meeting request to ${selectedUserForMeeting.name} has been sent!`
      );
      setPartnerModalVisible(false);
      setScheduleDate(null);
      setSelectedTime(null);
      setSelectedDate(null);
      setSelectedUserForMeeting(null);
    } catch (error) {
      console.error(
        "*** ERROR SENDING MEETING REQUEST (FULL AXIOS OBJECT) ***:",
        error
      );
      if (error.response) {
        console.error(
          "Error Status (Schedule Confirm):",
          error.response.status
        );
        console.error("Error Data (Schedule Confirm):", error.response.data);
      }
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          error.message ||
          "Failed to send meeting request. Please try again."
      );
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleRequestAction = async (requestId, action) => {
    const token = await getAuthToken();
    if (!token) {
      Alert.alert(
        "Authentication Required",
        "Please log in to manage requests."
      );
      return;
    }

    setIsProcessingAction(true);
    try {
      console.log(
        `SchedulePage: Attempting to ${action} request ID: ${requestId}`
      );
      const response = await axios.put(
        `${API_BASE_URL}/requests/${requestId}/${action}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(
        `SchedulePage: Request ${action} successful for ID: ${requestId}`,
        response.data
      );
      Alert.alert("Success", `Meeting request ${action}ed.`);

      onRefresh(); // Use onRefresh to reload all data
    } catch (error) {
      console.error(
        `*** ERROR ${action.toUpperCase()}ING REQUEST (FULL AXIOS OBJECT) ***:`,
        error
      );
      if (error.response) {
        console.error(
          `Error Status (${action} Request):`,
          error.response.status
        );
        console.error(`Error Data (${action} Request):`, error.response.data);
      }
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          error.message ||
          `Failed to ${action} request. Please try again.`
      );
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Helper to get display label for filter status - not used directly on button now, but still useful
  const getFilterStatusLabel = (status) => {
    switch (status) {
      case "all":
        return "All Events";
      case "accepted":
        return "Accepted";
      case "pending":
        return "Pending";
      case "rejected":
        return "Rejected";
      default:
        return "All Events";
    }
  };

  // --- Function to filter events ---
  const getFilteredEvents = useCallback(() => {
    const sortedEvents = [...events].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA - dateB;
    });

    if (filterStatus === "all") {
      return sortedEvents;
    } else {
      return sortedEvents.filter((event) => {
        const isMeetingType = [
          "meeting_request",
          "accepted_meeting",
          "rejected_meeting",
        ].includes(event.type);
        return isMeetingType && event.status === filterStatus;
      });
    }
  }, [events, filterStatus]);

  const eventDates = getEventDates(events).filter((date) =>
    date.startsWith(
      `${currentYear}-${currentMonth.toString().padStart(2, "0")}`
    )
  );

  if (!fontsLoaded || loading) {
    return (
      <ActivityIndicator size="large" style={{ flex: 1, marginTop: 100 }} />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 20 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.logoBlue}
          colors={[COLORS.logoBlue]}
        />
      }
    >
      {/* Header, Logo, etc. */}
      <View style={styles.headerContainer}>
        <Text style={styles.logoText}>
          <Text style={{ color: COLORS.logoGreen }}>Grow</Text>
          <Text style={{ color: COLORS.logoBlue }}>Hive</Text>
        </Text>
      </View>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Schedule</Text>
      </View>

      {/* Calendar */}
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeaderRow}>
          <TouchableOpacity onPress={handlePrevMonth}>
            <Ionicons name="chevron-back" size={22} color="#A1A1AA" />
          </TouchableOpacity>
          <Text style={styles.calendarHeader}>
            {new Date(currentYear, currentMonth - 1).toLocaleString("default", {
              month: "long",
            })}
          </Text>
          <TouchableOpacity onPress={handleNextMonth}>
            <Ionicons name="chevron-forward" size={22} color="#A1A1AA" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePrevYear} style={{ marginLeft: 16 }}>
            <Ionicons name="chevron-back" size={18} color="#A1A1AA" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setYearPickerVisible(true)}>
            <Text
              style={[
                styles.calendarHeader,
                { textDecorationLine: "underline", marginHorizontal: 4 },
              ]}
            >
              {currentYear}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNextYear}>
            <Ionicons name="chevron-forward" size={18} color="#A1A1AA" />
          </TouchableOpacity>
        </View>
        <CalendarGrid
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          month={currentMonth}
          year={currentYear}
          eventDates={eventDates}
          onDateSelectForSchedule={handleDateSelectForSchedule}
        />
      </View>

      {/* Modals for scheduling workflow */}
      {scheduleDate && (
        <TimePicker
          visible={timePickerVisible}
          onClose={() => {
            setTimePickerVisible(false);
            setSelectedDate(null);
          }}
          onSelectTime={handleTimeSelected}
          selectedDate={scheduleDate}
        />
      )}
      {selectedTime && scheduleDate && (
        <SchedulePartnerModal
          visible={partnerModalVisible}
          onClose={() => {
            setPartnerModalVisible(false);
            setSelectedDate(null);
            setSelectedUserForMeeting(null);
          }}
          onScheduleConfirm={handleScheduleConfirm}
          selectedDate={scheduleDate}
          selectedTime={selectedTime}
          availableUsers={availableUsers}
          selectedUser={selectedUserForMeeting}
          onSelectUser={(user) => {
            setSelectedUserForMeeting(user);
            setIsUserPickerVisible(false);
          }}
          onOpenUserPicker={() => setIsUserPickerVisible(true)}
        />
      )}
      {isUserPickerVisible && (
        <UserPickerModal
          visible={isUserPickerVisible}
          users={availableUsers}
          onSelectUser={(user) => {
            setSelectedUserForMeeting(user);
            setIsUserPickerVisible(false);
          }}
          onClose={() => setIsUserPickerVisible(false)}
        />
      )}
      {requestsModalVisible && (
        <RequestsModal
          visible={requestsModalVisible}
          requests={incomingRequests}
          onClose={() => setRequestsModalVisible(false)}
          onAccept={handleRequestAction}
          onReject={handleRequestAction}
        />
      )}

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.seeRequestsBtn}
          onPress={() => setRequestsModalVisible(true)}
        >
          <Text style={styles.seeRequestsText}>
            See Requests ({incomingRequests.length})
          </Text>
        </TouchableOpacity>

        {/* Filters button, styled like a notification button */}
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setIsFilterDropdownVisible(true)}
        >
          <Ionicons name="filter-outline" size={20} color={COLORS.logoBlue} />
          <Text style={styles.filterBtnText}>Filters</Text>
          {filterStatus !== "all" && (
            <View style={styles.filterActiveIndicator} /> // Indicator for active filter
          )}
        </TouchableOpacity>
      </View>

      {/* Filter Dropdown Modal (positioned from the top right) */}
      <FilterDropdownModal
        visible={isFilterDropdownVisible}
        onClose={() => setIsFilterDropdownVisible(false)}
        onSelectFilter={(status) => setFilterStatus(status)}
        currentFilter={filterStatus}
      />

      <Text style={styles.upcomingHeader}>Upcoming Events</Text>

      {/* Displaying filtered events */}
      {getFilteredEvents().length === 0 ? (
        <Text style={styles.noEventsText}>
          No events found for this filter.
        </Text>
      ) : (
        <FlatList
          data={getFilteredEvents()}
          keyExtractor={(item, index) =>
            item.id ? item.id.toString() : index.toString()
          }
          renderItem={({ item }) => {
            let statusText = "";
            let statusColor = item.color;
            let displayTitle = item.title;
            let withText = item.instructor ? `With ${item.instructor}` : "";

            if (
              [
                "meeting_request",
                "accepted_meeting",
                "rejected_meeting",
              ].includes(item.type)
            ) {
              const otherPerson =
                item.requesterName ||
                item.recipientName ||
                item.instructor ||
                "Another User";

              switch (item.status) {
                case "pending":
                  statusText = "Pending";
                  statusColor = "orange";
                  break;
                case "accepted":
                  statusText = "Accepted";
                  statusColor = "green";
                  break;
                case "rejected":
                  statusText = "Rejected";
                  statusColor = "red";
                  break;
                default:
                  statusText = "";
              }
              withText = "";
            } else if (item.type === "workshop") {
              statusText = "Workshop";
              statusColor = item.color || COLORS.logoBlue;
            }
            return (
              <View
                style={[
                  styles.eventCard,
                  { borderLeftColor: statusColor || COLORS.DBEAFE },
                ]}
              >
                <View style={styles.eventIcon}>{item.icon}</View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{displayTitle}</Text>
                  {withText ? (
                    <Text style={styles.eventInstructor}>{withText}</Text>
                  ) : null}
                  <View style={styles.eventTimeRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color="#6B7280"
                    />
                    <Text style={styles.eventTime}>
                      {new Date(item.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      · {item.time}
                    </Text>
                  </View>
                  {statusText ? (
                    <Text
                      style={[styles.eventStatusText, { color: statusColor }]}
                    >
                      Status: {statusText}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          }}
          style={styles.eventsList}
          scrollEnabled={false}
        />
      )}

      {/* Processing Overlay for actions */}
      <ProcessingOverlay visible={isProcessingAction} message="Updating..." />
    </ScrollView>
  );
}
