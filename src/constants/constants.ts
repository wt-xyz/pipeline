import contractIds from "../../types/contract-ids.json";

export const TOKEN_STREAMING_CONTRACT_ID =
  process.env.NEXT_PUBLIC_TOKEN_STREAMING_CONTRACT_ID ||
  contractIds.tokenStreaming;

export const DEFAULT_SUB_ID =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

export const SECONDS_PER_HOUR = 3600;
