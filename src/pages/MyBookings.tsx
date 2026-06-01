import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Booking } from "../lib/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function MyBookings() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: async () => (await api.get<Booking[]>("/my-bookings")).data,
  });

  if (isLoading) return <p className="p-6 text-slate-500">Loading bookings…</p>;
  if (error) return <p className="p-6 text-red-600">Failed to load bookings.</p>;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-bold">My Bookings</h1>
      {!data?.length ? (
        <p className="text-slate-500">No bookings yet.</p>
      ) : (
        <ul className="space-y-3">
          {data.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm"
            >
              <div>
                <p className="font-semibold">{b.pitch?.name ?? "Pitch"}</p>
                <p className="text-sm text-slate-500">
                  {b.slot ? `${b.slot.startTime} – ${b.slot.endTime}` : ""} ·{" "}
                  {formatDate(b.bookingDate)}
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                {b.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
