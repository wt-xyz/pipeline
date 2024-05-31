"use client";
import { NavLinkButton } from "@/components/Buttons/NavLinkButton";
import { Flex, Title } from "@mantine/core";

export default function Home() {
  return (
    <Flex style={{ height: "100vh" }} align="center" justify="center">
      <Flex direction="column" align="center" gap={24}>
        <Title order={3}>Start Streaming Now!</Title>
        <div>
          <NavLinkButton label="Create" path="/create" />
          <NavLinkButton label="Manage" path="/manage" />
        </div>
      </Flex>
    </Flex>
  );
}
