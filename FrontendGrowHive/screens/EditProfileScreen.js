import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Modal,
    FlatList,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const COLORS = {
    primary: '#34e3b0',
    secondary: '#2563eb',
    accent: '#F472B6',
    background: '#f6fbfa',
    card: '#fff',
    text: '#23272F',
    muted: '#6b7280',
    shadow: '#e0e7ef',
    logoBlue: '#2563eb',
    logoGreen: '#34e3b0',
};

// IMPORTANT: Ensure this IP is correct for your network/emulator
const API_BASE_URL = 'http://10.239.62.149:5000/api';

const FloatingLabelInput = ({
    icon,
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    keyboardType,
    editable = true,
    multiline = false,
    numberOfLines = 1,
}) => (
    <View style={styles.inputWrapper}>
        <View style={styles.labelContainer}>
            <Ionicons name={icon} size={16} color={COLORS.text} />
            <Text style={styles.labelText}>{label}</Text>
        </View>
        <TextInput
            style={[styles.textInput, multiline && styles.multilineInput]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={COLORS.muted}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            editable={editable}
            multiline={multiline}
            numberOfLines={numberOfLines}
            textAlignVertical={multiline ? 'top' : 'center'}
        />
    </View>
);

const DropdownInput = ({ icon, label, value, onSelect, options, placeholder }) => {
    const [isVisible, setIsVisible] = useState(false);

    const handleSelect = (item) => {
        onSelect(item);
        setIsVisible(false);
    };

    return (
        <View style={styles.inputWrapper}>
            <View style={styles.labelContainer}>
                <Ionicons name={icon} size={16} color={COLORS.text} />
                <Text style={styles.labelText}>{label}</Text>
            </View>
            <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setIsVisible(true)}
            >
                <Text style={[styles.dropdownText, !value && { color: COLORS.muted }]}>
                    {value || placeholder}
                </Text>
                <Ionicons name="chevron-down" size={20} color={COLORS.text} />
            </TouchableOpacity>

            <Modal
                visible={isVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select {label}</Text>
                        <FlatList
                            data={options}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.optionItem}
                                    onPress={() => handleSelect(item)}
                                >
                                    <Text style={styles.optionText}>{item}</Text>
                                </TouchableOpacity>
                            )}
                            showsVerticalScrollIndicator={false}
                        />
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setIsVisible(false)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const EditProfileScreen = () => {
    const navigation = useNavigation();

    // State variables for all editable fields in the User schema
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState(''); // Email is typically not editable after signup
    const [dateOfBirth, setDateOfBirth] = useState(''); // For display (MM/DD/YYYY)
    const [dobForBackend, setDobForBackend] = useState(null); // For backend (ISO string)
    const [gender, setGender] = useState('');
    const [education, setEducation] = useState('');
    const [university, setUniversity] = useState('');
    const [location, setLocation] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [bio, setBio] = useState('');
    const [skillsOwned, setSkillsOwned] = useState(''); // Comma-separated string for display
    const [skillsToLearn, setSkillsToLearn] = useState(''); // Comma-separated string for display
    const [domains, setDomains] = useState(''); // For the single domain dropdown
    const [workLinks, setWorkLinks] = useState('');
    const [achievements, setAchievements] = useState('');

    // Define options for DropdownInputs
    const domainOptions = [
        'Select Domain', // Default placeholder option
        'Artificial Intelligence', 'Machine Learning', 'Data Science', 'Cybersecurity',
        'Web Development', 'Mobile Development', 'Blockchain', 'Game Development',
        'UI/UX Design', 'Cloud Computing', 'DevOps', 'Software Engineering',
        'Database Management', 'Network Administration', 'Digital Marketing',
        'Project Management', 'Quality Assurance', 'Data Analysis', 'Business Intelligence',
    ];

    const genderOptions = ['Select Gender', 'Male', 'Female', 'Non-binary', 'Prefer not to say'];

    const universityOptions = [
        'Select University', // Default placeholder option
        'Aditya College of Engineering', 'Acharya Nagarjuna University', 'Andhra University',
        'GITAM University', 'Vignan University', 'VIT-AP University', 'SRM University AP',
        'K L University', 'Amrita Vishwa Vidyapeetham', 'Centurion University',
        'RGUKT Nuzvidu', 'RGUKT Srikakulam', 'JNTU Anantapur', 'JNTU Kakinada',
        'SVU Tirupati', 'Sree Vidyanikethan Engineering College',
        'Gayatri Vidya Parishad College of Engineering', 'Pragati Engineering College',
        'CMR College of Engineering & Technology', 'Vignan Institute of Technology & Science',
    ];

    // Function to fetch user profile data
    const fetchUserProfile = useCallback(async () => {
        setLoading(true);
        try {
            const userToken = await SecureStore.getItemAsync('userToken');
            if (!userToken) {
                console.warn('No user token found. Redirecting to login.');
                navigation.replace('Login');
                return;
            }

            // Fetch from the general profile GET endpoint
            const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
                headers: {
                    Authorization: `Bearer ${userToken}`,
                },
            });

            const userData = response.data;
            console.log('Fetched user data:', userData);

            // Populate state variables with fetched data, handling potential nulls
            setName(userData.name || '');
            setEmail(userData.email || '');

            // Date of Birth: convert ISO string from backend to display format (MM/DD/YYYY)
            if (userData.dateOfBirth) {
                const parsedDate = new Date(userData.dateOfBirth);
                if (!isNaN(parsedDate.getTime())) {
                    setDobForBackend(parsedDate.toISOString());
                    setDateOfBirth(
                        // Format to MM/DD/YYYY manually for consistent display
                        `${(parsedDate.getUTCMonth() + 1).toString().padStart(2, '0')}/` +
                        `${parsedDate.getUTCDate().toString().padStart(2, '0')}/` +
                        `${parsedDate.getUTCFullYear()}`
                    );
                } else {
                    setDobForBackend(null);
                    setDateOfBirth('');
                }
            } else {
                setDobForBackend(null);
                setDateOfBirth('');
            }

            setGender(userData.gender || '');
            setEducation(userData.education || '');
            setUniversity(userData.university || '');
            setLocation(userData.location || '');
            setPhoneNumber(userData.phoneNumber || '');
            setBio(userData.bio || '');

            // Skills Owned: convert array of objects to comma-separated string
            setSkillsOwned(
                userData.skillsOwned && userData.skillsOwned.length > 0
                    ? userData.skillsOwned.map(s => s.skill).join(', ')
                    : ''
            );
            // Skills To Learn: convert array of objects to comma-separated string (assuming skill property)
            setSkillsToLearn(
                userData.skillsToLearn && userData.skillsToLearn.length > 0
                    ? userData.skillsToLearn.map(s => s.skill).join(', ')
                    : ''
            );

            // Domains: take the first domain from the array for the single dropdown
            setDomains(
                userData.domains && userData.domains.length > 0
                    ? userData.domains[0]
                    : 'Select Domain' // Set to default placeholder if no domain
            );

            setWorkLinks(userData.workLinks || '');
            setAchievements(userData.achievements || '');

        } catch (error) {
            console.error('Failed to fetch user profile:', error.response ? error.response.data : error.message);
            Alert.alert('Error', 'Failed to load profile data.');
        } finally {
            setLoading(false);
        }
    }, [navigation]);

    // Use useFocusEffect to refetch data whenever the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchUserProfile();
        }, [fetchUserProfile])
    );

    // Handler for Date of Birth input: parses MM/DD/YYYY and updates dobForBackend
    const handleDateChange = (text) => {
        setDateOfBirth(text); // Always update the display string

        // Regex for MM/DD/YYYY format.
        const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[1-2][0-9]|3[0-1])\/(19|20)\d{2}$/;
        if (dateRegex.test(text)) {
            const [month, day, year] = text.split('/').map(Number);
            const potentialDate = new Date(Date.UTC(year, month - 1, day));
            if (potentialDate.getUTCMonth() === month - 1 && potentialDate.getUTCDate() === day) {
                setDobForBackend(potentialDate.toISOString());
            } else {
                setDobForBackend(null); // Invalid date for month/day combo
            }
        } else {
            setDobForBackend(null); // Invalid format
        }
    };


    // Function to handle saving updated profile details
    const handleSave = async () => {
        setLoading(true);
        try {
            const userToken = await SecureStore.getItemAsync('userToken');
            if (!userToken) {
                Alert.alert('Authentication Error', 'Please log in again.');
                navigation.replace('Login');
                return;
            }

            // Client-side validation for Date of Birth format
            if (dateOfBirth && !dobForBackend) {
                Alert.alert('Invalid Date Format', 'Please enter a valid date of birth in MM/DD/YYYY format.');
                setLoading(false);
                return;
            }

            // Parse skillsOwned: "skill, skill" to array of { skill, proficiency, domain }
            // Assign a default proficiency and use the main selected domain
            const skillsOwnedArray = skillsOwned
                .split(',')
                .map(s => s.trim())
                .filter(s => s !== '')
                .map(skill => ({
                    skill: skill,
                    proficiency: 'Beginner', // Default proficiency
                    domain: (domains === 'Select Domain' ? 'General' : domains) || 'General' // Use selected domain or 'General' default
                }));

            // Parse skillsToLearn: "skill, skill" to array of { skill, domain }
            // Assign the main selected domain
            const skillsToLearnArray = skillsToLearn
                .split(',')
                .map(s => s.trim())
                .filter(s => s !== '')
                .map(skill => ({
                    skill: skill,
                    domain: (domains === 'Select Domain' ? 'General' : domains) || 'General' // Use selected domain or 'General' default
                }));


            const updatedProfile = {
                name,
                dateOfBirth: dobForBackend, // Use the ISO string for backend
                gender: gender === 'Select Gender' ? null : gender || null, // Send null if 'Select Gender' or empty
                education: education || null,
                university: university === 'Select University' ? null : university || null, // Send null if 'Select University' or empty
                location: location || null,
                phoneNumber: phoneNumber || null,
                bio: bio || null,
                skillsOwned: skillsOwnedArray,
                skillsToLearn: skillsToLearnArray,
                domains: (domains === 'Select Domain' ? [] : (domains ? [domains] : [])), // Send array of strings
                workLinks: workLinks || null,
                achievements: achievements || null,
                // Do NOT send email as it's not editable by user directly from profile edit
                // Do NOT send createdAt, isVerified, _id, __v
            };

            // Use the /auth/profile endpoint for PUT requests
            // This endpoint will be handled by the completeProfile controller
            await axios.put(`${API_BASE_URL}/auth/profile`, updatedProfile, {
                headers: {
                    Authorization: `Bearer ${userToken}`,
                    'Content-Type': 'application/json',
                },
            });

            Alert.alert('Success', 'Profile updated successfully!');
            navigation.goBack(); // Navigate back to the previous screen (e.g., main profile)
        } catch (error) {
            console.error('Failed to save profile:', error.response ? error.response.data : error.message);
            let errorMessage = 'Failed to update profile. Please try again.';
            if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
            } else if (error.response && error.response.status === 401) {
                errorMessage = 'Session expired. Please log in again.';
                await SecureStore.deleteItemAsync('userToken'); // Clear invalid token
                navigation.replace('Login');
            }
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={{ marginTop: 10, color: COLORS.text }}>Loading profile...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollViewContent}>

                    <Text style={styles.headerTitle}>Details</Text>

                    <FloatingLabelInput
                        icon="person"
                        label="Name"
                        value={name}
                        onChangeText={setName}
                        placeholder="Your full name"
                    />
                    <FloatingLabelInput
                        icon="mail"
                        label="Email"
                        value={email}
                        editable={false}
                    />
                    <FloatingLabelInput
                        icon="calendar"
                        label="Date of Birth"
                        value={dateOfBirth}
                        onChangeText={handleDateChange}
                        placeholder="MM/DD/YYYY"
                        keyboardType="numbers-and-punctuation"
                    />
                    <DropdownInput
                        icon="people"
                        label="Gender"
                        value={gender}
                        onSelect={setGender}
                        options={genderOptions}
                        placeholder="Select Gender"
                    />
                    <FloatingLabelInput
                        icon="school"
                        label="Education"
                        value={education}
                        onChangeText={setEducation}
                        placeholder="e.g., B.Tech Computer Science"
                    />
                    <DropdownInput
                        icon="business"
                        label="University"
                        value={university}
                        onSelect={setUniversity}
                        options={universityOptions}
                        placeholder="Select your university"
                    />
                    <FloatingLabelInput
                        icon="location"
                        label="Location"
                        value={location}
                        onChangeText={setLocation}
                        placeholder="e.g., Mumbai, India"
                    />
                    <FloatingLabelInput
                        icon="call"
                        label="Phone Number"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                        placeholder="e.g., +91 9876543210"
                    />
                    <FloatingLabelInput
                        icon="information-circle"
                        label="Bio"
                        value={bio}
                        onChangeText={setBio}
                        placeholder="Tell us about yourself (max 500 characters)"
                        multiline
                        numberOfLines={4}
                    />

                    {/* <FloatingLabelInput
                        icon="checkmark-circle"
                        label="Skills Owned"
                        value={skillsOwned}
                        onChangeText={setSkillsOwned}
                        placeholder="e.g., HTML, CSS, JavaScript (comma-separated)"
                        multiline
                        numberOfLines={2}
                    />
                    <FloatingLabelInput
                        icon="code-slash"
                        label="Skills To Learn"
                        value={skillsToLearn}
                        onChangeText={setSkillsToLearn}
                        placeholder="e.g., React Native, Python, AI (comma-separated)"
                        multiline
                        numberOfLines={2}
                    /> */}

                    {/* <DropdownInput
                        icon="briefcase"
                        label="Domain"
                        value={domains}
                        onSelect={setDomains}
                        options={domainOptions}
                        placeholder="Select your primary domain"
                    /> */}
                    <FloatingLabelInput
                        icon="link"
                        label="Work Links"
                        value={workLinks}
                        onChangeText={setWorkLinks}
                        placeholder="e.g., GitHub, LinkedIn, Portfolio URL"
                    />
                    <FloatingLabelInput
                        icon="trophy"
                        label="Achievements"
                        value={achievements}
                        onChangeText={setAchievements}
                        placeholder="List your significant achievements"
                        multiline
                        numberOfLines={3}
                    />

                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveText}>Save Profile</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        paddingTop: Platform.OS === 'android' ? 25 : 0, // Adjust for Android status bar
    },
    scrollViewContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: COLORS.secondary,
        textAlign: 'center',
        marginBottom: 30,
        marginTop: 15,
        fontFamily: 'Poppins_700Bold',
    },
    inputWrapper: {
        marginBottom: 20,
        borderWidth: 1.5,
        borderColor: COLORS.text,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingTop: 18,
        paddingBottom: 10,
        backgroundColor: COLORS.card,
        position: 'relative',
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    labelContainer: {
        position: 'absolute',
        top: -10,
        left: 12,
        backgroundColor: COLORS.card,
        paddingHorizontal: 6,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1,
    },
    labelText: {
        marginLeft: 5,
        fontSize: 13,
        color: COLORS.text,
        fontWeight: '600',
        fontFamily: 'Poppins_600SemiBold',
    },
    textInput: {
        fontSize: 16,
        color: COLORS.text,
        paddingTop: 2,
        fontFamily: 'Poppins_400Regular',
    },
    multilineInput: {
        minHeight: 80,
        paddingTop: 8,
    },
    dropdownButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 2,
        minHeight: 20,
    },
    dropdownText: {
        fontSize: 16,
        color: COLORS.text,
        flex: 1,
        fontFamily: 'Poppins_400Regular',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: COLORS.card,
        width: '85%',
        maxHeight: '70%',
        borderRadius: 15,
        padding: 20,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 15,
        color: COLORS.text,
        fontFamily: 'Poppins_700Bold',
    },
    optionItem: {
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.shadow,
    },
    optionText: {
        fontSize: 16,
        color: COLORS.text,
        fontFamily: 'Poppins_400Regular',
    },
    closeButton: {
        backgroundColor: COLORS.secondary,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 15,
    },
    closeButtonText: {
        color: COLORS.card,
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Poppins_700Bold',
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 25,
        marginBottom: 30,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    saveText: {
        color: COLORS.card,
        fontSize: 18,
        fontWeight: '700',
        fontFamily: 'Poppins_700Bold',
        letterSpacing: 0.5,
    },
});

export default EditProfileScreen;