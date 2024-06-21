"use client";
import { CardButton } from "@/components/Buttons/CardButton";
import { Flex, Title, Text, useMantineTheme } from "@mantine/core";
import { IconEdit, IconSend2 } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const theme = useMantineTheme();

  const router = useRouter();
  return (
    <Flex
      style={{ height: "80vh", backgroundColor: theme.colors.dark[7] }}
      align="center"
      justify="center"
    >
      <Flex direction="column" align="center" gap={60} w="100%">
        <Flex direction="column" align="center" gap={12} w="100%">
          <Title
            order={1}
            style={{ fontSize: "2.5rem", color: theme.colors.gray[2] }}
          >
            Welcome to Pipeline
          </Title>
          <Text>
            Get started by creating a new stream or managing your existing one
          </Text>
        </Flex>
        <Flex
          gap={20}
          style={{ maxWidth: "1000px", width: "100%" }}
          direction={{ base: "column", sm: "row" }}
        >
          <CardButton
            onClick={() => router.push("/create")}
            title="Create Stream"
            description="Start a new streaming session"
            icon={<IconSend2 size={32} style={{ color: theme.primaryColor }} />}
          />
          <CardButton
            onClick={() => router.push("/manage")}
            title="Manage Existing Stream"
            description="Adjust or view your current streams"
            icon={<IconEdit size={32} style={{ color: theme.primaryColor }} />}
          />
        </Flex>
      </Flex>
    </Flex>
  );
}
