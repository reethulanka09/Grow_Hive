import { StyleSheet, Platform } from 'react-native';
import { COLORS } from './constants'; // Make sure this path to your constants file is correct

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FDFF', // Light background color
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  headerContainer: {
    width: '120%', // Extends beyond the screen width
    backgroundColor: COLORS.background, // Background color from constants
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -50, // Pulls it up to cover the status bar area
    marginLeft: -20, // Aligns to the left edge despite width
    paddingTop: 62, // Padding for status bar content
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e7ef',
    paddingVertical: 10,
    zIndex: 10, // Ensures it's above other elements
    elevation: 4, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    marginBottom: 20,
  },
  logoText: {
    fontFamily: 'Poppins_700Bold', // Custom font
    fontSize: 24,
    letterSpacing: 0.5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  header: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#22223B', // Dark text color
  },
  addButton: {
    backgroundColor: '#22C55E', // Green button
    borderRadius: 20,
    padding: 7,
  },
  calendarContainer: {
    backgroundColor: '#fff', // White background for calendar
    borderRadius: 16,
    padding: 16,
    marginBottom: 22,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calendarHeader: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#22223B',
  },
  calendarNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2, // Space between nav icons (React Native specific property)
  },
  calendarDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    marginTop: 2,
  },
  calendarDayName: {
    width: 28, // Fixed width for each day name column
    textAlign: 'center',
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: '#A1A1AA', // Grey text for day names
  },
  calendarWeek: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  calendarDay: {
    width: 28, // Fixed width for each day cell
    height: 28, // Fixed height for each day cell
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#22223B',
  },
  calendarDaySelected: {
    backgroundColor: '#22C55E', // Green background for selected day
  },
  calendarDayTextSelected: {
    color: '#fff', // White text for selected day
    fontFamily: 'Poppins_700Bold',
  },
  calendarDayEvent: {
    backgroundColor: '#E0F2FE', // Light blue background for days with events
  },
  calendarDayTextEvent: {
    color: '#2563EB', // Blue text for days with events
    fontFamily: 'Poppins_700Bold',
  },
  upcomingHeader: {
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
    marginVertical: 10,
    color: '#22223B',
  },
  eventsList: {
    marginBottom: 16,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    // Added styling for consistency with your event card design from previous updates
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 5, // For the color indicator
    borderLeftColor: COLORS.primaryLight, // Default color, will be overridden by inline style
  },
  eventIcon: {
    marginRight: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 8,
  },
  eventInfo: {
    flex: 1, // Takes up remaining space
  },
  eventTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: '#22223B',
  },
  eventInstructor: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#6B7280', // Grey text
    marginVertical: 2,
  },
  eventTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  eventTime: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  eventStatusText: { // Added for event status display
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
    fontFamily: 'Poppins_700Bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 32,
  },
  seeRequestsBtn: {
    backgroundColor: '#22C55E', // Green button
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 18,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center', // Ensure text is centered
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  seeRequestsText: {
    color: '#fff',
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
  },
  // *** NEW/MODIFIED STYLES FOR FILTERS BUTTON ***
  filterBtn: {
    backgroundColor: COLORS.logoBlue, // Using logoBlue as per your addPartnerBtn
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 18,
    flex: 1,
    marginLeft: 8, // Use marginLeft to place it next to See Requests
    alignItems: 'center',
    justifyContent: 'center', // Center icon and text
    flexDirection: 'row', // To align icon and text horizontally
    position: 'relative', // For the active indicator badge
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterBtnText: {
    color: '#fff', // White text like other action buttons
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    marginLeft: 8, // Space between icon and text
  },
  filterActiveIndicator: {
    position: 'absolute',
    top: -5, // Adjust as needed to position the dot
    right: -5, // Adjust as needed
    backgroundColor: COLORS.red, // Red dot to indicate active filter
    borderRadius: 6,
    width: 12,
    height: 12,
    borderWidth: 2,
    borderColor: COLORS.white, // White border around the dot
  },
  // *** END NEW/MODIFIED STYLES ***

  upcomingHeader: {
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
    marginVertical: 10,
    color: '#22223B',
  },
  eventsList: {
    marginBottom: 16,
  },
  noEventsText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginVertical: 20,
  },

  // --- STYLES FOR FILTER DROPDOWN MODAL ---
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start', // Align to top
    alignItems: 'flex-end', // Align to right
    // Adjusted paddingTop to account for header height and button position
    paddingTop: Platform.OS === 'ios' ? 180 : 160,
    paddingRight: 20, // Aligns with the right padding of the container
  },
  filterModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    width: 180, // Fixed width for the dropdown
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
    overflow: 'hidden', // Ensures options stay within rounded borders
  },
  filterModalOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6', // Light border between items
  },
  filterModalOptionActive: {
    backgroundColor: COLORS.backgroundLight, // Lighter background for active option
  },
  filterModalOptionText: {
    fontSize: 16,
    color: '#22223B',
    fontFamily: 'Poppins_400Regular',
  },
  filterModalOptionTextActive: {
    color: COLORS.logoBlue, // Blue text for active option
    fontFamily: 'Poppins_700Bold',
  },

  // --- Existing Modal Styles (Ensuring consistency) ---
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: '#22223B',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 15,
    textAlign: 'center',
  },
  textInput: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 15,
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#22223B',
  },
  scheduleConfirmButton: {
    backgroundColor: COLORS.logoGreen, // Green button for confirmation
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  scheduleConfirmButtonText: {
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
    fontSize: 16,
  },
  modalCancelButton: {
    marginTop: 15,
    paddingVertical: 10,
  },
  modalCancelButtonText: {
    fontFamily: 'Poppins_400Regular',
    color: 'black',
    fontSize: 16,
  },
  timeOption: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    width: '100%',
    alignItems: 'center',
  },
  timeOptionText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#22223B',
  },
  timeOptionsContainer: {
    width: '100%',
    maxHeight: 200, // Limit height for scrolling
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalConfirmButton: {
    backgroundColor: COLORS.logoGreen, // Or a suitable confirm color
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    width: 180,
  },
  modalConfirmButtonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
  selectTimeButton: {
    backgroundColor: COLORS.logoBlue, // A primary color for the button
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  selectTimeButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold', // Make sure this font is loaded or remove if not
  },
  selectedTimePreview: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold', // Make sure this font is loaded or remove if not
    color: '#22223B',
    textAlign: 'center',
    marginBottom: 20,
  },
  // Styles for Partner Selection within SchedulePartnerModal
  partnerListContainer: {
    flex: 1, // Take available space
    marginTop: 15,
    marginBottom: 10,
    maxHeight: 200, // Limit height for scrolling the user list
    width: '100%',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden', // Ensures content stays within rounded borders
  },
  selectPartnerButton: {
    backgroundColor: '#E0F2FE', // Light blue background
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20, // Space before confirm button
  },
  selectPartnerButtonText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: COLORS.logoBlue,
  },
  partnerListItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6', // Very light border between items
    backgroundColor: '#fff', // White background for items
  },
  partnerListItemText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#22223B',
  },

  // Styles for RequestsModal
  requestCard: {
    backgroundColor: '#F9FAFB', // Light gray background
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  requestSender: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#22223B',
    marginBottom: 5,
  },
  requestDetails: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 5,
  },
  requestMessage: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#4A4A4A',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  acceptButton: {
    backgroundColor: COLORS.logoGreen,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    flex: 1, // Added flex to distribute space
    marginRight: 5, // Added margin for spacing
    alignItems: 'center', // Center text
  },
  acceptButtonText: {
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    fontSize: 14,
  },
  rejectButton: {
    backgroundColor: COLORS.red, // Assuming COLORS.red is defined
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    flex: 1, // Added flex to distribute space
    marginLeft: 5, // Added margin for spacing
    alignItems: 'center', // Center text
  },
  rejectButtonText: {
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    fontSize: 14,
  },
  requestsList: {
    maxHeight: 300, // Adjust as needed to fit content
    width: '100%',
    marginVertical: 10,
  },
  noRequestsText: { // Renamed from noEventsText for clarity in requests modal context
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginVertical: 20,
  },
  pendingRequestText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.warningYellow, // Using warningYellow from previous example
    marginLeft: 'auto', // Pushes it to the right
  },
  acceptedRequestText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.successGreen, // Using successGreen from previous example
    marginLeft: 'auto',
  },
  rejectedRequestText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.errorRed, // Using errorRed from previous example
    marginLeft: 'auto',
  },

  // Calendar grid specific styles (from previous iterations, ensure consistency)
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calendarWeekdays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 5,
  },
  calendarWeekdayText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: '#A1A1AA',
    width: '14%',
    textAlign: 'center',
  },
  calendarDaysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  calendarDayEmpty: {
    width: '14%',
    height: 28,
  },
  selectedDay: {
    backgroundColor: '#22C55E', // Green background for selected day
    borderRadius: 8,
  },
  selectedDayText: {
    color: '#fff', // White text for selected day
    fontFamily: 'Poppins_700Bold',
  },
  todayCircle: { // Style for today's date
    borderColor: COLORS.logoBlue, // Blue border for today
    borderWidth: 2,
    borderRadius: 8, // Keep square rounded corners or make it a circle if desired
  },
  eventDot: { // Small dot indicating an event
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.logoBlue, // Blue dot
    position: 'absolute',
    bottom: 3,
  },
});