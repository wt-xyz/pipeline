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
    cancellation_time: undefined,
    vested_withdraw_amount: undefined,
  });
});

TokenStreaming.CancelStream.handler(async ({ event, context }) => {
  const stream = await context.TokenStreaming_CreateStream.get(
    event.data.stream_id.toString(),
  );
  if (!stream) throw Error();

  context.TokenStreaming_CreateStream.set({
    ...stream,
    cancellation_time: event.time,
  });
});

TokenStreaming.Withdraw.handler(async ({ event, context }) => {
  const vault_sub_id = parseInt(event.data.vault_sub_id, 10);
  const stream_id = vault_sub_id % 2 === 0 ? vault_sub_id : vault_sub_id - 1;

  const stream = await context.TokenStreaming_CreateStream.get(
    stream_id.toString(),
  );
  if (!stream) throw Error();

  context.TokenStreaming_CreateStream.set({
    ...stream,
    vested_withdraw_amount: event.data.withdrawn_amount,
  });
});
