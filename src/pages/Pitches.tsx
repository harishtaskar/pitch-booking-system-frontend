import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Pitch } from "../lib/types";

export default function Pitches() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["pitches"],
    queryFn: async () => (await api.get<Pitch[]>("/pitches")).data,
  });

  if (isLoading) return <p className="p-6 text-slate-500">Loading pitches…</p>;
  if (error) return <p className="p-6 text-red-600">Failed to load pitches.</p>;

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-1 text-2xl font-bold">Cricket Pitches</h1>
      <p className="mb-6 text-slate-600">Pick a pitch to view availability and book a slot.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((pitch) => (
          <Link
            key={pitch.id}
            to={`/pitches/${pitch.id}`}
            className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <h2 className="text-lg font-semibold">{pitch.name}</h2>
            <p className="text-sm text-slate-500">{pitch.location}</p>
            <p className="mt-3 text-emerald-700">
              ₹{pitch.pricePerHour}
              <span className="text-sm text-slate-500"> / hour</span>
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
