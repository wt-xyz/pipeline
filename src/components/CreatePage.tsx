import {
  Container,
  Box,
  Title,
  Text,
  useMantineTheme,
  Paper,
  Group,
  ActionIcon,
} from "@mantine/core";
import { TextXxl } from "components/TextVariants";
import { useIsMobile } from "hooks/useIsMobile";
import { CreateStreamForm } from "components/CreateStreamForm";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconChevronLeft } from "@tabler/icons-react";
import Link from "next/link";
import { VestingChart } from "@/app/designer/vesting-chart";
import PieceWiseDesigner from "./Charts";

export const CreatePage = () => {
  const isMobile = useIsMobile();
  const theme = useMantineTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const shape = searchParams.get("shape");

  // Redirect to linear shape if no shape is provided
  useEffect(() => {
    if (!shape) {
      router.replace("/create/?shape=linear");
    }
  }, [shape, router]);

  // If no shape is provided yet, show loading or return null
  if (!shape) {
    return null;
  }

  // Get the title based on the shape
  const getShapeTitle = () => {
    switch (shape) {
      case "linear":
        return "Linear Vesting";
      case "piecewise-linear":
        return "Piecewise Linear";
      default:
        return "Linear Vesting";
    }
  };

  // Render the appropriate form based on the shape
  const renderForm = () => {
    switch (shape) {
      case "linear":
        return <CreateStreamForm />;
      case "piecewise-linear":
        return <PieceWiseDesigner />;
      default:
        return <CreateStreamForm />;
    }
  };

  return (
    <Container pt={isMobile ? "xxl" : "sxl"} px={0} pb={"xl"}>
      <TextXxl fw={600} pb={"xxl"}>
        Pipeline
      </TextXxl>
      <Group mb="xl">
        <Link href="/designer" style={{ textDecoration: "none" }}>
          <ActionIcon variant="subtle" color="gray">
            <IconChevronLeft size={20} />
          </ActionIcon>
        </Link>
        <Title order={2}>Create {getShapeTitle()}</Title>
      </Group>

      <Paper p="xl" radius="md" bg={theme.colors.dark[7]}>
        <Group mb="lg">
          <Box w={200} h={100}>
            <VestingChart type={shape} />
          </Box>
          <Box>
            <Title order={3}>{getShapeTitle()}</Title>
            <Text c="dimmed" mt="xs">
              Configure your {getShapeTitle().toLowerCase()} parameters
            </Text>
          </Box>
        </Group>

        <Text>
          This is the create page for the {getShapeTitle().toLowerCase()} shape.
        </Text>
      </Paper>
      {renderForm()}
    </Container>
  );
};

export default CreatePage;
