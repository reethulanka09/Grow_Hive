import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Alert,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store'; // Still imported for potential future API use
import axios from 'axios'; // Still imported for potential future API use
import { COLORS } from './constants'; // Ensure this path is correct for your COLORS

// IMPORTANT: Ensure this API_BASE_URL matches your backend's base URL (even if not actively used with static data)
const API_BASE_URL = 'http://10.16.59.193:5000/api';
// Define the base URL for serving static files (images)
// This is your backend's base URL WITHOUT the '/api' suffix
const STATIC_FILES_BASE_URL = 'http://10.16.59.193:5000'; 

// --- STATIC DATA FOR DEMONSTRATION ---
// This array simulates the data you might receive from a backend API
// for pending reports.
const STATIC_REPORTED_USERS = [
    {
        _id: 'report-1', // Unique ID for this specific report
        reportedUser: { // Details of the user who was reported
            _id: 'user-id-1',
            name: 'Scammer Smith',
            email: 'scammer.s@example.com',
            profileImageUrl: '/uploads/profile_images/reported_user_1.jpg', // Placeholder path for a user's profile image
        },
        reason: 'Spamming connection requests and sending unsolicited messages.',
        status: 'pending',
    },
    {
        _id: 'report-2',
        reportedUser: {
            _id: 'user-id-2',
            name: 'Bully B. Johnson',
            email: 'bully.b@example.com',
            profileImageUrl: null, // Example: User has no profile image, will use local fallback
        },
        reason: 'Harassment and inappropriate language in chat.',
        status: 'pending',
    },
    {
        _id: 'report-3',
        reportedUser: {
            _id: 'user-id-3',
            name: 'Phisher P. Kelly',
            email: 'phisher.p@example.com',
            profileImageUrl: '/uploads/profile_images/reported_user_3.jpg', // Another placeholder path
        },
        reason: 'Attempted phishing scam by asking for personal login details.',
        status: 'pending',
    },
    {
        _id: 'report-4',
        reportedUser: {
            _id: 'user-id-4',
            name: 'Spammy McSpamface',
            email: 'spammy@example.com',
            profileImageUrl: '/uploads/profile_images/reported_user_4.jpg',
        },
        reason: 'Posting irrelevant advertisements in public forums.',
        status: 'pending',
    },
];
// --- END STATIC DATA ---

