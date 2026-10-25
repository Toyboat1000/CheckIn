import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppData } from "../../../context/AppDataContext";
import type { ReportCategory } from "../../../types/data";

import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

const FACES = [
  require("../../../assets/faces/very-sad.png"),
  require("../../../assets/faces/sad.png"),
  require("../../../assets/faces/neutral.png"),
  require("../../../assets/faces/happy.png"),
  require("../../../assets/faces/very-happy.png"),
];

const REPORTS: ReportCategory[] = [
  "Memory",
  "Speech",
  "Mobility",
  "Conversation",
];

export default function MainView() {
  type Report = ReportCategory;

  const { people, selectedPersonId, addCheckup, isLoading } = useAppData();

  const router = useRouter();

  const selectedPerson = people.find(
    (person) => person.id === selectedPersonId,
  );

  const [activeReport, setActiveReport] = useState<Report | null>(null);

  // drafts only... until saved
  const [selectedFaces, setSelectedFaces] = useState<
    Record<Report, number | null>
  >({
    Memory: null,
    Speech: null,
    Mobility: null,
    Conversation: null,
  });

  const [notes, setNotes] = useState<Record<Report, string>>({
    Memory: "",
    Speech: "",
    Mobility: "",
    Conversation: "",
  });

  function reportIsComplete(report: Report) {
    return selectedFaces[report] !== null;
  }

  const completedCount = REPORTS.filter(reportIsComplete).length;
  const allReportsComplete = completedCount === REPORTS.length;

  function submitDailyReport() {
    if (!selectedPerson) {
      alert("Please add and select a person in Settings first.");
      return;
    }

    const incompleteReports = REPORTS.filter(
      (report) => !reportIsComplete(report),
    );

    if (incompleteReports.length > 0) {
      alert(`Please choose a face for: ${incompleteReports.join(", ")}`);
      return;
    }

    REPORTS.forEach((report) => {
      addCheckup(report, selectedFaces[report]!, notes[report]);
    });

    alert("Report Saved Successfully!");

    setActiveReport(null);

    setSelectedFaces({
      Memory: null,
      Speech: null,
      Mobility: null,
      Conversation: null,
    });

    setNotes({
      Memory: "",
      Speech: "",
      Mobility: "",
      Conversation: "",
    });
  }

  useEffect(() => {
    if (!isLoading && !selectedPerson) {
      router.replace("/profile");
    }
  }, [isLoading, selectedPerson, router]);

  if (isLoading || !selectedPerson) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.dateText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.mainView}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.push("/settings")}
            accessibilityLabel="Settings"
            hitSlop={10}
          >
            <Ionicons name="settings-outline" size={35} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/profile")}
            accessibilityLabel="Profile"
            hitSlop={10}
          >
            <Ionicons name="person-circle-outline" size={35} color="#ffffff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.dateText}>
          {selectedPerson
            ? `Checking in for ${selectedPerson.name}`
            : "No person selected"}
        </Text>

        <View style={styles.bar} />

        <View style={styles.reportButtons}>
          {REPORTS.map((report) => (
            <TouchableOpacity
              key={report}
              style={[
                styles.button,
                reportIsComplete(report) && styles.completedButton,
                activeReport === report && styles.activeButton,
              ]}
              onPress={() => setActiveReport(report)}
            >
              <Text style={styles.buttonText}>{report}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.reportContainer}>
          <Text style={styles.activeReportItem}>
            {activeReport ?? "Select a category"}
          </Text>

          <View style={styles.reportBar} />

          <View style={styles.faceRow}>
            {FACES.map((face, index) => (
              <TouchableOpacity
                key={index}
                style={styles.faceButton}
                onPress={() => {
                  if (activeReport === null) {
                    alert("Please select a category first.");
                    return;
                  }

                  setSelectedFaces((currentFaces) => ({
                    ...currentFaces,
                    [activeReport]: index,
                  }));
                }}
              >
                <Image
                  source={face}
                  style={[
                    styles.faceImage,
                    activeReport !== null &&
                      selectedFaces[activeReport] === index &&
                      styles.selectedFace,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>
            Notes for {activeReport ?? "selected category"}:
          </Text>

          <TextInput
            style={styles.notesInput}
            placeholder="Enter your notes here..."
            placeholderTextColor="#d9cdea"
            multiline
            editable={activeReport !== null}
            value={activeReport !== null ? notes[activeReport] : ""}
            onChangeText={(text) => {
              if (activeReport === null) return;

              setNotes((currentNotes) => ({
                ...currentNotes,
                [activeReport]: text,
              }));
            }}
          />
        </View>

        <View style={styles.submitReport}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              !allReportsComplete && styles.disabledSubmitButton,
            ]}
            onPress={submitDailyReport}
            disabled={!allReportsComplete}
          >
            <Text style={styles.submitButtonText}>
              {allReportsComplete
                ? "Submit Check-In"
                : `${completedCount}/4 Completed`}
            </Text>
          </TouchableOpacity>

          {!allReportsComplete ? (
            <Text style={styles.helpText}>
              Choose one face in every category to submit.
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6d3fa9",
  },

  mainView: {
    flexGrow: 1,
    alignItems: "center",
    paddingBottom: 110,
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

  dateText: {
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
  },

  progressText: {
    color: "#ffffff",
    fontSize: 16,
    marginTop: 18,
  },

  reportButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "98%",
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ffffff",
    padding: 10,
    gap: 10,
  },

  button: {
    width: "48%",
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#7ecf9a",
    marginBottom: 5,
    marginTop: 5,
  },

  activeButton: {
    borderWidth: 3,
    borderColor: "#ffffff",
  },

  completedButton: {
    backgroundColor: "#e5e8e5",
  },

  buttonText: {
    color: "#0e0e0e",
    fontSize: 16,
    fontWeight: "bold",
  },

  reportContainer: {
    width: "98%",
    height: 150,
    borderWidth: 2,
    borderColor: "#ffffff",
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
    position: "relative",
  },

  activeReportItem: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 15,
  },

  reportBar: {
    position: "absolute",
    top: "55%",
    left: "5%",
    width: "90%",
    height: 4,
    backgroundColor: "#000000",
    borderRadius: 1,
    marginTop: -2,
  },

  faceRow: {
    position: "absolute",
    top: "55%",
    left: "5%",
    width: "90%",
    marginTop: -20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  faceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  faceImage: {
    width: 50,
    height: 50,
  },

  selectedFace: {
    width: 65,
    height: 65,
  },

  notesContainer: {
    width: "98%",
    height: 150,
    borderWidth: 2,
    borderColor: "#ffffff",
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },

  notesLabel: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
  },

  notesInput: {
    width: "90%",
    height: 75,
    borderWidth: 1,
    borderColor: "#ffffff",
    borderRadius: 10,
    marginTop: 10,
    padding: 10,
    color: "#ffffff",
    textAlignVertical: "top",
  },

  submitReport: {
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  submitButton: {
    width: 265,
    minHeight: 55,
    backgroundColor: "#7ecf9a",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 12,
  },

  disabledSubmitButton: {
    backgroundColor: "#a99ab8",
  },

  submitButtonText: {
    color: "#0e0e0e",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },

  helpText: {
    color: "#ffffff",
    fontSize: 14,
    marginTop: 10,
  },

  settingsIcon: {
    position: "absolute",
    left: 130,
  },

  profileIcon: {
    position: "absolute",
    right: 130,
  },
});
