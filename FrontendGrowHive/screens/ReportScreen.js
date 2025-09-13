// import React, { useState, useEffect, useCallback } from "react";
// import {
//   View,
//   Text,
//   ScrollView,
//   StyleSheet,
//   TouchableOpacity,
//   TextInput,
//   FlatList,
//   Alert,
//   Modal,
//   RefreshControl,
// } from "react-native";
// import { MaterialIcons, Feather } from "@expo/vector-icons";
// import { PieChart } from "react-native-svg-charts";
// import { useFocusEffect } from "@react-navigation/native";
// import axios from "axios";
// import * as SecureStore from "expo-secure-store";
// import { IP } from "../Config/config";
// const API_BASE_URL = `${IP}/api/auth`;

// export const ReportScreen = ({ navigation }) => {
//   const [statusCounts, setStatusCounts] = useState({
//     new: 0,
//     progress: 0,
//     onhold: 0,
//     completed: 0,
//   });

//   const [searchText, setSearchText] = useState("");
//   const [filterStatus, setFilterStatus] = useState("All");
//   const [selectedSliceIndex, setSelectedSliceIndex] = useState(null);
//   const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
//   const [selectedReportId, setSelectedReportId] = useState(null);
//   const [onholdReason, setOnholdReason] = useState("");
//   const [reports, setReports] = useState([]);
//   const [refreshing, setRefreshing] = useState(false);
//   const [userEmail, setUserEmail] = useState("");

//   // Auto-refresh interval (every 10 seconds)
//   const AUTO_REFRESH_INTERVAL = 10000;
//   const statusOptions = ["All", "new", "progress", "onhold", "completed"];

//   // Helper function to safely extract string value from object or string
//   const safeStringValue = (value) => {
//     if (!value) return "";
//     if (typeof value === "string") return value;
//     if (typeof value === "object") {
//       return value.display_value || value.value || "";
//     }
//     return String(value);
//   };

//   const getStatusColor = (status) => {
//     switch (status?.toLowerCase()) {
//       case "new":
//         return "#4DA8DA";
//       case "progress":
//         return "#EF4444";
//       case "onhold":
//         return "#F59E0B";
//       case "completed":
//         return "#10B981";
//       default:
//         return "#6B7280";
//     }
//   };

//   // Get user email on component mount
//   useEffect(() => {
//     const getUserEmail = async () => {
//       try {
//         const storedEmail = await SecureStore.getItemAsync("userEmail");
//         if (storedEmail) {
//           setUserEmail(storedEmail);
//         } else {
//           console.warn("User email not found in SecureStore");
//         }
//       } catch (error) {
//         console.error("Error retrieving user email:", error);
//       }
//     };
//     getUserEmail();
//   }, []);

//   const fetchReportsFromServiceNow = async (showRefreshing = false) => {
//     if (!userEmail) return;

//     if (showRefreshing) {
//       setRefreshing(true);
//     }

//     try {
//       const encodedEmail = encodeURIComponent(userEmail);
//       const response = await axios.get(`${API_BASE_URL}/all/${encodedEmail}`, {
//         timeout: 10000,
//       });

//       if (response.data?.reports) {
//         // Transform the data to match your component structure
//         const transformedReports = response.data.reports.map((report) => {
//           return {
//             id: report.id,
//             caseNumber: safeStringValue(report.issueNumber) || "N/A",
//             department: safeStringValue(report.department) || "Unknown",
//             subject: safeStringValue(report.subject) || "No subject",
//             status: safeStringValue(report.status)?.toLowerCase() || "new",
//             description: safeStringValue(report.description) || "",
//             date: safeStringValue(report.createdOn),
//             assignedTo: safeStringValue(report.assignedTo) || "Unassigned",
//             lastUpdated: safeStringValue(report.createdOn),
//             solution: safeStringValue(report.solution) || "",
//             createdOn: safeStringValue(report.createdOn),
//             completedOn: null,
//             isAccepted: null,
//             onholdReason: safeStringValue(report.onholdReason),
//             sys_id: safeStringValue(report.sys_id),
//             departmentSysId: safeStringValue(report.departmentSysId),
//             assignedToSysId: safeStringValue(report.assignedToSysId),
//           };
//         });

//         setReports(transformedReports);

//         // Update status counts based on fetched data
//         const counts = { new: 0, progress: 0, onhold: 0, completed: 0 };
//         transformedReports.forEach((report) => {
//           const status = report.status.toLowerCase();
//           if (counts[status] !== undefined) counts[status]++;
//         });
//         setStatusCounts(counts);
//       }
//     } catch (error) {
//       console.error("Failed to fetch reports:", error);
//       // Only show alert if it's a manual refresh
//       if (showRefreshing) {
//         Alert.alert("Error", "Failed to fetch reports. Please try again.");
//       }
//     } finally {
//       if (showRefreshing) {
//         setRefreshing(false);
//       }
//     }
//   };

//   // Automatic data fetching with interval
//   useEffect(() => {
//     if (!userEmail) return;

//     // Initial fetch
//     fetchReportsFromServiceNow(false);

//     // Set up interval for automatic updates
//     const interval = setInterval(() => {
//       fetchReportsFromServiceNow(false); // Silent refresh without loading indicators
//     }, AUTO_REFRESH_INTERVAL);

//     // Cleanup interval on component unmount
//     return () => clearInterval(interval);
//   }, [userEmail]);

//   // Use useFocusEffect for real-time updates when screen is focused
//   useFocusEffect(
//     useCallback(() => {
//       if (userEmail) {
//         fetchReportsFromServiceNow(false);
//       }
//     }, [userEmail])
//   );

//   // Pull to refresh handler
//   const onRefresh = useCallback(() => {
//     fetchReportsFromServiceNow(true); // Show refreshing indicator for manual refresh
//   }, [userEmail]);

//   // Action handlers
//   const handleAcceptReport = async (id) => {
//     Alert.alert(
//       "Accept Resolution",
//       "Are you satisfied with the resolution of this report?",
//       [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: "Accept",
//           style: "default",
//           onPress: async () => {
//             try {
//               // Call API to update report status
//               await axios.put(`${API_BASE_URL}/reports/${id}/accept`);

//               // Update local state
//               setReports((prev) =>
//                 prev.map((report) =>
//                   report.id === id ? { ...report, isAccepted: true } : report
//                 )
//               );
//               Alert.alert("Success", "Report resolution has been accepted.");

//               // Refresh data to get latest updates
//               fetchReportsFromServiceNow(false);
//             } catch (error) {
//               console.error("Failed to accept report:", error);
//               Alert.alert(
//                 "Error",
//                 "Failed to accept report. Please try again."
//               );
//             }
//           },
//         },
//       ]
//     );
//   };

//   const handleRejectReport = (id) => {
//     setSelectedReportId(id);
//     setIsRejectModalVisible(true);
//   };

//   const submitRejectReport = async () => {
//     if (!onholdReason.trim()) {
//       Alert.alert("Error", "Please provide a reason for rejection.");
//       return;
//     }

//     try {
//       const report = reports.find((r) => r.id === selectedReportId);
//       if (!report) {
//         Alert.alert("Error", "Report not found.");
//         return;
//       }

//       const payload = {
//         sys_id: report.sys_id,
//         email: userEmail,
//         onholdReason: onholdReason.trim(),
//       };

//       const response = await axios.post(`${API_BASE_URL}/reject`, payload);

//       if (response.data.success) {
//         const updated = response.data.data;

//         // Update local report state
//         setReports((prevReports) =>
//           prevReports.map((r) =>
//             r.id === selectedReportId
//               ? {
//                   ...r,
//                   status: updated.newStatus?.toLowerCase() || "onhold",
//                   onholdReason: updated.onholdReason,
//                   lastUpdated: new Date().toISOString(),
//                   isAccepted: false,
//                 }
//               : r
//           )
//         );

//         closeRejectModal();
//         Alert.alert("Success", "Report has been rejected and put on hold.");
//       } else {
//         Alert.alert("Error", "Failed to update report status.");
//       }
//     } catch (error) {
//       console.error("Failed to reject report:", error.response?.data || error);
//       Alert.alert("Error", "Failed to reject report. Please try again.");
//     }
//   };

//   const closeRejectModal = () => {
//     setIsRejectModalVisible(false);
//     setSelectedReportId(null);
//     setOnholdReason("");
//   };

//   const filteredAndSortedReports = reports.filter((report) => {
//     const matchesSearch =
//       !searchText ||
//       report.caseNumber.toLowerCase().includes(searchText.toLowerCase()) ||
//       report.subject.toLowerCase().includes(searchText.toLowerCase()) ||
//       report.department.toLowerCase().includes(searchText.toLowerCase());

