import { Fragment, useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";
import type { ChartPoint } from "@/lib/trends";

const HEIGHT = 220;
const PAD = { left: 34, right: 18, top: 16, bottom: 40 };
const MIN_SCORE = 1;
const MAX_SCORE = 5;
const GRID_SCORES = [5, 4, 3, 2, 1];

type Props = {
  title: string;
  subtitle?: string;
  points: ChartPoint[];
  color?: string;
};

export default function TrendChart({ title, subtitle, points, color = "#6d3fa9" }: Props) {
  // Measure the space we actually have, so the chart fits any phone width.
  const [width, setWidth] = useState(0);
  const handleLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  // Many points (month view) need smaller dots and a thinner line.
  const dense = points.length > 14;
  const dotRadius = dense ? 3.5 : 6;
  const dotStroke = dense ? 2.5 : 4;
  const lineWidth = dense ? 2.5 : 4;

  const plotTop = PAD.top;
  const plotBottom = HEIGHT - PAD.bottom;
  const plotLeft = PAD.left;
  const plotRight = width - PAD.right;

  const yFor = (score: number) =>
    plotTop + ((MAX_SCORE - score) / (MAX_SCORE - MIN_SCORE)) * (plotBottom - plotTop);

  const xFor = (i: number) =>
    points.length < 2
      ? (plotLeft + plotRight) / 2
      : plotLeft + (i * (plotRight - plotLeft)) / (points.length - 1);

  // Build the line, lifting the "pen" across empty periods so the gap is visible.
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

  // Only list missed days in the week view; longer ranges would make a long list.
  const missed = points.length <= 7 ? points.filter((p) => p.score === null).map((p) => p.label) : [];

  // Screen readers can't read SVG, so describe the data in words.
  const scored = points.filter((p) => p.score !== null);
  const a11yLabel =
    scored.length === 0
      ? `${title}. No check-ins in this period.`
      : `${title}. ` + scored.map((p) => `${p.label}: ${p.score} out of 5`).join(", ");

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <View
        style={styles.chartArea}
        onLayout={handleLayout}
        accessible
        accessibilityRole="image"
        accessibilityLabel={a11yLabel}
      >
        {width > 0 && (
          <Svg width={width} height={HEIGHT}>
            {GRID_SCORES.map((s) => (
              <Fragment key={`grid-${s}`}>
                <Line
                  x1={plotLeft}
                  y1={yFor(s)}
                  x2={plotRight}
                  y2={yFor(s)}
                  stroke="#e5e5e5"
                  strokeWidth={1}
                />
                <SvgText x={14} y={yFor(s) + 5} fontSize={13} fill="#666666" textAnchor="middle">
                  {s}
                </SvgText>
              </Fragment>
            ))}

            {path !== "" && (
              <Path
                d={path.trim()}
                fill="none"
                stroke={color}
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
                  stroke={color}
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
                  fontSize={13}
                  fill={p.score === null ? "#aaaaaa" : "#555555"}
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

const styles = StyleSheet.create({
  card: {
    width: "90%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  title: {
    color: "#262626",
    fontSize: 20,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#666666",
    fontSize: 14,
    marginTop: 4,
    marginBottom: 6,
  },
  chartArea: {
    width: "100%",
    height: HEIGHT,
  },
  missedText: {
    color: "#777777",
    fontSize: 13,
    marginTop: 2,
  },
});
