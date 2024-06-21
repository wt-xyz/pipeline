"use client";
import { Card, Flex, Title, Text, useMantineTheme } from "@mantine/core";
import { useHover } from "@mantine/hooks";
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

const CardButton = ({
  onClick,
  title,
  description,
  icon,
}: {
  onClick: () => void;
  title: string;
  description: string;
  icon: React.ReactNode;
}) => {
  const theme = useMantineTheme();
  const { hovered, ref } = useHover();

  return (
    <Card
      ref={ref}
      shadow="lg"
      radius="md"
      padding="lg"
      withBorder
      style={{
        backgroundColor: hovered ? theme.colors.gray[9] : undefined,
        cursor: "pointer",
        width: "100%",
      }}
      onClick={onClick}
    >
      <Flex direction="column" align="center" justify="center" gap={20}>
        <Flex direction="column" align="center" justify="center">
          <Text size="lg" style={{ marginBottom: "10px" }}>
            {title}
          </Text>
          <Text
            size="sm"
            style={{ color: theme.colors.gray[4], textAlign: "center" }}
          >
            {description}
          </Text>
        </Flex>
        {icon}
      </Flex>
    </Card>
  );
};
