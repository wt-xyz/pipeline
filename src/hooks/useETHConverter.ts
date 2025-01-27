import { useState, useEffect } from "react";

type EthConverterHook = {
  ethAmount: string;
  usdAmount: string;
  ethPrice: number;
  loading: boolean;
  error: string | null;
  convertEthToUsd: (eth: string) => void;
};

type UseEthConverterProps = {
  initialEthAmount?: string;
};

type CoinGeckoResponse = {
  ethereum: {
    usd: number;
  };
};

const useEthConverter = ({
  initialEthAmount = "",
}: UseEthConverterProps = {}): EthConverterHook => {
  const [ethAmount, setEthAmount] = useState<string>(initialEthAmount);
  const [usdAmount, setUsdAmount] = useState<string>("");
  const [ethPrice, setEthPrice] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
        );
        const data: CoinGeckoResponse = await response.json();
        setEthPrice(data.ethereum.usd);
        if (initialEthAmount) {
          convertEthToUsd(initialEthAmount);
        }
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch ETH price");
        setLoading(false);
      }
    };

    fetchEthPrice();
    const interval = setInterval(fetchEthPrice, 60000);

    return () => clearInterval(interval);
  }, [initialEthAmount]);

  const convertEthToUsd = (eth: string): void => {
    setEthAmount(eth);
    const usd = parseFloat(eth) * ethPrice;
    setUsdAmount(isNaN(usd) ? "" : usd.toFixed(2));
  };

  return {
    ethAmount,
    usdAmount,
    ethPrice,
    loading,
    error,
    convertEthToUsd,
  };
};

export default useEthConverter;