//     const matchesStatus =
//       filterStatus === "All" || report.status === filterStatus;

//     return matchesSearch && matchesStatus;
//   });

//   const pieData = [
//     {
//       value: statusCounts["new"],
//       svg: { fill: "#4DA8DA", onPress: () => setSelectedSliceIndex(0) },
//       key: "new",
//       label: "New",
//     },
//     {
//       value: statusCounts["progress"],
//       svg: { fill: "#EF4444", onPress: () => setSelectedSliceIndex(1) },
//       key: "progress",
//       label: "Progress",
//     },
//     {
//       value: statusCounts["onhold"],
//       svg: { fill: "#F59E0B", onPress: () => setSelectedSliceIndex(2) },
//       key: "onhold",
//       label: "On-Hold",
//     },
//     {
//       value: statusCounts["completed"],
//       svg: { fill: "#10B981", onPress: () => setSelectedSliceIndex(3) },
//       key: "completed",
//       label: "Completed",
//     },
//   ].filter((item) => item.value > 0);

//   // Roadmap helpers
//   const getStatusIndex = (status) => {
//     switch (status?.toLowerCase()) {
//       case "new":
//         return 0;
//       case "progress":
//         return 1;
//       case "onhold":
//         return 2;
//       case "completed":
//         return 3;
//       default:
//         return 4;
//     }
//   };

//   // Format date safely
//   const formatDate = (dateString) => {
//     if (!dateString) return "N/A";
//     try {
//       return new Date(dateString).toLocaleDateString();
//     } catch (error) {
//       return "N/A";
//     }
//   };

//   // Render simplified roadmap
//   const renderRoadmap = (report) => {
//     const stages = ["new", "progress", "onhold", "completed"];
//     const currentIndex = getStatusIndex(report.status);

//     return (
//       <View>
//         <View style={styles.roadmapContainer}>
//           {stages.map((stage, index) => {
//             const isActive = index <= currentIndex;
//             const isCurrent = index === currentIndex;
//             const color = isActive ? getStatusColor(stage) : "#D1D5DB";
//             const isLast = index === stages.length - 1;

//             return (
//               <React.Fragment key={stage}>
//                 <View style={styles.roadmapStep}>
//                   <View
//                     style={[
//                       styles.roadmapCircle,
//                       {
//                         backgroundColor: color,
//                         borderWidth: isCurrent ? 2 : 1,
//                         borderColor: isCurrent ? color : "transparent",
//                       },
//                     ]}
//                   >
//                     {index < currentIndex && (
//                       <MaterialIcons name="check" size={12} color="white" />
//                     )}
//                   </View>
//                   <Text style={[styles.roadmapLabel, { color: color }]}>
//                     {stage}
//                   </Text>
//                 </View>
//                 {!isLast && (
//                   <View
//                     style={[
//                       styles.roadmapLine,
//                       {
//                         borderColor:
//                           index < currentIndex
//                             ? getStatusColor(stage)
//                             : "#D1D5DB",
//                       },
//                     ]}
//                   />
//                 )}
//               </React.Fragment>
//             );
//           })}
//         </View>

//         {/* Progress Report */}
//         <View
//           style={[
//             styles.progressReport,
//             { borderColor: getStatusColor(report.status) },
//           ]}
//         >
//           {/* Conditional rendering based on status */}
//           {report.status === "new" && report.createdOn && (
//             <Text style={styles.progressText}>
//               Created On: {formatDate(report.createdOn)}
//             </Text>
//           )}

//           {report.status === "progress" && report.assignedTo && (
//             <Text style={styles.progressText}>
//               Assigned To: {report.assignedTo}
//             </Text>
//           )}

//           {report.status === "onhold" && report.onholdReason && (
//             <Text style={styles.progressText}>
//               Hold Reason: {report.onholdReason}
//             </Text>
//           )}

//           {report.status === "completed" && (
//             <>
//               {report.assignedTo && (
//                 <Text style={styles.progressText}>
//                   Assigned To: {report.assignedTo}
//                 </Text>
//               )}
//               {report.solution && (
//                 <Text style={styles.progressText}>
//                   Solution: {report.solution}
//                 </Text>
//               )}
//             </>
//           )}

//           <Text style={styles.lastUpdateText}>
//             Last updated: {formatDate(report.lastUpdated)}
//           </Text>
//         </View>

//         {/* Accept/Reject Buttons - Show for completed status only */}
//         {report.status === "completed" && report.isAccepted === null && (
//           <View style={styles.actionButtonsContainer}>
//             <TouchableOpacity
//               style={styles.acceptButton}
//               onPress={() => handleAcceptReport(report.id)}
//             >
//               <MaterialIcons name="check-circle" size={20} color="white" />
//               <Text style={styles.acceptButtonText}>Accept</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.rejectButton}
//               onPress={() => handleRejectReport(report.id)}
//             >
//               <MaterialIcons name="cancel" size={20} color="white" />
//               <Text style={styles.rejectButtonText}>Reject</Text>
//             </TouchableOpacity>
//           </View>
//         )}
//       </View>
//     );
//   };

//   const renderReportItem = ({ item }) => (
//     <View style={styles.reportCard}>
//       <Text style={styles.title}>Subject: {item.subject}</Text>
//       <Text style={styles.label}>
//         Case Number: <Text style={styles.value}>{item.caseNumber}</Text>
//       </Text>
//       <Text style={styles.label}>
//         Department: <Text style={styles.value}>{item.department}</Text>
//       </Text>
//       <Text style={styles.label}>
//         Status:{" "}
//         <Text style={[styles.value, { color: getStatusColor(item.status) }]}>
//           {item.status}
//         </Text>
//       </Text>
//       {item.description && (
//         <Text style={styles.label}>
//           Description: <Text style={styles.value}>{item.description}</Text>
//         </Text>
//       )}
//       <Text style={styles.label}>Progress:</Text>
//       {renderRoadmap(item)}
//     </View>
//   );

//   return (
//     <ScrollView
//       style={styles.container}
//       refreshControl={
//         <RefreshControl
//           refreshing={refreshing}
//           onRefresh={onRefresh}
//           colors={["#4A90E2"]}
//           tintColor="#4A90E2"
//         />
//       }
//     >
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity
//           onPress={() => navigation.navigate("ContactScreen")}
//           style={styles.backButton}
//         >
//           <MaterialIcons name="arrow-back" size={24} color="#4A90E2" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Report Management</Text>
//         <TouchableOpacity
//           onPress={() => fetchReportsFromServiceNow(true)}
//           style={styles.refreshButton}
//         >
//           <MaterialIcons name="refresh" size={24} color="#4A90E2" />
//         </TouchableOpacity>
//       </View>

//       {/* Chart Section */}
//       <Text style={styles.heading}>Report Summary</Text>
//       {pieData.length > 0 ? (
//         <>
//           <PieChart style={styles.pieChart} data={pieData} innerRadius="70%" />

//           {/* Legend */}
//           <View style={styles.legendContainer}>
//             {pieData.map((item) => (
//               <View key={item.key} style={styles.legendItem}>
//                 <View
//                   style={[
//                     styles.legendColor,
//                     { backgroundColor: item.svg.fill },
//                   ]}
//                 />
//                 <Text style={styles.legendText}>
//                   {item.label} ({item.value})
//                 </Text>
//               </View>
//             ))}
//           </View>
//         </>
//       ) : (
//         <View style={styles.emptyChart}>
//           <Text style={styles.emptyChartText}>No data available</Text>
//         </View>
//       )}

//       {/* Search Bar */}
//       <View style={styles.searchContainer}>
//         <View style={styles.searchBar}>
//           <Feather name="search" size={20} color="#7C7C7C" />
//           <TextInput
//             style={styles.searchInput}
//             placeholder="Search reports..."
//             placeholderTextColor="#B0B0B0"
//             value={searchText}
//             onChangeText={setSearchText}
//           />
//           {searchText ? (
//             <TouchableOpacity onPress={() => setSearchText("")}>
//               <MaterialIcons name="clear" size={20} color="#7C7C7C" />
//             </TouchableOpacity>
//           ) : null}
//         </View>
//       </View>

//       {/* Filters */}
//       <View style={styles.filtersContainer}>
//         <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//           <View style={styles.filterSection}>
//             <Text style={styles.filterLabel}>Status:</Text>
//             {statusOptions.map((status) => (
//               <TouchableOpacity
//                 key={status}
//                 style={[
//                   styles.filterChip,
//                   filterStatus === status && styles.activeFilterChip,
//                 ]}
//                 onPress={() => setFilterStatus(status)}
//               >
//                 <Text
//                   style={[
//                     styles.filterChipText,
//                     filterStatus === status && styles.activeFilterChipText,
//                   ]}
//                 >
//                   {status}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//         </ScrollView>
//       </View>

