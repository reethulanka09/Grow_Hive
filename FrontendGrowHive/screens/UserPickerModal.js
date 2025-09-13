// UserPickerModal.js
import React from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from './constants'; // Ensure path is correct

const UserPickerModal = ({ visible, users, onSelectUser, onClose }) => {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Partner</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={COLORS.muted} />
                        </TouchableOpacity>
                    </View>
                    {users.length === 0 ? (
                        <Text style={styles.noUsersText}>No users available.</Text>
                    ) : (
                        <FlatList
                            data={users}
                            keyExtractor={item => item._id.toString()} // Use user _id as key
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.userOption}
                                    onPress={() => onSelectUser(item)}
                                >
                                    <Text style={styles.userOptionText}>{item.name} ({item.email})</Text>
                                </TouchableOpacity>
                            )}
                            style={styles.userList}
                        />
                    )}
                    <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        // backgroundColor: 'red=',
    },
    modalContent: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        maxHeight: '70%', // Limit height for long lists
        shadowColor: 'white',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'Poppins_700Bold', // Make sure this font is loaded or remove if not
        color: COLORS.text,
    },
    closeButton: {
        padding: 5,
    },
    userList: {
        flexGrow: 0, // Prevents list from expanding too much
        marginBottom: 15,
    },
    userOption: {
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'white',
    },
    userOptionText: {
        fontSize: 16,
        fontFamily: 'Poppins_400Regular', // Make sure this font is loaded or remove if not
        color: COLORS.text,
    },
    noUsersText: {
        fontSize: 16,
        fontFamily: 'Poppins_400Regular',
        color: COLORS.muted,
        textAlign: 'center',
        paddingVertical: 20,
    },
    cancelButton: {
        backgroundColor: COLORS.logoGreen,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: 'white',
        fontSize: 18,
        fontFamily: 'Poppins_600SemiBold', // Make sure this font is loaded or remove if not
    },
});

export default UserPickerModal;