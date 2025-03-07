import {
  Button,
  Card,
  Checkbox,
  Flex,
  Loader,
  NumberInput,
  Select,
  TextInput,
  TextProps,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useCreateStream } from "@/hooks/TokenStreamingAbi";
import { useFetchCoins, useRefreshCoins } from "@/hooks/useCoins";
import { convertUnixTimeMillisecondsToTaiTime } from "@/utils/dateTimeUtils";
import { useConnectUI, useWallet } from "@fuels/react";
import { BN } from "fuels";
import { useNotificationHook } from "@/hooks/Notifications";
import { useRouter } from "next/navigation";
import { useDisclosure } from "@mantine/hooks";
import { TimezoneModal } from "./TimezoneModal";
import { BASE_ASSET_ID } from "@/constants/constants";
import { CoinQuantityWithId } from "@/redux/coinsSlice";
import { useEffect, useMemo } from "react";
import { useAppSelector } from "@/redux/store-hooks";
import {
  selectStreamData,
  selectVestingInfo,
  vestingState,
} from "@/redux/vestingSlice";
import { fillBreakpointsTo64, generateBreakpoints } from "@/utils/stream-utils";
import {
  CustomCardSection,
  CustomLabelComponent,
  numberInputToDecimalBN,
} from "./CreateStreamForm";

type FormValues = {
  token: string;
  recipient: string;
  deposit: number;
  undercollateralized: boolean;
  cancellable: boolean;
};

function combineDateAndTime(date: Date | string, time: string): Date {
  const dateObj = new Date(date);
  const [hours, minutes] = time.split(":");
  dateObj.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return dateObj;
}

function isValueUndefined(values: vestingState["streamData"]): values is {
  streamStartDate: number;
  streamEndDate: number;
  streamSize: number;
} {
  return (
    values.streamEndDate !== undefined &&
    values.streamStartDate !== undefined &&
    values.streamSize !== undefined
  );
}

export const PieceWiseCreateStreamForm = () => {
  const wallet = useWallet();
  const coins = useFetchCoins();
  const { connect, isConnecting } = useConnectUI();

  const { createStream, loading, error, data } = useCreateStream();
  const { showNotification } = useNotificationHook(
    "Creating stream...",
    loading,
    error,
    "Stream created!",
  );
  const refreshCoins = useRefreshCoins();

  const form = useForm<FormValues>({
    validate: {
      token: (value) => (value ? null : "Token is required"),
      recipient: (value) => (value ? null : "Recipient is required"),
      deposit: (value, values) => {
        return !values.undercollateralized || value > 0
          ? null
          : "Deposit must be greater than 0";
      },
    },
    initialValues: {
      token: BASE_ASSET_ID,
      recipient: "",
      deposit: 0,
      undercollateralized: false,
      cancellable: true,
    },
  });

  const [tzModalOpened, { open: openTzModal, close: closeTzModal }] =
    useDisclosure();

  const router = useRouter();

  const vestingInfo = useAppSelector(selectVestingInfo);
  const streamData = useAppSelector(selectStreamData);

  const breakpoints = useMemo(() => {
    return generateBreakpoints(vestingInfo);
  }, [vestingInfo]);

  useEffect(() => {
    if (error != undefined) {
      return;
    }

    if (data !== undefined) {
      refreshCoins();
      router.push("/manage");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, error, refreshCoins]);

  const handleSubmit = (values: FormValues) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    if (
      vestingInfo &&
      vestingInfo.length >= 2 &&
      wallet.wallet?.address &&
      isValueUndefined(streamData)
    ) {
      const streamSizeBn = numberInputToDecimalBN(
        parseInt(vestingInfo[vestingInfo.length - 1].amount),
      );

      const depositBn = values.undercollateralized
        ? numberInputToDecimalBN(values.deposit)
        : streamSizeBn;
      const newStartDate = combineDateAndTime(
        new Date(streamData.streamStartDate),
        "00:00",
      );
      const newEndDate = combineDateAndTime(
        new Date(streamData.streamEndDate),
        "00:00",
      );

      createStream(
        values.token,
        depositBn,
        wallet.wallet.address.toB256(),
        values.recipient,
        convertUnixTimeMillisecondsToTaiTime(new BN(newStartDate.getTime())),
        convertUnixTimeMillisecondsToTaiTime(new BN(newEndDate.getTime())),
        streamSizeBn,
        {
          is_undercollateralized: values.undercollateralized,
          is_cancellable: values.cancellable,
          vesting_curve: {
            Linear: [],
            PiecewiseLinear: {
              breakpoint_count: new BN(64),
              breakpoints: fillBreakpointsTo64(breakpoints.breakpoints),
            },
          },
        },
      ).then(() => {
        // update the fetched streams
        refreshCoins();
        // router.push("/manage");
      });

      showNotification();
    }
  };

  return (
    <Card bg={"cardBackground"} p="lg">
      <CustomCardSection>
        <Title order={4}>Create Stream</Title>
      </CustomCardSection>

      <CustomCardSection>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Flex
            direction={"column"}
            align={"right"}
            justify={"center"}
            gap={20}
            style={{ color: "white" }}
          >
            <Flex direction="column">
              <CustomLabelComponent>Stream Type</CustomLabelComponent>
              <Flex direction="column" gap="sm">
                <Checkbox
                  label={
                    "Undercollateralized? (If you're not sure, leave this unchecked)"
                  }
                  {...form.getInputProps("undercollateralized")}
                  checked={form.getInputProps("undercollateralized").value}
                ></Checkbox>
                <Checkbox
                  label={
                    "Cancellable? (If you're not sure, leave this checked)"
                  }
                  {...form.getInputProps("cancellable")}
                  checked={form.getInputProps("cancellable").value}
                ></Checkbox>
              </Flex>
            </Flex>
            {coins && (
              <Select
                label={
                  <CustomLabelComponent>
                    What token do you want to use?
                  </CustomLabelComponent>
                }
                placeholder="Pick Token"
                data={coins.map((coin: CoinQuantityWithId) => ({
                  label:
                    coin.assetId === BASE_ASSET_ID
                      ? "Eth"
                      : coin.assetId.toString() || "Unknown",
                  // label: coin.symbol || coin.address || 'Unknown', // Fallback to 'Unknown' if symbol is undefined
                  value: coin.assetId.toString(), // Assuming address is the desired value
                }))}
                {...form.getInputProps("token")}
              />
            )}
            {form.getValues().undercollateralized && (
              <NumberInput
                label={
                  <CustomLabelComponent>
                    How much do you want to deposit initially?
                  </CustomLabelComponent>
                }
                placeholder={"100"}
                {...form.getInputProps("deposit")}
              />
            )}
            <TextInput
              label={
                <CustomLabelComponent>
                  Who is the recipient?
                </CustomLabelComponent>
              }
              placeholder={"0x12345.."}
              {...form.getInputProps("recipient")}
            />

            {wallet.wallet ? (
              <Button type="submit" fz={"lg"}>
                Create stream
              </Button>
            ) : isConnecting ? (
              <Button>
                <Loader color={"white"} size={"sm"} />
              </Button>
            ) : (
              <Button onClick={connect} loading={isConnecting} fz={"lg"}>
                Connect Wallet To Create
              </Button>
            )}
          </Flex>
        </form>
      </CustomCardSection>
      <TimezoneModal opened={tzModalOpened} onClose={closeTzModal} />
    </Card>
  );
};
