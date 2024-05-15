import { Meta, StoryObj } from "@storybook/react";
import { Header } from "components/Header/Header";

const meta = {
  title: "Components/Header",
  component: Header,
  parameters: {
    argTypes: {
      createOrManage: { control: "text" },
      value: { control: "text" },
    },
  },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    createOrManage: "create",
    setCreateOrManage: () => {
      console.log("setCreateOrManage");
    },
  },
};
