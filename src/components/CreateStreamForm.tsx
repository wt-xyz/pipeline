import {
  Button,
  Card,
  Flex,
  Loader,
  NumberInput,
  Select,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { DateTimePicker, DatesProvider } from "@mantine/dates";
import { useCreateStream } from "@/hooks/TokenStreamingAbi";
import { useFetchCoins, useRefreshCoins } from "@/hooks/useCoins";
import { convertUnixTimeMillisecondsToTaiTime } from "@/utils/dateTimeUtils";
import { useConnectUI, useWallet } from "@fuels/react";
import { BN } from "fuels";
import Decimal from "decimal.js";
import { useState } from "react";
import { useNotificationHook } from "@/hooks/Notifications";
import { useRouter } from "next/navigation";

type FormValues = {
  token: string;
  recipient: string;
  startTime: Date | undefined;
  endTime: Date | undefined;
  amount: number;
};

function isDatesDefined(values: FormValues): values is Omit<
  FormValues,
  "startTime" | "endTime"
> & {
  startTime: Date;
  endTime: Date;
} {
  return values.startTime !== undefined && values.endTime !== undefined;
}

export const CreateStreamForm = () => {
  const wallet = useWallet();
  const coins = useFetchCoins();
  const { connect, isConnecting } = useConnectUI();
  const [timezone, setTimezone] = useState("UTC");

  const { createStream, loading, error } = useCreateStream();
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
      startTime: (value) => (value ? null : "Start time is required"),
      endTime: (value) => (value ? null : "End time is required"),
      amount: (value) => (value > 0 ? null : "Amount must be greater than 0"),
    },
    initialValues: {
      // FIXME remove these placeholder values
      token: "",
      recipient:
        "fuel15mssspz9pg2t3yf2dls4d6mvsc9jgc8mtc3na5jp6n8q840mxy3srhn4q8",
      startTime: new Date(2024, 2, 29),
      endTime: new Date(2024, 4, 18),
      amount: 123,
      // token: '',
      // recipient: '',
      // startTime: undefined,
      // endTime: undefined,
      // amount: 0,
    },
  });

  const router = useRouter();

  const handleSubmit = (values: FormValues) => {
    // FIXME use fetched decimals const DECIMALS = 9;
    const DECIMALS = 9;
    // INFO: this is being used in the ternary expression below
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    if (isDatesDefined(values) && wallet.wallet?.address) {
      const amount_decimals = new Decimal(10).pow(DECIMALS).mul(values.amount);
      const amount_bn = new BN(amount_decimals.toString());
      createStream(
        values.token,
        amount_bn,
        wallet.wallet.address.toB256(),
        values.recipient,
        convertUnixTimeMillisecondsToTaiTime(
          new BN(values.startTime.getTime()),
        ),
        convertUnixTimeMillisecondsToTaiTime(new BN(values.endTime.getTime())),
        amount_bn,
        {
          is_undercollateralized: false,
          is_cancellable: true,
        },
      ).then(() => {
        // update the fetched streams
        refreshCoins();
        router.push("/manage");
      });
      showNotification();
    }
  };

  return (
    <Card bg={"cardBackground"}>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Flex
          direction={"column"}
          align={"right"}
          justify={"center"}
          gap={20}
          style={{ color: "white" }}
        >
          {coins && (
            <Select
              label={"What token do you want to use?"}
              placeholder="Pick Token"
              data={coins.map((coin) => ({
                label: coin.assetId || "Unknown",
                // label: coin.symbol || coin.address || 'Unknown', // Fallback to 'Unknown' if symbol is undefined
                value: coin.assetId.toString(), // Assuming address is the desired value
              }))}
              {...form.getInputProps("token")}
            />
          )}
          <NumberInput
            label={"How much do you want to stream in total?"}
            placeholder={"100"}
            {...form.getInputProps("amount")}
          />
          <TextInput
            label={"Who is the recipient? (ENS name or Ethereum address)"}
            placeholder={"0x12345.."}
            {...form.getInputProps("recipient")}
          />
          <Select
            label={"Select Timezone"}
            searchable
            data={Intl.supportedValuesOf("timeZone")}
            value={timezone}
            onChange={(value) => setTimezone(value ?? "UTC")}
          />
          {/* TODO: add maximum and minimum dates */}
          <DatesProvider settings={{ timezone: timezone }}>
            <DateTimePicker
              clearable
              label={"Start Date"}
              valueFormat={"MMMM DD, YYYY HH:mm"}
              {...form.getInputProps("startTime")}
            />
            <DateTimePicker
              clearable
              locale={""}
              label={"End Date"}
              valueFormat={"MMMM DD, YYYY HH:mm"}
              {...form.getInputProps("endTime")}
            />
          </DatesProvider>
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
    </Card>
  );
};
