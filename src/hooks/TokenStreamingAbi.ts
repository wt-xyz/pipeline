import {
  AbstractAddress,
  BN,
  BaseAssetId,
  BigNumberish,
  BytesLike,
  InvocationCallResult,
} from "fuels";
import { TokenStreamingAbi, TokenStreamingAbi__factory } from "../../types";
import { useWallet } from "@fuels/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TOKEN_STREAMING_CONTRACT_ID } from "@/constants/constants";
import { stringAddressesToIdentityInputs } from "@/utils/formatUtils";
import {
  StreamConfigurationInput,
  StreamOutput,
  VaultInfoOutput,
} from "../../types/contracts/TokenStreamingAbi";
import stream from "stream";

// TODO: change readonly interactions to simulate instead of call
export const useTokenStreamingAbi = (
  contractId: AbstractAddress | string,
): TokenStreamingAbi | undefined => {
  const wallet = useWallet();

  return useMemo(() => {
    if (!wallet.wallet) {
      return;
    }
    return TokenStreamingAbi__factory.connect(contractId, wallet.wallet);
  }, [contractId, wallet.wallet]);
};

export const useCreateStream = (
  contractId: AbstractAddress | string = TOKEN_STREAMING_CONTRACT_ID,
) => {
  const tokenContract = useTokenStreamingAbi(contractId);
  const wallet = useWallet();

  const [loading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [data, setData] = useState<BN | undefined>();

  const createStream = useCallback(
    async (
      token: BytesLike,
      amount: BigNumberish,
      senderShareRecipientString: string,
      receiverShareRecipientString: string,
      startTime: BigNumberish,
      stopTime: BigNumberish,
      streamSize: BigNumberish,
      configuration: StreamConfigurationInput,
    ): Promise<BN | undefined> => {
      const [senderShareRecipient, receiverShareRecipient] =
        stringAddressesToIdentityInputs([
          senderShareRecipientString,
          receiverShareRecipientString,
        ]);
      if (!wallet.wallet?.provider) return;
      const { minGasPrice } = wallet.wallet.provider.getGasConfig();
      setIsLoading(true);
      const response = await tokenContract?.functions
        .create_stream(
          senderShareRecipient,
          receiverShareRecipient,
          startTime,
          stopTime,
          streamSize,
          configuration,
        )
        .callParams({
          forward: [amount, token],
        })
        .txParams({
          gasLimit: 1000000,
          gasPrice: minGasPrice,
          variableOutputs: 2,
        })
        .call();

      if (response?.transactionResult.isStatusFailure) {
        setIsLoading(false);
        setError("Stream creation failed");
      }

      // we need to call a callback when the stream creation is successful or failed
      setIsLoading(false);
      setData(response?.value);
    },
    [tokenContract, wallet.wallet],
  );

  return { createStream, loading, error, data };
};

// When this function is called by the receiver they withdraw the full available balance from their stream vault
// when called by the sender, this withdraws their collateral and cancels the stream. will not withdraw funds already allocated to the user.
export const useFullWithdrawFromStream = (
  contractId: AbstractAddress | string = TOKEN_STREAMING_CONTRACT_ID,
) => {
  const tokenContract = useTokenStreamingAbi(contractId);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>();
  const [data, setData] = useState<BN | undefined>();

  const withdraw = useCallback(
    async (
      recipientIdentityString: string,
      underlyingAsset: string,
      shareToken: string,
    ) => {
      setLoading(true);
      const [recipientIdentityInput] = stringAddressesToIdentityInputs([
        recipientIdentityString,
      ]);

      const response = await tokenContract?.functions
        .withdraw(
          recipientIdentityInput,
          { value: underlyingAsset },
          BaseAssetId,
        )
        .callParams({ forward: [1, shareToken] })
        .txParams({ variableOutputs: 2 })
        .call()
        .catch((e) => {
          setLoading(false);
          setError(e.message);
        });

      setLoading(false);
      if (response?.transactionResult.isStatusFailure) {
        setError("Full Withdrawal failed");
      }

      setData(response?.value);
    },
    [tokenContract],
  );

  return {
    withdraw,
    loading,
    error,
    data,
  };
};

// function can only be called by the recipient of the stream
export const usePartialWithdrawFromStream = (
  contractId: AbstractAddress | string = TOKEN_STREAMING_CONTRACT_ID,
) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>();
  const [data, setData] = useState<BN | undefined>();

  const tokenContract = useTokenStreamingAbi(contractId);
  const partialWithdrawal = useCallback(
    async (
      recipientString: string,
      amount: BigNumberish,
      shareToken: string,
    ) => {
      setLoading(true);
      const [recipient] = stringAddressesToIdentityInputs([recipientString]);

      const response = await tokenContract?.functions
        .partial_withdraw_from_stream(recipient, amount)
        .callParams({ forward: [1, shareToken] })
        .call();

      setLoading(false);

      if (response?.transactionResult.isStatusFailure) {
        setError("Partial Withdrawal failed");
      }
      setData(response?.value);
    },
    [tokenContract],
  );

  return {
    loading,
    error,
    data,
    partialWithdrawal,
  };
};

export const useMaxWithdrawable = (
  stream: StreamOutput,
  contractId: AbstractAddress | string = TOKEN_STREAMING_CONTRACT_ID,
): BN | undefined => {
  console.log("in useMaxWithdrawable ", { stream, contractId });
  const tokenContract = useTokenStreamingAbi(contractId);
  const [vaultSubId, setVaultSubId] = useState<string>();
  const [maxWithdrawable, setMaxWithdrawable] = useState<BN | undefined>();

  useEffect(() => {
    tokenContract?.functions
      .get_vault_info(stream.receiver_asset)
      .get()
      .then((vaultInfo: InvocationCallResult<VaultInfoOutput>) => {
        console.log("valutInfo", vaultInfo);
        setVaultSubId(vaultInfo.value.vault_sub_id);
      })
      .catch((e) => {
        console.error(e);
      });

    if (vaultSubId) {
      tokenContract?.functions
        .max_withdrawable({ value: stream.underlying_asset.value }, vaultSubId)
        .get()
        .then((response) => {
          console.log(
            "should get max withdrawable here",
            response.value?.toString(),
          );
          setMaxWithdrawable(response?.value);
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }, [vaultSubId, stream.receiver_asset, tokenContract]);

  return maxWithdrawable;
};
