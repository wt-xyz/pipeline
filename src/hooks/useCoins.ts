import { useWallet } from "@fuels/react";
import { useCallback, useEffect, useState } from "react";
import { Account, BN, CoinQuantity } from "fuels";
import { TokenStreaming } from "../../types";
import {
  DEFAULT_SUB_ID,
  TOKEN_STREAMING_CONTRACT_ID,
} from "@/constants/constants";
import { Option } from "../../types/common";
import { useDispatch, useSelector } from "react-redux";
import {
  setCoins,
  CoinQuantityWithId,
  selectAllCoins,
} from "@/redux/coinsSlice";
import { RootState } from "@/redux/store";

const fetchCoins = async (
  wallet: Account | null | undefined,
): Promise<CoinQuantity[] | undefined> => {
  if (wallet == undefined) {
    // console.log("wallet is undefined");
    return;
  }
  return (await wallet.getBalances()).balances;
};

export const useRefreshCoins = () => {
  const dispatch = useDispatch();

  const wallet = useWallet();
  return useCallback(() => {
    fetchCoins(wallet.wallet).then((fetchedCoins) => {
      if (fetchedCoins != undefined) {
        dispatch(setCoins(fetchedCoins));
      }
    });
  }, [setCoins, wallet.wallet]);
};

export const useFetchCoins = () => {
  const dispatch = useDispatch();
  const coins = useSelector(selectAllCoins);
  const wallet = useWallet();

  useEffect(() => {
    fetchCoins(wallet.wallet).then((fetchedCoins) => {
      if (fetchedCoins != undefined) {
        // console.log("fetchedCoins - ", fetchedCoins);
        dispatch(setCoins(fetchedCoins));
      }
    });
    // console.log('coins - ', coins);
  }, [setCoins, wallet.wallet]);

  return coins;
};

export type CoinInfo = {
  symbol: Option<string>;
  name: Option<string>;
  decimals: Option<number>;
};

export type CoinWithInfo = CoinInfo & {
  amount: BN;
  assetId: string;
};

export const useStreamTokenInfo = (
  streamAddress: string,
  contractAddress: string = TOKEN_STREAMING_CONTRACT_ID,
): { symbol?: string; name?: string } => {
  const [streamTokenInfo] = useState<{
    symbol?: string;
    name?: string;
  }>({});

  const wallet = useWallet();

  const streamingContract = wallet.wallet
    ? new TokenStreaming(contractAddress, wallet.wallet)
    : undefined;
  // TODO: enable this and debug
  useEffect(() => {
    if (!streamingContract) return;
    // getCoinInfo(streamingContract, streamAddress).then((coinInfo) => {
    //   setStreamTokenInfo({
    //     symbol: coinInfo.symbol,
    //     name: coinInfo.name,
    //   });
    // });
  }, [streamingContract, streamAddress]);

  return streamTokenInfo;
};
/**
 * useCoinsWithInfo grabs info on all coins in a users wallet
 */
export const useCoinsWithInfo = () => {
  const coins = useSelector(selectAllCoins);
  let coinsWithInfo = null;
  const wallet = useWallet();

  useEffect(() => {
    const provider = wallet.wallet?.provider;
    if (provider == undefined) {
      return;
    }

    Promise.all(
      coins.map(async (coin) => {
        const tokenContract = new TokenStreaming(coin.assetId, provider);
        return {
          ...(await getCoinInfo(tokenContract)),
          amount: coin.amount,
          assetId: coin.assetId,
        };
      }),
    ).then((result) => {
      coinsWithInfo = result;
    });
  }, [coins, wallet]);

  return coinsWithInfo;
};

// FIXME why was there two copies of this?
// const useCoinWithInfo = (coin: CoinQuantity) => {
//   const [coinWithInfo, setCoinWithInfo] = useState<CoinWithInfo>();
//   const wallet = useWallet();

//   const tokenContract = wallet.wallet
//     ? TokenStreamingAbi__factory.connect(coin.assetId, wallet.wallet.provider)
//     : undefined;

//   useEffect(() => {
//     if (!tokenContract) return;

//     getCoinInfo(tokenContract).then((coinInfo) => {
//       setCoinWithInfo({
//         ...coin,
//         ...coinInfo,
//       });
//     });
//   }, [coin, tokenContract]);

//   return coinWithInfo;
// };

export const useCoinInfo = (
  tokenContract: TokenStreaming | undefined,
): CoinInfo | undefined => {
  const [coinInfo, setCoinInfo] = useState<CoinInfo | undefined>(undefined);

  useEffect(() => {
    if (!tokenContract) return;
    getCoinInfo(tokenContract).then((result) => {
      setCoinInfo(result);
    });
  }, [tokenContract]);

  return coinInfo;
};

// The symbol, name, and decimals would not take a vaule argument in that case
export const getCoinInfo = async (
  tokenContract: TokenStreaming,
  subId: string = DEFAULT_SUB_ID,
): Promise<CoinInfo> => {
  const symbol = tokenContract.functions
    .symbol({ bits: subId })
    .simulate()
    .catch((e) => {
      console.error(e);
    });

  const name = tokenContract.functions
    .name({ bits: subId })
    .simulate()
    .catch((e) => {
      console.error(e);
    });

  const decimals = tokenContract.functions
    .decimals({ bits: subId })
    .simulate()
    .catch((e) => {
      console.error(e);
    });

  return {
    symbol: (await symbol)?.value,
    name: (await name)?.value,
    decimals: (await decimals)?.value,
  };
};
