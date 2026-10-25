import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppData } from "../../../context/AppDataContext";

export default function Settings() {
  const router = useRouter();

  const { resetAllData } = useAppData();

  function handleResetData() {
    Alert.alert(
      "Delete all app data?",
      "This permanently deletes every person, check-in and report saved in this app.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: resetAllData,
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.navigate("/")}
            accessibilityLabel="Home"
            hitSlop={10}
          >
            <Ionicons name="home-outline" size={35} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.navigate("/profile")}
            accessibilityLabel="Profile"
            hitSlop={10}
          >
            <Ionicons name="person-circle-outline" size={35} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.topText}>Settings</Text>
        <View style={styles.bar} />

        <TouchableOpacity onPress={handleResetData}>
          <Text style={styles.importantButtonText}>Delete All App Data</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6d3fa9",
  },
  content: {
    flex: 1,
    width: "100%",
    alignItems: "center",
  },
  headerRow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 260,
    zIndex: 10,
  },
  topText: {
    fontSize: 24,
    color: "#fff",
    paddingTop: 30,
    paddingBottom: 10,
    textAlign: "center",
    fontWeight: "bold",
  },
  bar: {
    width: "90%",
    height: 1.5,
    backgroundColor: "#ffffff",
    borderRadius: 1,
    marginBottom: 10,
  },
  importantButtonText: {
    color: "#ffffff",
    backgroundColor: "#ff4d4d",
    borderWidth: 3,
    borderColor: "#ffffff",
    borderRadius: 5,
    padding: 10,
    textAlign: "center",
    fontSize: 20,
    marginTop: 20,
    paddingHorizontal: 70,
  },
});
