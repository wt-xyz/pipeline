import { useConnectUI, useAccount } from "@fuels/react";
import { WalletView } from "./WalletView";
import { useDisclosure } from "@mantine/hooks";
import { Modal, Button, Flex } from "@mantine/core";
import { useEffect, useState } from "react";

export const Wallet = () => {
  const { connect, isConnecting, isLoading, isError, error } = useConnectUI();
  const { account } = useAccount();
  const [opened, { open, close }] = useDisclosure(false);

  // delay checking if wallet is connected for .5 second to allow the wallet to connect
  useEffect(() => {
    const timer = setTimeout(() => {
      !!account === false ? open() : close();
    }, 500);

    return () => clearTimeout(timer);
  }, [account]);

  return (
    <>
      <WalletView
        isConnected={!!account}
        isError={isError}
        isLoading={isConnecting || isLoading}
        error={error instanceof Error ? error.message : undefined}
        connectAsync={connect}
        account={account ?? ""}
      />

      <Modal
        opened={opened}
        title="Connect wallet"
        centered
        onClose={() => {
          // noop
        }}
        withCloseButton={false}
      >
        <Flex justify="center" align="center" p="xl">
          <Button onClick={connect}>Connect Wallet</Button>
        </Flex>
      </Modal>
    </>
  );
};