//       {/* Reports List */}
//       {filteredAndSortedReports.length > 0 ? (
//         <FlatList
//           data={filteredAndSortedReports}
//           renderItem={renderReportItem}
//           keyExtractor={(item) => item.id}
//           scrollEnabled={false}
//           contentContainerStyle={styles.listContainer}
//         />
//       ) : (
//         <View style={styles.emptyState}>
//           <MaterialIcons name="folder-open" size={64} color="#B0B0B0" />
//           <Text style={styles.emptyTitle}>No reports found</Text>
//           <Text style={styles.emptySubtitle}>
//             {searchText || filterStatus !== "All"
//               ? "Try adjusting your search or filter criteria"
//               : "No reports available at the moment"}
//           </Text>
//         </View>
//       )}

//       {/* Fixed Reject Modal */}
//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={isRejectModalVisible}
//         onRequestClose={closeRejectModal}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContainer}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Reject Resolution</Text>
//               <TouchableOpacity
//                 onPress={closeRejectModal}
//                 style={styles.modalCloseButton}
//               >
//                 <MaterialIcons name="close" size={24} color="#666" />
//               </TouchableOpacity>
//             </View>

//             <Text style={styles.modalSubtitle}>
//               Please provide a reason for rejecting this resolution:
//             </Text>

//             <TextInput
//               style={styles.modalTextInput}
//               placeholder="Enter reason for rejection..."
//               placeholderTextColor="#B0B0B0"
//               value={onholdReason}
//               onChangeText={setOnholdReason}
//               multiline={true}
//               numberOfLines={4}
//               textAlignVertical="top"
//             />

//             <View style={styles.modalButtonContainer}>
//               <TouchableOpacity
//                 style={styles.modalCancelButton}
//                 onPress={closeRejectModal}
//               >
//                 <Text style={styles.modalCancelButtonText}>Cancel</Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={styles.modalSubmitButton}
//                 onPress={submitRejectReport}
//               >
//                 <Text style={styles.modalSubmitButtonText}>Submit</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </ScrollView>
//   );
// };

