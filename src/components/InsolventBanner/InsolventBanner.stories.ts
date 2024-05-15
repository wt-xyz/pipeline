import { Meta, StoryObj } from "@storybook/react";
import { InsolventBanner } from "components/InsolventBanner/InsolventBanner";

const meta = {
  title: "Components/InsolventBanner",
  component: InsolventBanner,
  parameters: {
    argTypes: {
      createOrManage: { control: "text" },
      value: { control: "text" },
    },
  },
} satisfies Meta<typeof InsolventBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {},
};
