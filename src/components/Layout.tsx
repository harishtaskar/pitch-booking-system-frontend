import { AppShell, Button, Group, Text, Title } from "@mantine/core";
import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const navLink = (to: string, label: string) => (
    <Button
      component={Link}
      to={to}
      variant={pathname === to ? "light" : "subtle"}
      size="sm"
      color="teal"
    >
      {label}
    </Button>
  );

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
            {navLink("/", "Pitches")}
            {navLink("/my-bookings", "My Bookings")}
            {user && (
              <Text size="sm" fw={500} visibleFrom="sm">
                {user.name}
              </Text>
            )}
            <Button onClick={handleLogout} variant="default" size="sm">
              Logout
            </Button>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Main bg="gray.0">
        <div className="mx-auto max-w-5xl">{children}</div>
      </AppShell.Main>
    </AppShell>
  );
}
