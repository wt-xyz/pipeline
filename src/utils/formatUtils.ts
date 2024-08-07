import Decimal from "decimal.js";
import { Address, BN } from "fuels";
import { truncate } from "lodash";

// Convert BN to a serializable format
export const serializeBN = (coin: any) => ({
  ...coin,
  amount: coin.amount.toString(),
});

// Convert serialized data back to BN
export const deserializeBN = (coin: any) => ({
  ...coin,
  amount: new BN(coin.amount),
});

export function formatDateToISO(date: Date) {
  // Convert the date to ISO string and slice to get the date part
  return date.toISOString().slice(0, 10).replaceAll("-", "/");
}

export function formatAddress(address: string) {
  // Check if the address is less than or equal to 9 characters, return as is (since there's nothing to shorten)
  if (address.length <= 9) return address;

  // Take the first 6 characters (including 0x), add ellipsis, and then the last 4 characters
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function truncateString(s: string, maxLength: number) {
  // Use Lodash's truncate function to shorten the string if it exceeds the maxLength
  return truncate(s, {
    length: maxLength, // Maximum string length including the omission string
    omission: "...", // String to append if truncated
  });
}

export function stringAddressesToIdentityInputs(arr: string[]) {
  return arr.map((str) => {
    // If it's a bech32 address make it a bytes32 address
    const value = Address.fromAddressOrString(str).toB256();

    return {
      Address: {
        bits: value,
      },
    };
  });
}

export const parseDecimalsBN = (val: BN, decimals = 9): BN => {
  return val.div(10 ** decimals);
};

export const parseDecimals = (val: number | string, decimals = 9): BN => {
  const valDecimal = new Decimal(val);

  return new BN(valDecimal.mul(Math.pow(10, decimals)).toNumber());
};

export const formatDecimals = (val: BN | number, decimals = 9): string => {
  const valueString = val.toString();

  const valueDecimal = new Decimal(valueString);

  return valueDecimal.div(Math.pow(10, decimals)).toString();
};
