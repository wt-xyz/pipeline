import React from "react";
import type { Meta } from "@storybook/react";
import { CustomAccordion } from "./CustomAccordion";
import { CustomAccordionItem } from "components/CustomAccordionItem/CustomAccordionItem";

const meta = {
  title: "Components/CustomAccordion",
  component: CustomAccordion,
  parameters: {
    argTypes: {
      bg: { control: "color" },
      valueTextColor: { control: "color" },
    },
  },
} satisfies Meta<typeof CustomAccordion>;

export default meta;

export const Primary = () => {
  return (
    <CustomAccordion>
      <CustomAccordionItem
        value="0xEadkaekLVKDJ239829WADJl"
        label="First item"
      />
      <CustomAccordionItem
        value={"0xAKELKJGDdkeo39294"}
        label={"seccond Item"}
      />
    </CustomAccordion>
  );
};
