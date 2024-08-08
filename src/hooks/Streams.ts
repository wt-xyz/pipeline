import { AbstractAddress, BN, CoinQuantity } from "fuels";
import { TOKEN_STREAMING_CONTRACT_ID } from "@/constants/constants";
import { useTokenStreamingAbi } from "hooks/TokenStreamingAbi";
import { useEffect } from "react";
import { compact, isEqual, uniqBy } from "lodash";
import { TokenStreamingAbi } from "../../types";
import {
  AssetIdInput,
  StreamOutput,
} from "../../types/contracts/TokenStreamingAbi";
import { setGlobalStreams } from "@/redux/slice";
import { useDispatch, useSelector } from "react-redux";

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

export type Stream = StreamOutput & { streamId: string };

const getStreamResponses = async (
  tokenContract: TokenStreamingAbi | undefined,
  coins: CoinQuantity[],
) => {
  if (!tokenContract || coins.length === 0) return;

  const streams = uniqBy(
    compact(
      await Promise.all(
        coins
          .filter((coin) => coin.amount.eq(new BN(1)))
          .map(async (coin) => {
            const stream = (await getStream(tokenContract, coin.assetId))
              ?.value;

            return stream
              ? {
                ...stream[0],
                streamId: stream[1].toString(),
              }
              : undefined;
          }),
      ),
    ) as Stream[],
    "streamId",
  );

  return streams;
};

export const useRefreshStreams = (
  contractId: AbstractAddress | string = TOKEN_STREAMING_CONTRACT_ID,
) => {
  const tokenContract = useTokenStreamingAbi(contractId);
  const coins = useSelector((state: any) => state.pipeline.coins);
  const globalStreams = useSelector((state: any) => state.pipeline.globalStreams);
  const dispatch = useDispatch();

  const refreshStreams = async () => {
    const newStreams = await getStreamResponses(tokenContract, coins);
    // console.log("refreshStreams - ", refreshStreams);

    if (newStreams && !isEqual(newStreams, globalStreams)) {
      dispatch(setGlobalStreams(newStreams));
    }
  };

  return {
    refreshStreams,
  };
};

export const useFetchStreams = (
  contractId: AbstractAddress | string = TOKEN_STREAMING_CONTRACT_ID,
): Stream[] | undefined => {
  const tokenContract = useTokenStreamingAbi(contractId);
  const coins = useSelector((state: any) => state.pipeline.coins);
  const globalStreams = useSelector((state: any) => state.pipeline.globalStreams);
  const dispatch = useDispatch();

  useEffect(() => {
    if (tokenContract && coins.length) {
      getStreamResponses(tokenContract, coins).then((responseStreams) => {
        console.log("fetchStreams - ", responseStreams);

        if (responseStreams && !isEqual(responseStreams, globalStreams)) {
          dispatch(setGlobalStreams(responseStreams));
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coins]);

  return globalStreams;
};

export const isUserOwnerOfSenderAsset = (
  senderAsset: AssetIdInput,
  userCoins: CoinQuantity[],
) => {
  return !!userCoins.find((coin) => coin.assetId === senderAsset.bits);
};

export const isUserOwnerOfReceiverAsset = (
  receiverAsset: AssetIdInput,
  userCoins: CoinQuantity[],
) => {
  return !!userCoins.find((coin) => coin.assetId === receiverAsset.bits);
};

// TODO: this should be a recoil selector
export const useSenderStreams = () => {
  const globalStreams = useSelector((state: any) => state.pipeline.globalStreams);
  const coins = useSelector((state: any) => state.pipeline.coins);

  return globalStreams?.filter((stream: any) =>
    isUserOwnerOfSenderAsset(stream.sender_asset, coins),
  );
};

// TODO: this should be a recoil selector
export const useReceiverStreams = () => {
  const globalStreams = useSelector((state: any) => state.pipeline.globalStreams);
  const coins = useSelector((state: any) => state.pipeline.coins);

  return globalStreams?.filter((stream: any) =>
    isUserOwnerOfReceiverAsset(stream.receiver_asset, coins),
  );
};
