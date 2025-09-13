import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  ScrollView,
  StyleSheet,
  Animated,
  Pressable,
  Modal,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import LottieView from "lottie-react-native";
import { Svg, Path } from "react-native-svg";
import { useFocusEffect } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import { useEffect } from "react";

import { IP } from "../Config/config";
const API_BASE_URL = `${IP}/api/auth`;

const ContactScreen = ({ navigation }) => {
  const [userDetails, setUserDetails] = useState(null);
  const [hasPostedToServiceNow, setHasPostedToServiceNow] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [department, setDepartment] = useState("");
  const [description, setDescription] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [subject, setSubject] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [recentReports, setRecentReports] = useState([]);
  const postToServiceNowViaBackend = async () => {
    try {
      const storedUserId = await SecureStore.getItemAsync("userId");
      if (!storedUserId) {
        Alert.alert("Error", "No user ID found. Please log in again.");
        return;
      }

      // Fetch user details
      const res = await axios.get(`${API_BASE_URL}/user/${storedUserId}`);
      setUserDetails(res.data);

      // Sync user with ServiceNow
      const snRes = await axios.post(
        `${API_BASE_URL}/post-user/${storedUserId}`
      );
      console.log(snRes.data?.message);
    } catch (error) {
      console.error(
        "Error posting to ServiceNow:",
        error.response?.data || error.message
      );
      Alert.alert("Error", "Failed to sync with ServiceNow.");
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/departments`);
      setDepartments(response.data);
    } catch (error) {
      console.error(
        "Failed to fetch departments:",
        error.response?.data || error.message
      );
    }
  };

  // const loadUserReports = async () => {
  //   try {
  //     const storedUserId = await SecureStore.getItemAsync("userId");
  //     const userRes = await axios.get(`${API_BASE_URL}/user/${storedUserId}`);
  //     const email = userRes.data.email;

  //     const reportsRes = await axios.get(`${API_BASE_URL}/cases/${email}`);

  //     const reports = reportsRes.data
  //       .filter((report) => report.status?.toLowerCase() !== "completed") // Exclude completed
  //       .map((report, index) => {

  //         return {
  //           id: index.toString(),
  //           sys_id: report.sys_id,
  //           subject: report.subject || "No Subject",
  //           description: report.description || "No Description",
  //           department: report.department?.display_value || "Unknown",
  //           status: report.status || "Unknown",
  //           date: report.createdon || new Date().toISOString(),
  //           caseNumber: report.number || `CASE${index + 1}`,
  //         };
  //       });

  //     setRecentReports(reports);
  //   } catch (err) {
  //     console.error(
  //       "Failed to load reports:",
  //       err.response?.data || err.message
  //     );
  //     Alert.alert("Error", "Could not load recent reports");
  //   }
  // };

  const loadUserReports = async () => {
    try {
      const storedUserId = await SecureStore.getItemAsync("userId");
      const userRes = await axios.get(`${API_BASE_URL}/user/${storedUserId}`);
      const email = userRes.data.email;

      const reportsRes = await axios.get(`${API_BASE_URL}/cases/${email}`);
      const reports = reportsRes.data
        .filter((report) => report.status?.toLowerCase() !== "completed")
        .map((report, index) => {
          return {
            id: index.toString(),
            sys_id: report.sys_id,
            subject: report.subject || "No Subject",
            description: report.description || "No Description",
            department: report.department?.display_value || "Unknown",
            status: report.status
              ? report.status.toLowerCase().replace(/[^a-z0-9 ]/gi, "")
              : "unknown",
            date: report.sys_created_on || new Date().toISOString(),
            caseNumber: report.number || `CASE${index + 1}`,
          };
        });

      setRecentReports(reports);
    } catch (err) {
      console.error(
        "Failed to load reports:",
        err.response?.data || err.message
      );
      Alert.alert("Error", "Could not load recent reports");
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      let intervalId;

      const initialize = async () => {
        await postToServiceNowViaBackend();
        await fetchDepartments();
        await loadUserReports(); // Initial load
      };

      initialize();

      intervalId = setInterval(() => {
        loadUserReports();
      }, 1000);

      return () => clearInterval(intervalId);
    }, [])
  );

  const iconAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleCreateCase = async () => {
    if (!userDetails) {
      Alert.alert("Please wait", "User details are still loading.");
      return;
    }

    if (!department || !description || !subject) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setIsSending(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/contact`, {
        name: userDetails?.name,
        email: userDetails?.email,
        subject,
        description,
        department: department.name,
      });

      Alert.alert("Success", "Case created and sent to ServiceNow");

      setModalVisible(false);
      setDepartment("");
      setDescription("");
      setSubject("");

      const newCase = {
        id: Date.now().toString(),
        department: department.name,
        subject,
        description,
        status: "new",
        date: new Date().toISOString().split("T")[0],
        caseNumber: `CS${String(recentReports.length + 1).padStart(3, "0")}`,
      };
      setRecentReports((prev) => [newCase, ...prev]);
    } catch (err) {
      console.error(
        "Error submitting case:",
        err.response?.data || err.message
      );
      Alert.alert("Error", "Failed to create case. Please try again.");
    } finally {
      setIsSending(false); // ✅ Re-enable send button
    }
  };

  const handleReportManagement = () => {
    navigation.navigate("MainStack", {
      screen: "ReportScreen",
    });
  };

  const handleKnowledgeManagement = () => {
    navigation.navigate("MainStack", {
      screen: "KnowledgeScreen",
    });
  };
  const handleDepartmentSelect = (selectedDept) => {
    setDepartment(selectedDept); // Save full object
    setDropdownVisible(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "#10B981";
      case "progress":
        return "#EF4444";
      case "onhold":
        return "#F59E0B";
      case "new":
        return "#4DA8DA";
      case "New":
        return "#4DA8DA";
      default:
        return "#6B7280";
    }
  };

  // Create individual report cards without FlatList
  const renderRecentReports = () => {
    if (recentReports.length === 0) {
      return (
        <View style={styles.emptyState}>
          <MaterialIcons name="inbox" size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>No reports yet</Text>
        </View>
      );
    }

    return recentReports.map((item) => (
      <View key={item.id} style={styles.reportCard}>
        <View style={styles.reportHeader}>
          <Text style={styles.caseNumber}>{item.caseNumber}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.reportDepartment}>
          Department:{item.department}
        </Text>
        <Text style={styles.reportDescription} numberOfLines={2}>
          Subject:
          {item.subject}
        </Text>
        <Text style={styles.reportDate}>Created: {item.date}</Text>
      </View>
    ));
  };

  return (
    <ScrollView style={styles.container}>
      <LottieView
        source={require("../assets/Animation - 1749013885897.json")}
        autoPlay
        loop
        style={styles.lottie}
      />

      <Text style={styles.header}>Features</Text>

      {/* Create Case Button */}
      <TouchableOpacity
        style={styles.createCaseButton}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.buttonContent}>
          <MaterialIcons name="add-circle" size={24} color="#fff" />
          <Text style={styles.buttonText}>Create Case</Text>
        </View>
      </TouchableOpacity>

      {/* Report Management Button */}
      <TouchableOpacity
        style={styles.reportManagementButton}
        onPress={handleReportManagement}
      >
        <View style={styles.buttonContent} onPress={handleReportManagement}>
          <MaterialIcons name="assessment" size={24} color="#fff" />
          <Text style={styles.buttonText}>Report Management</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.selfservice}
        onPress={handleKnowledgeManagement}
      >
        <View style={styles.buttonContent} onPress={handleKnowledgeManagement}>
          <MaterialIcons name="support-agent" size={24} color="#fff" />
          <Text style={styles.buttonText}>Self Service</Text>
        </View>
      </TouchableOpacity>

      {/* Recent Reports Section */}
      <View style={styles.recentReportsSection}>
        <Text style={styles.sectionTitle}>Recent Reports</Text>
        {renderRecentReports()}
      </View>

      {/* Create Case Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setDropdownVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create new Case</Text>
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    setDropdownVisible(false);
                  }}
                  style={styles.closeButton}
                >
                  <MaterialIcons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalBody}
                contentContainerStyle={{ paddingBottom: 30 }}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
              >
                <Text style={styles.inputLabel}>Department</Text>

                {/* Dropdown Container */}
                {/* <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setDropdownVisible(!dropdownVisible)}
                  >
                    <Text
                      style={[
                        styles.dropdownButtonText,
                        !department && styles.placeholderText,
                      ]}
                    >
                      {department?.name || "Select Department"}
                    </Text>
                    <MaterialIcons
                      name={
                        dropdownVisible
                          ? "keyboard-arrow-up"
                          : "keyboard-arrow-down"
                      }
                      size={24}
                      color="#6B7280"
                    />
                  </TouchableOpacity>

                  {dropdownVisible && (
                    <View style={{ flex: 1 }}>
                      <ScrollView
                        style={styles.dropdownScrollView}
                        nestedScrollEnabled={true}
                        keyboardShouldPersistTaps="handled"
                      >
                        {departments.map((item, index) => (
                          <View key={item.sys_id || index.toString()}>
                            <TouchableOpacity
                              style={[
                                styles.dropdownItem,
                                index === 0 && styles.firstDropdownItem,
                                index === departments.length - 1 &&
                                  styles.lastDropdownItem,
                              ]}
                              onPress={() => handleDepartmentSelect(item)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.dropdownItemText}>
                                {item.name}
                              </Text>
                            </TouchableOpacity>
                            {index < departments.length - 1 && (
                              <View style={styles.dropdownSeparator} />
                            )}
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View> */}

                {/* Dropdown Container */}
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setDropdownVisible(!dropdownVisible)}
                  >
                    <Text
                      style={[
                        styles.dropdownButtonText,
                        !department && styles.placeholderText,
                      ]}
                    >
                      {department?.name || "Select Department"}
                    </Text>
                    <MaterialIcons
                      name={
                        dropdownVisible
                          ? "keyboard-arrow-up"
                          : "keyboard-arrow-down"
                      }
                      size={24}
                      color="#6B7280"
                    />
                  </TouchableOpacity>

                  {dropdownVisible && (
                    <View style={{ flex: 1 }}>
                      <ScrollView
                        style={styles.dropdownScrollView}
                        nestedScrollEnabled={true}
                        keyboardShouldPersistTaps="handled"
                      >
                        {departments.map((item, index) => (
                          <View key={item.sys_id || index.toString()}>
                            <TouchableOpacity
                              style={[
                                styles.dropdownItem,
                                index === 0 && styles.firstDropdownItem,
                                index === departments.length - 1 &&
                                  styles.lastDropdownItem,
                              ]}
                              onPress={() => handleDepartmentSelect(item)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.dropdownItemText}>
                                {item.name}
                              </Text>
                            </TouchableOpacity>
                            {index < departments.length - 1 && (
                              <View style={styles.dropdownSeparator} />
                            )}
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                <Text style={styles.inputLabel}>Subject</Text>

                <TextInput
                  style={styles.subject}
                  placeholder="Enter Subject"
                  value={subject}
                  onChangeText={setSubject}
                  multiline={false}
                  numberOfLines={1}
                  textAlignVertical="top"
                />

                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={styles.descriptionInput}
                  placeholder="Describe your issue or request..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                {/* <Pressable style={styles.sendButton} onPress={handleCreateCase}>
                  <Animated.View
                    style={[
                      styles.iconWrapper,
                      { transform: [{ scale: iconAnim }] },
                    ]}
                  >
                    <MaterialIcons name="send" size={20} color="#fff" />
                  </Animated.View>
                  <Text style={styles.sendText}>Send</Text>
                </Pressable> */}

                <Pressable
                  style={[styles.sendButton, isSending && { opacity: 0.6 }]}
                  onPress={handleCreateCase}
                  disabled={!userDetails || isSending} // ✅ disable during send
                >
                  <Animated.View
                    style={[
                      styles.iconWrapper,
                      { transform: [{ scale: iconAnim }] },
                    ]}
                  >
                    <MaterialIcons name="send" size={20} color="#fff" />
                  </Animated.View>
                  <Text style={styles.sendText}>
                    {isSending ? "Sending..." : "Send"}
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#F7F9FA",
  },
  lottie: {
    width: 200,
    height: 200,
    alignSelf: "center",
    marginTop: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "left",
    color: "#1F2937",
    marginLeft: 35,
  },
  createCaseButton: {
    backgroundColor: "#10B981",
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reportManagementButton: {
    backgroundColor: "#3B82F6",
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  selfservice: {
    marginTop: -10,
    backgroundColor: "#F59E0B",
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  recentReportsSection: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
  },
  reportCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  caseNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  reportDepartment: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
    lineHeight: 20,
  },
  reportDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#9CA3AF",
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 20,
    maxHeight: "80%",
    width: "90%",
    overflow: "hidden", // Prevent content from bleeding outside
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
    backgroundColor: "#fff",
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  // Improved Dropdown Styles
  // dropdownContainer: {
  //   marginBottom: 16,
  //   position: "relative",
  //   zIndex: 9999, // Highest z-index
  // },

  // Simplify the dropdown z-index
  dropdownContainer: {
    marginBottom: 16,
  },
  dropdownList: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    maxHeight: 200,
    elevation: 10, // Reduced elevation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  dropdownButton: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 48,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: "#374151",
    flex: 1,
  },
  placeholderText: {
    color: "#9CA3AF",
  },
  // dropdownList: {
  //   position: "absolute",
  //   top: 52, // Position right below the button
  //   left: 0,
  //   right: 0,
  //   backgroundColor: "#fff",
  //   borderWidth: 1,
  //   borderColor: "#E5E7EB",
  //   borderRadius: 8,
  //   maxHeight: 200,
  //   elevation: 15, // Higher elevation for Android
  //   shadowColor: "#000",
  //   shadowOffset: { width: 0, height: 8 },
  //   shadowOpacity: 0.25,
  //   shadowRadius: 12,
  //   zIndex: 10000, // Ensure it's above everything
  // },

  // dropdownList: {
  //   position: "absolute",
  //   top: 52,
  //   left: 0,
  //   right: 0,
  //   backgroundColor: "#fff",
  //   borderWidth: 1,
  //   borderColor: "#E5E7EB",
  //   borderRadius: 8,
  //   elevation: 15,
  //   shadowColor: "#000",
  //   shadowOffset: { width: 0, height: 8 },
  //   shadowOpacity: 0.25,
  //   shadowRadius: 12,
  //   zIndex: 10000,
  //   maxHeight: 200, // ✅ this is critical
  // },

  dropdownScrollView: {
    maxHeight: 200,
    flexGrow: 0,
  },
  dropdownItem: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 0, // Remove default border
  },
  firstDropdownItem: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  lastDropdownItem: {
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#374151",
  },
  dropdownSeparator: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 0, // Full width separator
  },
  descriptionInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 100,
    marginBottom: 20,
  },
  subject: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 50,
    marginBottom: 16,
  },
  sendButton: {
    flexDirection: "row",
    backgroundColor: "#10B981",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 10,
  },
  iconWrapper: {
    marginRight: 8,
  },
  sendText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ContactScreen;
