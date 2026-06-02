import {
  AppShell,
  Avatar,
  Button,
  Divider,
  Group,
  Menu,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Title
            order={4}
            c="teal.7"
            renderRoot={(props) => <Link to="/" {...props} />}
            style={{ textDecoration: "none" }}
          >
            🏏 Pitch Booking
          </Title>

          <Group gap="xs" wrap="nowrap">
            <Button
              component={Link}
              to="/"
              variant={pathname === "/" ? "light" : "subtle"}
              size="sm"
              color="teal"
              visibleFrom="xs"
            >
              Pitches
            </Button>

            <Menu shadow="md" width={250} position="bottom-end" withArrow trigger="click">
              <Menu.Target>
                <UnstyledButton
                  aria-label="Open profile menu"
                  style={{ borderRadius: 999, padding: 2 }}
                >
                  <Group gap="xs" wrap="nowrap">
                    <Avatar color="teal" radius="xl">
                      {user ? initials(user.name) : "?"}
                    </Avatar>
                    <Text size="sm" fw={500} visibleFrom="sm">
                      {user?.name}
                    </Text>
                  </Group>
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown>
                <div style={{ padding: "8px 12px" }}>
                  <Group gap="sm" wrap="nowrap">
                    <Avatar color="teal" radius="xl">
                      {user ? initials(user.name) : "?"}
                    </Avatar>
                    <div style={{ minWidth: 0 }}>
                      <Text fw={600} truncate>
                        {user?.name}
                      </Text>
                      <Text size="xs" c="dimmed" truncate>
                        {user?.email}
                      </Text>
                    </div>
                  </Group>
                </div>

                <Divider />

                <Menu.Item onClick={() => navigate("/")}>Pitches</Menu.Item>
                <Menu.Item onClick={() => navigate("/my-bookings")}>My Bookings</Menu.Item>
                <Menu.Item disabled>Profile (coming soon)</Menu.Item>

                <Divider />

                <Menu.Item color="red" onClick={handleLogout}>
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main bg="gray.0">
        <div className="mx-auto max-w-5xl">{children}</div>
      </AppShell.Main>
    </AppShell>
  );
}
