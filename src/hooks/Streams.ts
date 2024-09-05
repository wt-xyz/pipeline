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
import { RootState } from "@/redux/store";

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

// export type Stream = StreamOutput & { streamId: string };
// Define the structure of the stream object
type StreamConfig = {
  start_time: string;
  stop_time: string;
  stream_size: string;
  rate_per_second_e10: string;
  id: string;
  initial_receiver: string;
  initial_sender: string;
  receiver_asset: string;
  sender_asset: string;
  timestamp: number;
  underlying_asset: string;
  deposit: string;
};

// Create the configuration object for each stream
export type Stream = {
  cancellation_time: number | undefined;
  configuration: {
    is_cancellable: boolean;
    is_undercollateralized: boolean;
  };
  deposit: BN;
  rate_per_second_e_10: BN;
  receiver_asset: { bits: string };
  sender_asset: { bits: string };
  start_time: BN;
  stop_time: BN;
  streamId: string;
  stream_size: BN;
  underlying_asset: { bits: string };
  vested_withdrawn_amount: BN;
};

const processStream = (stream: StreamConfig): Stream => {
  // Convert necessary fields to BN and other appropriate formats
  return {
    cancellation_time: undefined, // or some logic to calculate this if needed
    configuration: {
      is_cancellable: true, // Add logic for determining cancellability
      is_undercollateralized: false, // Add logic if needed
    },
    deposit: new BN(stream.deposit), // Convert deposit to BN
    rate_per_second_e_10: new BN(stream.rate_per_second_e10), // Convert rate_per_second_e10 to BN
    receiver_asset: { bits: stream.receiver_asset }, // Convert receiver_asset to object
    sender_asset: { bits: stream.sender_asset }, // Convert sender_asset to object
    start_time: new BN(stream.start_time), // Convert start_time to BN
    stop_time: new BN(stream.stop_time), // Convert stop_time to BN
    streamId: stream.id, // Use the id directly
    stream_size: new BN(stream.stream_size), // Convert stream_size to BN
    underlying_asset: { bits: stream.underlying_asset }, // Convert underlying_asset to object
    vested_withdrawn_amount: new BN(0), // Initialize or calculate based on logic
  };
};

const getStreamResponses = async (
  tokenContract: TokenStreamingAbi | undefined,
  coins: CoinQuantity[],
) => {
  if (!tokenContract || coins.length === 0) return;

  // Get streans using indexer
  const apiUrl = "http://localhost:8080/v1/graphql";

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
          query MyQuery {
            TokenStreaming_CreateStream {
              start_time
              stop_time
              stream_size
              rate_per_second_e10
              id
              initial_receiver
              initial_sender
              receiver_asset
              sender_asset
              timestamp
              underlying_asset
              deposit
            }
          }
        `,
    }),
  });
  const json = await res.json();
  const filteredJson = json.data.TokenStreaming_CreateStream.filter(
    (jsonItem: { sender_asset: string }) =>
      coins.some((coin) => coin.assetId === jsonItem.sender_asset),
  );

  const streams = uniqBy(compact(filteredJson) as StreamConfig[], "id");
  const processedStreams = streams.map(processStream);

  return processedStreams;
};

export const useRefreshStreams = (
  contractId: AbstractAddress | string = TOKEN_STREAMING_CONTRACT_ID,
) => {
  const tokenContract = useTokenStreamingAbi(contractId);
  const coins = useSelector((state: RootState) => state.pipeline.coins);
  const globalStreams = useSelector(
    (state: RootState) => state.pipeline.globalStreams,
  );
  const dispatch = useDispatch();

  const refreshStreams = async () => {
    const newStreams = await getStreamResponses(tokenContract, coins);
    // console.log("refresh Streams - ", refreshStreams);

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
): boolean | false => {
  const tokenContract = useTokenStreamingAbi(contractId);
  const coins = useSelector((state: RootState) => state.pipeline.coins);
  const globalStreams = useSelector(
    (state: RootState) => state.pipeline.globalStreams,
  );
  const dispatch = useDispatch();

  useEffect(() => {
    // console.log("coins => :", coins);
    if (tokenContract && coins.length > 0) {
      getStreamResponses(tokenContract, coins).then((responseStreams) => {
        if (
          responseStreams?.length &&
          !isEqual(responseStreams, globalStreams)
        ) {
          dispatch(setGlobalStreams(responseStreams));
        }
      });
      // console.log("coins - ", coins);
      // console.log("globalStreams - ", globalStreams);
    }

    return;
  }, [coins]);

  return true;
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
  const globalStreams = useSelector(
    (state: RootState) => state.pipeline.globalStreams,
  );
  const coins = useSelector((state: RootState) => state.pipeline.coins);
  // console.log("coins - ", coins);
  // console.log("streams - ", globalStreams);

  return globalStreams?.filter((stream) =>
    isUserOwnerOfSenderAsset(stream.sender_asset, coins),
  );
};

// TODO: this should be a recoil selector
export const useReceiverStreams = () => {
  const globalStreams = useSelector(
    (state: RootState) => state.pipeline.globalStreams,
  );
  const coins = useSelector((state: RootState) => state.pipeline.coins);

  return globalStreams?.filter((stream) =>
    isUserOwnerOfReceiverAsset(stream.receiver_asset, coins),
  );
};
