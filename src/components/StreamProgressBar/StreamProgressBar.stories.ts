import type { Meta, StoryObj } from "@storybook/react";
import { StreamProgressBar } from "./StreamProgressBar";

const meta = {
  title: "Components/StreamProgressBar",
  component: StreamProgressBar,
} satisfies Meta<typeof StreamProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    startDate: new Date(2023, 2, 29),
    endDate: new Date(2024, 9, 18),
  },
};
