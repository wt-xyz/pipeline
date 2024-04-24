import { Card, CardProps, Flex, Text, useMantineTheme } from "@mantine/core";
import classes from "./FieldCard.module.scss";

type FieldCardProps = {
  valueTextColor: string;
  value: string;
  label: string;
} & CardProps; // Extend with Mantine CardProps

export const FieldCard = ({
  valueTextColor,
  value,
  label,
  ...cardProps
}: FieldCardProps) => (
  <>
    <Card
      bg={"gray.9"}
      radius={"lg"}
      className={classes.FieldCard}
      {...cardProps}
    >
      <Flex gap={"sm"} className={classes.TextContainer}>
        <Text fz={"sm"} fw="400">
          {" "}
          {label}
        </Text>
        <Text
          size={"lg"}
          fw="600"
          c={valueTextColor}
          className={classes.ValueText}
        >
          {value}
        </Text>
      </Flex>
    </Card>
  </>
);
