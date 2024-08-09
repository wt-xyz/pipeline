import {
  AbstractAddress,
  BN,
  BigNumberish,
  BytesLike,
  FunctionInvocationResult,
  InvocationCallResult,
  sha256,
} from "fuels";
import { TokenStreamingAbi, TokenStreamingAbi__factory } from "../../types";
import { useWallet } from "@fuels/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TOKEN_STREAMING_CONTRACT_ID } from "@/constants/constants";
import {
  parseDecimals,
  stringAddressesToIdentityInputs,
} from "@/utils/formatUtils";
import {
  StreamConfigurationInput,
  StreamOutput,
  VaultInfoOutput,
} from "../../types/contracts/TokenStreamingAbi";
import { Stream } from "./Streams";

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
          variableOutputs: 2,
        })
        .call()
        .catch((e: Error) => {
          setError(e.message);
        });

      if (response?.transactionResult.isStatusFailure) {
        setIsLoading(false);
        setError("Stream creation failed");
      }

      console.log({
        creationResponse: response,
      });
      // we need to call a callback when the stream creation is successful or failed
      setIsLoading(false);
      setData(response?.value);
    },
    [tokenContract, wallet.wallet],
  );

  return { createStream, loading, error, data };
};

// Take this string value, it is a decimal value. It needs to be converted to a u64 value
// Then take the sha256 hash of that value
const getVaultSubId = (streamId: string, role: "sender" | "receiver") => {
  const streamIdBn = new BN(streamId, 10);
  const preImage = role === "sender" ? streamIdBn.add(new BN(1)) : streamIdBn;
  // convert preImage to u64 bytes
  const preImageBytes = preImage.toBytes(16);
  console.log({ preImageBytes });
  return sha256(preImageBytes);
};

export const useDepositToStream = (
  contractId: AbstractAddress | string = TOKEN_STREAMING_CONTRACT_ID,
) => {
  const tokenContract = useTokenStreamingAbi(contractId);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>();
  const [data, setData] = useState<BN | undefined>();

  const deposit = useCallback(
    async (recipient: string, stream: Stream, amount: BigNumberish) => {
      setLoading(true);

      const [recipientIdentityInput] = stringAddressesToIdentityInputs([
        recipient,
      ]);

      console.log("before get_vault_info");
      console.log({ stream });
      try {
        const vaultSubIdPromise = tokenContract?.functions
          .get_vault_info(stream.sender_asset)
          .get();
      } catch (e) {
        console.error(e);
        setLoading(false);
        setError("Vault not found");
        return;
      }

      console.log("after get_vault_info");

      const vaultSubId = (
        await tokenContract?.functions.get_vault_info(stream.sender_asset).get()
      )?.value.vault_sub_id;
      console.log("after get_vault_info");

      if (!vaultSubId) {
        setLoading(false);
        setError("Vault not found");
        return;
      }

      const response = await tokenContract?.functions
        .deposit(recipientIdentityInput, vaultSubId)
        .callParams({
          forward: [amount, stream.underlying_asset.bits],
        })
        .txParams({ variableOutputs: 1 })
        .call();

      setLoading(false);

      if (response?.transactionResult.isStatusFailure) {
        setError("Deposit failed");
      }
      setData(response?.value);
    },
    [tokenContract],
  );

  return {
    deposit,
    loading,
    error,
    data,
  };
};

// When this function is called by the receiver they withdraw the full available balance from their stream vault
// when called by the sender, this withdraws their collateral and cancels the stream. will not withdraw funds already allocated to the user.
export const useWithdrawFromStream = (
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
      amount?: BigNumberish,
      asset: string,
    ) => {
      setLoading(true);
      const [recipientIdentityInput] = stringAddressesToIdentityInputs([
        recipientIdentityString,
      ]);

      let response: void | FunctionInvocationResult<BN, void> | undefined =
        undefined;

      if (amount == undefined) {
        response = await tokenContract?.functions
          .withdraw(
            recipientIdentityInput,
            { bits: underlyingAsset },
            // This could be any value, used to comply with vault standard
            "0x0000000000000000000000000000000000000000000000000000000000000000",
          )
          .callParams({ forward: [1, shareToken] })
          .txParams({ variableOutputs: 2 })
          .call()
          .catch((e) => {
            setLoading(false);
            setError(e.message);
          });
      } else {
        // TODO we need to get the SRC20 decimal value here

        console.log("part withdraw - ", asset);

        const decimals = await tokenContract?.functions.decimals(asset).get();

        console.log("decimals - ", decimals);

        // response = await tokenContract?.functions
        //   .partial_withdraw_from_stream(recipientIdentityInput, amount)
        //   .txParams({ variableOutputs: 2 })
        //   .callParams({ forward: [1, shareToken] })
        //   .call();
      }

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

export const useVaultInfo = (
  stream: StreamOutput,
  contractId: AbstractAddress | string,
): VaultInfoOutput | undefined => {
  const tokenContract = useTokenStreamingAbi(contractId);
  const [vaultInfo, setVaultInfo] = useState<VaultInfoOutput | undefined>();

  useEffect(() => {
    tokenContract?.functions
      .get_vault_info(stream.receiver_asset)
      .get()
      .then((response) => {
        setVaultInfo(response?.value);
      })
      .catch((e) => {
        console.error(e);
      });
  }, [tokenContract, stream.receiver_asset]);

  return vaultInfo;
};

export const useMaxWithdrawable = (
  stream: StreamOutput,
  contractId: AbstractAddress | string = TOKEN_STREAMING_CONTRACT_ID,
): BN | undefined => {
  const tokenContract = useTokenStreamingAbi(contractId);
  const [vaultSubId, setVaultSubId] = useState<string>();
  const [maxWithdrawable, setMaxWithdrawable] = useState<BN | undefined>();

  useEffect(() => {
    tokenContract?.functions
      .get_vault_info(stream.receiver_asset)
      .get()
      .then((vaultInfo: InvocationCallResult<VaultInfoOutput>) => {
        setVaultSubId(vaultInfo.value.vault_sub_id);
      })
      .catch((e) => {
        console.error(e);
      });

    if (vaultSubId) {
      tokenContract?.functions
        .max_withdrawable({ bits: stream.underlying_asset.bits }, vaultSubId)
        .get()
        .then((response) => {
          setMaxWithdrawable(response?.value);
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }, [
    vaultSubId,
    stream.receiver_asset,
    tokenContract,
    stream.underlying_asset,
  ]);

  return maxWithdrawable;
};

export const useTotalVested = (
  stream: Stream,
  contractId: AbstractAddress | string = TOKEN_STREAMING_CONTRACT_ID,
): BN | undefined => {
  const tokenContract = useTokenStreamingAbi(contractId);

  const [totalVested, setTotalVested] = useState<BN | undefined>();
  useEffect(() => {
    tokenContract?.functions
      .vested_amount(stream.streamId)
      .get()
      .then((response) => {
        setTotalVested(response?.value);
      })
      .catch((e) => {
        console.error(e);
      });
  }, [tokenContract, stream]);

  return totalVested;
};
