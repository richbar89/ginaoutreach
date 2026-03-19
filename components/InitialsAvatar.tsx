const PALETTE = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-indigo-100 text-indigo-700",
  "bg-pink-100 text-pink-700",
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function colorClass(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash += seed.charCodeAt(i);
  return PALETTE[hash % PALETTE.length];
}

type Props = {
  name: string;
  email?: string;
  size?: "sm" | "md" | "lg";
};

const sizes = { sm: "w-7 h-7 text-xs", md: "w-9 h-9 text-sm", lg: "w-12 h-12 text-base" };

export default function InitialsAvatar({ name, email = "", size = "md" }: Props) {
  const label = name?.trim() ? initials(name) : (email[0] ?? "?").toUpperCase();
  const color = colorClass(email || name);
  return (
    <div
      className={`${sizes[size]} ${color} rounded-full flex items-center justify-center font-semibold flex-shrink-0`}
    >
      {label}
    </div>
  );
}
