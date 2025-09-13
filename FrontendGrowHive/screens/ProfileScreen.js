import React, { useState, useEffect, useCallback } from 'react';
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
    Platform // Import Platform to check OS
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // Ensure Ionicons is imported
import * as ImagePicker from 'expo-image-picker';
import { useFonts, Poppins_700Bold, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import GrowHiveHead from './GrowHivehead'; // Ensure this path is correct
import { COLORS } from './constants'; // Ensure this path is correct and COLORS is defined
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

// IMPORTANT: Ensure this API_BASE_URL matches your backend's base URL
// Use your local IP or 'localhost' if testing on emulator/simulator,
// or your deployed backend URL.
const API_BASE_URL = 'http://10.239.62.149:5000/api'; // Your backend API base URL
const STATIC_FILES_BASE_URL = 'http://10.239.62.149:5000'; // Your backend base URL for static files (images)

const MAX_SKILLS_TO_SHOW = 4;

const ProfileScreen = () => {
    const navigation = useNavigation();

    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('Loading Name...');
    const [userEmail, setUserEmail] = useState('Loading Email...');
    const [bio, setBio] = useState('Loading bio...');
    const [skillsOwned, setSkillsOwned] = useState([]);
    const [profileImageUrl, setProfileImageUrl] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imageTimestamp, setImageTimestamp] = useState(Date.now()); // For cache busting
    const [userRating, setUserRating] = useState(0); // State for user rating

    const [showAllSkills, setShowAllSkills] = useState(false);

    let [fontsLoaded] = useFonts({
        Poppins_700Bold,
        Poppins_400Regular,
        Poppins_600SemiBold,
    });

    const fetchUserProfile = useCallback(async () => {
        setLoading(true);
        console.log('ProfileScreen: Attempting to fetch user profile...');
        try {
            const userToken = await SecureStore.getItemAsync('userToken');

            if (!userToken) {
                console.warn('ProfileScreen: No user token found. Redirecting to login.');
                Alert.alert('Authentication Required', 'Your session has expired. Please log in again.');
                setTimeout(() => navigation.replace('Login'), 100);
                return;
            }

            const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
                headers: {
                    Authorization: `Bearer ${userToken}`,
                },
            });

            const userData = response.data;
            console.log('ProfileScreen: Fetched user data:', userData);

            setUserName(userData.name || 'User');
            setUserEmail(userData.email || 'No email');
            setBio(userData.bio || 'No bio provided.');

            setUserRating(userData.rating || 0); // Assuming 'rating' field exists in userData, default to 0

            // Ensure skills are mapped correctly. `skillsOwned` is an array of objects { skill, proficiency, domain }
            const skillsForDisplay = (userData.skillsOwned || []).map(s => {
                // If skills are stored as objects like { skill: "SkillName", proficiency: "level" }
                if (typeof s === 'object' && s !== null && s.skill) {
                    return s.skill;
                }
                // If skills are stored as plain strings (less likely given your schema)
                return s;
            });
            setSkillsOwned(skillsForDisplay);

            const relativePathFromBackend = userData.profileImageUrl;
            let fullImageUrl = null;
            if (relativePathFromBackend) {
                // Ensure correct URL construction, handling potential leading slash in relativePath
                fullImageUrl = `${STATIC_FILES_BASE_URL}${relativePathFromBackend.startsWith('/') ? '' : '/'}${relativePathFromBackend}`;
            }
            setProfileImageUrl(fullImageUrl);
            setImageTimestamp(Date.now()); // Update timestamp to force image reload

            console.log('ProfileScreen: Fetched relative profileImageUrl from backend:', relativePathFromBackend);
            console.log('ProfileScreen: Constructed fullImageUrl for display:', fullImageUrl);

            // Store profile data for fallback
            const { password, ...profileToStore } = userData; // Destructure to remove password
            await SecureStore.setItemAsync('userProfile', JSON.stringify(profileToStore));
            await SecureStore.setItemAsync('userName', userData.name);
            await SecureStore.setItemAsync('userEmail', userData.email);

        } catch (error) {
            console.error('ProfileScreen: Failed to fetch user profile from backend:', error.response ? error.response.data : error.message);
            let errorMessage = 'Failed to load profile. Please try again.';

            if (error.response) {
                if (error.response.data && error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
                if (error.response.status === 401) {
                    errorMessage = 'Session expired. Please log in again.';
                    await SecureStore.deleteItemAsync('userToken');
                    setTimeout(() => navigation.replace('Login'), 100);
                } else if (error.response.status === 404) {
                    errorMessage = 'Profile data not found. Contact support.';
                }
            } else if (error.request) {
                errorMessage = 'Network error. Please check your internet connection.';
            } else {
                errorMessage = `Error: ${error.message}`;
            }
            Alert.alert('Profile Load Failed', errorMessage);

            // Attempt to load from SecureStore as a fallback
            try {
                const storedUserProfile = await SecureStore.getItemAsync('userProfile');
                if (storedUserProfile) {
                    const profileData = JSON.parse(storedUserProfile);
                    setUserName(profileData.name || 'User');
                    setUserEmail(profileData.email || 'No email');
                    setBio(profileData.bio || 'No bio provided.');
                    setUserRating(profileData.rating || 0); // Fallback rating
                    const skillsForDisplay = (profileData.skillsOwned || []).map(s => typeof s === 'object' && s !== null && s.skill ? s.skill : s);
                    setSkillsOwned(skillsForDisplay);
                    const storedRelativeImageUrl = profileData.profileImageUrl;
                    let storedFullImageUrl = null;
                    if (storedRelativeImageUrl) {
                        storedFullImageUrl = `${STATIC_FILES_BASE_URL}${storedRelativeImageUrl.startsWith('/') ? '' : '/'}${storedRelativeImageUrl}`;
                    }
                    setProfileImageUrl(storedFullImageUrl);
                    setImageTimestamp(Date.now()); // Update timestamp for fallback image
                    console.log('ProfileScreen: Loaded fallback profile from SecureStore:', profileData);
                } else {
                    console.warn('ProfileScreen: No fallback profile data found in SecureStore.');
                }
            } catch (e) {
                console.error("ProfileScreen: Failed to load fallback profile from SecureStore:", e);
                setUserName('Error loading');
                setUserEmail('Error loading');
                setBio('Could not load profile data.');
                setSkillsOwned([]);
                setProfileImageUrl(null);
                setUserRating(0); // Default rating on error
            }
        } finally {
            setLoading(false);
        }
    }, [navigation]);

    useFocusEffect(
        useCallback(() => {
            fetchUserProfile();
            return () => {
                // Optional cleanup if needed when screen loses focus
            };
        }, [fetchUserProfile])
    );

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission denied', 'We need permission to access your gallery to upload images.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1], // Force a square aspect ratio
            quality: 0.7, // Compress image quality
        });

        if (!result.canceled) {
            const selectedImageUri = result.assets[0].uri;
            setProfileImageUrl(selectedImageUri); // Optimistically update the UI with local URI
            setImageTimestamp(Date.now()); // Immediately update timestamp for optimistic UI
            console.log('ProfileScreen: Selected local image URI (optimistic update):', selectedImageUri);
            uploadProfileImage(selectedImageUri);
        }
    };

    const uploadProfileImage = async (imageUri) => {
        setUploadingImage(true);
        try {
            const userToken = await SecureStore.getItemAsync('userToken');
            if (!userToken) {
                Alert.alert('Authentication Error', 'No user token found. Please log in again.');
                setTimeout(() => navigation.replace('Login'), 100);
                return;
            }

            const formData = new FormData();
            formData.append('profileImage', {
                uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
                name: `profile_${Date.now()}.jpg`,
                type: 'image/jpeg',
            });

            console.log('ProfileScreen: Sending FormData to backend for profile image upload...');
            const response = await axios.put(`${API_BASE_URL}/upload/profile-image`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${userToken}`,
                },
            });

            const newRelativeImageUrl = response.data.profileImageUrl;
            let newFullImageUrl = null;
            if (newRelativeImageUrl) {
                newFullImageUrl = `${STATIC_FILES_BASE_URL}${newRelativeImageUrl.startsWith('/') ? '' : '/'}${newRelativeImageUrl}`;
            }
            setProfileImageUrl(newFullImageUrl);
            setImageTimestamp(Date.now()); // Update timestamp to force re-render with new URL

            console.log('ProfileScreen: Backend upload response data:', response.data);
            console.log('ProfileScreen: New relative image URL from backend:', newRelativeImageUrl);
            console.log('ProfileScreen: Constructed new full image URL for display after upload:', newFullImageUrl);

            Alert.alert('Success', 'Profile image updated successfully!');

        } catch (error) {
            console.error('ProfileScreen: Error uploading image:', error.response ? error.response.data : error.message);
            let errorMessage = 'Failed to upload image. Please try again.';
            if (error.response) {
                if (error.response.data && error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
                if (error.response.status === 413) {
                    errorMessage = 'Image file is too large. Please select a smaller image (max 2MB).';
                } else if (error.response.status === 401) {
                    errorMessage = 'Session expired. Please log in again.';
                    await SecureStore.deleteItemAsync('userToken');
                    setTimeout(() => navigation.replace('Login'), 100);
                }
            } else if (error.request) {
                errorMessage = 'Network error during upload. Please check your internet connection.';
            } else {
                errorMessage = `Error setting up upload: ${error.message}`;
            }
            Alert.alert('Upload Failed', errorMessage);
            fetchUserProfile(); // Re-fetch to revert to the previous correct image or default
        } finally {
            setUploadingImage(false);
        }
    };


    if (!fontsLoaded || loading) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={{ fontFamily: 'Poppins_400Regular', marginTop: 10 }}>Loading profile...</Text>
            </View>
        );
    }

    const displayedSkills = showAllSkills ? skillsOwned : skillsOwned.slice(0, MAX_SKILLS_TO_SHOW);
    const hasMoreSkills = skillsOwned.length > MAX_SKILLS_TO_SHOW;

    // Function to render stars based on rating
    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        const stars = [];

        for (let i = 0; i < fullStars; i++) {
            stars.push(<Ionicons key={`star-full-${i}`} name="star" size={16} color="#FFD700" />);
        }
        if (halfStar) {
            stars.push(<Ionicons key="star-half" name="star-half-outline" size={16} color="#FFD700" />);
        }
        for (let i = 0; i < emptyStars; i++) {
            stars.push(<Ionicons key={`star-empty-${i}`} name="star-outline" size={16} color="#CCCCCC" />);
        }
        return <View style={styles.starsContainer}>{stars}</View>;
    };


    return (
        <SafeAreaView style={styles.container}>
            <GrowHiveHead />
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Header (Image, Name, Bio) */}
                <View style={styles.profileHeader}>
                    <View style={styles.profileImageWrapper}>
                        <Image
                            source={
                                profileImageUrl
                                    ? { uri: `${profileImageUrl}?v=${imageTimestamp}` } // Cache busting with timestamp
                                    : require('../assets/profile.jpeg') // Fallback to local asset
                            }
                            style={styles.profileImage}
                            onError={(e) => {
                                console.log('ProfileScreen: Image failed to load:', e.nativeEvent.error, 'URL that failed:', profileImageUrl);
                                // Optionally set to fallback image if loading from URL fails
                                setProfileImageUrl(null); // Set to null to show default image
                            }}
                        />
                        <TouchableOpacity onPress={pickImage} style={styles.editIcon} disabled={uploadingImage}>
                            {uploadingImage ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons name="add" size={18} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.profileDetailsRight}>
                        <View style={styles.nameAndStars}>
                            <Text style={styles.name}>{userName}</Text>
                            {renderStars(userRating)}
                        </View>
                        <Text style={styles.profileBioText}>{bio}</Text>
                    </View>
                </View>

                {/* Skills Section (for display summary) */}
                {skillsOwned.length > 0 && (
                    <View style={styles.skillsSection}>
                        <View style={styles.skillsContainerCompact}>
                            {displayedSkills.map((skill, index) => (
                                <View key={index} style={styles.skillTag}>
                                    <Text style={styles.skillText}>{skill}</Text>
                                </View>
                            ))}
                            {hasMoreSkills && !showAllSkills && (
                                <TouchableOpacity onPress={() => setShowAllSkills(true)} style={styles.showMoreHideButton}>
                                    <Text style={styles.showMoreHideButtonText}>Show More</Text>
                                </TouchableOpacity>
                            )}
                            {showAllSkills && (
                                <TouchableOpacity onPress={() => setShowAllSkills(false)} style={styles.showMoreHideButton}>
                                    <Text style={styles.showMoreHideButtonText}>Show Less</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <StatsBlock label="Connections" count="25" />
                    <StatsBlock label="Courses Learned" count="10" />
                    <StatsBlock label="Hackathons" count="3" />
                </View>

                {/* Section Rows */}
                <SectionRow
                    icon="person-circle-outline"
                    label="Personal Information"
                    onPress={() => navigation.navigate('EditProfile')}
                />
                <SectionRow
                    icon="lock-closed-outline"
                    label="Change Password"
                    onPress={() => navigation.navigate('ChangePassword')}
                />
                <SectionRow
                    icon="bar-chart-outline"
                    label="Proficiency"
                    onPress={() => {
                        // Pass userToken and userId to Proficiency screen
                        SecureStore.getItemAsync('userToken').then(userToken => {
                            SecureStore.getItemAsync('userId').then(userId => {
                                navigation.navigate('Proficiency', { userToken, userId });
                            });
                        });
                    }}
                />
                <SectionRow
                    icon="settings-outline"
                    label="Settings"
                    onPress={() => navigation.navigate('Settings')}
                />
                <SectionRow
                    icon="alert-circle-outline"
                    label="Blocked Users"
                    onPress={() => navigation.navigate('BlockedUsers')}
                />
                <SectionRow
                    icon="alert-octagon-outline"
                    label="Reported Users"
                    onPress={() => navigation.navigate('ReportedUsersScreen')}
                />
                <SectionRow
                    icon="log-out-outline"
                    label="Log Out"
                    onPress={() =>
                        Alert.alert(
                            "Log Out",
                            "Are you sure you want to log out?",
                            [
                                {
                                    text: "Cancel",
                                    style: "cancel"
                                },
                                {
                                    text: "Yes",
                                    onPress: async () => {
                                        await SecureStore.deleteItemAsync('userToken');
                                        await SecureStore.deleteItemAsync('userId');
                                        await SecureStore.deleteItemAsync('userName');
                                        await SecureStore.deleteItemAsync('userEmail');
                                        await SecureStore.deleteItemAsync('userProfile');
                                        Alert.alert("Logged Out", "You have been logged out successfully.");
                                        navigation.replace('Login');
                                    }
                                }
                            ],
                            { cancelable: true }
                        )
                    }
                />
            </ScrollView>
        </SafeAreaView>
    );
};

const StatsBlock = ({ label, count }) => (
    <View style={styles.statBox}>
        <Text style={styles.statNumber}>{count}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const SectionRow = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.sectionRow} onPress={onPress}>
        <View style={styles.sectionLeft}>
            <Ionicons name={icon} size={22} color={COLORS.primary} />
            <Text style={styles.sectionText}>{label}</Text>
        </View>
        {/* Conditional rendering for the edit icon */}
        {label === 'Personal Information' ? (
            <MaterialCommunityIcons name="square-edit-outline" size={20} color={COLORS.primary} />
        ) : (
            <Ionicons name="chevron-forward-outline" size={20} color={COLORS.muted} />
        )}
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: 20,
        paddingTop: 80, // Adjust as needed, considering SafeAreaView and GrowHiveHead
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    profileImageWrapper: {
        position: 'relative',
        marginRight: 15,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderColor: COLORS.primary,
        borderWidth: 2,
    },
    editIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.secondary,
        borderRadius: 8,
        padding: 6,
        borderWidth: 2,
        borderColor: '#fff',
    },
    profileDetailsRight: {
        flex: 1,
        justifyContent: 'center',
    },
    nameAndStars: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2, // Space between name/stars and bio
    },
    name: {
        fontSize: 22,
        color: '#222',
        fontFamily: 'Poppins_700Bold',
        marginRight: 8, // Space between name and stars
    },
    starsContainer: {
        flexDirection: 'row',
    },
    profileBioText: {
        fontSize: 13,
        fontFamily: 'Poppins_400Regular',
        color: '#555',
        lineHeight: 18,
    },
    skillsSection: {
        marginBottom: 20,
        paddingHorizontal: 5,
    },
    skillsContainerCompact: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 10,
    },
    skillTag: {
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginRight: 8,
        marginBottom: 8,
    },
    skillText: {
        color: '#fff',
        fontSize: 12,
        fontFamily: 'Poppins_600SemiBold',
    },
    showMoreHideButton: {
        backgroundColor: COLORS.secondary,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginRight: 8,
        marginBottom: 8,
    },
    showMoreHideButtonText: {
        color: '#fff',
        fontSize: 12,
        fontFamily: 'Poppins_600SemiBold',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#fff',
        borderRadius: 15,
        paddingVertical: 15,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    statBox: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 20,
        fontFamily: 'Poppins_700Bold',
        color: COLORS.primary,
    },
    statLabel: {
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
        color: '#666',
        marginTop: 2,
    },
    sectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 15,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    sectionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionText: {
        fontSize: 16,
        fontFamily: 'Poppins_600SemiBold',
        color: COLORS.text,
        marginLeft: 15,
    },
});

export default ProfileScreen;
