import { useWallet } from "@fuels/react";
import { useCallback, useEffect, useState } from "react";
import { Account, BN, CoinQuantity } from "fuels";
import { TokenStreamingAbi, TokenStreamingAbi__factory } from "../../types";
import {
  DEFAULT_SUB_ID,
  TOKEN_STREAMING_CONTRACT_ID,
} from "@/constants/constants";
import { Option } from "../../types/contracts/common";
import {
  atom,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
} from "recoil";

export const globalCoins = atom<CoinQuantity[]>({
  key: "globalCoins",
  default: [],
});

const fetchCoins = async (
  wallet: Account | null | undefined,
): Promise<CoinQuantity[] | undefined> => {
  if (wallet == undefined) {
    console.log("wallet is undefined");
    return;
  }
  console.log("wallet is defined", wallet);
  return wallet.getBalances();
};

export const useRefreshCoins = () => {
  const setCoins = useSetRecoilState(globalCoins);
  const wallet = useWallet();
  return useCallback(() => {
    fetchCoins(wallet.wallet).then((fetchedCoins) => {
      if (fetchedCoins != undefined) {
        setCoins(fetchedCoins);
      }
    });
  }, [setCoins, wallet.wallet]);
};

export const useFetchCoins = () => {
  const [coins, setCoins] = useRecoilState<CoinQuantity[]>(globalCoins);

  const wallet = useWallet();
  useEffect(() => {
    fetchCoins(wallet.wallet).then((fetchedCoins) => {
      if (fetchedCoins != undefined) {
        setCoins(fetchedCoins);
      }
    });
  }, [setCoins, wallet.wallet]);

  return coins;
};

type CoinInfo = {
  symbol: Option<string>;
  name: Option<string>;
  decimals: Option<number>;
};

type CoinWithInfo = CoinInfo & {
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
    ? TokenStreamingAbi__factory.connect(contractAddress, wallet.wallet)
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
  const [coinsWithInfo, setCoinsWithInfo] = useState<CoinWithInfo[]>();
  const coins = useRecoilValue(globalCoins);
  const wallet = useWallet();
  useEffect(() => {
    const provider = wallet.wallet?.provider;
    if (provider == undefined) {
      return;
    }

    Promise.all(
      coins.map(async (coin) => {
        const tokenContract = TokenStreamingAbi__factory.connect(
          coin.assetId,
          provider,
        );
        return {
          ...(await getCoinInfo(tokenContract)),
          amount: coin.amount,
          assetId: coin.assetId,
        };
      }),
    ).then((coinsWithInfo) => {
      setCoinsWithInfo(coinsWithInfo);
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
  tokenContract: TokenStreamingAbi | undefined,
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
  tokenContract: TokenStreamingAbi,
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
