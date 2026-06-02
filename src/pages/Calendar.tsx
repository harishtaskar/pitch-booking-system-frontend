import {
  Badge,
  Button,
  Group,
  SegmentedControl,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SlotCard from "../components/SlotCard";
import { api } from "../lib/api";
import { getSocket, joinRoom, leaveRoom } from "../lib/socket";
import {
  addDays,
  browserTimeZone,
  formatDateLong,
  isSlotExpired,
  todayLocal,
} from "../lib/time";
import { AvailabilityResponse, Pitch, SlotAvailability, SlotEventPayload } from "../lib/types";

type Filter = "all" | "available" | "booked";

export default function Calendar() {
  const { pitchId = "" } = useParams();
  const navigate = useNavigate();
  const tz = useMemo(() => browserTimeZone(), []);

  const [date, setDate] = useState<string>(todayLocal());
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  const pitchesQuery = useQuery({
    queryKey: ["pitches"],
    queryFn: async () => (await api.get<Pitch[]>("/pitches")).data,
  });
  const pitch = pitchesQuery.data?.find((p) => p.id === pitchId);

  const availabilityQuery = useQuery({
    queryKey: ["slots", pitchId, date, tz],
    queryFn: async () =>
      (await api.get<AvailabilityResponse>("/slots", { params: { pitchId, date, tz } })).data,
  });

  useEffect(() => {
    if (availabilityQuery.data) setSlots(availabilityQuery.data.slots);
  }, [availabilityQuery.data]);

  // Live updates: join the room and patch slot statuses on socket events.
  useEffect(() => {
    if (!pitchId || !date) return;
    const socket = getSocket();
    joinRoom(pitchId, date);

    const patch = (p: SlotEventPayload) => {
      if (p.pitchId !== pitchId || p.date !== date) return;
      setSlots((prev) => prev.map((s) => (s.id === p.slotId ? { ...s, status: p.status } : s)));
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

  // Selecting a slot takes the user to the dedicated confirmation page, which
  // places the 2-minute hold on the backend.
  const handleBook = (slot: SlotAvailability) =>
    navigate(`/booking/confirm?pitchId=${pitchId}&slotId=${slot.id}&date=${date}`);

  // Client-side expiry safeguard + status filter.
  const visibleSlots = useMemo(() => {
    return slots
      .map((s) => ({ slot: s, expired: isSlotExpired(date, s.startTime) }))
      .filter(({ slot, expired }) => {
        if (filter === "available") return slot.status === "available" && !expired;
        if (filter === "booked") return slot.status === "booked";
        return true;
      });
  }, [slots, date, filter]);

  const counts = useMemo(() => {
    const avail = slots.filter(
      (s) => s.status === "available" && !isSlotExpired(date, s.startTime)
    ).length;
    const booked = slots.filter((s) => s.status === "booked").length;
    return { avail, booked };
  }, [slots, date]);

  return (
    <Stack p="xs">
      <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
        <div>
          <Title order={2}>{pitch?.name ?? "Pitch"}</Title>
          <Text c="dimmed">📍 {pitch?.location ?? "…"}</Text>
        </div>
        <Group gap="sm" wrap="wrap" align="flex-end">
          <Select
            label="Pitch"
            value={pitchId}
            data={(pitchesQuery.data ?? []).map((p) => ({ value: p.id, label: p.name }))}
            onChange={(v) => v && navigate(`/pitches/${v}`)}
            allowDeselect={false}
            w={180}
          />
          <DatePickerInput
            label="Date"
            value={date}
            minDate={todayLocal()}
            maxDate={addDays(todayLocal(), 30)}
            onChange={(v) => v && setDate(v as string)}
            highlightToday
            firstDayOfWeek={0}
            w={170}
          />
        </Group>
      </Group>

      <Title order={4} fw={600}>
        {filter === "available"
          ? "Available slots for "
          : filter === "booked"
            ? "Booked slots for "
            : "All slots for "}
        <Text span c="teal.7" inherit>
          {formatDateLong(date)}
        </Text>
      </Title>

      <Group justify="space-between" wrap="wrap" gap="sm">
        <Group gap="xs">
          <Badge color="teal" variant="light" size="lg">
            {counts.avail} available
          </Badge>
          <Badge color="gray" variant="light" size="lg">
            {counts.booked} booked
          </Badge>
        </Group>
        <SegmentedControl
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
          data={[
            { label: "All", value: "all" },
            { label: "Available", value: "available" },
            { label: "Booked", value: "booked" },
          ]}
        />
      </Group>

      {availabilityQuery.isLoading ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={110} radius="md" />
          ))}
        </SimpleGrid>
      ) : visibleSlots.length === 0 ? (
        <Stack align="center" py="xl" gap={4}>
          <Text fz={40}>🗓️</Text>
          <Text fw={600}>No slots to show</Text>
          <Text c="dimmed" size="sm" ta="center">
            {filter !== "all"
              ? "Try a different filter, or pick another date."
              : "All slots for this date have passed or none are scheduled. Try another date."}
          </Text>
        </Stack>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {visibleSlots.map(({ slot, expired }) => (
            <SlotCard key={slot.id} slot={slot} expired={expired} busy={false} onBook={handleBook} />
          ))}
        </SimpleGrid>
      )}

      <Button variant="subtle" color="gray" size="xs" w="fit-content" onClick={() => navigate("/")}>
        ← Back to pitches
      </Button>
    </Stack>
  );
}
