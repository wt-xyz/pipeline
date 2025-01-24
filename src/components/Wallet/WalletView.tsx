import React from "react";
import { useBalance } from "@fuels/react";
import {
  Avatar,
  Box,
  Button,
  Card,
  Flex,
  MantineColor,
  Popover,
  Text,
  Image,
} from "@mantine/core";
import { IconWallet } from "@tabler/icons-react";
import { formatAddress } from "utils/formatUtils";
import { TextLg } from "components/TextVariants";
import { BN } from "fuels";
import ETHLogo from "@/assets/ETH.png";
import NextImage from "next/image";
import useEthConverter from "@/hooks/useETHConverter";

type WalletProps = {
  isConnected: boolean;
  connectAsync: (connectorName?: string) => void;
  isLoading: boolean;
  isError: boolean;
  error?: string;
  account?: string;
  color?: MantineColor;
};

const formatMoney = (amount: number) => {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });
  return formatter.format(amount);
};

export const WalletView = ({
  isConnected,
  connectAsync,
  isLoading,
  account = "",
  color = "white",
}: WalletProps) => {
  const { balance } = useBalance({ address: account });
  const accountBalance = new BN(balance);
  const { usdAmount } = useEthConverter({
    initialEthAmount: accountBalance.toString(),
  });

  return (
    <div>
      {isConnected ? (
        <Popover width={200} position="bottom" withArrow shadow="md">
          <Popover.Target>
            <Button
              radius={"999px"}
              h={"32px"}
              color="cardBackground"
              p={"xs"}
              pr={"md"}
            >
              <Avatar color={color} size={24}></Avatar>
              <TextLg c={color}>{formatAddress(account ?? "")}</TextLg>
            </Button>
          </Popover.Target>

          <Popover.Dropdown>
            <Card p="xs">
              <Text>Total balance</Text>

              <Box
                my="lg"
                py="md"
                component="div"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: "12px",
                  background:
                    "radial-gradient(100% 225% at 0 0, #1a1a1a 0%, #29483a 100%)",
                }}
              >
                <Box mb="sm">
                  <Image component={NextImage} src={ETHLogo} alt="" />
                </Box>
                <Flex>
                  <Text
                    size="xl"
                    mr="sm"
                    style={{
                      color: "green",
                    }}
                  >
                    {accountBalance.format()}
                  </Text>
                  <Text size="xl">ETH</Text>
                </Flex>
                <Flex>
                  <Text>{formatMoney(parseInt(usdAmount))}</Text>
                </Flex>
              </Box>
            </Card>
          </Popover.Dropdown>
        </Popover>
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
