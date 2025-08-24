import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

// npx expo start

export default function App() {
  return (
    <View style={styles.container}>
      <Text>NextFare</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
