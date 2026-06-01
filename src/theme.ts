import { createTheme } from "@mantine/core";

/** Shared Mantine theme — emerald primary to match the cricket/turf vibe. */
export const theme = createTheme({
  primaryColor: "teal",
  fontFamily:
    "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
  defaultRadius: "md",
  cursorType: "pointer",
});
