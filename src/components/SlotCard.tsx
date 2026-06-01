import { SlotAvailability } from "../lib/types";
import CountdownTimer from "./CountdownTimer";

interface Props {
  slot: SlotAvailability;
  isMine: boolean; // reserved by the current user (pending confirmation)
  expiresAt: number | null;
  busy: boolean;
  onReserve: (slot: SlotAvailability) => void;
  onConfirm: (slot: SlotAvailability) => void;
  onExpire: () => void;
}

const STATUS_STYLES: Record<string, string> = {
  available: "border-emerald-200 bg-emerald-50",
  reserved: "border-amber-200 bg-amber-50",
  booked: "border-slate-200 bg-slate-100 opacity-70",
};

export default function SlotCard({
  slot,
  isMine,
  expiresAt,
  busy,
  onReserve,
  onConfirm,
  onExpire,
}: Props) {
  const label = `${slot.startTime} – ${slot.endTime}`;

  // The slot I'm holding: show confirm + live countdown.
  if (isMine && expiresAt) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3">
        <div className="flex items-center justify-between">
          <span className="font-medium">{label}</span>
          <CountdownTimer expiresAt={expiresAt} onExpire={onExpire} />
        </div>
        <button
          disabled={busy}
          onClick={() => onConfirm(slot)}
          className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? "Confirming…" : "Confirm booking"}
        </button>
      </div>
    );
  }

  if (slot.status === "booked") {
    return (
      <div className={`rounded-lg border p-3 ${STATUS_STYLES.booked}`}>
        <div className="flex items-center justify-between">
          <span className="font-medium">{label}</span>
          <span className="text-xs font-semibold uppercase text-slate-500">Booked</span>
        </div>
      </div>
    );
  }

  if (slot.status === "reserved") {
    return (
      <div className={`rounded-lg border p-3 ${STATUS_STYLES.reserved}`}>
        <div className="flex items-center justify-between">
          <span className="font-medium">{label}</span>
          <span className="text-xs font-semibold uppercase text-amber-600">Reserved</span>
        </div>
      </div>
    );
  }

  // available
  return (
    <button
      disabled={busy}
      onClick={() => onReserve(slot)}
      className={`flex items-center justify-between rounded-lg border p-3 text-left transition hover:bg-emerald-100 disabled:opacity-50 ${STATUS_STYLES.available}`}
    >
      <span className="font-medium">{label}</span>
      <span className="text-xs font-semibold uppercase text-emerald-600">Available</span>
    </button>
  );
}
