import React from "react";
import { useDisconnect } from "@fuels/react";
import { Avatar, Button, MantineColor } from "@mantine/core";
import { IconWallet } from "@tabler/icons-react";
import { formatAddress } from "utils/formatUtils";
import { TextLg } from "components/TextVariants";

type WalletProps = {
  isConnected: boolean;
  connectAsync: (connectorName?: string) => void;
  isLoading: boolean;
  isError: boolean;
  error?: string;
  account?: string;
  color?: MantineColor;
};

export const WalletView = ({
  isConnected,
  connectAsync,
  isLoading,
  account = "",
  color = "white",
}: WalletProps) => {
  const { disconnect } = useDisconnect();

  return (
    <div>
      {isConnected ? (
        <Button
          radius={"999px"}
          h={"32px"}
          color="cardBackground"
          onClick={() => disconnect()}
          p={"xs"}
          pr={"md"}
        >
          <Avatar color={color} size={24}></Avatar>
          <TextLg c={color}>{formatAddress(account ?? "")}</TextLg>
        </Button>
      ) : (
        <Button
          radius={"999px"}
          h={"32px"}
          onClick={() => connectAsync()}
          color="cardBackground"
          leftSection={<IconWallet color={"white"} />}
          loading={isLoading}
        >
          <TextLg c={color}>Connect Wallet</TextLg>
        </Button>
      )}
    </div>
  );
};
// :(
//   <Text c={color || "white"}>connecting...</Text>
// )
