/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import { TokenStreaming, TokenStreaming_CreateStream } from "generated";

TokenStreaming.CreateStream.handler(async ({ event, context }) => {
  context.TokenStreaming_CreateStream.set({
    id: event.data.stream_id.toString(),
    receiver_asset: event.data.receiver_asset.bits,
    sender_asset: event.data.sender_asset.bits,
    initial_sender: event.data.sender.payload.bits.toString(),
    initial_receiver: event.data.receiver.payload.bits.toString(),
    underlying_asset: event.data.underlying_asset.bits,
    deposit: event.data.deposit,
    stream_size: event.data.stream_size,
    start_time: event.data.start_time,
    stop_time: event.data.stop_time,
    timestamp: event.time,
    rate_per_second_e10:
      (event.data.stream_size * BigInt(Math.pow(10, 10))) /
      (event.data.stop_time - event.data.start_time),
  });
});
