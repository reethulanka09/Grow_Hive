// RequestModal.js
import React from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList } from 'react-native';
import styles from './SchedulePageStyles'; // Assuming styles are shared or you have a specific RequestModalStyles

// You might need to import Ionicons if not already imported in your actual file
import { Ionicons } from '@expo/vector-icons';

const RequestsModal = ({ visible, requests, onClose, onAccept, onReject }) => {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close-circle" size={30} color="#6B7280" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Incoming Meeting Requests</Text>

                    {requests.length === 0 ? (
                        <Text style={styles.noRequestsText}>No pending requests.</Text>
                    ) : (
                        <FlatList
                            data={requests}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <View style={styles.requestCard}>
                                    <Text style={styles.requestTitle}>{item.title}</Text>
                                    <Text style={styles.requestFrom}>From: {item.requesterName}</Text>
                                    <Text style={styles.requestTime}>
                                        {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {item.time}
                                    </Text>
                                    {item.message && <Text style={styles.requestMessage}>Message: {item.message}</Text>}
                                    <View style={styles.requestActions}>
                                        <TouchableOpacity
                                            style={styles.acceptButton}
                                            onPress={() => onAccept(item.id, 'accept')}
                                        >
                                            <Text style={styles.acceptButtonText}>Accept</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.rejectButton} // Add this style in SchedulePageStyles.js
                                            onPress={() => onReject(item.id, 'reject')}
                                        >
                                            <Text style={styles.rejectButtonText}>Reject</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
};

export default RequestsModal;