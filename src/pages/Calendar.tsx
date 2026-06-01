import {
  Badge,
  Button,
  Group,
  Modal,
  SegmentedControl,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CountdownTimer from "../components/CountdownTimer";
import SlotCard from "../components/SlotCard";
import { api, apiError } from "../lib/api";
import { getSocket, joinRoom, leaveRoom } from "../lib/socket";
import {
  addDays,
  browserTimeZone,
  formatDateLong,
  formatTime,
  isSlotExpired,
  todayLocal,
} from "../lib/time";
import { AvailabilityResponse, Pitch, SlotAvailability, SlotEventPayload } from "../lib/types";

type Filter = "all" | "available" | "booked";

interface ActiveReservation {
  slot: SlotAvailability;
  expiresAt: number;
}

export default function Calendar() {
  const { pitchId = "" } = useParams();
  const navigate = useNavigate();
  const tz = useMemo(() => browserTimeZone(), []);

  const [date, setDate] = useState<string>(todayLocal());
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [busySlot, setBusySlot] = useState<string | null>(null);
  const [active, setActive] = useState<ActiveReservation | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [modalOpened, modal] = useDisclosure(false);

  const pitchesQuery = useQuery({
    queryKey: ["pitches"],
    queryFn: async () => (await api.get<Pitch[]>("/pitches")).data,
  });
  const pitch = pitchesQuery.data?.find((p) => p.id === pitchId);

  const availabilityQuery = useQuery({
    queryKey: ["slots", pitchId, date, tz],
    queryFn: async () =>
      (
        await api.get<AvailabilityResponse>("/slots", {
          params: { pitchId, date, tz },
        })
      ).data,
  });

  useEffect(() => {
    if (availabilityQuery.data) setSlots(availabilityQuery.data.slots);
  }, [availabilityQuery.data]);

  // Live updates: join the room and patch slot statuses on socket events.
  const activeRef = useRef<ActiveReservation | null>(null);
  activeRef.current = active;

  // When the modal closes after a confirm/expiry we must NOT release the hold
  // (it's already booked or already gone); this flag distinguishes those from
  // a user-initiated cancel/close, where we DO release the hold instantly.
  const skipReleaseRef = useRef(false);

  useEffect(() => {
    if (!pitchId || !date) return;
    const socket = getSocket();
    joinRoom(pitchId, date);

    const patch = (p: SlotEventPayload) => {
      if (p.pitchId !== pitchId || p.date !== date) return;
      if (p.status === "reserved" && activeRef.current?.slot.id === p.slotId) return;
      setSlots((prev) =>
        prev.map((s) => (s.id === p.slotId ? { ...s, status: p.status } : s))
      );
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

  const handleBook = useCallback(
    async (slot: SlotAvailability) => {
      setBusySlot(slot.id);
      try {
        const { data } = await api.post("/reserve-slot", {
          pitchId,
          slotId: slot.id,
          date,
          tz,
        });
        setActive({ slot, expiresAt: Date.now() + data.expiresInSeconds * 1000 });
        setSlots((prev) =>
          prev.map((s) => (s.id === slot.id ? { ...s, status: "reserved" } : s))
        );
        modal.open();
      } catch (err) {
        notifications.show({ color: "red", title: "Could not reserve", message: apiError(err) });
        availabilityQuery.refetch();
      } finally {
        setBusySlot(null);
      }
    },
    [pitchId, date, tz, modal, availabilityQuery]
  );

  const handleConfirm = useCallback(async () => {
    if (!active) return;
    setConfirming(true);
    try {
      await api.post("/confirm-booking", {
        pitchId,
        slotId: active.slot.id,
        date,
        tz,
      });
      setSlots((prev) =>
        prev.map((s) => (s.id === active.slot.id ? { ...s, status: "booked" } : s))
      );
      notifications.show({
        color: "teal",
        title: "Booking confirmed 🎉",
        message: `${pitch?.name} · ${formatTime(active.slot.startTime)}–${formatTime(active.slot.endTime)}`,
      });
      skipReleaseRef.current = true; // already booked, don't release
      modal.close();
      setActive(null);
    } catch (err) {
      notifications.show({ color: "red", title: "Could not confirm", message: apiError(err) });
      skipReleaseRef.current = true;
      modal.close();
      setActive(null);
      availabilityQuery.refetch();
    } finally {
      setConfirming(false);
    }
  }, [active, pitchId, date, tz, pitch, modal, availabilityQuery]);

  const handleExpire = useCallback(() => {
    notifications.show({
      color: "yellow",
      title: "Reservation expired",
      message: "The 2-minute hold elapsed and the slot was released.",
    });
    skipReleaseRef.current = true; // server already released it via TTL
    modal.close();
    setActive(null);
    availabilityQuery.refetch();
  }, [modal, availabilityQuery]);

  // User-initiated close/cancel: release the hold immediately so the slot frees
  // up at once for everyone, instead of waiting out the 2-minute TTL.
  const handleModalClose = useCallback(() => {
    const a = activeRef.current;
    if (skipReleaseRef.current) {
      skipReleaseRef.current = false;
    } else if (a) {
      setSlots((prev) =>
        prev.map((s) => (s.id === a.slot.id ? { ...s, status: "available" } : s))
      );
      api.post("/release-slot", { pitchId, slotId: a.slot.id, date }).catch(() => undefined);
    }
    setActive(null);
    modal.close();
  }, [pitchId, date, modal]);

  // Apply client-side expiry safeguard + status filter.
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
            <SlotCard
              key={slot.id}
              slot={slot}
              expired={expired}
              busy={busySlot === slot.id}
              onBook={handleBook}
            />
          ))}
        </SimpleGrid>
      )}

      <Modal
        opened={modalOpened}
        onClose={handleModalClose}
        title={<Title fz={22} fw={600} order={3}>Confirm your booking</Title>}
        centered
        size="lg"
        radius="lg"
        padding="xl"
      >
        {active && (
          <Stack gap="md">
            <Group justify="space-between">
              <Text c="dimmed" size="lg">
                Pitch
              </Text>
              <Text fw={700} size="lg">
                {pitch?.name}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text c="dimmed" size="lg">
                Date
              </Text>
              <Text fw={700} size="lg">
                {formatDateLong(date)}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text c="dimmed" size="lg">
                Time
              </Text>
              <Text fw={700} size="lg">
                {formatTime(active.slot.startTime)} – {formatTime(active.slot.endTime)}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text c="dimmed" size="lg">
                Hold expires in
              </Text>
              <CountdownTimer expiresAt={active.expiresAt} onExpire={handleExpire} />
            </Group>
            <Text size="sm" c="dimmed">
              Your slot is held for 2 minutes. Confirm before the timer runs out — closing
              this dialog releases the slot immediately.
            </Text>
            <Group justify="flex-end" mt="sm">
              <Button variant="light" size="md" onClick={handleModalClose}>
                Cancel
              </Button>
              <Button variant="filled" color="teal" size="md" loading={confirming} onClick={handleConfirm}>
                Confirm booking
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      <Button variant="subtle" color="gray" size="xs" w="fit-content" onClick={() => navigate("/")}>
        ← Back to pitches
      </Button>
    </Stack>
  );
}
