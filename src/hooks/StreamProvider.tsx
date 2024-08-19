import React, {
  createContext,
  useState,
  useEffect,
  PropsWithChildren,
  useMemo,
} from "react";
// import Web3 from 'web3';
import PropTypes from "prop-types";
import { useWallet } from "@fuels/react";
import { Account, BN, CoinQuantity, AbstractAddress } from "fuels";
import { TOKEN_STREAMING_CONTRACT_ID } from "@/constants/constants";
import { UseTokenStreamingAbiWithWallet } from "hooks/TokenStreamingAbi";
import { compact, isEqual, uniqBy } from "lodash";
import { TokenStreamingAbi } from "../../types";
import { AssetIdInput } from "../../types/contracts/TokenStreamingAbi";
import { Stream } from "./Streams";
// import { ConnectExtension } from '@magic-ext/connect';
// import { Magic } from 'magic-sdk';

export const StreamContext = createContext<{
  coins: CoinQuantity[];
  streams: Stream[];
  sendingStreams: Stream[];
  receiverStreams: Stream[];
}>({
  coins: [],
  streams: [],
  sendingStreams: [],
  receiverStreams: [],
});

export const StreamProvider = ({ children }: PropsWithChildren) => {
  const wallet = useWallet();
  const [coins, setCoins] = useState<CoinQuantity[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);

  const isUserOwnerOfSenderAsset = (
    senderAsset: AssetIdInput,
    userCoins: CoinQuantity[],
  ) => {
    return !!userCoins.find((coin) => coin.assetId === senderAsset.bits);
  };

  const isUserOwnerOfReceiverAsset = (
    receiverAsset: AssetIdInput,
    userCoins: CoinQuantity[],
  ) => {
    return !!userCoins.find((coin) => coin.assetId === receiverAsset.bits);
  };

  const receiverStreams = useMemo(() => {
    return streams?.filter((stream) =>
      isUserOwnerOfReceiverAsset(stream.receiver_asset, coins),
    );
  }, [streams, coins]);

  const sendingStreams = useMemo(() => {
    return streams?.filter((stream) =>
      isUserOwnerOfSenderAsset(stream.sender_asset, coins),
    );
  }, [streams, coins]);

  const fetchCoins = async (
    wallet: Account | null | undefined,
  ): Promise<CoinQuantity[] | undefined> => {
    if (wallet == undefined) {
      return;
    }

    return wallet.getBalances();
  };

  const getStream = async (
    tokenContract: TokenStreamingAbi,
    shareToken: string,
  ) => {
    try {
      const response = await tokenContract?.functions
        .get_stream_by_vault_share_id({ bits: shareToken })
        .get();
      return response;
    } catch (e) {
      console.error(`Error: ${e} not a stream token`);
    }
  };

  const getStreamResponses = async (
    tokenContract: TokenStreamingAbi | undefined,
    coins: CoinQuantity[],
  ) => {
    if (!tokenContract || coins.length === 0) return;

    const result = await Promise.all(
      coins
        .filter((coin) => coin.amount.eq(new BN(1)))
        .map(async (coin) => {
          const stream = (await getStream(tokenContract, coin.assetId))?.value;

          return stream
            ? {
                ...stream[0],
                streamId: stream[1].toString(),
              }
            : undefined;
        }),
    );

    const streams = uniqBy(compact(result) as Stream[], "streamId");

    return streams;
  };

  const handleFetchStreams = (
    contractId: AbstractAddress | string = TOKEN_STREAMING_CONTRACT_ID,
  ) => {
    console.log("wallet - ", wallet);
    console.log("wallet.wallet - ", wallet.wallet);

    const tokenContract = UseTokenStreamingAbiWithWallet(
      contractId,
      wallet.wallet,
    );

    console.log("tokenContract", tokenContract, coins);

    if (tokenContract && coins.length > 0) {
      getStreamResponses(tokenContract, coins).then((responseStreams) => {
        if (responseStreams?.length && !isEqual(responseStreams, streams)) {
          setStreams(responseStreams);
        }
      });
    }
  };

  useEffect(() => {
    fetchCoins(wallet.wallet).then((fetchedCoins) => {
      if (fetchedCoins != undefined) {
        setCoins(fetchedCoins);
      }
    });
  }, [setCoins, wallet.wallet]);

  useEffect(() => {
    if (coins?.length > 0) {
      console.log("updated conis");
      handleFetchStreams();
    }
  }, [coins, handleFetchStreams]);

  return (
    <StreamContext.Provider
      value={{
        coins: coins,
        streams: streams,
        receiverStreams: receiverStreams,
        sendingStreams: sendingStreams,
      }}
    >
      {children}
    </StreamContext.Provider>
  );
};

StreamProvider.propTypes = {
  children: PropTypes.any,
};
