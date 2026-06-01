import { Badge, Card, Group, Skeleton, Stack, Text, Title } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { formatTime } from "../lib/time";
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
  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: async () => (await api.get<Booking[]>("/my-bookings")).data,
  });

  return (
    <Stack p="xs">
      <Title order={2}>My Bookings</Title>

      {isError && <Text c="red">Failed to load bookings.</Text>}

      {isLoading ? (
        <Stack>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={72} radius="md" />
          ))}
        </Stack>
      ) : !data?.length ? (
        <Stack align="center" py="xl" gap={4}>
          <Text fz={40}>📭</Text>
          <Text fw={600}>No bookings yet</Text>
          <Text c="dimmed" size="sm">
            Reserve a slot from the Pitches page to see it here.
          </Text>
        </Stack>
      ) : (
        <Stack>
          {data.map((b) => (
            <Card key={b.id} withBorder radius="md" padding="md">
              <Group justify="space-between" wrap="nowrap">
                <div>
                  <Text fw={600}>{b.pitch?.name ?? "Pitch"}</Text>
                  <Text c="dimmed" size="sm">
                    {b.slot ? `${formatTime(b.slot.startTime)} – ${formatTime(b.slot.endTime)}` : ""} ·{" "}
                    {formatDate(b.bookingDate)}
                  </Text>
                </div>
                <Badge color={b.status === "CONFIRMED" ? "teal" : "gray"} variant="light">
                  {b.status}
                </Badge>
              </Group>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
