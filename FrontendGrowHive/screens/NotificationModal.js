// frontend/SchedulePage/NotificationModal.js
import React from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from './constants';

const NotificationModal = ({ visible, notifications, onClose, onMarkAsRead, onDelete }) => {

    const renderNotificationItem = ({ item }) => {
        const isRead = item.read;
        const backgroundColor = isRead ? COLORS.white : COLORS.lightGray;

        return (
            <View style={[modalStyles.notificationItem, { backgroundColor }]}>
                <View style={modalStyles.notificationContent}>
                    <Text style={modalStyles.notificationMessage}>{item.message}</Text>
                    {item.relatedEntityId && item.type === 'meeting_status_update' && (
                        <Text style={modalStyles.notificationDetails}>
                            For: '{item.relatedEntityId.title}' on {item.relatedEntityId.date} at {item.relatedEntityId.time}
                        </Text>
                    )}
                    <Text style={modalStyles.notificationTime}>
                        {new Date(item.createdAt).toLocaleString()}
                    </Text>
                </View>
                <View style={modalStyles.notificationActions}>
                    {!isRead && (
                        <TouchableOpacity
                            onPress={() => onMarkAsRead([item._id])}
                            style={modalStyles.actionButton}
                        >
                            <Ionicons name="checkmark-circle-outline" size={24} color={COLORS.logoGreen} />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        onPress={() => onDelete(item._id)}
                        style={modalStyles.actionButton}
                    >
                        <Ionicons name="trash-outline" size={24} color={COLORS.red} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <SafeAreaView style={modalStyles.centeredView}>
                <View style={modalStyles.modalView}>
                    <View style={modalStyles.modalHeader}>
                        <Text style={modalStyles.modalTitle}>Notifications</Text>
                        <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
                            <Ionicons name="close" size={30} color={COLORS.textDark} />
                        </TouchableOpacity>
                    </View>

                    {notifications.length === 0 ? (
                        <Text style={modalStyles.noNotificationsText}>No notifications yet.</Text>
                    ) : (
                        <FlatList
                            data={notifications}
                            keyExtractor={(item) => item._id}
                            renderItem={renderNotificationItem}
                            contentContainerStyle={modalStyles.flatListContent}
                        />
                    )}

                    {notifications.some(n => !n.read) && ( // Only show if there are unread notifications
                        <TouchableOpacity
                            style={modalStyles.markAllReadButton}
                            onPress={() => onMarkAsRead()} // Calling with no args marks all as read
                        >
                            <Text style={modalStyles.markAllReadButtonText}>Mark All as Read</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </SafeAreaView>
        </Modal>
    );
};

// --- Modal Styles ---
const modalStyles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'flex-end', // Position modal at the bottom
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dim background
    },
    modalView: {
        width: '100%',
        height: '80%', // Take up 80% of the screen height
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textDark,
    },
    closeButton: {
        padding: 5,
    },
    noNotificationsText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: COLORS.textLight,
    },
    flatListContent: {
        paddingBottom: 20, // Give some padding at the bottom for the last item
    },
    notificationItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        marginVertical: 5,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.lightGrayBorder,
    },
    notificationContent: {
        flex: 1,
        marginRight: 10,
    },
    notificationMessage: {
        fontSize: 16,
        color: COLORS.textDark,
        fontWeight: '500',
    },
    notificationDetails: {
        fontSize: 13,
        color: COLORS.textLight,
        marginTop: 4,
    },
    notificationTime: {
        fontSize: 12,
        color: COLORS.textGray,
        marginTop: 8,
    },
    notificationActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        marginLeft: 10,
        padding: 5,
    },
    markAllReadButton: {
        backgroundColor: COLORS.logoBlue, // Or another prominent color
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    markAllReadButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default NotificationModal;