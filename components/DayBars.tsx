import { StyleSheet, Text, View } from "react-native";

type Props = {
  scores: { category: string; score: number | null }[];
  color?: string;
};

/** Today's four category scores as horizontal bars (a line needs at least two points). */
export default function DayBars({ scores, color = "#6d3fa9" }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Today’s check-in</Text>

      {scores.map(({ category, score }) => (
        <View
          key={category}
          style={styles.row}
          accessible
          accessibilityLabel={`${category}: ${score === null ? "no check-in" : `${score} out of 5`}`}
        >
          <Text style={styles.label}>{category}</Text>
          <View style={styles.track}>
            {score !== null && (
              <View
                style={[
                  styles.fill,
                  { width: `${(score / 5) * 100}%` as const, backgroundColor: color },
                ]}
              />
            )}
          </View>
          <Text style={styles.value}>{score === null ? "–" : score.toFixed(1)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "90%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
  },
  title: {
    color: "#262626",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 7,
  },
  label: {
    width: 104,
    color: "#3d2163",
    fontSize: 15,
    fontWeight: "bold",
  },
  track: {
    flex: 1,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#eee6f8",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 7,
  },
  value: {
    width: 36,
    textAlign: "right",
    color: "#555555",
    fontSize: 15,
  },
});
