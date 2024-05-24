import { Card, CardProps, Flex, Text } from "@mantine/core";
import { TextSm } from "components/TextVariants";
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
}: FieldCardProps) => {
  return (
    <>
      <Card
        bg={"gray.9"}
        radius={"lg"}
        className={classes.FieldCard}
        {...cardProps}
      >
        <Flex gap={"sm"} className={classes.TextContainer}>
          <TextSm fw="400">{label}</TextSm>
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
};
