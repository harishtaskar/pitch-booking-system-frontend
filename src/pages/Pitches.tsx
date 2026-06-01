import {
  Badge,
  Card,
  Group,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Pitch } from "../lib/types";

export default function Pitches() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["pitches"],
    queryFn: async () => (await api.get<Pitch[]>("/pitches")).data,
  });

  return (
    <Stack p="xs">
      <div>
        <Title order={2}>Cricket Pitches</Title>
        <Text c="dimmed">Pick a pitch to view availability and book a slot.</Text>
      </div>

      {isError && (
        <Text c="red">Failed to load pitches. Please try again.</Text>
      )}

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} height={150} radius="lg" />
            ))
          : data?.map((pitch) => (
              <Card
                key={pitch.id}
                withBorder
                shadow="sm"
                radius="lg"
                padding="lg"
                className="cursor-pointer transition-transform hover:-translate-y-1 hover:shadow-md"
                onClick={() => navigate(`/pitches/${pitch.id}`)}
              >
                <Group justify="space-between" align="flex-start">
                  <Title order={4}>{pitch.name}</Title>
                  <Badge color="teal" variant="light">
                    ₹{pitch.pricePerHour}/hr
                  </Badge>
                </Group>
                <Text c="dimmed" size="sm" mt={4}>
                  📍 {pitch.location}
                </Text>
              </Card>
            ))}
      </SimpleGrid>

      {!isLoading && data?.length === 0 && (
        <Text c="dimmed" ta="center" py="xl">
          No pitches available yet.
        </Text>
      )}
    </Stack>
  );
}
