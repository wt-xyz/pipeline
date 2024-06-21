import { useMantineTheme, Card, Flex, Text } from "@mantine/core";
import { useHover } from "@mantine/hooks";

export const CardButton = ({
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
