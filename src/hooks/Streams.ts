import { AbstractAddress, BN } from "fuels";
import { TOKEN_STREAMING_CONTRACT_ID } from "@/constants/constants";
import { useTokenStreamingAbi } from "hooks/TokenStreamingAbi";
import { useEffect } from "react";
import { compact, isEqual, uniqBy } from "lodash";
import { TokenStreaming } from "../../types";
import { AssetIdInput, StreamOutput } from "../../types/TokenStreaming";
import { serializeStream, setStreams } from "@/redux/streamsSlice";
import { useDispatch, useSelector } from "react-redux";
import { selectAllCoins, CoinQuantityWithId } from "@/redux/coinsSlice";
import { selectAllStreams } from "@/redux/streamsSlice";

const getStream = async (tokenContract: TokenStreaming, shareToken: string) => {
  try {
    const response = await tokenContract?.functions
      .get_stream_by_vault_share_id({ bits: shareToken })
      .get();
    return response;
  } catch (e) {
    console.error(`Error: ${e} not a stream token`);
  }
};

export type Stream = StreamOutput & { id: string };

const getStreamResponses = async (
  tokenContract: TokenStreaming | undefined,
  coins: CoinQuantityWithId[],
): Promise<Stream[]> => {
  if (!tokenContract || coins.length === 0) return [];

  const streams = uniqBy(
    compact(
      await Promise.all(
        coins
          .filter((coin) => new BN(coin.amount).eq(new BN(1)))
          .map(async (coin) => {
            const stream = (await getStream(tokenContract, coin.assetId))
              ?.value;

            if (stream) {
              return {
                ...stream[0],
                id: stream[1].toString(),
              };
            }

            return undefined;
          }),
      ),
    ),
    "id",
  );

  return streams;
};

export const useRefreshStreams = (
  contractId: AbstractAddress | string = TOKEN_STREAMING_CONTRACT_ID,
) => {
  const tokenContract = useTokenStreamingAbi(contractId);
  const coins = useSelector(selectAllCoins);
  const globalStreams = useSelector(selectAllStreams);
  const dispatch = useDispatch();

  const refreshStreams = async () => {
    const newStreams = await getStreamResponses(tokenContract, coins);
    // console.log("refreshStreams - ", refreshStreams);

    if (newStreams && !isEqual(newStreams, globalStreams)) {
      dispatch(setStreams(newStreams.map(serializeStream)));
    }
  };

  return {
    refreshStreams,
  };
};

export const useFetchStreams = (
  contractId: AbstractAddress | string = TOKEN_STREAMING_CONTRACT_ID,
): void => {
  const tokenContract = useTokenStreamingAbi(contractId);
  const coins = useSelector(selectAllCoins);
  // console.log("coins - ", coins);

  const globalStreams = useSelector(selectAllStreams);
  const dispatch = useDispatch();

  useEffect(() => {
    if (tokenContract && coins.length) {
      getStreamResponses(tokenContract, coins).then((responseStreams) => {
        if (responseStreams && !isEqual(responseStreams, globalStreams)) {
          dispatch(setStreams(responseStreams.map(serializeStream)));
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coins]);
};

export const isUserOwnerOfSenderAsset = (
  senderAsset: AssetIdInput,
  userCoins: CoinQuantityWithId[],
) => {
  return !!userCoins.find((coin) => coin.assetId === senderAsset.bits);
};

export const isUserOwnerOfReceiverAsset = (
  receiverAsset: AssetIdInput,
  userCoins: CoinQuantityWithId[],
) => {
  return !!userCoins.find((coin) => coin.assetId === receiverAsset.bits);
};

// TODO: this should be a recoil selector
export const useSenderStreams = () => {
  const globalStreams = useSelector(selectAllStreams);
  const coins = useSelector(selectAllCoins);

  return globalStreams?.filter((stream) =>
    isUserOwnerOfSenderAsset(stream.sender_asset, coins),
  );
};

// TODO: this should be a recoil selector
export const useReceiverStreams = () => {
  const globalStreams = useSelector(selectAllStreams);
  const coins = useSelector(selectAllCoins);

  return globalStreams?.filter((stream) =>
    isUserOwnerOfReceiverAsset(stream.receiver_asset, coins),
  );
};
