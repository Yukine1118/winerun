import { Card } from "@/components/ui";
import type { Player } from "@/lib/types";

export function MemberList({ players, meId }: { players: Player[]; meId: string }) {
  return (
    <Card>
      <h2 className="mb-3 font-bold">
        成員 <span className="text-zinc-400">({players.length})</span>
      </h2>
      <ul className="flex flex-wrap gap-2">
        {players.map((p) => (
          <li
            key={p.id}
            className={`rounded-full px-3 py-1 text-sm ${
              p.id === meId ? "bg-amber-400 text-zinc-950" : "bg-zinc-800 text-zinc-200"
            }`}
          >
            {p.is_host && "👑 "}
            {p.nickname}
          </li>
        ))}
      </ul>
    </Card>
  );
}
