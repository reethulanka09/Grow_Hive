import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Alert,
  Image,
  Pressable,
  Dimensions,
  SafeAreaView,
  Platform,
  StatusBar,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import socket from "../utils/socket";
import axios from "axios";
import { IP } from "../Config/config";

const API_URL = `${IP}`;
const { width, height } = Dimensions.get("window");

const COLORS = {
  primary: "#34e3b0",
  secondary: "#34e3b0",
  background: "#f6fbfa",
  ownMessage: "#E8F4EA",
  otherMessage: "#FFFFFF",
  recording: "#34e3b0",
};

export default function ChatScreen({ navigation, route }) {
  const { otherUserId, otherUserName } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioPermission, setAudioPermission] = useState(false);
  const [sound, setSound] = useState(null);
  const [playingMessageId, setPlayingMessageId] = useState(null);
  const [playbackPosition, setPlaybackPosition] = useState({});
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const flatRef = useRef(null);
  const recordingTimer = useRef(null);
  const isStartingOrStopping = useRef(false);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Text style={styles.headerTitle}>{otherUserName}</Text>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          style={{ paddingRight: 12 }}
        >
          <Ionicons name="ellipsis-vertical" size={24} color="white" />
        </TouchableOpacity>
      ),
      headerStyle: { backgroundColor: COLORS.primary },
      headerTintColor: "white",
    });
  }, [otherUserName, navigation]);

  const scrollToBottom = useCallback(() => {
    if (flatRef.current && messages.length > 0) {
      setTimeout(() => {
        flatRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  useEffect(() => {
    const init = async () => {
      const id = (await AsyncStorage.getItem("currentUserId")) || "user1";
      setCurrentUserId(id);

      await setupAudio();

      socket.connect();
      socket.emit("setup", id);

      socket.on("receiveMessage", (msg) => {
        if (msg.senderId === otherUserId && msg.receiverId === id) {
          setMessages((prev) => [...prev, msg]);
        }
      });

      try {
        const res = await axios.get(
          `${API_URL}/api/messages/history/${id}/${otherUserId}`
        );
        setMessages(res.data);
      } catch (error) {
        console.error("Error fetching messages:", error);
        Alert.alert("Error", "Failed to load message history.");
      }
    };
    init();

    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setTimeout(scrollToBottom, 100);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      socket.off("receiveMessage");
      socket.disconnect();
      if (recordingTimer.current) clearInterval(recordingTimer.current);
      if (recording) recording.stopAndUnloadAsync().catch(() => {});
      if (sound) sound.unloadAsync().catch(() => {});
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [otherUserId, scrollToBottom]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const setupAudio = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setAudioPermission(status === "granted");

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Microphone access is required for voice messages. Please enable it in Settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error("Audio setup error:", error.message);
      Alert.alert(
        "Error",
        "Failed to initialize audio. Please check your microphone and try again."
      );
    }
  };

  const uploadAudio = async (audioUri, messageId) => {
    if (!audioUri || !messageId) {
      console.error("Invalid audio URI or message ID:", {
        audioUri,
        messageId,
      });
      Alert.alert("Error", "Invalid audio file.");
      return null;
    }

    try {
      const formData = new FormData();
      formData.append("audio", {
        uri: audioUri,
        name: `audio-${messageId}.m4a`,
        type: "audio/m4a",
      });

      const uploadRes = await axios.post(
        `${API_URL}/api/upload-audio`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 30000,
        }
      );

      if (!uploadRes.data.url) {
        throw new Error("No URL returned from server");
      }

      return uploadRes.data.url;
    } catch (error) {
      console.error(
        "Audio upload error:",
        error.response?.data || error.message
      );
      Alert.alert(
        "Error",
        "Failed to upload audio. Please check your network and try again."
      );
      return null;
    }
  };

  // New function to upload documents
  const uploadDocument = async (documentUri, fileName, messageId) => {
    const formData = new FormData();
    formData.append("document", {
      uri: documentUri,
      name: fileName,
      type: "application/octet-stream",
    });

    try {
      const uploadRes = await axios.post(
        `${API_URL}/api/upload-document`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return uploadRes.data.url;
    } catch (error) {
      console.error(
        "Error uploading document:",
        error.response?.data || error.message
      );
      Alert.alert("Error", "Failed to upload document file.");
      return null;
    }
  };

  // Function to open document in browser
  const openDocumentInBrowser = async (documentUrl, fileName) => {
    try {
      // Check if the URL can be opened
      const supported = await Linking.canOpenURL(documentUrl);

      if (supported) {
        await Linking.openURL(documentUrl);
      } else {
        const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
          documentUrl
        )}`;
        const canOpenGoogleDocs = await Linking.canOpenURL(googleDocsUrl);

        if (canOpenGoogleDocs) {
          await Linking.openURL(googleDocsUrl);
        } else {
          Alert.alert(
            "Error",
            "Cannot open this document. Please install a PDF viewer app."
          );
        }
      }
    } catch (error) {
      console.error("Error opening document:", error);
      Alert.alert("Error", "Failed to open document.");
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const payload = {
      id: Date.now().toString(),
      senderId: currentUserId,
      receiverId: otherUserId,
      text: newMessage,
      type: "text",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, payload]);
    setNewMessage("");
    socket.emit("sendMessage", payload);

    try {
      await axios.post(`${API_URL}/api/messages/send`, payload);
    } catch (error) {
      console.error("Error sending message payload:", error);
      Alert.alert("Error", "Failed to send message. Please try again.");
    }
  };

  const sendImage = async (source = "gallery") => {
    try {
      // Check permissions
      const permissionType = source === "camera" ? "camera" : "mediaLibrary";
      const permissionResult = await ImagePicker[
        `request${
          permissionType.charAt(0).toUpperCase() + permissionType.slice(1)
        }PermissionsAsync`
      ]();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Denied",
          `Please enable ${source} access in Settings.`
        );
        return;
      }

      let result;
      if (source === "camera") {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets.length > 0) {
        const img = result.assets[0];
        const payload = {
          id: Date.now().toString(),
          senderId: currentUserId,
          receiverId: otherUserId,
          text: img.uri,
          type: "image",
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, payload]);
        socket.emit("sendMessage", payload);
        await axios.post(`${API_URL}/api/messages/send`, payload);
      }
    } catch (error) {
      console.error(
        `Error ${source === "camera" ? "capturing" : "selecting"} image:`,
        error
      );
      Alert.alert(
        "Error",
        `Failed to ${
          source === "camera" ? "capture" : "select"
        } image. Please try again.`
      );
    }
  };

  const sendDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const file = result.assets[0];
        const messageId = Date.now().toString();

        // Upload document to server and get public URL
        const publicDocumentUrl = await uploadDocument(
          file.uri,
          file.name,
          messageId
        );

        if (!publicDocumentUrl) {
          Alert.alert("Error", "Failed to upload document. Message not sent.");
          return;
        }

        const payload = {
          id: messageId,
          senderId: currentUserId,
          receiverId: otherUserId,
          text: publicDocumentUrl, // Store the public URL
          type: "document",
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.mimeType,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, payload]);
        socket.emit("sendMessage", payload);

        try {
          await axios.post(`${API_URL}/api/messages/send`, payload);
        } catch (error) {
          console.error("Error sending document message:", error);
          Alert.alert("Error", "Failed to save document message.");
        }
      }
    } catch (error) {
      console.error("Error sending document:", error);
      Alert.alert("Error", "Failed to send document. Please try again.");
    }
  };

  const startRecording = async () => {
    if (!audioPermission) {
      Alert.alert(
        "Permission Denied",
        "Microphone access is required to record voice messages."
      );
      return;
    }

    if (isStartingOrStopping.current || isRecording) {
      return;
    }

    isStartingOrStopping.current = true;

    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
        setPlayingMessageId(null);
      }

      if (recording) {
        try {
          await recording.stopAndUnloadAsync();
        } catch (err) {
          console.error("Error cleaning up previous recording:", err);
        }
        setRecording(null);
      }

      setIsRecording(true);
      setRecordingDuration(0);

      const recordingOptions = {
        android: {
          extension: ".m4a",
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: ".m4a",
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
      };
      const { recording: newRecording } = await Audio.Recording.createAsync(
        recordingOptions
      );
      setRecording(newRecording);
      recordingTimer.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Recording failed to start:", error);
      Alert.alert("Error", "Failed to start recording.");
      setIsRecording(false);
      setRecording(null);
      setRecordingDuration(0);
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
    } finally {
      isStartingOrStopping.current = false;
    }
  };

  const stopRecording = async () => {
    if (isStartingOrStopping.current || !recording) {
      setIsRecording(false);
      setRecording(null);
      setRecordingDuration(0);
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
      isStartingOrStopping.current = false;
      return;
    }

    isStartingOrStopping.current = true;

    try {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }

      const uri = recording.getURI();
      await recording.stopAndUnloadAsync();
      setRecording(null);

      if (uri && recordingDuration >= 1) {
        const messageId = Date.now().toString();
        const publicAudioUrl = await uploadAudio(uri, messageId);

        if (!publicAudioUrl) {
          Alert.alert("Error", "Failed to upload audio. Message not sent.");
          return;
        }

        const payload = {
          id: messageId,
          senderId: currentUserId,
          receiverId: otherUserId,
          text: publicAudioUrl,
          type: "audio",
          duration: recordingDuration,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, payload]);
        socket.emit("sendMessage", payload);

        try {
          await axios.post(`${API_URL}/api/messages/send`, payload);
        } catch (error) {
          console.error("Error sending voice message payload:", error);
          Alert.alert("Error", "Failed to save voice message.");
        }
      } else {
        Alert.alert(
          "Recording Too Short",
          "Voice message must be at least 1 second long."
        );
      }
    } catch (error) {
      console.error("Error during stop recording or sending:", error);
      Alert.alert("Error", "Failed to stop recording or send voice message.");
    } finally {
      setIsRecording(false);
      setRecording(null);
      setRecordingDuration(0);
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
      isStartingOrStopping.current = false;
    }
  };

  const toggleVoicePlayback = async (audioUri, messageId) => {
    if (!audioUri || typeof audioUri !== "string") {
      Alert.alert("Error", "Invalid audio file.");
      return;
    }

    try {
      if (playingMessageId === messageId && sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await sound.pauseAsync();
          setPlayingMessageId(null);
          return;
        }
      }
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true, isLooping: false }
      );
      setSound(newSound);
      setPlayingMessageId(messageId);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.didJustFinish) {
            setPlayingMessageId(null);
            setPlaybackPosition((prev) => ({ ...prev, [messageId]: 0 }));
          } else if (status.isPlaying) {
            const position = Math.floor(status.positionMillis / 1000);
            setPlaybackPosition((prev) => ({ ...prev, [messageId]: position }));
          }
        }
      });
    } catch (error) {
      console.error("Voice playback failed:", error);
      Alert.alert("Playback Error", "Failed to play audio.");
    }
  };

  const openImageModal = (imageUri) => {
    setSelectedImage(imageUri);
    setImageModalVisible(true);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate()} ${date.toLocaleString("default", {
      month: "short",
    })}, ${date.getFullYear()}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (fileName, mimeType) => {
    if (!fileName && !mimeType) return "document";

    const extension = fileName ? fileName.split(".").pop().toLowerCase() : "";
    const type = mimeType ? mimeType.toLowerCase() : "";

    if (extension === "pdf" || type.includes("pdf")) return "document-text";
    if (["doc", "docx"].includes(extension) || type.includes("word"))
      return "document-text";
    if (["xls", "xlsx"].includes(extension) || type.includes("sheet"))
      return "grid";
    if (["ppt", "pptx"].includes(extension) || type.includes("presentation"))
      return "easel";
    if (
      ["jpg", "jpeg", "png", "gif"].includes(extension) ||
      type.includes("image")
    )
      return "image";
    if (["mp4", "avi", "mov"].includes(extension) || type.includes("video"))
      return "videocam";
    if (["mp3", "wav", "aac"].includes(extension) || type.includes("audio"))
      return "musical-notes";
    if (["zip", "rar", "7z"].includes(extension) || type.includes("zip"))
      return "archive";

    return "document";
  };

  const renderMessage = useCallback(
    ({ item, index }) => {
      const isOwnMessage = item.senderId === currentUserId;
      const isPlaying = playingMessageId === item.id;
      const currentPosition = playbackPosition[item.id] || 0;
      const messageId = item.id || index.toString();

      const showDate =
        index === 0 ||
        new Date(item.createdAt).toDateString() !==
          new Date(messages[index - 1]?.createdAt).toDateString();

      return (
        <View>
          {showDate && (
            <View style={styles.dateContainer}>
              <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
            </View>
          )}

          <View
            style={[
              styles.messageContainer,
              isOwnMessage
                ? styles.ownMessageContainer
                : styles.otherMessageContainer,
            ]}
          >
            <Pressable
              onLongPress={() => console.log("Long pressed message:", item.id)}
            >
              <View
                style={[
                  styles.messageBubble,
                  isOwnMessage ? styles.ownMessage : styles.otherMessage,
                ]}
              >
                {item.type === "image" ? (
                  <TouchableOpacity onPress={() => openImageModal(item.text)}>
                    <Image
                      source={{ uri: item.text }}
                      style={styles.imageMessage}
                    />
                  </TouchableOpacity>
                ) : item.type === "audio" ? (
                  <TouchableOpacity
                    onPress={() => toggleVoicePlayback(item.text, messageId)}
                    style={styles.voiceMessage}
                  >
                    <View
                      style={[
                        styles.playButton,
                        isOwnMessage
                          ? styles.playButtonOwn
                          : styles.playButtonOther,
                      ]}
                    >
                      <Ionicons
                        name={isPlaying ? "pause" : "play"}
                        size={20}
                        color={isOwnMessage ? COLORS.primary : "white"}
                      />
                    </View>

                    <View style={styles.voiceInfo}>
                      <View style={styles.waveform}>
                        {[...Array(20)].map((_, i) => (
                          <View
                            key={i}
                            style={[
                              styles.waveBar,
                              {
                                height: Math.random() * 20 + 8,
                                backgroundColor: isOwnMessage
                                  ? "#25D366"
                                  : "#128C7E",
                                opacity:
                                  isPlaying &&
                                  (currentPosition / (item.duration || 1)) *
                                    20 >
                                    i
                                    ? 1
                                    : 0.4,
                              },
                            ]}
                          />
                        ))}
                      </View>

                      <Text
                        style={[
                          styles.voiceTime,
                          { color: isOwnMessage ? "#25D366" : "#666" },
                        ]}
                      >
                        {isPlaying
                          ? formatDuration(currentPosition)
                          : formatDuration(item.duration || 0)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ) : item.type === "document" ? (
                  <TouchableOpacity
                    style={styles.documentMessage}
                    onPress={() =>
                      openDocumentInBrowser(item.text, item.fileName)
                    }
                  >
                    <View style={styles.documentIconContainer}>
                      <Ionicons
                        name={getFileIcon(item.fileName, item.mimeType)}
                        size={24}
                        color={isOwnMessage ? COLORS.primary : COLORS.secondary}
                      />
                    </View>
                    <View style={styles.documentInfo}>
                      <Text
                        style={[
                          styles.documentName,
                          { color: isOwnMessage ? "#000" : "#000" },
                        ]}
                        numberOfLines={2}
                      >
                        {item.fileName || "Document"}
                      </Text>
                      {item.fileSize && (
                        <Text
                          style={[
                            styles.documentSize,
                            { color: isOwnMessage ? "#666" : "#666" },
                          ]}
                        >
                          {formatFileSize(item.fileSize)}
                        </Text>
                      )}
                      <Text
                        style={[
                          styles.documentHint,
                          { color: isOwnMessage ? "#888" : "#888" },
                        ]}
                      >
                        Tap to open in browser
                      </Text>
                    </View>
                    <View style={styles.documentArrow}>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={isOwnMessage ? "#666" : "#666"}
                      />
                    </View>
                  </TouchableOpacity>
                ) : (
                  <Text
                    style={[
                      styles.messageText,
                      { color: isOwnMessage ? "#000" : "#000" },
                    ]}
                  >
                    {item.text}
                  </Text>
                )}

                <Text
                  style={[
                    styles.messageTime,
                    { color: isOwnMessage ? "#666" : "#999" },
                  ]}
                >
                  {formatTime(item.createdAt)}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      );
    },
    [currentUserId, playingMessageId, playbackPosition, messages]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.mainContainer, { marginBottom: keyboardHeight }]}>
        <FlatList
          ref={flatRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => item.id || index.toString()}
          style={styles.messagesList}
          contentContainerStyle={{
            paddingVertical: 10,
            paddingHorizontal: 8,
            paddingBottom: 80, // Space for input container
          }}
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
        />

        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>
              Recording... {formatDuration(recordingDuration)}
            </Text>
            <Text style={styles.recordingHint}>Release to send</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TouchableOpacity onPress={sendImage} style={styles.attachButton}>
              <Ionicons name="image" size={24} color={COLORS.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={sendDocument}
              style={styles.attachButton}
            >
              <Ionicons name="attach" size={24} color={COLORS.secondary} />
            </TouchableOpacity>

            <TextInput
              style={styles.textInput}
              placeholder="Type a message"
              placeholderTextColor="#999"
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={1000}
              onFocus={scrollToBottom}
            />

            {newMessage.trim() ? (
              <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
                <Ionicons name="send" size={20} color="white" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPressIn={startRecording}
                onPressOut={stopRecording}
                style={[
                  styles.micButton,
                  isRecording && styles.micButtonActive,
                ]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isRecording ? "stop" : "mic"}
                  size={24}
                  color={isRecording ? "white" : COLORS.primary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.imageModalContainer}>
          <StatusBar backgroundColor="black" barStyle="light-content" />
          <TouchableOpacity
            style={styles.imageModalClose}
            onPress={() => setImageModalVisible(false)}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
          <Image
            source={{ uri: selectedImage }}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
        </View>
      </Modal>

      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.menuOverlay}
          onPress={() => setMenuVisible(false)}
        />
        <View style={styles.menuBox}>
          {["Search", "Clear Chat", "Mute Notifications", "Block"].map(
            (item) => (
              <TouchableOpacity
                key={item}
                style={styles.menuItem}
                onPress={() => {
                  if (item === "Clear Chat") {
                    Alert.alert(
                      "Clear Chat",
                      "Are you sure you want to clear all messages from this chat?",
                      [
                        { text: "Cancel", style: "cancel" },
                        { text: "Clear", onPress: () => setMessages([]) },
                      ]
                    );
                  }
                  setMenuVisible(false);
                }}
              >
                <Text style={styles.menuText}>{item}</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mainContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
  // Remove the unnecessary style definitions that I added
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContentContainer: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  dateContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
  dateText: {
    backgroundColor: "rgba(0,0,0,0.1)",
    color: "#666",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "500",
  },
  messageContainer: {
    marginVertical: 2,
    paddingHorizontal: 8,
  },
  ownMessageContainer: {
    alignItems: "flex-end",
  },
  otherMessageContainer: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: width * 0.75,
    padding: 12,
    borderRadius: 18,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  ownMessage: {
    backgroundColor: COLORS.ownMessage,
    borderBottomRightRadius: 6,
  },
  otherMessage: {
    backgroundColor: COLORS.otherMessage,
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    textAlign: "right",
  },
  imageMessage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    resizeMode: "cover",
  },
  voiceMessage: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    width: 200,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  playButtonOwn: {
    backgroundColor: "white",
  },
  playButtonOther: {
    backgroundColor: COLORS.primary,
  },
  voiceInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  waveform: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    height: 20,
    marginRight: 8,
  },
  waveBar: {
    width: 2,
    marginHorizontal: 1,
    borderRadius: 1,
  },
  voiceTime: {
    fontSize: 12,
    fontWeight: "500",
    minWidth: 35,
    textAlign: "right",
  },
  documentMessage: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    height: 100,
    backgroundColor: "rgba(52, 227, 176, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(52, 227, 176, 0.2)",
  },
  documentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(52, 227, 176, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  documentSize: {
    fontSize: 12,
    marginBottom: 2,
  },
  documentHint: {
    fontSize: 11,
    fontStyle: "italic",
  },
  documentArrow: {
    marginLeft: 8,
  },
  inputContainer: {
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    paddingBottom: Platform.OS === "ios" ? 25 : 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  attachButton: {
    padding: 8,
    marginRight: 4,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: "#F8F8FA",
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  micButton: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  micButtonActive: {
    backgroundColor: COLORS.recording,
    borderColor: COLORS.recording,
  },
  recordingIndicator: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 60,

    backgroundColor: "rgba(52, 227, 176, 0.95)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "red",
    marginRight: 8,
  },
  recordingText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 16,
  },
  recordingHint: {
    color: "white",
    fontSize: 12,
    opacity: 0.8,
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalClose: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
  fullScreenImage: {
    width: width,
    height: height,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  menuBox: {
    position: "absolute",
    top: 100,
    right: 20,
    backgroundColor: "white",
    borderRadius: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    minWidth: 150,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  menuText: {
    fontSize: 16,
    color: "#333",
  },
});
