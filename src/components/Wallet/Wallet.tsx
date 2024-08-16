import { useConnectUI, useAccount } from "@fuels/react";
import { WalletView } from "./WalletView";
import { useDisclosure } from "@mantine/hooks";
import { Modal, Button, TextInput } from "@mantine/core";
import { useEffect } from "react";

export const Wallet = () => {
  const { connect, isConnecting, isLoading, isError, error } = useConnectUI();
  const { account } = useAccount();
  const [opened, { open, close }] = useDisclosure(false);
  // console.log("status", status);
  // const { connectAsync, isError, isLoading, error, status } = useConnect();
  // const { isConnected } = useIsConnected();

  useEffect(() => {
    !!account === false ? open() : close();
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
        onClose={() => {
          /* no-op */
        }}
        title="Connect wallet"
        centered
      >
        <Button onClick={connect}>Connect Wallet</Button>
      </Modal>
    </>
  );
};
