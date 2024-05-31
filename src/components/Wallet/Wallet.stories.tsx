import { Meta, StoryObj } from "@storybook/react";
import { WalletView } from "./WalletView";

const meta = {
  title: "Components/Wallet",
  component: WalletView,
  parameters: {
    argTypes: {
      isLoading: { control: "text" },
      isError: { control: "text" },
      isConnected: { control: "boolean" },
      error: { control: "text" },
    },
  },
} satisfies Meta<typeof WalletView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    isConnected: false,
    isLoading: false,
    isError: false,
    connectAsync: (connectorName) => {
      setTimeout(() => console.log("Connected: ", connectorName), 1000);
    },
  },
};

export const Connected: Story = {
  args: {
    account: "fuel1uhqvftyxuwdq2hv8ratlaznywqp9w0anl29y0guls0xu7xwz453seekcnf",
    isConnected: true,
    isLoading: false,
    isError: false,
    connectAsync: (connectorName) => {
      setTimeout(() => console.log("Connected: ", connectorName), 1000);
    },
  },
};

export const Loading: Story = {
  args: {
    isConnected: false,
    isLoading: true,
    isError: false,
    connectAsync: (connectorName) => {
      setTimeout(() => console.log("Connected: ", connectorName), 1000);
    },
  },
};
