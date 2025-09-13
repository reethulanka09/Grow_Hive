import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import LottieView from "lottie-react-native";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import {
  useFonts,
  Poppins_700Bold,
  Poppins_400Regular,
  Poppins_600SemiBold,
} from "@expo-google-fonts/poppins";
import { IP } from "../Config/config";

// You likely have this defined in a central 'constants.js' or similar.
// If not, it's fine to keep it here.
const COLORS = {
  primary: "#34e3b0",
  secondary: "#2563eb",
  accent: "#F472B6",
  background: "#f4faff",
  card: "#fff",
  text: "#23272F",
  muted: "#6b7280",
  shadow: "#e0e7ef",
  logoBlue: "#2563eb",
  logoGreen: "#34e3b0",
};

// IMPORTANT: Ensure this API_BASE_URL matches your backend's base URL
const API_BASE_URL = `${IP}/api/auth`; // Your backend API base URL

const ChangePasswordScreen = () => {
  const navigation = useNavigation();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  let [fontsLoaded] = useFonts({
    Poppins_700Bold,
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  const handleChangePassword = async () => {
    // --- Input Validation ---
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Validation Error", "All fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Validation Error", "New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert(
        "Validation Error",
        "New password must be at least 6 characters long."
      );
      return;
    }
    if (oldPassword === newPassword) {
      Alert.alert(
        "Validation Error",
        "New password cannot be the same as the old password."
      );
      return;
    }

    setLoading(true);
    console.log("ChangePasswordScreen: Attempting to change password...");
    try {
      const userToken = await SecureStore.getItemAsync("userToken");

      if (!userToken) {
        console.warn(
          "ChangePasswordScreen: No user token found. Redirecting to login."
        );
        Alert.alert(
          "Authentication Required",
          "Your session has expired. Please log in again."
        );
        await SecureStore.deleteItemAsync("userToken"); // Clear any lingering token
        setTimeout(() => navigation.replace("Login"), 100);
        return;
      }

      console.log(
        `ChangePasswordScreen: Sending PUT request to ${API_BASE_URL}/users/change-password`
      );
      const response = await axios.put(
        `${API_BASE_URL}/users/change-password`,
        {
          oldPassword,
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log(
        "ChangePasswordScreen: Password change successful response:",
        response.data
      );
      Alert.alert(
        "Success",
        response.data.message || "Password changed successfully!"
      );

      // Clear input fields after successful change
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Navigate back to the profile screen or a confirmation screen
      navigation.goBack();
    } catch (error) {
      console.error(
        "ChangePasswordScreen: Failed to change password:",
        error.response ? error.response.data : error.message
      );
      let errorMessage = "Failed to change password. Please try again.";

      if (error.response) {
        if (error.response.status === 401) {
          if (error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message; // e.g., "Invalid old password" or "Not authorized"
          } else {
            errorMessage = "Authentication error. Please log in again.";
          }
          // For 401, always clear token and redirect to login
          await SecureStore.deleteItemAsync("userToken");
          setTimeout(() => navigation.replace("Login"), 100);
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = `Server Error: ${error.response.status}`;
        }
      } else if (error.request) {
        // The request was made but no response was received (e.g., network down)
        errorMessage = "Network error. Please check your internet connection.";
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = `Error: ${error.message}`;
      }
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text
          style={{
            fontFamily: "Poppins_400Regular",
            marginTop: 10,
            color: COLORS.text,
          }}
        >
          Loading fonts...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LottieView
        source={require("../assets/password-lock.json")} // Ensure this path is correct
        autoPlay
        loop
        style={styles.animation}
      />

      <Text style={styles.title}>Change Password</Text>

      <TextInput
        style={styles.input}
        placeholder="Old Password"
        placeholderTextColor={COLORS.muted}
        secureTextEntry
        onChangeText={setOldPassword}
        value={oldPassword}
        autoCapitalize="none"
        editable={!loading} // Disable input when loading
      />
      <TextInput
        style={styles.input}
        placeholder="New Password"
        placeholderTextColor={COLORS.muted}
        secureTextEntry
        onChangeText={setNewPassword}
        value={newPassword}
        autoCapitalize="none"
        editable={!loading} // Disable input when loading
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm New Password"
        placeholderTextColor={COLORS.muted}
        secureTextEntry
        onChangeText={setConfirmPassword}
        value={confirmPassword}
        autoCapitalize="none"
        editable={!loading} // Disable input when loading
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleChangePassword}
        disabled={loading} // Disable button when loading
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Update Password</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default ChangePasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    backgroundColor: COLORS.background,
    paddingTop: 50,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  animation: {
    width: 180,
    height: 180,
    alignSelf: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    color: "#0D2A64",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#aaa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: COLORS.card,
    color: COLORS.text,
    fontFamily: "Poppins_400Regular",
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
  },
});
