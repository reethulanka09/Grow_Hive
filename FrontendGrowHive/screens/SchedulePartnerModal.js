// SchedulePartnerModal.js
import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "./constants";

function SchedulePartnerModal({
  visible,
  onClose,
  onScheduleConfirm,
  selectedDate,
  selectedTime,
  availableUsers,
  selectedUser,
  onSelectUser,
  onOpenUserPicker,
}) {
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingLink, setMeetingLink] = useState(""); // Corrected state variable name to camelCase

  const handleConfirm = () => {
    if (!meetingTitle.trim()) {
      Alert.alert("Missing Information", "Please enter the meeting title.");
      return;
    }
    if (!selectedUser) {
      Alert.alert(
        "Missing Information",
        "Please select a partner for the meeting."
      );
      return;
    }
    // Pass both meetingTitle and meetingLink to the onScheduleConfirm function
    onScheduleConfirm(meetingTitle, meetingLink);
  };

  useEffect(() => {
    if (!visible) {
      setMeetingTitle("");
      setMeetingLink(""); // Reset meetingLink when modal closes
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Schedule Meeting</Text>
          <Text style={styles.modalSubtitle}>
            On: {selectedDate} at {selectedTime}
          </Text>

          <TextInput
            style={styles.textInput}
            placeholder="Meeting Title (e.g., Project Discussion)"
            placeholderTextColor="#999"
            value={meetingTitle}
            onChangeText={setMeetingTitle}
          />
          <TextInput
            style={styles.textInput}
            placeholder="Meeting Link (e.g., Google Meet link)" // CHANGED THIS PLACEHOLDER
            placeholderTextColor="#999"
            value={meetingLink}
            onChangeText={setMeetingLink} // Corrected onChangeText to use setMeetingLink
          />

          <Text style={styles.inputHeading}>Schedule with whom?</Text>
          <TouchableOpacity
            style={styles.dropdownTrigger}
            onPress={onOpenUserPicker}
          >
            <Text style={styles.dropdownText}>
              {selectedUser ? selectedUser.name : "Select Partner"}
            </Text>
            <Ionicons name="chevron-down" size={20} color={COLORS.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.scheduleConfirmButton}
            onPress={handleConfirm}
          >
            <Text style={styles.scheduleConfirmButtonText}>
              Confirm Schedule
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.modalCancelButton}>
            <Text style={styles.modalCancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white, // Or a semi-transparent color like 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: "85%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: COLORS.textDark,
    marginBottom: 10,
  },
  modalSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: COLORS.textGray,
    marginBottom: 15,
    textAlign: "center",
  },
  textInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    // fontFamily: 'Poppins_400Regular', // Uncomment if loaded in this component
    marginBottom: 15,
    color: COLORS.text,
  },
  inputHeading: {
    fontSize: 14,
    // fontFamily: 'Poppins_600SemiBold', // Uncomment if loaded in this component
    color: COLORS.text,
    alignSelf: "flex-start",
    marginBottom: 8,
    marginTop: 5,
  },
  dropdownTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    backgroundColor: COLORS.white,
    width: "100%",
  },
  dropdownText: {
    fontSize: 16,
    // fontFamily: 'Poppins_400Regular', // Uncomment if loaded in this component
    color: COLORS.text,
    flex: 1,
  },
  scheduleConfirmButton: {
    backgroundColor: COLORS.logoBlue,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    width: 180,
  },
  scheduleConfirmButtonText: {
    color: "white",
    fontSize: 18,
    // fontFamily: 'Poppins_700Bold', // Uncomment if loaded in this component
  },
  modalCancelButton: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  modalCancelButtonText: {
    color: "black",
    fontSize: 16,
  },
});

export default SchedulePartnerModal;
