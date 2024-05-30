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
// TODO: Change the font type to fit your project.
const inter = Inter({ subsets: ["latin"] });
import { useIsMobile } from "@/hooks/useIsMobile";
import { Header } from "@/components/Header/Header";
import { useEffect, useState } from "react";

export type createOrManageSet = "create" | "manage";

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
  const isMobile = useIsMobile();

  const [createOrManage, setCreateOrManage] = useState<createOrManageSet>(
    () => {
      if (typeof window !== "undefined") {
        return (
          (localStorage.getItem("createOrManage") as createOrManageSet) ||
          "create"
        );
      }
      return "create";
    },
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("createOrManage", createOrManage);
    }
  }, [createOrManage]);

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
        <Header
          createOrManage={createOrManage}
          setCreateOrManage={setCreateOrManage}
        />
      </AppShell.Header>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
};
