import "../src/app/globals.css";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import { MantineProvider } from "@mantine/core";
import {
  FuelWalletConnector,
  FuelWalletDevelopmentConnector,
  FueletWalletConnector,
} from "@fuels/connectors";
import { FuelProvider } from "@fuels/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { theme } from "../src/theme";
import { RecoilRoot } from "recoil";

const BlackBackdrop = ({ children }) => (
  <div style={{ backgroundColor: "black", height: "100vh", padding: "20px" }}>
    {children}
  </div>
);

export const decorators = [
  (Story) => {
    const queryClient = new QueryClient();

    return (
      <BlackBackdrop>
        <QueryClientProvider client={queryClient}>
          <FuelProvider
            fuelConfig={{
              connectors: [
                new FuelWalletConnector(),
                new FuelWalletDevelopmentConnector(),
                new FueletWalletConnector(),
              ],
            }}
          >
            <RecoilRoot>
              <MantineProvider theme={theme}>
                <Story />
              </MantineProvider>
            </RecoilRoot>
          </FuelProvider>
        </QueryClientProvider>
      </BlackBackdrop>
    );
  },
];
