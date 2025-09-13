import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import socket from "../utils/socket";
import { IP } from "../Config/config";

const API_URL = `${IP}`;

const ChatListScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const storedId = await AsyncStorage.getItem("currentUserId");
      if (!storedId) {
        console.warn("⚠️ No currentUserId found");
        setLoading(false);
        return;
      }

      setCurrentUserId(storedId);
      socket.emit("setup", storedId);

      const res = await axios.get(
        `${API_URL}/api/connection/accepted-connections/${storedId}`
      );

      const usersWithImages = res.data.map((user) => ({
        ...user,
        profileImage: user.profileImageUrl
          ? `${API_URL}${user.profileImageUrl}`
          : `https://picsum.photos/200/200?random=${Math.floor(
              Math.random() * 1000
            )}`,
      }));

      setUsers(usersWithImages);
    } catch (error) {
      console.error("❌ Failed to fetch accepted connections:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) fetchUsers();
  }, [isFocused]);

  const openChat = (otherUserId, otherUserName, profileImage) => {
    navigation.navigate("Chat", {
      otherUserId,
      otherUserName,
      otherUserProfileImage: profileImage,
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <FlatList
      data={users}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.chatItem}
          onPress={() => openChat(item._id, item.name, item.profileImage)}
        >
          <View style={styles.chatItemContainer}>
            {item.profileImageUrl ? (
              <Image
                source={{ uri: item.profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.initialsCircle}>
                <Text style={styles.initialsText}>
                  {item.name?.substring(0, 2).toUpperCase()}
                </Text>
              </View>
            )}

            <Text style={styles.name}>{item.name}</Text>
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={() => (
        <Text style={styles.emptyText}>No connections found</Text>
      )}
    />
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  chatItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },
  chatItemContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  name: {
    fontWeight: "bold",
    fontSize: 18,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
  },

  initialsCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  initialsText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default ChatListScreen;
