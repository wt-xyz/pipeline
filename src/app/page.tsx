"use client";
import { NavLinkButton } from "@/components/Buttons/NavLinkButton";
import { Flex } from "@mantine/core";

export default function Home() {
  return (
    <Flex style={{ height: "100vh" }} align="center" justify="center">
      <div>
        <NavLinkButton label="Create" path="/create" />
        <NavLinkButton label="Manage" path="/manage" />
      </div>
    </Flex>
  );
}
