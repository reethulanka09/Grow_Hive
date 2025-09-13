import React, { useState, useEffect, useCallback, useRef } from 'react'; // Import useRef
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
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { COLORS } from './constants'; // Ensure this path is correct for your COLORS

// IMPORTANT: Ensure this API_BASE_URL matches your backend's base URL
const API_BASE_URL = 'http://10.16.59.193:5000/api';
// Define the base URL for serving static files (images)
// This is your backend's base URL WITHOUT the '/api' suffix
// It should NOT have a trailing slash here.
const STATIC_FILES_BASE_URL = 'http://10.16.59.193:5000';

// --- STATIC DATA FOR DEMONSTRATION ---
const STATIC_BLOCKED_USERS = [
    {
        _id: 'static-user-1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        profileImageUrl: '/uploads/profile_images/profile1.jpg', // Placeholder, ensure this path exists on your backend or use local asset
        fullProfileImageUrl: null, // Will be set in fetchBlockedUsers
    },
    {
        _id: 'static-user-2',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        profileImageUrl: '/uploads/profile_images/profile2.jpg', // Placeholder
        fullProfileImageUrl: null,
    },
    {
        _id: 'static-user-3',
        name: 'Alice Johnson',
        email: 'alice.j@example.com',
        profileImageUrl: '/uploads/profile_images/profile3.jpg', // Placeholder
        fullProfileImageUrl: null,
    },
    {
        _id: 'static-user-4',
        name: 'Bob Williams',
        email: 'bob.w@example.com',
        profileImageUrl: null, // Example with no image, will use fallback
        fullProfileImageUrl: null,
    },
];
// --- END STATIC DATA ---

const BlockedUsers = () => {
    const navigation = useNavigation();
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Use a ref to control whether to use static data or fetch from API
    // Set this to `true` to primarily use static data for testing/development.
    // Set to `false` (or remove this line) when you want to use the live API.
    const useStaticData = useRef(true); // <-- Set to 'false' to use live API

    const fetchBlockedUsers = useCallback(async () => {
        setLoading(true);
        setError(null);

        if (useStaticData.current) {
            // Simulate API call delay with static data
            setTimeout(() => {
                const usersWithFullImages = STATIC_BLOCKED_USERS.map(user => {
                    let fullImageUrl = null;
                    if (user.profileImageUrl) {
                        fullImageUrl = `${STATIC_FILES_BASE_URL}${user.profileImageUrl.startsWith('/') ? '' : '/'}${user.profileImageUrl}`;
                    } else {
                        // If static user data has no image, force local asset
                        fullImageUrl = require('../assets/profile.jpeg');
                    }
                    return { ...user, fullProfileImageUrl: fullImageUrl };
                });
                setBlockedUsers(usersWithFullImages);
                setLoading(false);
            }, 1000); // 1 second delay
            return; // Exit if using static data
        }

        // --- Live API Fetch Logic (Only runs if useStaticData.current is false) ---
        try {
            const userToken = await SecureStore.getItemAsync('userToken');
            if (!userToken) {
                Alert.alert('Authentication Error', 'You are not logged in. Please log in again.');
                navigation.replace('Login');
                return;
            }

            const response = await axios.get(`${API_BASE_URL}/users/blocked`, {
                headers: { Authorization: `Bearer ${userToken}` },
            });

            const usersWithFullImages = response.data.map(user => {
                let fullImageUrl = null;
                if (user.profileImageUrl) {
                    fullImageUrl = `${STATIC_FILES_BASE_URL}${user.profileImageUrl.startsWith('/') ? '' : '/'}${user.profileImageUrl}`;
                }
                return { ...user, fullProfileImageUrl: fullImageUrl };
            });

            setBlockedUsers(usersWithFullImages);

        } catch (err) {
            console.error('Error fetching blocked users:', err.response ? err.response.data : err.message);
            setError('Failed to fetch blocked users. Please try again.');
            if (err.response && err.response.status === 401) {
                Alert.alert('Session Expired', 'Please log in again.');
                SecureStore.deleteItemAsync('userToken');
                navigation.replace('Login');
            }
        } finally {
            setLoading(false);
        }
    }, [navigation]);

    useFocusEffect(
        useCallback(() => {
            fetchBlockedUsers();
        }, [fetchBlockedUsers])
    );

    const handleUnblockUser = (userId, userName) => {
        Alert.alert(
            'Unblock User',
            `Are you sure you want to unblock ${userName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Unblock',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true); // Re-show loading for unblock action
                        if (useStaticData.current) {
                            // Simulate unblock with static data
                            setTimeout(() => {
                                setBlockedUsers(prevUsers => prevUsers.filter(u => u._id !== userId));
                                Alert.alert('Success', `${userName} has been unblocked (static data).`);
                                setLoading(false);
                            }, 500);
                            return;
                        }

                        // --- Live API Unblock Logic (Only runs if useStaticData.current is false) ---
                        try {
                            const userToken = await SecureStore.getItemAsync('userToken');
                            const response = await axios.put(`${API_BASE_URL}/users/unblock/${userId}`, {}, {
                                headers: { Authorization: `Bearer ${userToken}` },
                            });
                            Alert.alert('Success', response.data.message || `${userName} has been unblocked.`);
                            fetchBlockedUsers(); // Re-fetch the list to show the updated state
                        } catch (err) {
                            console.error('Error unblocking user:', err.response ? err.response.data : err.message);
                            Alert.alert('Error', err.response ? err.response.data.message : 'Failed to unblock user. Please try again.');
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading blocked users...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchBlockedUsers}>
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
                <Text style={styles.title}>Blocked Users</Text>
                <View style={{ width: 24 }} /> {/* Spacer to balance header */}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {blockedUsers.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={50} color={COLORS.muted} />
                        <Text style={styles.emptyStateText}>No users are blocked yet.</Text>
                        <Text style={styles.emptyStateText}>You will see a list here if you block someone.</Text>
                    </View>
                ) : (
                    blockedUsers.map((user) => (
                        <View key={user._id} style={styles.userCard}>
                            <Image
                                source={
                                    // If fullProfileImageUrl is a string (from API or static with path), use it.
                                    // Otherwise, assume it's a local require() result (from static data with no path).
                                    typeof user.fullProfileImageUrl === 'string'
                                        ? { uri: user.fullProfileImageUrl }
                                        : require('../assets/profile.jpeg') // Fallback to local asset if no URL or if it's the local require()
                                }
                                style={styles.profileImage}
                                onError={(e) => console.log('BlockedUsersScreen: Image failed to load:', e.nativeEvent.error, 'URL:', user.fullProfileImageUrl)}
                            />
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>{user.name}</Text>
                                <Text style={styles.userEmail}>{user.email}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.unblockButton}
                                onPress={() => handleUnblockUser(user._id, user.name)}
                            >
                                <Text style={styles.unblockButtonText}>Unblock</Text>
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
    unblockButton: {
        backgroundColor: COLORS.redDanger, // Use a distinct color for unblock
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 10,
    },
    unblockButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default BlockedUsers;