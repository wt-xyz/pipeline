"use client";
import { FuelProvider } from "@fuels/react";
import {
  FuelWalletConnector,
  FuelWalletDevelopmentConnector,
  FueletWalletConnector,
} from "@fuels/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { RecoilRoot } from "recoil";
import { AppShell, ColorSchemeScript, MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "./globals.css";
import { theme } from "@/theme";
import { Inter } from "next/font/google";
import { Notifications } from "@mantine/notifications";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Header } from "@/components/Header/Header";
import { useFetchStreams } from "hooks/Streams";
import { useFetchCoins } from "hooks/useCoins";

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
              <RecoilRoot>
                <Notifications position="top-left" containerWidth="600px" />
                <AppShellLayout>{children}</AppShellLayout>
              </RecoilRoot>
            </MantineProvider>
          </FuelProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}

const AppShellLayout = ({ children }: { children: React.ReactNode }) => {
  useFetchStreams();
  useFetchCoins();
  const isMobile = useIsMobile();

  return (
    <AppShell
      bg={"background"}
      px={isMobile ? "lg" : "120px"}
      header={{ height: "84px" }}
    >
      <AppShell.Header
        style={{
          display: "flex",
          justifyItems: "center",
          justify: "center",
        }}
        px={"sxl"}
      >
        <Header />
      </AppShell.Header>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
};
