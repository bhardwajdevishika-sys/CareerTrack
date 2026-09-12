import Badge from "./Badge";

const tones = {
  easy: "green",
  medium: "amber",
  hard: "red",
};

export default function DifficultyBadge({ difficulty }) {
  return <Badge tone={tones[difficulty] || "slate"}>{difficulty}</Badge>;
}
