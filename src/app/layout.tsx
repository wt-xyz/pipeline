"use client";
import { FuelProvider } from "@fuels/react";
import {
  FuelWalletConnector,
  FuelWalletDevelopmentConnector,
  FueletWalletConnector,
} from "@fuels/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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
import { Provider } from "react-redux";
import { store } from "@/redux/store";
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const queryClient = new QueryClient();
  const client = new ApolloClient({
    uri: "http://localhost:8080/v1/graphql", // Replace with your GraphQL API endpoint
    cache: new InMemoryCache(),
  });

  return (
    <html lang="en">
      <link rel="icon" href="PL_logo.svg" type="image/svg+xml" />
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body className={inter.className}>
        <ApolloProvider client={client}>
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
                <Provider store={store}>
                  <Notifications position="top-left" containerWidth="600px" />
                  <AppShellLayout>{children}</AppShellLayout>
                </Provider>
              </MantineProvider>
            </FuelProvider>
          </QueryClientProvider>
        </ApolloProvider>
      </body>
    </html>
  );
}

const AppShellLayout = ({ children }: { children: React.ReactNode }) => {
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
