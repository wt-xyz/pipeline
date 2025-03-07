"use client";
import {
  Group,
  Title,
  Text,
  Button,
  SimpleGrid,
  Card,
  Badge,
  Box,
  useMantineTheme,
  Container,
  Paper,
} from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import { VestingChart } from "./vesting-chart";
import Link from "next/link";

export default function DesignerPage() {
  const theme = useMantineTheme();

  const vestingOptions = [
    {
      id: "linear",
      title: "Linear",
      description: "Vesting at a constant rate/second",
      type: "linear",
      popular: true,
    },
    {
      id: "piecewise-linear",
      title: "Piecewise Linear",
      description: "Multiple linear segments with varying rates",
      type: "piecewise-linear",
      popular: true,
    },
  ];

  return (
    <Box style={{ backgroundColor: theme.colors.dark[8], minHeight: "100vh" }}>
      <Container size="xl" py="lg">
        <Box mb="md">
          <Group gap={5} mt={5}>
            <Text size="sm" c="dimmed" span>
              # On-chain token vesting locks funds upfront for secure
              allocation.
            </Text>
          </Group>
        </Box>

        <Group mb="xl">
          <Title order={2}>Select Shape</Title>
        </Group>

        <Text mb="md">One or Multiple Lockup Streams</Text>

        <Paper p={0} radius="md">
          <SimpleGrid
            cols={{ base: 1, xs: 2, md: 2, lg: 2 }}
            spacing={{ base: "sm", md: "md" }}
          >
            {vestingOptions.map((option) => (
              <Card
                key={option.id}
                shadow="sm"
                padding="md"
                radius="md"
                withBorder
                style={{
                  backgroundColor: theme.colors.dark[6],
                  borderColor: theme.colors.dark[6],
                }}
              >
                <Card.Section
                  h={{ base: 120, md: 150 }}
                  p={{ base: 16, md: 20 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Box w="100%" h="100%">
                    <VestingChart type={option.type} />
                  </Box>
                </Card.Section>

                <Title order={4} mt="md">
                  {option.title}
                </Title>
                <Text size="sm" c="dimmed" mt={5} mb="xl">
                  {option.description}
                </Text>

                <Group justify="space-between" mt="auto">
                  <Link
                    href={`/create/?shape=${option.type}`}
                    style={{ textDecoration: "none" }}
                  >
                    <Button
                      variant="subtle"
                      color="gray"
                      rightSection={<IconArrowRight size={16} />}
                    >
                      Pick this
                    </Button>
                  </Link>

                  {option.popular && (
                    <Badge color="green" variant="light">
                      Popular
                    </Badge>
                  )}
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        </Paper>
      </Container>
    </Box>
  );
}
