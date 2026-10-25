import { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppData } from "../../../context/AppDataContext";

export default function Settings() {
  const [nameInput, setNameInput] = useState("");

  const { resetAllData } = useAppData();

  function handleResetData() {
    Alert.alert(
      "Delete all app data?",
      "This permanently deletes every person and check-in saved in this app.",
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
      <Text style={styles.topText}>Settings</Text>
      <View style={styles.bar} />

      <TouchableOpacity onPress={handleResetData}>
        <Text style={styles.importantButtonText}>Delete All App Data</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6d3fa9",
    alignItems: "center",
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
  text: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
  },
  title: {
    color: "#ffffff",
    fontSize: 50,
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    color: "#ffffff",
    fontSize: 18,
    marginTop: 20,
  },

  buttonText: {
    color: "#ffffff",
    borderWidth: 3,
    borderColor: "#ffffff",
    borderRadius: 5,
    padding: 10,
    textAlign: "center",
    fontSize: 20,
    marginTop: 20,
    paddingHorizontal: 70,
  },
  input: {
    color: "#ffffff",
    fontSize: 18,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#ffffff",
    borderRadius: 5,
    padding: 10,
  },

  divider: {
    width: "90%",
    height: 2,
    backgroundColor: "#ffffff",
    marginVertical: 30,
  },

  personButton: {
    backgroundColor: "#ffffff",
    padding: 10,
    marginVertical: 6,
    borderRadius: 5,
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

  selectedPersonButton: {
    backgroundColor: "#4caf50",
    color: "#ffffff",
  },
  personButtonText: {
    color: "#000000",
    fontSize: 18,
  },
});
