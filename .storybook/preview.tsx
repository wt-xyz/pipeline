import "../src/app/globals.css";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import { MantineProvider } from "@mantine/core";
import { theme } from "../src/theme";

export const decorators = [
  (Story) => (
    <MantineProvider theme={theme} defaultColorScheme={"dark"}>
      <Story />
    </MantineProvider>
  ),
];
