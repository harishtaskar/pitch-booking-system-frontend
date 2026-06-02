import { Button, Card, Divider, Group, Skeleton, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, apiError } from "../lib/api";
import { browserTimeZone, formatDateLong, formatTime } from "../lib/time";
import { AvailabilityResponse, Pitch } from "../lib/types";

type Phase = "reserving" | "ready" | "gone";

export default function BookingConfirm() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const tz = useMemo(() => browserTimeZone(), []);

  const pitchId = params.get("pitchId") ?? "";
  const slotId = params.get("slotId") ?? "";
  const date = params.get("date") ?? "";

  const [phase, setPhase] = useState<Phase>("reserving");
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const reservedRef = useRef(false);

  const pitchesQuery = useQuery({
    queryKey: ["pitches"],
    queryFn: async () => (await api.get<Pitch[]>("/pitches")).data,
  });
  const pitch = pitchesQuery.data?.find((p) => p.id === pitchId);

  const slotsQuery = useQuery({
    queryKey: ["slots", pitchId, date, tz],
    enabled: Boolean(pitchId && date),
    queryFn: async () =>
      (await api.get<AvailabilityResponse>("/slots", { params: { pitchId, date, tz } })).data,
  });
  const slot = slotsQuery.data?.slots.find((s) => s.id === slotId);

  // Place the 2-minute hold as soon as the page loads (runs once).
  useEffect(() => {
    if (!pitchId || !slotId || !date) {
      setPhase("gone");
      return;
    }
    if (reservedRef.current) return;
    reservedRef.current = true;
    api
      .post("/reserve-slot", { pitchId, slotId, date, tz })
      .then(() => setPhase("ready"))
      .catch((err) => {
        notifications.show({ color: "red", title: "Slot unavailable", message: apiError(err) });
        setPhase("gone");
      });
  }, [pitchId, slotId, date, tz]);

  // If the reservation could not be (re)acquired, bounce back to availability.
  useEffect(() => {
    if (phase !== "gone") return;
    const t = setTimeout(() => navigate(pitchId ? `/pitches/${pitchId}` : "/"), 1800);
    return () => clearTimeout(t);
  }, [phase, pitchId, navigate]);

  const handleConfirm = useCallback(async () => {
    setConfirming(true);
    try {
      await api.post("/confirm-booking", { pitchId, slotId, date, tz });
      notifications.show({
        color: "teal",
        title: "Booking confirmed 🎉",
        message: pitch && slot ? `${pitch.name} · ${formatTime(slot.startTime)}` : "Your slot is booked",
      });
      navigate("/my-bookings");
    } catch (err) {
      notifications.show({ color: "red", title: "Could not confirm", message: apiError(err) });
      setPhase("gone");
    } finally {
      setConfirming(false);
    }
  }, [pitchId, slotId, date, tz, pitch, slot, navigate]);

  const handleCancel = useCallback(async () => {
    setCancelling(true);
    try {
      await api.post("/release-slot", { pitchId, slotId, date });
    } catch {
      // ignore — TTL will release it anyway
    }
    navigate(pitchId ? `/pitches/${pitchId}` : "/");
  }, [pitchId, slotId, date, navigate]);

  if (phase === "gone") {
    return (
      <Stack align="center" py={80} gap="xs">
        <Text fz={48}>⌛</Text>
        <Title order={3}>This slot is no longer available</Title>
        <Text c="dimmed">Taking you back to availability…</Text>
      </Stack>
    );
  }

  const loading = phase === "reserving" || slotsQuery.isLoading || pitchesQuery.isLoading;

  return (
    <Stack p="xs" maw={560} mx="auto" w="100%">
      <Title order={2}>Confirm your booking</Title>
      <Text c="dimmed">Review the details below and confirm to lock in your slot.</Text>

      <Card withBorder radius="lg" padding="xl" mt="sm">
        {loading ? (
          <Stack>
            <Skeleton height={28} width="60%" />
            <Skeleton height={20} />
            <Skeleton height={20} />
            <Skeleton height={20} width="40%" />
          </Stack>
        ) : (
          <Stack gap="lg">
            <Group justify="space-between" align="flex-start">
              <div>
                <Title order={3}>{pitch?.name}</Title>
                <Text c="dimmed" size="sm">
                  📍 {pitch?.location}
                </Text>
              </div>
              {/* <Badge color="teal" variant="light" size="lg">
                Reserved for you
              </Badge> */}
            </Group>

            <Divider />

            <Stack gap="sm">
              <Group justify="space-between">
                <Text c="dimmed">Date</Text>
                <Text fw={600}>{formatDateLong(date)}</Text>
              </Group>
              <Group justify="space-between">
                <Text c="dimmed">Time slot</Text>
                <Text fw={600}>
                  {slot ? `${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}` : "—"}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text c="dimmed">Price</Text>
                <Text fw={600}>₹{pitch?.pricePerHour} / hour</Text>
              </Group>
            </Stack>

            <Divider />

            <Group justify="space-between">
              <Text fw={600}>Total</Text>
              <Title order={3} c="teal.7">
                ₹{pitch?.pricePerHour}
              </Title>
            </Group>
          </Stack>
        )}
      </Card>

      <Group justify="flex-end" mt="sm">
        <Button variant="default" size="md" onClick={handleCancel} loading={cancelling}>
          Cancel booking
        </Button>
        <Button
          color="teal"
          size="md"
          onClick={handleConfirm}
          loading={confirming}
          disabled={loading}
        >
          Confirm booking
        </Button>
      </Group>
    </Stack>
  );
}
