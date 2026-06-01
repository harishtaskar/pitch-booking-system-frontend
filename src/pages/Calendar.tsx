import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import SlotCard from "../components/SlotCard";
import { api, apiError } from "../lib/api";
import { getSocket, joinRoom, leaveRoom } from "../lib/socket";
import { AvailabilityResponse, Pitch, SlotAvailability, SlotEventPayload } from "../lib/types";

function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

interface MyReservation {
  slotId: string;
  expiresAt: number;
}

export default function Calendar() {
  const { pitchId = "" } = useParams();
  const [date, setDate] = useState<string>(tomorrow());
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [mine, setMine] = useState<MyReservation | null>(null);
  const [busySlot, setBusySlot] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { data: pitch } = useQuery({
    queryKey: ["pitch", pitchId],
    queryFn: async () =>
      (await api.get<Pitch[]>("/pitches")).data.find((p) => p.id === pitchId),
  });

  const availabilityQuery = useQuery({
    queryKey: ["slots", pitchId, date],
    queryFn: async () =>
      (await api.get<AvailabilityResponse>("/slots", { params: { pitchId, date } })).data,
  });

  // Seed local slot state whenever the server data changes.
  useEffect(() => {
    if (availabilityQuery.data) setSlots(availabilityQuery.data.slots);
  }, [availabilityQuery.data]);

  // Reset a pending reservation when the pitch/date context changes.
  useEffect(() => {
    setMine(null);
    setMessage(null);
  }, [pitchId, date]);

  // Live updates: join the room and patch slot statuses on socket events.
  const mineRef = useRef<MyReservation | null>(null);
  mineRef.current = mine;

  useEffect(() => {
    if (!pitchId || !date) return;
    const socket = getSocket();
    joinRoom(pitchId, date);

    const patch = (p: SlotEventPayload) => {
      if (p.pitchId !== pitchId || p.date !== date) return;
      // Don't let an echo of my own reservation override my local "mine" view.
      if (p.status === "reserved" && mineRef.current?.slotId === p.slotId) return;
      setSlots((prev) =>
        prev.map((s) => (s.id === p.slotId ? { ...s, status: p.status } : s))
      );
      // If a slot I was holding got booked by someone else, drop my hold.
      if (p.status === "booked" && mineRef.current?.slotId === p.slotId) {
        setMine(null);
        setMessage("That slot was just booked by someone else.");
      }
    };

    socket.on("slot:reserved", patch);
    socket.on("slot:released", patch);
    socket.on("slot:booked", patch);

    return () => {
      socket.off("slot:reserved", patch);
      socket.off("slot:released", patch);
      socket.off("slot:booked", patch);
      leaveRoom(pitchId, date);
    };
  }, [pitchId, date]);

  const handleReserve = useCallback(
    async (slot: SlotAvailability) => {
      setMessage(null);
      setBusySlot(slot.id);
      try {
        const { data } = await api.post("/reserve-slot", {
          pitchId,
          slotId: slot.id,
          date,
        });
        setMine({ slotId: slot.id, expiresAt: Date.now() + data.expiresInSeconds * 1000 });
        setSlots((prev) =>
          prev.map((s) => (s.id === slot.id ? { ...s, status: "reserved" } : s))
        );
      } catch (err) {
        setMessage(apiError(err));
        availabilityQuery.refetch();
      } finally {
        setBusySlot(null);
      }
    },
    [pitchId, date, availabilityQuery]
  );

  const handleConfirm = useCallback(
    async (slot: SlotAvailability) => {
      setMessage(null);
      setBusySlot(slot.id);
      try {
        await api.post("/confirm-booking", { pitchId, slotId: slot.id, date });
        setMine(null);
        setSlots((prev) =>
          prev.map((s) => (s.id === slot.id ? { ...s, status: "booked" } : s))
        );
        setMessage("✅ Booking confirmed!");
      } catch (err) {
        setMessage(apiError(err));
        setMine(null);
        availabilityQuery.refetch();
      } finally {
        setBusySlot(null);
      }
    },
    [pitchId, date, availabilityQuery]
  );

  const handleExpire = useCallback(() => {
    setMine(null);
    setMessage("Reservation expired — the slot was released.");
    availabilityQuery.refetch();
  }, [availabilityQuery]);

  const legend = useMemo(
    () => [
      { label: "Available", cls: "bg-emerald-50 border-emerald-200" },
      { label: "Reserved", cls: "bg-amber-50 border-amber-200" },
      { label: "Booked", cls: "bg-slate-100 border-slate-200" },
    ],
    []
  );

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{pitch?.name ?? "Pitch"}</h1>
          <p className="text-slate-500">{pitch?.location}</p>
        </div>
        <label className="text-sm font-medium">
          Date{" "}
          <input
            type="date"
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
            className="ml-2 rounded border px-3 py-1.5"
          />
        </label>
      </div>

      <div className="mb-4 flex gap-3 text-xs text-slate-600">
        {legend.map((l) => (
          <span key={l.label} className="flex items-center gap-1">
            <span className={`inline-block h-3 w-3 rounded border ${l.cls}`} />
            {l.label}
          </span>
        ))}
      </div>

      {message && (
        <p className="mb-4 rounded bg-blue-50 px-3 py-2 text-sm text-blue-800">{message}</p>
      )}

      {availabilityQuery.isLoading ? (
        <p className="text-slate-500">Loading slots…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {slots.map((slot) => (
            <SlotCard
              key={slot.id}
              slot={slot}
              isMine={mine?.slotId === slot.id}
              expiresAt={mine?.slotId === slot.id ? mine.expiresAt : null}
              busy={busySlot === slot.id}
              onReserve={handleReserve}
              onConfirm={handleConfirm}
              onExpire={handleExpire}
            />
          ))}
        </div>
      )}
    </div>
  );
}
