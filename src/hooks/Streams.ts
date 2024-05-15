import { AbstractAddress, BN, CoinQuantity } from "fuels";
import { TOKEN_STREAMING_CONTRACT_ID } from "@/constants/constants";
import { useRecoilState } from "recoil";
import { globalStreams } from "components/MainPage";
import { useTokenStreamingAbi } from "hooks/TokenStreamingAbi";
import { useEffect } from "react";
import { compact } from "lodash";
import { useCoins } from "hooks/useCoins";
import { TokenStreamingAbi, TokenStreamingAbi__factory } from "../../types";
import { AssetIdInput } from "../../types/contracts/TokenStreamingAbi";

const getStream = async (
  tokenContract: TokenStreamingAbi,
  shareToken: string,
) => {
  console.log(`running getStream function with shareToken ${shareToken}`);
  try {
    const response = await tokenContract?.functions
      .get_stream_by_vault_share_id({ value: shareToken })
      .addContracts([tokenContract])
      .simulate();
    console.log("response", response);
    return response;
  } catch (e) {
    console.log("response led to error");
    console.error(`Error: ${e} not a stream token`);
  }
};

export type Stream = StreamOutput & { streamId: string };
export const useStreams = (
  contractId: AbstractAddress | string = TOKEN_STREAMING_CONTRACT_ID,
): Stream[] | undefined => {
  const [streams, setStreams] = useRecoilState<Stream[]>(globalStreams);
  const coins = useCoins();
  console.log("coins", coins);
  const tokenContract = useTokenStreamingAbi(contractId);

  useEffect(() => {
    if (!tokenContract || coins.length === 0) return;
    const getStreamResponses = async () => {
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

    getStreamResponses().then((streams) => {
      setStreams(streams);
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

export const useSenderStreams = () => {
  const streams = useStreams();
  const coins = useCoins();

  return streams?.filter((stream) =>
    isUserOwnerOfSenderAsset(stream.sender_asset, coins),
  );
};

export const useReceiverStreams = () => {
  const streams = useStreams();
  const coins = useCoins();

  return streams?.filter((stream) =>
    isUserOwnerOfReceiverAsset(stream.receiver_asset, coins),
  );
};
