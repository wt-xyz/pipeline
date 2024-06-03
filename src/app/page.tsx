"use client";
import { NavLinkButton } from "@/components/Buttons/NavLinkButton";
import { Flex, Title, useMantineTheme } from "@mantine/core";

export default function Home() {
  const theme = useMantineTheme();
  return (
    <Flex style={{ height: "100vh" }} align="center" justify="center">
      <Flex direction="column" align="center" gap={24}>
        <Title order={3}>Start Streaming Now!</Title>
        <Flex gap={10}>
          <NavLinkButton
            label="Create Stream"
            path="/create"
            color={theme.primaryColor}
            variant="light"
          />
          <NavLinkButton
            label="Manage Existing Stream"
            path="/manage"
            color={theme.primaryColor}
            variant="light"
          />
        </Flex>
      </Flex>
    </Flex>
  );
}
