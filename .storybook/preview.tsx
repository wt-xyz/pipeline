import "../src/app/globals.css";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import { MantineProvider } from "@mantine/core";
import { FuelProvider } from "@fuels/react";
import { theme } from "../src/theme";
import { RecoilRoot } from "recoil";

const BlackBackdrop = ({ children }) => (
  <div style={{ backgroundColor: "black", height: "100vh", padding: "20px" }}>
    {children}
  </div>
);

export const decorators = [
  (Story) => (
    <BlackBackdrop>
      <FuelProvider>
        <RecoilRoot>
          <MantineProvider theme={theme}>
            <Story />
          </MantineProvider>
        </RecoilRoot>
      </FuelProvider>
    </BlackBackdrop>
  ),
];
