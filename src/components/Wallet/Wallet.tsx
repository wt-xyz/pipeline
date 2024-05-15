import { useConnectUI, useAccount } from "@fuels/react";
import { WalletView } from "./WalletView";

export const Wallet = () => {
  const { connect, isConnecting, isLoading, isError, error } = useConnectUI();
  const { account } = useAccount();
  // console.log("status", status);
  // const { connectAsync, isError, isLoading, error, status } = useConnect();
  // const { isConnected } = useIsConnected();

  return (
    <WalletView
      isConnected={!!account}
      isError={isError}
      isLoading={isConnecting || isLoading}
      error={error instanceof Error ? error.message : undefined}
      connectAsync={connect}
      account={account ?? ""}
    />
  );
};
