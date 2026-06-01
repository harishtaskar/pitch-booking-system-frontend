import { Badge, Button, Card, Group, Text } from "@mantine/core";
import { formatTime } from "../lib/time";
import { SlotAvailability } from "../lib/types";

interface Props {
  slot: SlotAvailability;
  expired: boolean; // client-side safeguard
  busy: boolean; // this slot is currently being reserved
  onBook: (slot: SlotAvailability) => void;
}

type Display = {
  label: string;
  color: string;
  border: string;
  bg: string;
};

const DISPLAY: Record<string, Display> = {
  available: { label: "Available", color: "teal", border: "var(--mantine-color-teal-3)", bg: "var(--mantine-color-teal-0)" },
  reserved: { label: "Reserved", color: "yellow", border: "var(--mantine-color-yellow-3)", bg: "var(--mantine-color-yellow-0)" },
  booked: { label: "Booked", color: "gray", border: "var(--mantine-color-gray-3)", bg: "var(--mantine-color-gray-1)" },
  expired: { label: "Expired", color: "gray", border: "var(--mantine-color-gray-2)", bg: "var(--mantine-color-gray-0)" },
};

export default function SlotCard({ slot, expired, busy, onBook }: Props) {
  const status = expired ? "expired" : slot.status;
  const d = DISPLAY[status];
  const isAvailable = status === "available";
  const dimmed = status === "booked" || status === "expired";

  return (
    <Card
      withBorder
      radius="md"
      padding="md"
      style={{
        borderColor: d.border,
        backgroundColor: d.bg,
        opacity: dimmed ? 0.7 : 1,
        transition: "transform 120ms ease, box-shadow 120ms ease",
      }}
      className={isAvailable ? "hover:-translate-y-0.5 hover:shadow-md" : undefined}
    >
      <Group justify="space-between" align="center" wrap="nowrap">
        <Text fw={600}>
          {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
        </Text>
        <Badge color={d.color} variant={isAvailable ? "light" : "filled"} radius="sm">
          {d.label}
        </Badge>
      </Group>

      {isAvailable ? (
        <Button
          mt="sm"
          size="xs"
          color="teal"
          fullWidth
          loading={busy}
          onClick={() => onBook(slot)}
        >
          Book slot
        </Button>
      ) : (
        <Text mt="sm" size="xs" c="dimmed">
          {status === "reserved"
            ? "Held by another user"
            : status === "booked"
              ? "Already booked"
              : "Time has passed"}
        </Text>
      )}
    </Card>
  );
}
