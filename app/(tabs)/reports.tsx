import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import {
  Image,
  LayoutAnimation,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppData } from "../../context/AppDataContext";
import type { Checkup } from "../../types/data";

const FACES = [
  require("../../assets/faces/very-sad.png"),
  require("../../assets/faces/sad.png"),
  require("../../assets/faces/neutral.png"),
  require("../../assets/faces/happy.png"),
  require("../../assets/faces/very-happy.png"),
];

export default function Reports() {
  const { people, selectedPersonId, checkups } = useAppData();

  const [openDate, setOpenDate] = useState<string | null>(null);

  const selectedPerson = people.find(
    (person) => person.id === selectedPersonId,
  );

  const selectedPersonCheckups = checkups.filter(
    (checkup) => checkup.personId === selectedPersonId,
  );

  const checkupsByDate = selectedPersonCheckups.reduce<
    Record<string, Checkup[]>
  >((groups, checkup) => {
    const date = checkup.reportDate;

    if (!groups[date]) {
      groups[date] = [];
    }

    groups[date].push(checkup);

    return groups;
  }, {});

  const reportDates = Object.keys(checkupsByDate).sort().reverse();

  function toggleDate(date: string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenDate((current) => (current === date ? null : date));
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainView}>
        <Text style={styles.text}>
          Check-Ins for{" "}
          {selectedPerson ? selectedPerson.name : "No One Selected"}
        </Text>

        <View style={styles.bar} />

        <ScrollView
          style={styles.reportContainer}
          contentContainerStyle={styles.scrollContent}
        >
          {reportDates.map((date) => {
            const isOpen = openDate === date;
            const dateCheckups = checkupsByDate[date];

            return (
              <View key={date} style={styles.checkupCard}>
                <TouchableOpacity
                  style={styles.cardHeader}
                  onPress={() => toggleDate(date)}
                  activeOpacity={0.7}
                >
                  <View>
                    <Text style={styles.checkupText}>Report for {date}</Text>
                    <Text style={styles.checkupNotes}>
                      {dateCheckups.length} category check-in(s)
                    </Text>
                  </View>

                  <Ionicons
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={22}
                    color="#222222"
                  />
                </TouchableOpacity>

                {isOpen && (
                  <View style={styles.cardBody}>
                    {dateCheckups.map((checkup) => (
                      <View key={checkup.id} style={styles.categoryRow}>
                        <Text style={styles.category}>{checkup.category}</Text>

                        <Image
                          source={FACES[checkup.rating]}
                          style={styles.faceImage}
                        />

                        <Text style={styles.ratingText}>
                          {checkup.rating + 1}/5
                        </Text>

                        {checkup.notes ? (
                          <Text style={styles.notesText}>{checkup.notes}</Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6d3fa9",
    alignItems: "center",
    justifyContent: "flex-start",
  },

  mainView: {
    flex: 1,
    alignItems: "center",
    width: "100%",
    paddingBottom: 40,
  },

  text: {
    paddingTop: 30,
    paddingBottom: 10,
    color: "#ffffff",
    fontSize: 24,
    textAlign: "center",
    fontWeight: "bold",
  },

  bar: {
    width: "90%",
    height: 1.5,
    backgroundColor: "#ffffff",
    borderRadius: 1,
  },

  reportContainer: {
    width: "90%",
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ffffff",
  },

  scrollContent: {
    padding: 10,
  },

  checkupCard: {
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: "#ffffff",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  cardBody: {
    marginTop: 10,
  },

  checkupText: {
    color: "#222222",
    fontSize: 16,
    fontWeight: "bold",
  },

  checkupNotes: {
    marginTop: 6,
    color: "#555555",
    fontSize: 14,
  },

  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#dddddd",
    paddingVertical: 10,
    gap: 30,
  },

  category: {
    width: 90,
    fontSize: 13.5,
    fontWeight: "bold",
  },

  faceImage: {
    width: 42,
    height: 42,
  },

  ratingText: {
    fontSize: 14,
    fontWeight: "bold",
  },

  notesText: {
    flex: 1,
    fontSize: 13,
    color: "#555555",
  },
});
