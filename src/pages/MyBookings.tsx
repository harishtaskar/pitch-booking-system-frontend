import { Badge, Card, Group, Skeleton, Stack, Tabs, Text, Title } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { api } from "../lib/api";
import { browserTimeZone, formatTime } from "../lib/time";
import { Booking, MyBookingsResponse } from "../lib/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusBadge(b: Booking, upcoming: boolean) {
  if (b.status === "CANCELLED") return <Badge color="red" variant="light">Cancelled</Badge>;
  if (upcoming) return <Badge color="teal" variant="light">Confirmed</Badge>;
  return <Badge color="gray" variant="light">Completed</Badge>;
}

function BookingCard({ booking, upcoming }: { booking: Booking; upcoming: boolean }) {
  return (
    <Card withBorder radius="md" padding="md">
      <Group justify="space-between" wrap="nowrap">
        <div>
          <Text fw={600}>{booking.pitch?.name ?? "Pitch"}</Text>
          <Text c="dimmed" size="sm">
            {booking.slot
              ? `${formatTime(booking.slot.startTime)} – ${formatTime(booking.slot.endTime)}`
              : ""}{" "}
            · {formatDate(booking.bookingDate)}
          </Text>
          {booking.pitch?.location && (
            <Text c="dimmed" size="xs" mt={2}>
              📍 {booking.pitch.location}
            </Text>
          )}
        </div>
        {statusBadge(booking, upcoming)}
      </Group>
    </Card>
  );
}

function BookingList({
  bookings,
  loading,
  upcoming,
  emptyText,
}: {
  bookings: Booking[];
  loading: boolean;
  upcoming: boolean;
  emptyText: string;
}) {
  if (loading) {
    return (
      <Stack mt="md">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} height={84} radius="md" />
        ))}
      </Stack>
    );
  }
  if (bookings.length === 0) {
    return (
      <Stack align="center" py="xl" gap={4}>
        <Text fz={40}>📭</Text>
        <Text fw={600}>Nothing here yet</Text>
        <Text c="dimmed" size="sm">
          {emptyText}
        </Text>
      </Stack>
    );
  }
  return (
    <Stack mt="md">
      {bookings.map((b) => (
        <BookingCard key={b.id} booking={b} upcoming={upcoming} />
      ))}
    </Stack>
  );
}

export default function MyBookings() {
  const tz = useMemo(() => browserTimeZone(), []);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-bookings", tz],
    queryFn: async () =>
      (await api.get<MyBookingsResponse>("/my-bookings", { params: { tz } })).data,
  });

  const upcoming = data?.upcomingBookings ?? [];
  const history = data?.bookingHistory ?? [];

  return (
    <Stack p="xs">
      <Title order={2}>My Bookings</Title>
      {isError && <Text c="red">Failed to load bookings.</Text>}

      <Tabs defaultValue="upcoming" color="teal" keepMounted={false}>
        <Tabs.List>
          <Tabs.Tab value="upcoming" rightSection={<Badge size="sm" circle variant="light" color="teal">{upcoming.length}</Badge>}>
            Upcoming Bookings
          </Tabs.Tab>
          <Tabs.Tab value="history" rightSection={<Badge size="sm" circle variant="light" color="gray">{history.length}</Badge>}>
            Booking History
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="upcoming">
          <BookingList
            bookings={upcoming}
            loading={isLoading}
            upcoming
            emptyText="Reserve a slot from the Pitches page to see it here."
          />
        </Tabs.Panel>

        <Tabs.Panel value="history">
          <BookingList
            bookings={history}
            loading={isLoading}
            upcoming={false}
            emptyText="Your past and cancelled bookings will appear here."
          />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
