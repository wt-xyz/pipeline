import { Meta, StoryObj } from "@storybook/react";
import { CreateOrManageButtonGroupWithDivider } from "components/CreateOrManageButtonGroup/CreateOrManageButtonGroupWithDivider";

const meta = {
  title: "Components/CreateOrManageButtonGroupWithDivider",
  component: CreateOrManageButtonGroupWithDivider,
  parameters: {
    argTypes: {
      createOrManage: { control: "text" },
      value: { control: "text" },
    },
  },
} satisfies Meta<typeof CreateOrManageButtonGroupWithDivider>;

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
