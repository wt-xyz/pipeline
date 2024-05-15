"use client";
import { FuelProvider } from "@fuels/react";
import {
  FuelWalletConnector,
  FuelWalletDevelopmentConnector,
  FueletWalletConnector,
} from "@fuels/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { RecoilRoot } from "recoil";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "./globals.css";
import { theme } from "@/theme";
import { IBM_Plex_Mono, IBM_Plex_Sans, Inter } from "next/font/google";
// TODO: Change the font type to fit your project.
const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const queryClient = new QueryClient();

  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
      </head>
      <body className={inter.className}>
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
            <MantineProvider defaultColorScheme={"dark"} theme={theme}>
              <RecoilRoot>{children}</RecoilRoot>
            </MantineProvider>
          </FuelProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
