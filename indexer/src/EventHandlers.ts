/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import { TokenStreaming, TokenStreaming_CreateStream } from "generated";

TokenStreaming.CreateStream.handler(async ({ event, context }) => {
  const entity: TokenStreaming_CreateStream = {
    id: `${event.transactionId}_${event.receiptIndex}`,
  };

  context.TokenStreaming_CreateStream.set(entity);
});
