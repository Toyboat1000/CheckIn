import { useAppData } from "@/context/AppDataContext";
import { generateReport } from "@/lib/ai";
import { sharePdf } from "@/lib/pdf";
import { buildReportSummary } from "@/lib/report";
import { buildReportHtml, reportToPlainText } from "@/lib/reportHtml";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Profile() {
  const {
    people,
    checkups,
    selectedPersonId,
    addPerson,
    selectPerson,
    isLoading,
    reports,
    addReport,
    deleteReport,
  } = useAppData();

  const selectedPerson = people.find(
    (person) => person.id === selectedPersonId,
  );

  const [nameInput, setNameInput] = useState("");

  const [openReportId, setOpenReportId] = useState<string | null>(null);

  // This person's saved reports, newest first
  const personReports = reports
    .filter((r) => r.personId === selectedPersonId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // The report on screen: the one tapped, otherwise the newest
  const openReport =
    personReports.find((r) => r.id === openReportId) ??
    personReports[0] ??
    null;

  const openReportText =
    openReport && selectedPerson
      ? reportToPlainText(openReport, selectedPerson.name)
      : "";

  // Older reports were saved as plain text and have no data for the PDF table
  const canMakePdf = Boolean(openReport?.sections && openReport?.summary);

  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  function handleAddPerson() {
    if (!nameInput.trim()) {
      alert("Please enter a name first.");
      return;
    }
    addPerson(nameInput);
    setNameInput("");
  }

  async function handleGenerateReport() {
    if (!selectedPerson) {
      alert("Please select a person first.");
      return;
    }

    const personCheckups = checkups.filter(
      (c) => c.personId === selectedPerson.id,
    );
    if (personCheckups.length === 0) {
      alert(`There are no check-ins for ${selectedPerson.name} yet.`);
      return;
    }

    setReportLoading(true);
    setReportError(null);

    try {
      const summary = buildReportSummary(checkups, selectedPerson);
      const sections = await generateReport(summary);
      const saved = addReport(selectedPerson.id, summary, sections);
      setOpenReportId(saved.id);
    } catch (error) {
      setReportError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setReportLoading(false);
    }
  }

  async function handleSharePdf() {
    if (!openReport?.sections || !openReport.summary) return;

    setPdfLoading(true);
    try {
      const html = buildReportHtml(
        openReport.summary,
        openReport.sections,
        openReport.createdAt,
      );
      await sharePdf(html);
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Could not create the PDF.",
      );
    } finally {
      setPdfLoading(false);
    }
  }

  async function handleSendText() {
    if (!openReportText) return;
    try {
      await Share.share({ message: openReportText });
    } catch (error) {
      alert("Could not open the share menu.");
    }
  }

  function handleDeleteReport(reportId: string) {
    Alert.alert("Delete report?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteReport(reportId);
          setOpenReportId(null);
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Loading people...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.topText}>Profile</Text>
        <View style={styles.bar} />

        <TextInput
          placeholder="Enter name"
          placeholderTextColor="#d9cdea"
          value={nameInput}
          onChangeText={setNameInput}
          style={styles.input}
        />
        <TouchableOpacity onPress={handleAddPerson}>
          <Text style={styles.buttonText}>Add Person</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={styles.text}>Select a person</Text>

        {people.length === 0 ? (
          <Text style={styles.text}>No people added yet.</Text>
        ) : (
          people.map((person) => {
            const isSelected = person.id === selectedPersonId;
            return (
              <TouchableOpacity
                key={person.id}
                style={[
                  styles.personButton,
                  isSelected && styles.selectedPersonButton,
                ]}
                onPress={() => selectPerson(person.id)}
              >
                <Text style={styles.personButtonText}>
                  {person.name}
                  {isSelected ? " ✓" : ""}
                </Text>
              </TouchableOpacity>
            );
          })
        )}

        <View style={styles.divider} />

        {/* AI report */}
        <Text style={styles.text}>Check-in report</Text>
        <Text style={styles.disclosure}>
          Check-in scores and notes are sent to Google Gemini to write this
          report.
        </Text>

        <TouchableOpacity
          onPress={handleGenerateReport}
          disabled={reportLoading}
        >
          <Text style={styles.buttonText}>
            {reportLoading
              ? "Writing report…"
              : openReport
                ? "Generate new report"
                : "Generate report"}
          </Text>
        </TouchableOpacity>

        {reportLoading && (
          <ActivityIndicator color="#ffffff" style={styles.spinner} />
        )}

        {reportError && <Text style={styles.errorText}>{reportError}</Text>}

        {openReport && (
          <>
            <Text style={styles.reportDate}>
              Generated {new Date(openReport.createdAt).toLocaleString()}
            </Text>

            <View style={styles.reportCard}>
              <Text style={styles.reportText} selectable>
                {openReportText}
              </Text>
            </View>

            {canMakePdf ? (
              <TouchableOpacity onPress={handleSharePdf} disabled={pdfLoading}>
                <Text style={styles.buttonText}>
                  {pdfLoading ? "Making PDF…" : "Share as PDF"}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.disclosure}>
                This older report can only be sent as text. Generate a new
                report to get a PDF.
              </Text>
            )}

            <TouchableOpacity onPress={handleSendText}>
              <Text style={styles.buttonText}>Send as text</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleDeleteReport(openReport.id)}>
              <Text style={styles.deleteText}>Delete this report</Text>
            </TouchableOpacity>
          </>
        )}

        {personReports.length > 1 && (
          <>
            <View style={styles.divider} />
            <Text style={styles.text}>Past reports</Text>

            {personReports.map((r) => {
              const isOpen = r.id === openReport?.id;
              return (
                <TouchableOpacity
                  key={r.id}
                  style={[
                    styles.personButton,
                    isOpen && styles.selectedPersonButton,
                  ]}
                  onPress={() => setOpenReportId(r.id)}
                >
                  <Text style={styles.personButtonText}>
                    {new Date(r.createdAt).toLocaleDateString()}
                    {isOpen ? " ✓" : ""}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6d3fa9",
  },
  content: {
    alignItems: "center",
    paddingBottom: 120,
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
    minWidth: 220,
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
  selectedPersonButton: {
    backgroundColor: "#4caf50",
  },
  personButtonText: {
    color: "#000000",
    fontSize: 18,
  },
  disclosure: {
    width: "85%",
    color: "#e8d8ff",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
  },
  spinner: {
    marginTop: 16,
  },
  errorText: {
    width: "85%",
    color: "#ffd6d6",
    fontSize: 14,
    textAlign: "center",
    marginTop: 14,
  },
  reportCard: {
    width: "90%",
    backgroundColor: "#e8d8ff",
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
  },
  reportText: {
    color: "#3d2163",
    fontSize: 15,
    lineHeight: 22,
  },
  reportDate: {
    color: "#e8d8ff",
    fontSize: 14,
    marginTop: 20,
  },
  deleteText: {
    color: "#ffd6d6",
    fontSize: 15,
    marginTop: 14,
    textDecorationLine: "underline",
  },
});
