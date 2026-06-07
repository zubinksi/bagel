import { teamColor } from "@/lib/teamColors";

type Props = {
  team: string | null;
  position?: string | null;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "w-10 h-10 text-xs",
  md: "w-16 h-16 text-sm",
  lg: "w-20 h-20 text-base",
};

export default function TeamColorSquare({ team, position, size = "md" }: Props) {
  const { bg, text } = teamColor(team);
  return (
    <div
      className={`${sizes[size]} rounded flex flex-col items-center justify-center font-display gap-0.5 shrink-0`}
      style={{ backgroundColor: bg, color: text }}
    >
      {position && <span className="text-[10px] opacity-70 leading-none">{position}</span>}
      <span className="leading-none font-bold">{team ?? "?"}</span>
    </div>
  );
}
