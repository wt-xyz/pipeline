import contractIds from "../../types/contract-ids.json";

export const TOKEN_STREAMING_CONTRACT_ID =
  process.env.NEXT_PUBLIC_TOKEN_STREAMING_CONTRACT_ID ||
  contractIds.tokenStreaming;

export const DEFAULT_SUB_ID =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

export const SECONDS_PER_HOUR = 3600;
export const SECONDS_PER_DAY = 86400;

export const BASE_ASSET_ID =
  "0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07";
