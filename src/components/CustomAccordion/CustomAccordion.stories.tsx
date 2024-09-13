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
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  return (
    <CustomAccordion>
      <CustomAccordionItem
        key={"first"}
        value="0xEadkaekLVKDJ239829WADJl"
        label="First item"
      />
      <CustomAccordionItem
        key={"second"}
        value={"0xAKELKJGDdkeo39294"}
        label={"second Item"}
      />
      <>
        {items.map((_, index) => (
          <CustomAccordionItem
            key={index}
            value={`sm${index}`}
            label={"another thing"}
          />
        ))}
      </>
    </CustomAccordion>
  );
};
