import type { Meta } from "@storybook/react";
import { CustomAccordionItem } from "./CustomAccordionItem";
import { useState } from "react";
import { useMantineTheme } from "@mantine/core";

const meta = {
  title: "Components/CustomAccordionItem",
  component: CustomAccordionItem,
  parameters: {
    argTypes: {
      bg: { control: "color" },
      valueTextColor: { control: "color" },
    },
  },
} satisfies Meta<typeof CustomAccordionItem>;

export default meta;

export const Primary = () => {
  const [isOpen, setIsOpen] = useState(true);
  const theme = useMantineTheme();

  return (
    <CustomAccordionItem
      value="0xEadkaekLVKDJ239829WADJl"
      isOpen={isOpen}
      toggle={() => setIsOpen(!isOpen)}
    />
  );
};
