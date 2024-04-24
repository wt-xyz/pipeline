import type { Meta, StoryObj } from "@storybook/react";
import { FieldCard } from "./FieldCard";

const meta = {
  title: "Components/FieldCard",
  component: FieldCard,
  parameters: {
    argTypes: {
      bg: { control: "color" },
      valueTextColor: { control: "color" },
    },
  },
} satisfies Meta<typeof FieldCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    label: "To",
    value: "0xEadkaekLVKDJ239829WADJl",
    valueTextColor: "white",
  },
};
