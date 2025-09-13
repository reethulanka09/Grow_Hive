import React from "react";
import { View, Text, StyleSheet } from "react-native";

const FAQScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Frequently Asked Questions</Text>
    </View>
  );
};

export default FAQScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 18,
  },
});
