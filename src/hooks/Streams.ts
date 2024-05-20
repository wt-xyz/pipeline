import { AbstractAddress, BN, CoinQuantity } from "fuels";
import { TOKEN_STREAMING_CONTRACT_ID } from "@/constants/constants";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { globalStreams } from "components/MainPage";
import { useTokenStreamingAbi } from "hooks/TokenStreamingAbi";
import { useEffect } from "react";
import { compact, isEqual } from "lodash";
import { globalCoins } from "hooks/useCoins";
import { TokenStreamingAbi, TokenStreamingAbi__factory } from "../../types";
import {
  AssetIdInput,
  StreamOutput,
} from "../../types/contracts/TokenStreamingAbi";

const getStream = async (
  tokenContract: TokenStreamingAbi,
  shareToken: string,
) => {
  console.log(`running getStream function with shareToken ${shareToken}`);
  try {
    const response = await tokenContract?.functions
      .get_stream_by_vault_share_id({ value: shareToken })
      // .addContracts([tokenContract])
      .get();
    console.log("response", response);
    return response;
  } catch (e) {
    console.log("response led to error");
    console.error(`Error: ${e} not a stream token`);
  }
};

export type Stream = StreamOutput & { streamId: string };
const getStreamResponses = async (
  tokenContract: TokenStreamingAbi | undefined,
  coins: CoinQuantity[],
) => {
  if (!tokenContract || coins.length === 0) return;
  console.log("running getStreamResponses REFETCH");
  return (
    (
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
      ) as Stream[]
    )
      // TODO this feels a bit hacky here, findIndex run so many times, maybe a reducer is better
      .filter(
        (obj, index, self) =>
          index === self.findIndex((t) => t.streamId === obj.streamId),
      )
  );
};

export const useRefreshStreams = (
  contractId: AbstractAddress | string = TOKEN_STREAMING_CONTRACT_ID,
) => {
  const [streams, setStreams] = useRecoilState(globalStreams);
  const tokenContract = useTokenStreamingAbi(contractId);
  const coins = useRecoilValue(globalCoins);

  const refreshStreams = async () => {
    const newStreams = await getStreamResponses(tokenContract, coins);
    if (newStreams && !isEqual(newStreams, streams)) {
      setStreams(newStreams);
    }
  };

  return {
    refreshStreams,
  };
};

export const useFetchStreams = (
  contractId: AbstractAddress | string = TOKEN_STREAMING_CONTRACT_ID,
): Stream[] | undefined => {
  console.log("running useFetchStreams");
  const [streams, setStreams] = useRecoilState<Stream[]>(globalStreams);
  const coins = useRecoilValue(globalCoins);
  const tokenContract = useTokenStreamingAbi(contractId);

  useEffect(() => {
    getStreamResponses(tokenContract, coins).then((responseStreams) => {
      if (responseStreams && !isEqual(responseStreams, streams)) {
        setStreams(responseStreams);
      }
    });
  }, [coins, tokenContract]);

  return streams;
};

export const isUserOwnerOfSenderAsset = (
  senderAsset: AssetIdInput,
  userCoins: CoinQuantity[],
) => {
  return !!userCoins.find((coin) => coin.assetId === senderAsset.value);
};

export const isUserOwnerOfReceiverAsset = (
  receiverAsset: AssetIdInput,
  userCoins: CoinQuantity[],
) => {
  return !!userCoins.find((coin) => coin.assetId === receiverAsset.value);
};

// TODO: this should be a recoil selector
export const useSenderStreams = () => {
  const streams = useRecoilValue(globalStreams);
  const coins = useRecoilValue(globalCoins);

  return streams?.filter((stream) =>
    isUserOwnerOfSenderAsset(stream.sender_asset, coins),
  );
};

// TODO: this should be a recoil selector
export const useReceiverStreams = () => {
  const streams = useRecoilValue(globalStreams);
  const coins = useRecoilValue(globalCoins);

  return streams?.filter((stream) =>
    isUserOwnerOfReceiverAsset(stream.receiver_asset, coins),
  );
};
