import Ionicons from "@expo/vector-icons/Ionicons";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  LayoutAnimation,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";

import { useAppData } from "@/context/AppDataContext";
import {
  CATEGORIES,
  ChartPoint,
  RANGES,
  TrendRange,
  buildTrend,
  describeTrend,
  summarizeTrend,
  todayScores,
} from "@/lib/trends";
import type { ReportCategory } from "@/types/data";

const PURPLE = "#6d3fa9";

const RANGE_SHORT: Record<TrendRange, string> = {
  day: "1D",
  week: "1W",
  month: "1M",
  "3months": "3M",
  year: "1Y",
};

const POINT_TEXT: Record<TrendRange, string> = {
  day: "",
  week: "one point per day",
  month: "one point per day",
  "3months": "one point per week",
  year: "one point per month",
};

export default function Trends() {
  const { people, selectedPersonId, checkups, loadDemoData } = useAppData();
  const selectedPerson = people.find(
    (person) => person.id === selectedPersonId,
  );
  const personId = selectedPerson?.id ?? "";

  const [range, setRange] = useState<TrendRange>("week");
  const [activeReport, setActiveReport] = useState<ReportCategory | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(true);

  function toggleSummary() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSummaryOpen((open) => !open);
  }

  const overall = useMemo(
    () => buildTrend(checkups, personId, "Overall", range),
    [checkups, personId, range],
  );
  const graphTrend = useMemo(
    () => buildTrend(checkups, personId, activeReport ?? "Overall", range),
    [checkups, personId, activeReport, range],
  );
  const today = useMemo(
    () => todayScores(checkups, personId),
    [checkups, personId],
  );

  let summaryText: string;
  let evidenceText: string;

  if (!selectedPerson) {
    summaryText = "Add or select a person in Profile to see their trends.";
    evidenceText = "";
  } else if (range === "day") {
    const done = today.filter((t) => t.score !== null) as {
      category: string;
      score: number;
    }[];
    if (done.length === 0) {
      summaryText = "No check-in yet today.";
    } else {
      const avg = done.reduce((sum, t) => sum + t.score, 0) / done.length;
      const lowest = done.reduce((low, t) => (t.score < low.score ? t : low));
      summaryText = `Today’s check-in averages ${avg.toFixed(1)} out of 5. Lowest today: ${lowest.category}.`;
    }
    evidenceText = `${done.length} of 4 categories checked in today`;
  } else {
    summaryText = describeTrend(
      summarizeTrend(overall.points),
      "Overall",
      range,
    );
    evidenceText = `Based on ${overall.daysWithData} day${overall.daysWithData === 1 ? "" : "s"} with check-ins`;
  }

  const graphTitle =
    range === "day"
      ? "Today’s check-in"
      : activeReport
        ? `${activeReport} trend`
        : "Overall check-in trend";

  const pointText = POINT_TEXT[range];
  const graphSubtitle =
    range === "day"
      ? "Score for each category, out of 5"
      : activeReport
        ? pointText.charAt(0).toUpperCase() + pointText.slice(1)
        : `Average of all four categories, ${pointText}`;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          Trends for {selectedPerson ? selectedPerson.name : "No One Selected"}
        </Text>
        <View style={styles.bar} />

        <RangePicker value={range} onChange={setRange} />

        <View style={styles.summaryCard}>
          <TouchableOpacity
            style={styles.summaryHeader}
            onPress={toggleSummary}
            activeOpacity={0.7}
          >
            <Text style={styles.summaryTitle}>Recent patterns</Text>
            <Ionicons
              name={summaryOpen ? "chevron-up" : "chevron-down"}
              size={24}
              color="#050505"
            />
          </TouchableOpacity>

          {summaryOpen && (
            <View>
              <Text style={styles.summaryText}>{summaryText}</Text>
              {evidenceText ? (
                <Text style={styles.evidenceText}>{evidenceText}</Text>
              ) : null}
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Category</Text>
        <View style={styles.catBar} />
        <View style={styles.reportButtons}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.fullWidthButton,
              activeReport === null && styles.activeButton,
            ]}
            onPress={() => setActiveReport(null)}
          >
            <Text style={styles.buttonText}>Overall</Text>
          </TouchableOpacity>

          {CATEGORIES.map((report) => (
            <TouchableOpacity
              key={report}
              style={[
                styles.button,
                activeReport === report && styles.activeButton,
              ]}
              onPress={() => setActiveReport(report)}
            >
              <Text style={styles.buttonText}>{report}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.graphCard}>
          <Text style={styles.graphTitle}>{graphTitle}</Text>
          <Text style={styles.graphSubtitle}>{graphSubtitle}</Text>

          {range === "day" ? (
            <TodayBars scores={today} highlight={activeReport} />
          ) : (
            <LineChart title={graphTitle} points={graphTrend.points} />
          )}
        </View>

        <View style={styles.bar} />

        <Text style={styles.aiNotice}>
          Want the full picture? Generate a report from Profile.
        </Text>

        <Text style={styles.footerText}>
          This page shows patterns, not diagnoses.
        </Text>

        {/* Only present in the development builds. Saves a year of fake check ins */}
        {__DEV__ && selectedPerson && (
          <Pressable onPress={loadDemoData} style={styles.demoButton}>
            <Text style={styles.demoButtonText}>
              Load demo year (replaces this person’s data)
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const PICKER_PAD = 4;

function RangePicker({
  value,
  onChange,
}: {
  value: TrendRange;
  onChange: (r: TrendRange) => void;
}) {
  const [rowWidth, setRowWidth] = useState(0);
  const slide = useRef(new Animated.Value(0)).current;
  const placed = useRef(false);

  const segment =
    rowWidth > 0 ? (rowWidth - PICKER_PAD * 2) / RANGES.length : 0;
  const index = RANGES.indexOf(value);

  useEffect(() => {
    if (segment === 0) return;
    const target = index * segment;

    if (!placed.current) {
      slide.setValue(target);
      placed.current = true;
      return;
    }
    Animated.timing(slide, {
      toValue: target,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [index, segment, slide]);

  return (
    <View
      style={styles.rangeRow}
      onLayout={(e: LayoutChangeEvent) =>
        setRowWidth(e.nativeEvent.layout.width)
      }
    >
      {segment > 0 && (
        <Animated.View
          style={[
            styles.rangeHighlight,
            { width: segment, transform: [{ translateX: slide }] },
          ]}
        />
      )}

      {RANGES.map((r) => {
        const active = r === value;
        return (
          <Pressable
            key={r}
            onPress={() => onChange(r)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={styles.rangeOption}
          >
            <Text style={active ? styles.rangeTextActive : styles.rangeText}>
              {RANGE_SHORT[r]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const CHART_HEIGHT = 220;
const PAD = { left: 34, right: 18, top: 16, bottom: 40 };
const GRID_SCORES = [5, 4, 3, 2, 1];

function LineChart({ title, points }: { title: string; points: ChartPoint[] }) {
  const [width, setWidth] = useState(0);

  const dense = points.length > 14;
  const dotRadius = dense ? 3.5 : 6;
  const dotStroke = dense ? 2.5 : 4;
  const lineWidth = dense ? 2.5 : 4;

  const plotBottom = CHART_HEIGHT - PAD.bottom;
  const plotRight = width - PAD.right;

  const yFor = (score: number) =>
    PAD.top + ((5 - score) / 4) * (plotBottom - PAD.top);
  const xFor = (i: number) =>
    points.length < 2
      ? (PAD.left + plotRight) / 2
      : PAD.left + (i * (plotRight - PAD.left)) / (points.length - 1);

  let path = "";
  let penUp = true;
  points.forEach((p, i) => {
    if (p.score === null) {
      penUp = true;
      return;
    }
    path += `${penUp ? "M" : "L"} ${xFor(i)} ${yFor(p.score)} `;
    penUp = false;
  });

  const scored = points.filter((p) => p.score !== null);
  const a11yLabel =
    scored.length === 0
      ? `${title}. No check-ins in this period.`
      : `${title}. ` +
        scored.map((p) => `${p.label}: ${p.score} out of 5`).join(", ");

  const missed =
    points.length <= 7
      ? points.filter((p) => p.score === null).map((p) => p.label)
      : [];

  return (
    <View style={styles.chartWrap}>
      <View
        style={styles.chartArea}
        onLayout={(e: LayoutChangeEvent) =>
          setWidth(e.nativeEvent.layout.width)
        }
        accessible
        accessibilityRole="image"
        accessibilityLabel={a11yLabel}
      >
        {width > 0 && (
          <Svg width={width} height={CHART_HEIGHT}>
            {GRID_SCORES.map((s) => (
              <Fragment key={`grid-${s}`}>
                <Line
                  x1={PAD.left}
                  y1={yFor(s)}
                  x2={plotRight}
                  y2={yFor(s)}
                  stroke="#e5e5e5"
                  strokeWidth={1}
                />
                <SvgText
                  x={14}
                  y={yFor(s) + 5}
                  fontSize={12}
                  fill="#777777"
                  textAnchor="middle"
                >
                  {s}
                </SvgText>
              </Fragment>
            ))}

            {path !== "" && (
              <Path
                d={path.trim()}
                fill="none"
                stroke={PURPLE}
                strokeWidth={lineWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {points.map((p, i) =>
              p.score === null ? null : (
                <Circle
                  key={`pt-${p.key}`}
                  cx={xFor(i)}
                  cy={yFor(p.score)}
                  r={dotRadius}
                  fill="#ffffff"
                  stroke={PURPLE}
                  strokeWidth={dotStroke}
                />
              ),
            )}

            {points.map((p, i) =>
              p.showLabel ? (
                <SvgText
                  key={`label-${p.key}`}
                  x={xFor(i)}
                  y={plotBottom + 26}
                  fontSize={12}
                  fill={p.score === null ? "#aaaaaa" : "#666666"}
                  textAnchor="middle"
                >
                  {p.label}
                </SvgText>
              ) : null,
            )}
          </Svg>
        )}
      </View>

      {missed.length > 0 && (
        <Text style={styles.missedText}>No check-in: {missed.join(", ")}</Text>
      )}
    </View>
  );
}

function TodayBars({
  scores,
  highlight,
}: {
  scores: { category: string; score: number | null }[];
  highlight: ReportCategory | null;
}) {
  return (
    <View style={styles.barsWrap}>
      {scores.map(({ category, score }) => {
        const dimmed = highlight !== null && highlight !== category;
        return (
          <View
            key={category}
            style={[styles.barRow, dimmed && styles.barRowDimmed]}
            accessible
            accessibilityLabel={`${category}: ${score === null ? "no check-in" : `${score} out of 5`}`}
          >
            <Text style={styles.barLabel}>{category}</Text>
            <View style={styles.barTrack}>
              {score !== null && (
                <View
                  style={[
                    styles.barFill,
                    { width: `${(score / 5) * 100}%` as const },
                  ]}
                />
              )}
            </View>
            <Text style={styles.barValue}>
              {score === null ? "–" : score.toFixed(1)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PURPLE,
  },

  content: {
    alignItems: "center",
    paddingBottom: 110,
  },

  title: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 20,
  },

  bar: {
    width: "90%",
    height: 1.5,
    backgroundColor: "#ffffff",
    marginTop: 10,
    marginBottom: 18,
  },

  catBar: {
    width: "90%",
    height: 1.5,
    backgroundColor: "#ffffff",
    marginTop: 10,
    marginBottom: 2,
  },

  rangeRow: {
    width: "90%",
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: PICKER_PAD,
    marginBottom: 16,
  },

  rangeHighlight: {
    position: "absolute",
    top: PICKER_PAD,
    bottom: PICKER_PAD,
    left: PICKER_PAD,
    backgroundColor: "#ffffff",
    borderRadius: 9,
  },

  rangeOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },

  rangeText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },

  rangeTextActive: {
    color: "#3d2163",
    fontSize: 14,
    fontWeight: "bold",
  },

  // Summary card
  summaryCard: {
    width: "90%",
    backgroundColor: "#e8d8ff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },

  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  summaryTitle: {
    color: "#050505",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 2,
  },

  aiNotice: {
    color: "#26b443",
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 6,
    marginBottom: 6,
  },

  summaryText: {
    color: "#3d2163",
    fontSize: 15,
    lineHeight: 21,
  },

  evidenceText: {
    color: "#674b88",
    fontSize: 12,
    marginTop: 10,
  },

  // Category buttons
  sectionTitle: {
    color: "#ffffff",
    fontSize: 23,
    fontWeight: "bold",
  },

  reportButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "80%",
    marginTop: 5,
    marginBottom: 5,
    padding: 10,
    gap: 10,
  },

  button: {
    width: "48%",
    paddingVertical: 8,
    paddingHorizontal: 5,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#7ecf9a",
    marginBottom: 5,
    marginTop: 5,
  },

  fullWidthButton: {
    width: "100%",
  },

  activeButton: {
    borderWidth: 3,
    borderColor: "#ffffff",
  },

  buttonText: {
    color: "#0e0e0e",
    fontSize: 16,
    fontWeight: "bold",
  },

  graphCard: {
    width: "90%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 10,
    alignItems: "center",
    marginBottom: 6,
  },

  graphTitle: {
    color: "#262626",
    fontSize: 23,
    fontWeight: "bold",
  },

  graphSubtitle: {
    color: "#666666",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 5,
  },

  chartWrap: {
    width: "100%",
    alignItems: "center",
  },

  chartArea: {
    width: "100%",
    height: CHART_HEIGHT,
  },

  missedText: {
    color: "#888888",
    fontSize: 12,
    marginTop: 2,
  },

  barsWrap: {
    width: "100%",
    paddingHorizontal: 8,
    paddingTop: 8,
  },

  barRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 7,
  },

  barRowDimmed: {
    opacity: 0.35,
  },

  barLabel: {
    width: 104,
    color: "#3d2163",
    fontSize: 15,
    fontWeight: "bold",
  },

  barTrack: {
    flex: 1,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#eee6f8",
    overflow: "hidden",
  },

  barFill: {
    height: "100%",
    borderRadius: 7,
    backgroundColor: PURPLE,
  },

  barValue: {
    width: 36,
    textAlign: "right",
    color: "#555555",
    fontSize: 15,
  },

  footerText: {
    color: "#e8d8ff",
    fontSize: 13,
  },

  demoButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e8d8ff",
  },

  demoButtonText: {
    color: "#e8d8ff",
    fontSize: 13,
  },
});