// // Add the styles object (you'll need to include your existing styles)
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#F5F5F5",
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: "white",
//     elevation: 2,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     marginTop: 30,
//   },
//   backButton: {
//     padding: 8,
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#333",
//   },
//   refreshButton: {
//     padding: 8,
//   },
//   heading: {
//     fontSize: 20,
//     fontWeight: "600",
//     color: "#333",
//     marginHorizontal: 16,
//     marginTop: 16,
//     marginBottom: 12,
//   },
//   pieChart: {
//     height: 200,
//     marginHorizontal: 16,
//   },
//   legendContainer: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     justifyContent: "center",
//     marginHorizontal: 16,
//     marginBottom: 16,
//   },
//   legendItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     margin: 4,
//   },
//   legendColor: {
//     width: 12,
//     height: 12,
//     borderRadius: 6,
//     marginRight: 6,
//   },
//   legendText: {
//     fontSize: 12,
//     color: "#666",
//   },
//   emptyChart: {
//     height: 200,
//     justifyContent: "center",
//     alignItems: "center",
//     marginHorizontal: 16,
//   },
//   emptyChartText: {
//     fontSize: 16,
//     color: "#666",
//   },
//   searchContainer: {
//     paddingHorizontal: 16,
//     marginBottom: 16,
//   },
//   searchBar: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "white",
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     elevation: 1,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 2,
//   },
//   searchInput: {
//     flex: 1,
//     marginLeft: 8,
//     fontSize: 16,
//     color: "#333",
//   },
//   filtersContainer: {
//     paddingHorizontal: 16,
//     marginBottom: 16,
//   },
//   filterSection: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   filterLabel: {
//     fontSize: 16,
//     fontWeight: "500",
//     color: "#333",
//     marginRight: 12,
//   },
//   filterChip: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 16,
//     backgroundColor: "white",
//     marginRight: 8,
//     borderWidth: 1,
//     borderColor: "#E0E0E0",
//   },
//   activeFilterChip: {
//     backgroundColor: "#4A90E2",
//     borderColor: "#4A90E2",
//   },
//   filterChipText: {
//     fontSize: 14,
//     color: "#666",
//   },
//   activeFilterChipText: {
//     color: "white",
//   },
//   listContainer: {
//     paddingHorizontal: 16,
//   },
//   reportCard: {
//     backgroundColor: "white",
//     borderRadius: 8,
//     padding: 16,
//     marginBottom: 12,
//     elevation: 2,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   title: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#333",
//     marginBottom: 8,
//   },
//   label: {
//     fontSize: 14,
//     color: "#666",
//     marginBottom: 4,
//   },
//   value: {
//     fontWeight: "500",
//     color: "#333",
//   },
//   roadmapContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginVertical: 12,
//   },
//   roadmapStep: {
//     alignItems: "center",
//   },
//   roadmapCircle: {
//     width: 20,
//     height: 20,
//     borderRadius: 10,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   roadmapLabel: {
//     fontSize: 10,
//     marginTop: 4,
//     fontWeight: "500",
//   },
//   roadmapLine: {
//     flex: 1,
//     height: 1,
//     borderWidth: 1,
//     borderStyle: "dashed",
//     marginHorizontal: 4,
//   },
//   progressReport: {
//     borderWidth: 1,
//     borderRadius: 8,
//     padding: 12,
//     marginTop: 8,
//     backgroundColor: "#FAFAFA",
//   },
//   progressTitle: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#333",
//     marginBottom: 8,
//   },
//   progressText: {
//     fontSize: 12,
//     color: "#666",
//     marginBottom: 4,
//   },
//   lastUpdateText: {
//     fontSize: 12,
//     color: "#999",
//     fontStyle: "italic",
//     marginTop: 4,
//   },
//   actionButtonsContainer: {
//     flexDirection: "row",
//     justifyContent: "space-around",
//     marginTop: 12,
//   },
//   acceptButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#10B981",
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 6,
//   },
//   acceptButtonText: {
//     color: "white",
//     fontWeight: "500",
//     marginLeft: 4,
//   },
//   rejectButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#EF4444",
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 6,
//   },
//   rejectButtonText: {
//     color: "white",
//     fontWeight: "500",
//     marginLeft: 4,
//   },
//   emptyState: {
//     alignItems: "center",
//     padding: 32,
//   },
//   emptyTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#666",
//     marginTop: 16,
//   },
//   emptySubtitle: {
//     fontSize: 14,
//     color: "#999",
//     textAlign: "center",
//     marginTop: 8,
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(0, 0, 0, 0.5)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   modalContainer: {
//     backgroundColor: "white",
//     borderRadius: 12,
//     padding: 20,
//     marginHorizontal: 20,
//     maxWidth: 400,
//     width: "90%",
//   },
//   modalHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 16,
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#333",
//   },
//   modalCloseButton: {
//     padding: 4,
//   },
//   modalSubtitle: {
//     fontSize: 14,
//     color: "#666",
//     marginBottom: 16,
//   },
//   modalTextInput: {
//     borderWidth: 1,
//     borderColor: "#E0E0E0",
//     borderRadius: 8,
//     padding: 12,
//     fontSize: 14,
//     color: "#333",
//     minHeight: 80,
//     marginBottom: 20,
//   },
//   modalButtonContainer: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },
//   modalCancelButton: {
//     flex: 1,
//     padding: 12,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: "#E0E0E0",
//     alignItems: "center",
//     marginRight: 8,
//   },
//   modalCancelButtonText: {
//     fontSize: 16,
//     color: "#666",
//   },
//   modalSubmitButton: {
//     flex: 1,
//     padding: 12,
//     borderRadius: 8,
//     backgroundColor: "#EF4444",
//     alignItems: "center",
//     marginLeft: 8,
//   },
//   modalSubmitButtonText: {
//     fontSize: 16,
//     color: "white",
//     fontWeight: "500",
//   },
// });

// import React, { useState, useEffect, useCallback } from "react";
// import {
//   View,
//   Text,
//   ScrollView,
//   StyleSheet,
//   TouchableOpacity,
//   TextInput,
//   FlatList,
//   Alert,
//   Modal,
//   RefreshControl,
// } from "react-native";
// import { MaterialIcons, Feather } from "@expo/vector-icons";
// import { PieChart } from "react-native-svg-charts";
// import { useFocusEffect } from "@react-navigation/native";
// import axios from "axios";
// import * as SecureStore from "expo-secure-store";
// import { IP } from "../Config/config";
// const API_BASE_URL = `${IP}/api/auth`;

// export const ReportScreen = ({ navigation }) => {
//   const [statusCounts, setStatusCounts] = useState({
//     new: 0,
//     progress: 0,
//     onhold: 0,
//     completed: 0,
//     closed: 0, // Added closed status
//   });

//   const [searchText, setSearchText] = useState("");
//   const [filterStatus, setFilterStatus] = useState("All");
//   const [selectedSliceIndex, setSelectedSliceIndex] = useState(null);
//   const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
//   const [selectedReportId, setSelectedReportId] = useState(null);
//   const [onholdReason, setOnholdReason] = useState("");
//   const [reports, setReports] = useState([]);
//   const [refreshing, setRefreshing] = useState(false);
//   const [userEmail, setUserEmail] = useState("");

//   // Auto-refresh interval (every 10 seconds)
//   const AUTO_REFRESH_INTERVAL = 10000;
//   const statusOptions = [
//     "All",
//     "new",
//     "progress",
//     "onhold",
//     "completed",
//     "closed",
//   ]; // Added closed

//   // Helper function to safely extract string value from object or string
//   const safeStringValue = (value) => {
//     if (!value) return "";
//     if (typeof value === "string") return value;
//     if (typeof value === "object") {
//       return value.display_value || value.value || "";
//     }
//     return String(value);
//   };

//   const getStatusColor = (status) => {
//     switch (status?.toLowerCase()) {
//       case "new":
//         return "#4DA8DA";
//       case "progress":
//         return "#EF4444";
//       case "onhold":
//         return "#F59E0B";
//       case "completed":
//         return "#10B981";
//       case "closed":
//         return "#6B46C1"; // Purple color for closed status
//       default:
//         return "#6B7280";
//     }
//   };

//   // Get user email on component mount
//   useEffect(() => {
//     const getUserEmail = async () => {
//       try {
//         const storedEmail = await SecureStore.getItemAsync("userEmail");
//         if (storedEmail) {
//           setUserEmail(storedEmail);
//         } else {
//           console.warn("User email not found in SecureStore");
//         }
//       } catch (error) {
//         console.error("Error retrieving user email:", error);
//       }
//     };
//     getUserEmail();
//   }, []);

//   const fetchReportsFromServiceNow = async (showRefreshing = false) => {
//     if (!userEmail) return;

//     if (showRefreshing) {
//       setRefreshing(true);
//     }

//     try {
//       const encodedEmail = encodeURIComponent(userEmail);
//       const response = await axios.get(`${API_BASE_URL}/all/${encodedEmail}`, {
//         timeout: 10000,
//       });

//       if (response.data?.reports) {
//         // Transform the data to match your component structure
//         const transformedReports = response.data.reports.map((report) => {
//           return {
//             id: report.id,
//             caseNumber: safeStringValue(report.issueNumber) || "N/A",
//             department: safeStringValue(report.department) || "Unknown",
//             subject: safeStringValue(report.subject) || "No subject",
//             status: safeStringValue(report.status)?.toLowerCase() || "new",
//             description: safeStringValue(report.description) || "",
//             date: safeStringValue(report.createdOn),
//             assignedTo: safeStringValue(report.assignedTo) || "Unassigned",
//             lastUpdated: safeStringValue(report.createdOn),
//             solution: safeStringValue(report.solution) || "",
//             createdOn: safeStringValue(report.createdOn),
//             completedOn: null,
//             isAccepted: null,
//             onholdReason: safeStringValue(report.onholdReason),
//             sys_id: safeStringValue(report.sys_id),
//             departmentSysId: safeStringValue(report.departmentSysId),
//             assignedToSysId: safeStringValue(report.assignedToSysId),
//           };
//         });

//         setReports(transformedReports);

//         // Update status counts based on fetched data
//         const counts = {
//           new: 0,
//           progress: 0,
//           onhold: 0,
//           completed: 0,
//           closed: 0,
//         }; // Added closed
//         transformedReports.forEach((report) => {
//           const status = report.status.toLowerCase();
//           if (counts[status] !== undefined) counts[status]++;
//         });
//         setStatusCounts(counts);
//       }
//     } catch (error) {
//       console.error("Failed to fetch reports:", error);
//       // Only show alert if it's a manual refresh
//       if (showRefreshing) {
//         Alert.alert("Error", "Failed to fetch reports. Please try again.");
//       }
//     } finally {
//       if (showRefreshing) {
//         setRefreshing(false);
//       }
//     }
//   };

//   // Automatic data fetching with interval
//   useEffect(() => {
//     if (!userEmail) return;

//     // Initial fetch
//     fetchReportsFromServiceNow(false);

//     // Set up interval for automatic updates
//     const interval = setInterval(() => {
//       fetchReportsFromServiceNow(false); // Silent refresh without loading indicators
//     }, AUTO_REFRESH_INTERVAL);

//     // Cleanup interval on component unmount
//     return () => clearInterval(interval);
//   }, [userEmail]);

//   // Use useFocusEffect for real-time updates when screen is focused
//   useFocusEffect(
//     useCallback(() => {
//       if (userEmail) {
//         fetchReportsFromServiceNow(false);
//       }
//     }, [userEmail])
//   );

//   // Pull to refresh handler
//   const onRefresh = useCallback(() => {
//     fetchReportsFromServiceNow(true); // Show refreshing indicator for manual refresh
//   }, [userEmail]);

//   // Action handlers
//   const handleAcceptReport = async (id) => {
//     Alert.alert(
//       "Accept Resolution",
//       "Are you satisfied with the resolution of this report?",
//       [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: "Accept",
//           style: "default",
//           onPress: async () => {
//             try {
//               const report = reports.find((r) => r.id === id);
//               if (!report) {
//                 Alert.alert("Error", "Report not found.");
//                 return;
//               }

//               const payload = {
//                 sys_id: report.sys_id,
//                 email: userEmail,
//               };

//               // Call API to update report status to closed
//               const response = await axios.post(
//                 `${API_BASE_URL}/accept`,
//                 payload
//               );

//               if (response.data.success) {
//                 const updated = response.data.data;

//                 // Update local state
//                 setReports((prevReports) =>
//                   prevReports.map((r) =>
//                     r.id === id
//                       ? {
//                           ...r,
//                           status: updated.newStatus?.toLowerCase() || "closed",
//                           lastUpdated: new Date().toISOString(),
//                           isAccepted: true,
//                         }
//                       : r
//                   )
//                 );

//                 Alert.alert(
//                   "Success",
//                   "Report resolution has been accepted and case is now closed."
//                 );

//                 // Refresh data to get latest updates
//                 fetchReportsFromServiceNow(false);
//               } else {
//                 Alert.alert("Error", "Failed to accept report.");
//               }
//             } catch (error) {
//               console.error("Failed to accept report:", error);
//               Alert.alert(
//                 "Error",
//                 "Failed to accept report. Please try again."
//               );
//             }
//           },
//         },
//       ]
//     );
//   };

//   const handleRejectReport = (id) => {
//     setSelectedReportId(id);
//     setIsRejectModalVisible(true);
//   };

//   const submitRejectReport = async () => {
//     if (!onholdReason.trim()) {
//       Alert.alert("Error", "Please provide a reason for rejection.");
//       return;
//     }

//     try {
//       const report = reports.find((r) => r.id === selectedReportId);
//       if (!report) {
//         Alert.alert("Error", "Report not found.");
//         return;
//       }

//       const payload = {
//         sys_id: report.sys_id,
//         email: userEmail,
//         onholdReason: onholdReason.trim(),
//       };

//       const response = await axios.post(`${API_BASE_URL}/reject`, payload);

//       if (response.data.success) {
//         const updated = response.data.data;

//         // Update local report state
//         setReports((prevReports) =>
//           prevReports.map((r) =>
//             r.id === selectedReportId
//               ? {
//                   ...r,
//                   status: updated.newStatus?.toLowerCase() || "onhold",
//                   onholdReason: updated.onholdReason,
//                   lastUpdated: new Date().toISOString(),
//                   isAccepted: false,
//                 }
//               : r
//           )
//         );

//         closeRejectModal();
//         Alert.alert("Success", "Report has been rejected and put on hold.");
//       } else {
//         Alert.alert("Error", "Failed to update report status.");
//       }
//     } catch (error) {
//       console.error("Failed to reject report:", error.response?.data || error);
//       Alert.alert("Error", "Failed to reject report. Please try again.");
//     }
//   };

//   const closeRejectModal = () => {
//     setIsRejectModalVisible(false);
//     setSelectedReportId(null);
//     setOnholdReason("");
//   };

//   const filteredAndSortedReports = reports.filter((report) => {
//     const matchesSearch =
//       !searchText ||
//       report.caseNumber.toLowerCase().includes(searchText.toLowerCase()) ||
//       report.subject.toLowerCase().includes(searchText.toLowerCase()) ||
//       report.department.toLowerCase().includes(searchText.toLowerCase());

//     const matchesStatus =
//       filterStatus === "All" || report.status === filterStatus;

//     return matchesSearch && matchesStatus;
//   });

//   const pieData = [
//     {
//       value: statusCounts["new"],
//       svg: { fill: "#4DA8DA", onPress: () => setSelectedSliceIndex(0) },
//       key: "new",
//       label: "New",
//     },
//     {
//       value: statusCounts["progress"],
//       svg: { fill: "#EF4444", onPress: () => setSelectedSliceIndex(1) },
//       key: "progress",
//       label: "Progress",
//     },
//     {
//       value: statusCounts["onhold"],
//       svg: { fill: "#F59E0B", onPress: () => setSelectedSliceIndex(2) },
//       key: "onhold",
//       label: "On-Hold",
//     },
//     {
//       value: statusCounts["completed"],
//       svg: { fill: "#10B981", onPress: () => setSelectedSliceIndex(3) },
//       key: "completed",
//       label: "Completed",
//     },
//     {
//       value: statusCounts["closed"],
//       svg: { fill: "#6B46C1", onPress: () => setSelectedSliceIndex(4) },
//       key: "closed",
//       label: "Closed",
//     },
//   ].filter((item) => item.value > 0);

//   // Roadmap helpers
//   const getStatusIndex = (status) => {
//     switch (status?.toLowerCase()) {
//       case "new":
//         return 0;
//       case "progress":
//         return 1;
//       case "onhold":
//         return 2;
//       case "completed":
//         return 3;
//       case "closed":
//         return 4;
//       default:
//         return 5;
//     }
//   };

//   // Format date safely
//   const formatDate = (dateString) => {
//     if (!dateString) return "N/A";
//     try {
//       return new Date(dateString).toLocaleDateString();
//     } catch (error) {
//       return "N/A";
//     }
//   };

//   // Render simplified roadmap
//   const renderRoadmap = (report) => {
//     const stages = ["new", "progress", "onhold", "completed", "closed"]; // Added closed
//     const currentIndex = getStatusIndex(report.status);

//     return (
//       <View>
//         <View style={styles.roadmapContainer}>
//           {stages.map((stage, index) => {
//             const isActive = index <= currentIndex;
//             const isCurrent = index === currentIndex;
//             const color = isActive ? getStatusColor(stage) : "#D1D5DB";
//             const isLast = index === stages.length - 1;

//             return (
//               <React.Fragment key={stage}>
//                 <View style={styles.roadmapStep}>
//                   <View
//                     style={[
//                       styles.roadmapCircle,
//                       {
//                         backgroundColor: color,
//                         borderWidth: isCurrent ? 2 : 1,
//                         borderColor: isCurrent ? color : "transparent",
//                       },
//                     ]}
//                   >
//                     {index < currentIndex && (
//                       <MaterialIcons name="check" size={12} color="white" />
//                     )}
//                   </View>
//                   <Text style={[styles.roadmapLabel, { color: color }]}>
//                     {stage}
//                   </Text>
//                 </View>
//                 {!isLast && (
//                   <View
//                     style={[
//                       styles.roadmapLine,
//                       {
//                         borderColor:
//                           index < currentIndex
//                             ? getStatusColor(stage)
//                             : "#D1D5DB",
//                       },
//                     ]}
//                   />
//                 )}
//               </React.Fragment>
//             );
//           })}
//         </View>

//         {/* Progress Report */}
//         <View
//           style={[
//             styles.progressReport,
//             { borderColor: getStatusColor(report.status) },
//           ]}
//         >
//           {/* Conditional rendering based on status */}
//           {report.status === "new" && report.createdOn && (
//             <Text style={styles.progressText}>
//               Created On: {formatDate(report.createdOn)}
//             </Text>
//           )}

//           {report.status === "progress" && report.assignedTo && (
//             <Text style={styles.progressText}>
//               Assigned To: {report.assignedTo}
//             </Text>
//           )}

//           {report.status === "onhold" && report.onholdReason && (
//             <Text style={styles.progressText}>
//               Hold Reason: {report.onholdReason}
//             </Text>
//           )}

//           {report.status === "completed" && (
//             <>
//               {report.assignedTo && (
//                 <Text style={styles.progressText}>
//                   Assigned To: {report.assignedTo}
//                 </Text>
//               )}
//               {report.solution && (
//                 <Text style={styles.progressText}>
//                   Solution: {report.solution}
//                 </Text>
//               )}
//             </>
//           )}

//           {report.status === "closed" && (
//             <>
//               {report.assignedTo && (
//                 <Text style={styles.progressText}>
//                   Resolved By: {report.assignedTo}
//                 </Text>
//               )}
//               {report.solution && (
//                 <Text style={styles.progressText}>
//                   Final Solution: {report.solution}
//                 </Text>
//               )}
//               <Text
//                 style={[
//                   styles.progressText,
//                   { color: "#6B46C1", fontWeight: "600" },
//                 ]}
//               >
//                 Case Closed - Resolution Accepted
//               </Text>
//             </>
//           )}

//           <Text style={styles.lastUpdateText}>
//             Last updated: {formatDate(report.lastUpdated)}
//           </Text>
//         </View>

//         {/* Accept/Reject Buttons - Show for completed status only */}
//         {report.status === "completed" && report.isAccepted === null && (
//           <View style={styles.actionButtonsContainer}>
//             <TouchableOpacity
//               style={styles.acceptButton}
//               onPress={() => handleAcceptReport(report.id)}
//             >
//               <MaterialIcons name="check-circle" size={20} color="white" />
//               <Text style={styles.acceptButtonText}>Accept</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.rejectButton}
//               onPress={() => handleRejectReport(report.id)}
//             >
//               <MaterialIcons name="cancel" size={20} color="white" />
//               <Text style={styles.rejectButtonText}>Reject</Text>
//             </TouchableOpacity>
//           </View>
//         )}
//       </View>
//     );
//   };

//   const renderReportItem = ({ item }) => (
//     <View style={styles.reportCard}>
//       <Text style={styles.title}>Subject: {item.subject}</Text>
//       <Text style={styles.label}>
//         Case Number: <Text style={styles.value}>{item.caseNumber}</Text>
//       </Text>
//       <Text style={styles.label}>
//         Department: <Text style={styles.value}>{item.department}</Text>
//       </Text>
//       <Text style={styles.label}>
//         Status:{" "}
//         <Text style={[styles.value, { color: getStatusColor(item.status) }]}>
//           {item.status}
//         </Text>
//       </Text>
//       {item.description && (
//         <Text style={styles.label}>
//           Description: <Text style={styles.value}>{item.description}</Text>
//         </Text>
//       )}
//       <Text style={styles.label}>Progress:</Text>
//       {renderRoadmap(item)}
//     </View>
//   );

//   return (
//     <ScrollView
//       style={styles.container}
//       refreshControl={
//         <RefreshControl
//           refreshing={refreshing}
//           onRefresh={onRefresh}
//           colors={["#4A90E2"]}
//           tintColor="#4A90E2"
//         />
//       }
//     >
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity
//           onPress={() => navigation.navigate("ContactScreen")}
//           style={styles.backButton}
//         >
//           <MaterialIcons name="arrow-back" size={24} color="#4A90E2" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Report Management</Text>
//         <TouchableOpacity
//           onPress={() => fetchReportsFromServiceNow(true)}
//           style={styles.refreshButton}
//         >
//           <MaterialIcons name="refresh" size={24} color="#4A90E2" />
//         </TouchableOpacity>
//       </View>

//       {/* Chart Section */}
//       <Text style={styles.heading}>Report Summary</Text>
//       {pieData.length > 0 ? (
//         <>
//           <PieChart style={styles.pieChart} data={pieData} innerRadius="70%" />

//           {/* Legend */}
//           <View style={styles.legendContainer}>
//             {pieData.map((item) => (
//               <View key={item.key} style={styles.legendItem}>
//                 <View
//                   style={[
//                     styles.legendColor,
//                     { backgroundColor: item.svg.fill },
//                   ]}
//                 />
//                 <Text style={styles.legendText}>
//                   {item.label} ({item.value})
//                 </Text>
//               </View>
//             ))}
//           </View>
//         </>
//       ) : (
//         <View style={styles.emptyChart}>
//           <Text style={styles.emptyChartText}>No data available</Text>
//         </View>
//       )}

//       {/* Search Bar */}
//       <View style={styles.searchContainer}>
//         <View style={styles.searchBar}>
//           <Feather name="search" size={20} color="#7C7C7C" />
//           <TextInput
//             style={styles.searchInput}
//             placeholder="Search reports..."
//             placeholderTextColor="#B0B0B0"
//             value={searchText}
//             onChangeText={setSearchText}
//           />
//           {searchText ? (
//             <TouchableOpacity onPress={() => setSearchText("")}>
//               <MaterialIcons name="clear" size={20} color="#7C7C7C" />
//             </TouchableOpacity>
//           ) : null}
//         </View>
//       </View>

//       {/* Filters */}
//       <View style={styles.filtersContainer}>
//         <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//           <View style={styles.filterSection}>
//             <Text style={styles.filterLabel}>Status:</Text>
//             {statusOptions.map((status) => (
//               <TouchableOpacity
//                 key={status}
//                 style={[
//                   styles.filterChip,
//                   filterStatus === status && styles.activeFilterChip,
//                 ]}
//                 onPress={() => setFilterStatus(status)}
//               >
//                 <Text
//                   style={[
//                     styles.filterChipText,
//                     filterStatus === status && styles.activeFilterChipText,
//                   ]}
//                 >
//                   {status}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//         </ScrollView>
//       </View>

//       {/* Reports List */}
//       {filteredAndSortedReports.length > 0 ? (
//         <FlatList
//           data={filteredAndSortedReports}
//           renderItem={renderReportItem}
//           keyExtractor={(item) => item.id}
//           scrollEnabled={false}
//           contentContainerStyle={styles.listContainer}
//         />
//       ) : (
//         <View style={styles.emptyState}>
//           <MaterialIcons name="folder-open" size={64} color="#B0B0B0" />
//           <Text style={styles.emptyTitle}>No reports found</Text>
//           <Text style={styles.emptySubtitle}>
//             {searchText || filterStatus !== "All"
//               ? "Try adjusting your search or filter criteria"
//               : "No reports available at the moment"}
//           </Text>
//         </View>
//       )}

//       {/* Fixed Reject Modal */}
//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={isRejectModalVisible}
//         onRequestClose={closeRejectModal}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContainer}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Reject Resolution</Text>
//               <TouchableOpacity
//                 onPress={closeRejectModal}
//                 style={styles.modalCloseButton}
//               >
//                 <MaterialIcons name="close" size={24} color="#666" />
//               </TouchableOpacity>
//             </View>

//             <Text style={styles.modalSubtitle}>
//               Please provide a reason for rejecting this resolution:
//             </Text>

//             <TextInput
//               style={styles.modalTextInput}
//               placeholder="Enter reason for rejection..."
//               placeholderTextColor="#B0B0B0"
//               value={onholdReason}
//               onChangeText={setOnholdReason}
//               multiline={true}
//               numberOfLines={4}
//               textAlignVertical="top"
//             />

//             <View style={styles.modalButtonContainer}>
//               <TouchableOpacity
//                 style={styles.modalCancelButton}
//                 onPress={closeRejectModal}
//               >
//                 <Text style={styles.modalCancelButtonText}>Cancel</Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={styles.modalSubmitButton}
//                 onPress={submitRejectReport}
//               >
//                 <Text style={styles.modalSubmitButtonText}>Submit</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </ScrollView>
//   );
// };

// // Styles remain the same as your original code
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#F5F5F5",
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: "white",
//     elevation: 2,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     marginTop: 30,
//   },
//   backButton: {
//     padding: 8,
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#333",
//   },
//   refreshButton: {
//     padding: 8,
//   },
//   heading: {
//     fontSize: 20,
//     fontWeight: "600",
//     color: "#333",
//     marginHorizontal: 16,
//     marginTop: 16,
//     marginBottom: 12,
//   },
//   pieChart: {
//     height: 200,
//     marginHorizontal: 16,
//   },
//   legendContainer: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     justifyContent: "center",
//     marginHorizontal: 16,
//     marginBottom: 16,
//   },
//   legendItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     margin: 4,
//   },
//   legendColor: {
//     width: 12,
//     height: 12,
//     borderRadius: 6,
//     marginRight: 6,
//   },
//   legendText: {
//     fontSize: 12,
//     color: "#666",
//   },
//   emptyChart: {
//     height: 200,
//     justifyContent: "center",
//     alignItems: "center",
//     marginHorizontal: 16,
//   },
//   emptyChartText: {
//     fontSize: 16,
//     color: "#666",
//   },
//   searchContainer: {
//     paddingHorizontal: 16,
//     marginBottom: 16,
//   },
//   searchBar: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "white",
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     elevation: 1,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 2,
//   },
//   searchInput: {
//     flex: 1,
//     marginLeft: 8,
//     fontSize: 16,
//     color: "#333",
//   },
//   filtersContainer: {
//     paddingHorizontal: 16,
//     marginBottom: 16,
//   },
//   filterSection: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   filterLabel: {
//     fontSize: 16,
//     fontWeight: "500",
//     color: "#333",
//     marginRight: 12,
//   },
//   filterChip: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 16,
//     backgroundColor: "white",
//     marginRight: 8,
//     borderWidth: 1,
//     borderColor: "#E0E0E0",
//   },
//   activeFilterChip: {
//     backgroundColor: "#4A90E2",
//     borderColor: "#4A90E2",
//   },
//   filterChipText: {
//     fontSize: 14,
//     color: "#666",
//   },
//   activeFilterChipText: {
//     color: "white",
//   },
//   listContainer: {
//     paddingHorizontal: 16,
//   },
//   reportCard: {
//     backgroundColor: "white",
//     borderRadius: 8,
//     padding: 16,
//     marginBottom: 12,
//     elevation: 2,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   title: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#333",
//     marginBottom: 8,
//   },
//   label: {
//     fontSize: 14,
//     color: "#666",
//     marginBottom: 4,
//   },
//   value: {
//     fontWeight: "500",
//     color: "#333",
//   },
//   roadmapContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginVertical: 12,
//   },
//   roadmapStep: {
//     alignItems: "center",
//   },
//   roadmapCircle: {
//     width: 20,
//     height: 20,
//     borderRadius: 10,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   roadmapLabel: {
//     fontSize: 10,
//     marginTop: 4,
//     fontWeight: "500",
//   },
//   roadmapLine: {
//     flex: 1,
//     height: 1,
//     borderWidth: 1,
//     borderStyle: "dashed",
//     marginHorizontal: 4,
//   },
//   progressReport: {
//     borderWidth: 1,
//     borderRadius: 8,
//     padding: 12,
//     marginTop: 8,
//     backgroundColor: "#FAFAFA",
//   },
//   progressTitle: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#333",
//     marginBottom: 8,
//   },
//   progressText: {
//     fontSize: 12,
//     color: "#666",
//     marginBottom: 4,
//   },
//   lastUpdateText: {
//     fontSize: 12,
//     color: "#999",
//     fontStyle: "italic",
//     marginTop: 4,
//   },
//   actionButtonsContainer: {
//     flexDirection: "row",
//     justifyContent: "space-around",
//     marginTop: 12,
//   },
//   acceptButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#10B981",
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 6,
//   },
//   acceptButtonText: {
//     color: "white",
//     fontWeight: "500",
//     marginLeft: 4,
//   },
//   rejectButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#EF4444",
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 6,
//   },
//   rejectButtonText: {
//     color: "white",
//     fontWeight: "500",
//     marginLeft: 4,
//   },
//   emptyState: {
//     alignItems: "center",
//     padding: 32,
//   },
//   emptyTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#666",
//     marginTop: 16,
//   },
//   emptySubtitle: {
//     fontSize: 14,
//     color: "#999",
//     textAlign: "center",
//     marginTop: 8,
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(0, 0, 0, 0.5)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   modalContainer: {
//     backgroundColor: "white",
//     borderRadius: 12,
//     padding: 20,
//     marginHorizontal: 20,
//     maxWidth: 400,
//     width: "90%",
//   },
//   modalHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 16,
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#333",
//   },
//   modalCloseButton: {
//     padding: 4,
//   },
//   modalSubtitle: {
//     fontSize: 14,
//     color: "#666",
//     marginBottom: 16,
//   },
//   modalTextInput: {
//     borderWidth: 1,
//     borderColor: "#E0E0E0",
//     borderRadius: 8,
//     padding: 12,
//     fontSize: 14,
//     color: "#333",
//     minHeight: 80,
//     marginBottom: 20,
//   },
//   modalButtonContainer: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },
//   modalCancelButton: {
//     flex: 1,
//     padding: 12,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: "#E0E0E0",
//     alignItems: "center",
//     marginRight: 8,
//   },
//   modalCancelButtonText: {
//     fontSize: 16,
//     color: "#666",
//   },
//   modalSubmitButton: {
//     flex: 1,
//     padding: 12,
//     borderRadius: 8,
//     backgroundColor: "#EF4444",
//     alignItems: "center",
//     marginLeft: 8,
//   },
//   modalSubmitButtonText: {
//     fontSize: 16,
//     color: "white",
//     fontWeight: "500",
//   },
// });

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  Modal,
  RefreshControl,
} from "react-native";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { PieChart } from "react-native-svg-charts";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { IP } from "../Config/config";
const API_BASE_URL = `${IP}/api/auth`;

export const ReportScreen = ({ navigation }) => {
  const [statusCounts, setStatusCounts] = useState({
    new: 0,
    progress: 0,
    onhold: 0,
    completed: 0,
    closed: 0, // Added closed status
  });

  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedSliceIndex, setSelectedSliceIndex] = useState(null);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [onholdReason, setOnholdReason] = useState("");
  const [reports, setReports] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Auto-refresh interval (every 10 seconds)
  const AUTO_REFRESH_INTERVAL = 10000;
  const statusOptions = [
    "All",
    "new",
    "progress",
    "onhold",
    "completed",
    "closed",
  ]; // Added closed

  // Helper function to safely extract string value from object or string
  const safeStringValue = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      return value.display_value || value.value || "";
    }
    return String(value);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "new":
        return "#4DA8DA";
      case "progress":
        return "#6B46C1"; // Purple color for progress status
      case "onhold":
        return "#F59E0B";
      case "completed":
        return "#10B981";
      case "closed":
        return "#EF4444"; // Red color for closed status
      default:
        return "#6B7280";
    }
  };

  // Get user email on component mount
  useEffect(() => {
    const getUserEmail = async () => {
      try {
        const storedEmail = await SecureStore.getItemAsync("userEmail");
        if (storedEmail) {
          setUserEmail(storedEmail);
        } else {
          console.warn("User email not found in SecureStore");
        }
      } catch (error) {
        console.error("Error retrieving user email:", error);
      }
    };
    getUserEmail();
  }, []);

  const fetchReportsFromServiceNow = async (showRefreshing = false) => {
    if (!userEmail) return;

    if (showRefreshing) {
      setRefreshing(true);
    }

    try {
      const encodedEmail = encodeURIComponent(userEmail);
      const response = await axios.get(`${API_BASE_URL}/all/${encodedEmail}`, {
        timeout: 10000,
      });

      if (response.data?.reports) {
        // Transform the data to match your component structure
        const transformedReports = response.data.reports.map((report) => {
          return {
            id: report.id,
            caseNumber: safeStringValue(report.issueNumber) || "N/A",
            department: safeStringValue(report.department) || "Unknown",
            subject: safeStringValue(report.subject) || "No subject",
            status: safeStringValue(report.status)?.toLowerCase() || "new",
            description: safeStringValue(report.description) || "",
            date: safeStringValue(report.createdOn),
            assignedTo: safeStringValue(report.assignedTo) || "Unassigned",
            lastUpdated: safeStringValue(report.createdOn),
            solution: safeStringValue(report.solution) || "",
            createdOn: safeStringValue(report.createdOn),
            completedOn: null,
            isAccepted: null,
            onholdReason: safeStringValue(report.onholdReason),
            sys_id: safeStringValue(report.sys_id),
            departmentSysId: safeStringValue(report.departmentSysId),
            assignedToSysId: safeStringValue(report.assignedToSysId),
          };
        });

        setReports(transformedReports);

        // Update status counts based on fetched data
        const counts = {
          new: 0,
          progress: 0,
          onhold: 0,
          completed: 0,
          closed: 0,
        }; // Added closed
        transformedReports.forEach((report) => {
          const status = report.status.toLowerCase();
          if (counts[status] !== undefined) counts[status]++;
        });
        setStatusCounts(counts);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      // Only show alert if it's a manual refresh
      if (showRefreshing) {
        Alert.alert("Error", "Failed to fetch reports. Please try again.");
      }
    } finally {
      if (showRefreshing) {
        setRefreshing(false);
      }
    }
  };

  // Automatic data fetching with interval
  useEffect(() => {
    if (!userEmail) return;

    // Initial fetch
    fetchReportsFromServiceNow(false);

    // Set up interval for automatic updates
    const interval = setInterval(() => {
      fetchReportsFromServiceNow(false); // Silent refresh without loading indicators
    }, AUTO_REFRESH_INTERVAL);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [userEmail]);

  // Use useFocusEffect for real-time updates when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (userEmail) {
        fetchReportsFromServiceNow(false);
      }
    }, [userEmail])
  );

  // Pull to refresh handler
  const onRefresh = useCallback(() => {
    fetchReportsFromServiceNow(true); // Show refreshing indicator for manual refresh
  }, [userEmail]);

  // Action handlers
  const handleAcceptReport = async (id) => {
    Alert.alert(
      "Accept Resolution",
      "Are you satisfied with the resolution of this report?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          style: "default",
          onPress: async () => {
            try {
              const report = reports.find((r) => r.id === id);
              if (!report) {
                Alert.alert("Error", "Report not found.");
                return;
              }

              const payload = {
                sys_id: report.sys_id,
                email: userEmail,
              };

              // Call API to update report status to closed
              const response = await axios.post(
                `${API_BASE_URL}/accept`,
                payload
              );

              if (response.data.success) {
                const updated = response.data.data;

                // Update local state
                setReports((prevReports) =>
                  prevReports.map((r) =>
                    r.id === id
                      ? {
                          ...r,
                          status: updated.newStatus?.toLowerCase() || "closed",
                          lastUpdated: new Date().toISOString(),
                          isAccepted: true,
                        }
                      : r
                  )
                );

                Alert.alert(
                  "Success",
                  "Report resolution has been accepted and case is now closed."
                );

                // Refresh data to get latest updates
                fetchReportsFromServiceNow(false);
              } else {
                Alert.alert("Error", "Failed to accept report.");
              }
            } catch (error) {
              console.error("Failed to accept report:", error);
              Alert.alert(
                "Error",
                "Failed to accept report. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const handleRejectReport = (id) => {
    setSelectedReportId(id);
    setIsRejectModalVisible(true);
  };

  const submitRejectReport = async () => {
    if (!onholdReason.trim()) {
      Alert.alert("Error", "Please provide a reason for rejection.");
      return;
    }

    try {
      const report = reports.find((r) => r.id === selectedReportId);
      if (!report) {
        Alert.alert("Error", "Report not found.");
        return;
      }

      const payload = {
        sys_id: report.sys_id,
        email: userEmail,
        onholdReason: onholdReason.trim(),
      };

      const response = await axios.post(`${API_BASE_URL}/reject`, payload);

      if (response.data.success) {
        const updated = response.data.data;

        // Update local report state
        setReports((prevReports) =>
          prevReports.map((r) =>
            r.id === selectedReportId
              ? {
                  ...r,
                  status: updated.newStatus?.toLowerCase() || "onhold",
                  onholdReason: updated.onholdReason,
                  lastUpdated: new Date().toISOString(),
                  isAccepted: false,
                }
              : r
          )
        );

        closeRejectModal();
        Alert.alert("Success", "Report has been rejected and put on hold.");
      } else {
        Alert.alert("Error", "Failed to update report status.");
      }
    } catch (error) {
      console.error("Failed to reject report:", error.response?.data || error);
      Alert.alert("Error", "Failed to reject report. Please try again.");
    }
  };

  const closeRejectModal = () => {
    setIsRejectModalVisible(false);
    setSelectedReportId(null);
    setOnholdReason("");
  };

  const filteredAndSortedReports = reports.filter((report) => {
    const matchesSearch =
      !searchText ||
      report.caseNumber.toLowerCase().includes(searchText.toLowerCase()) ||
      report.subject.toLowerCase().includes(searchText.toLowerCase()) ||
      report.department.toLowerCase().includes(searchText.toLowerCase());

    const matchesStatus =
      filterStatus === "All" || report.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const pieData = [
    {
      value: statusCounts["new"],
      svg: { fill: "#4DA8DA", onPress: () => setSelectedSliceIndex(0) },
      key: "new",
      label: "New",
    },
    {
      value: statusCounts["progress"],
      svg: { fill: "#6B46C1", onPress: () => setSelectedSliceIndex(1) }, // Purple for progress
      key: "progress",
      label: "Progress",
    },
    {
      value: statusCounts["onhold"],
      svg: { fill: "#F59E0B", onPress: () => setSelectedSliceIndex(2) },
      key: "onhold",
      label: "On-Hold",
    },
    {
      value: statusCounts["completed"],
      svg: { fill: "#10B981", onPress: () => setSelectedSliceIndex(3) },
      key: "completed",
      label: "Completed",
    },
    {
      value: statusCounts["closed"],
      svg: { fill: "#EF4444", onPress: () => setSelectedSliceIndex(4) }, // Red for closed
      key: "closed",
      label: "Closed",
    },
  ].filter((item) => item.value > 0);

  // Roadmap helpers
  const getStatusIndex = (status) => {
    switch (status?.toLowerCase()) {
      case "new":
        return 0;
      case "progress":
        return 1;
      case "onhold":
        return 2;
      case "completed":
        return 3;
      case "closed":
        return 4;
      default:
        return 5;
    }
  };

  // Format date safely
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return "N/A";
    }
  };

  // Render simplified roadmap
  const renderRoadmap = (report) => {
    const stages = ["new", "progress", "onhold", "completed", "closed"]; // Added closed
    const currentIndex = getStatusIndex(report.status);

    return (
      <View>
        <View style={styles.roadmapContainer}>
          {stages.map((stage, index) => {
            const isActive = index <= currentIndex;
            const isCurrent = index === currentIndex;
            const color = isActive ? getStatusColor(stage) : "#D1D5DB";
            const isLast = index === stages.length - 1;

            return (
              <React.Fragment key={stage}>
                <View style={styles.roadmapStep}>
                  <View
                    style={[
                      styles.roadmapCircle,
                      {
                        backgroundColor: color,
                        borderWidth: isCurrent ? 2 : 1,
                        borderColor: isCurrent ? color : "transparent",
                      },
                    ]}
                  >
                    {index < currentIndex && (
                      <MaterialIcons name="check" size={12} color="white" />
                    )}
                  </View>
                  <Text style={[styles.roadmapLabel, { color: color }]}>
                    {stage}
                  </Text>
                </View>
                {!isLast && (
                  <View
                    style={[
                      styles.roadmapLine,
                      {
                        borderColor:
                          index < currentIndex
                            ? getStatusColor(stage)
                            : "#D1D5DB",
                      },
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>

        {/* Progress Report */}
        <View
          style={[
            styles.progressReport,
            { borderColor: getStatusColor(report.status) },
          ]}
        >
          {/* Conditional rendering based on status */}
          {report.status === "new" && report.createdOn && (
            <Text style={styles.progressText}>
              Created On: {formatDate(report.createdOn)}
            </Text>
          )}

          {report.status === "progress" && report.assignedTo && (
            <Text style={styles.progressText}>
              Assigned To: {report.assignedTo}
            </Text>
          )}

          {report.status === "onhold" && report.onholdReason && (
            <Text style={styles.progressText}>
              Hold Reason: {report.onholdReason}
            </Text>
          )}

          {report.status === "completed" && (
            <>
              {report.assignedTo && (
                <Text style={styles.progressText}>
                  Assigned To: {report.assignedTo}
                </Text>
              )}
              {report.solution && (
                <Text style={styles.progressText}>
                  Solution: {report.solution}
                </Text>
              )}
            </>
          )}

          {report.status === "closed" && (
            <>
              {report.assignedTo && (
                <Text style={styles.progressText}>
                  Resolved By: {report.assignedTo}
                </Text>
              )}
              {report.solution && (
                <Text style={styles.progressText}>
                  Final Solution: {report.solution}
                </Text>
              )}
              <Text
                style={[
                  styles.progressText,
                  { color: "#EF4444", fontWeight: "600" },
                ]}
              >
                Case Closed - Resolution Accepted
              </Text>
            </>
          )}

          <Text style={styles.lastUpdateText}>
            Last updated: {formatDate(report.lastUpdated)}
          </Text>
        </View>

        {/* Accept/Reject Buttons - Show for completed status only */}
        {report.status === "completed" && report.isAccepted === null && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleAcceptReport(report.id)}
            >
              <MaterialIcons name="check-circle" size={20} color="white" />
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => handleRejectReport(report.id)}
            >
              <MaterialIcons name="cancel" size={20} color="white" />
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderReportItem = ({ item }) => (
    <View style={styles.reportCard}>
      <Text style={styles.title}>Subject: {item.subject}</Text>
      <Text style={styles.label}>
        Case Number: <Text style={styles.value}>{item.caseNumber}</Text>
      </Text>
      <Text style={styles.label}>
        Department: <Text style={styles.value}>{item.department}</Text>
      </Text>
      <Text style={styles.label}>
        Status:{" "}
        <Text style={[styles.value, { color: getStatusColor(item.status) }]}>
          {item.status}
        </Text>
      </Text>
      {item.description && (
        <Text style={styles.label}>
          Description: <Text style={styles.value}>{item.description}</Text>
        </Text>
      )}
      <Text style={styles.label}>Progress:</Text>
      {renderRoadmap(item)}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#4A90E2"]}
          tintColor="#4A90E2"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate("ContactScreen")}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#4A90E2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Management</Text>
        <TouchableOpacity
          onPress={() => fetchReportsFromServiceNow(true)}
          style={styles.refreshButton}
        >
          <MaterialIcons name="refresh" size={24} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      {/* Chart Section */}
      <Text style={styles.heading}>Report Summary</Text>
      {pieData.length > 0 ? (
        <>
          <PieChart style={styles.pieChart} data={pieData} innerRadius="70%" />

          {/* Legend */}
          <View style={styles.legendContainer}>
            {pieData.map((item) => (
              <View key={item.key} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendColor,
                    { backgroundColor: item.svg.fill },
                  ]}
                />
                <Text style={styles.legendText}>
                  {item.label} ({item.value})
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyChartText}>No data available</Text>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Feather name="search" size={20} color="#7C7C7C" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search reports..."
            placeholderTextColor="#B0B0B0"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <MaterialIcons name="clear" size={20} color="#7C7C7C" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Status:</Text>
            {statusOptions.map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterChip,
                  filterStatus === status && styles.activeFilterChip,
                ]}
                onPress={() => setFilterStatus(status)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filterStatus === status && styles.activeFilterChipText,
                  ]}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Reports List */}
      {filteredAndSortedReports.length > 0 ? (
        <FlatList
          data={filteredAndSortedReports}
          renderItem={renderReportItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyState}>
          <MaterialIcons name="folder-open" size={64} color="#B0B0B0" />
          <Text style={styles.emptyTitle}>No reports found</Text>
          <Text style={styles.emptySubtitle}>
            {searchText || filterStatus !== "All"
              ? "Try adjusting your search or filter criteria"
              : "No reports available at the moment"}
          </Text>
        </View>
      )}

      {/* Fixed Reject Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isRejectModalVisible}
        onRequestClose={closeRejectModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Resolution</Text>
              <TouchableOpacity
                onPress={closeRejectModal}
                style={styles.modalCloseButton}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Please provide a reason for rejecting this resolution:
            </Text>

            <TextInput
              style={styles.modalTextInput}
              placeholder="Enter reason for rejection..."
              placeholderTextColor="#B0B0B0"
              value={onholdReason}
              onChangeText={setOnholdReason}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={closeRejectModal}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={submitRejectReport}
              >
                <Text style={styles.modalSubmitButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

// Styles remain the same as your original code
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginTop: 30,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  refreshButton: {
    padding: 8,
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  pieChart: {
    height: 200,
    marginHorizontal: 16,
  },
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginHorizontal: 16,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    margin: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#666",
  },
  emptyChart: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 16,
  },
  emptyChartText: {
    fontSize: 16,
    color: "#666",
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#333",
  },
  filtersContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginRight: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "white",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  activeFilterChip: {
    backgroundColor: "#4A90E2",
    borderColor: "#4A90E2",
  },
  filterChipText: {
    fontSize: 14,
    color: "#666",
  },
  activeFilterChipText: {
    color: "white",
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  reportCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  value: {
    fontWeight: "500",
    color: "#333",
  },
  roadmapContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },
  roadmapStep: {
    alignItems: "center",
  },
  roadmapCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  roadmapLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: "500",
  },
  roadmapLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderStyle: "dashed",
    marginHorizontal: 4,
  },
  progressReport: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    backgroundColor: "#FAFAFA",
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  lastUpdateText: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    marginTop: 4,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
  },
  acceptButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  acceptButtonText: {
    color: "white",
    fontWeight: "500",
    marginLeft: 4,
  },
  rejectButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF4444",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  rejectButtonText: {
    color: "white",
    fontWeight: "500",
    marginLeft: 4,
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    maxWidth: 400,
    width: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#333",
    minHeight: 80,
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalCancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    alignItems: "center",
    marginRight: 8,
  },
  modalCancelButtonText: {
    fontSize: 16,
    color: "#666",
  },
  modalSubmitButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    alignItems: "center",
    marginLeft: 8,
  },
  modalSubmitButtonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "500",
  },
});