const ReportedUsersScreen = () => {
    const navigation = useNavigation();
    const [reportedUsers, setReportedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // This ref controls whether the screen uses static data or attempts an API call.
    // Set to `true` to use the predefined `STATIC_REPORTED_USERS`.
    // Change to `false` when you want to connect to a live backend API.
    const useStaticData = useRef(true); 

    const fetchReportedUsers = useCallback(async () => {
        setLoading(true);
        setError(null);

        if (useStaticData.current) {
            // Simulate network delay for static data
            setTimeout(() => {
                // Prepare static data with full image URLs or local fallbacks
                const reportsWithFullImages = STATIC_REPORTED_USERS.map(report => {
                    let fullImageUrl = null;
                    if (report.reportedUser.profileImageUrl) {
                        // Construct full URL for static images if they are relative paths
                        fullImageUrl = `${STATIC_FILES_BASE_URL}${report.reportedUser.profileImageUrl.startsWith('/') ? '' : '/'}${report.reportedUser.profileImageUrl}`;
                    } else {
                        // If static user data has no image path, use a local fallback asset
                        fullImageUrl = require('../assets/profile.jpeg'); // Make sure this path is correct!
                    }
                    return { 
                        ...report, 
                        reportedUser: { 
                            ...report.reportedUser, 
                            fullProfileImageUrl: fullImageUrl 
                        } 
                    };
                });
                setReportedUsers(reportsWithFullImages);
                setLoading(false);
            }, 1000); // Simulate 1 second loading
            return; // Stop execution if static data is being used
        }

        // --- Live API Fetch Logic (Only active when useStaticData.current is false) ---
        try {
            const userToken = await SecureStore.getItemAsync('userToken');
            if (!userToken) {
                Alert.alert('Authentication Error', 'You are not logged in. Please log in again.');
                navigation.replace('Login');
                return;
            }

            // Replace with your actual backend endpoint for fetching reported users
            const response = await axios.get(`${API_BASE_URL}/reports/pending`, {
                headers: { Authorization: `Bearer ${userToken}` },
            });
            
            const reportsWithFullImages = response.data.map(report => {
                let fullImageUrl = null;
                if (report.reportedUser && report.reportedUser.profileImageUrl) {
                    fullImageUrl = `${STATIC_FILES_BASE_URL}${report.reportedUser.profileImageUrl.startsWith('/') ? '' : '/'}${report.reportedUser.profileImageUrl}`;
                }
                return { 
                    ...report, 
                    reportedUser: { 
                        ...report.reportedUser, 
                        fullProfileImageUrl: fullImageUrl 
                    } 
                };
            });

            setReportedUsers(reportsWithFullImages);

        } catch (err) {
            console.error('Error fetching reported users:', err.response ? err.response.data : err.message);
            setError('Failed to fetch reported users. Please try again.');
            if (err.response && err.response.status === 401) {
                Alert.alert('Session Expired', 'Please log in again.');
                SecureStore.deleteItemAsync('userToken');
                navigation.replace('Login');
            }
        } finally {
            setLoading(false);
        }
    }, [navigation]);

    // This hook ensures data is fetched every time the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchReportedUsers();
        }, [fetchReportedUsers])
    );

    const handleResolveReport = (reportId, reportedUserName) => {
        Alert.alert(
            'Resolve Report',
            `Are you sure you want to resolve the report against ${reportedUserName}? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Resolve',
                    style: 'destructive', // Use a distinctive style for "destructive" actions like resolving
                    onPress: async () => {
                        setLoading(true); // Show loading indicator during the action
                        if (useStaticData.current) {
                            // Simulate resolving for static data: remove the report from the list
                            setTimeout(() => {
                                setReportedUsers(prevReports => prevReports.filter(r => r._id !== reportId));
                                Alert.alert('Success', `Report against ${reportedUserName} has been resolved (static data).`);
                                setLoading(false);
                            }, 500); // Short delay for simulation
                            return; // Stop execution if static data is being used
                        }

                        // --- Live API Resolve Report Logic (Only active when useStaticData.current is false) ---
                        try {
                            const userToken = await SecureStore.getItemAsync('userToken');
                            // Replace with your actual backend endpoint to resolve a report
                            const response = await axios.put(`${API_BASE_URL}/reports/resolve/${reportId}`, {}, {
                                headers: { Authorization: `Bearer ${userToken}` },
                            });
                            Alert.alert('Success', response.data.message || `Report against ${reportedUserName} has been resolved.`);
                            fetchReportedUsers(); // Re-fetch to update the list after resolving
                        } catch (err) {
                            console.error('Error resolving report:', err.response ? err.response.data : err.message);
                            Alert.alert('Error', err.response ? err.response.data.message : 'Failed to resolve report. Please try again.');
                            setLoading(false); // Hide loading on error
                        }
                    },
                },
            ]
        );
    };

    // --- UI Rendering based on loading/error states ---
    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading reported users...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchReportedUsers}>
                    <Text style={styles.retryButtonText}>Tap to Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Reported Users</Text>
                <View style={{ width: 24 }} /> {/* Spacer to balance header */}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {reportedUsers.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="shield-checkmark-outline" size={50} color={COLORS.muted} />
                        <Text style={styles.emptyStateText}>No pending reports.</Text>
                        <Text style={styles.emptyStateText}>Check back later for new reports.</Text>
                    </View>
                ) : (
                    reportedUsers.map((report) => (
                        <View key={report._id} style={styles.userCard}>
                            <Image
                                source={
                                    // Checks if the fullProfileImageUrl is a string (a URI)
                                    // If not, it assumes it's a local asset `require()` result or should be the fallback
                                    typeof report.reportedUser.fullProfileImageUrl === 'string'
                                        ? { uri: report.reportedUser.fullProfileImageUrl }
                                        : require('../assets/profile.jpeg') // Fallback local asset
                                }
                                style={styles.profileImage}
                                // Log errors if an image fails to load
                                onError={(e) => console.log('ReportedUsersScreen: Image failed to load:', e.nativeEvent.error, 'URL:', report.reportedUser.fullProfileImageUrl)}
                            />
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>{report.reportedUser.name}</Text>
                                <Text style={styles.userEmail}>{report.reportedUser.email}</Text>
                                <Text style={styles.reportReason}>Reason: {report.reason}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.resolveButton}
                                onPress={() => handleResolveReport(report._id, report.reportedUser.name)}
                            >
                                <Text style={styles.resolveButtonText}>Resolve</Text>
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: COLORS.text,
    },
    errorText: {
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
        marginBottom: 10,
    },
    retryButton: {
        backgroundColor: COLORS.secondary,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50, // Adjust for SafeAreaView notch/status bar
        paddingBottom: 20,
        backgroundColor: COLORS.card,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.shadow,
        elevation: 3, // For Android shadow
        shadowColor: COLORS.shadow, // For iOS shadow
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    backButton: {
        padding: 5,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100, // Ensure content isn't cut off by bottom tabs/buttons
    },
    emptyState: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
        padding: 20,
        backgroundColor: COLORS.card,
        borderRadius: 15,
        elevation: 2,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    emptyStateText: {
        fontSize: 16,
        color: COLORS.muted,
        textAlign: 'center',
        marginTop: 10,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: 15,
        padding: 15,
        marginBottom: 10,
        elevation: 2,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    profileImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 15,
        borderColor: COLORS.primary,
        borderWidth: 1,
    },
    userInfo: {
        flex: 1, // Takes up remaining space
    },
    userName: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
    },
    userEmail: {
        fontSize: 14,
        color: COLORS.muted,
        marginTop: 2,
    },
    reportReason: {
        fontSize: 13,
        color: COLORS.muted,
        marginTop: 4,
        fontStyle: 'italic',
    },
    resolveButton: {
        backgroundColor: COLORS.success, // A green or distinct color for 'Resolve'
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 10,
    },
    resolveButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default ReportedUsersScreen;