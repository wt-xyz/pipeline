import { Meta, StoryObj } from "@storybook/react";
import { SendingAndReceiving } from "components/SendingAndReceiving/SendingAndReceiving";

const meta = {
  title: "Components/SendingAndReceiving",
  component: SendingAndReceiving,
  parameters: {
    argTypes: {},
  },
} satisfies Meta<typeof SendingAndReceiving>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {},
};
