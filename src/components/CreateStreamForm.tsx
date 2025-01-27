import {
  ActionIcon,
  Box,
  Button,
  Card,
  CardSection,
  CardSectionProps,
  Checkbox,
  Flex,
  Loader,
  NumberInput,
  Select,
  Text,
  TextInput,
  TextProps,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { DatePickerInput, DatesProvider, TimeInput } from "@mantine/dates";
import { useCreateStream } from "@/hooks/TokenStreamingAbi";
import { useFetchCoins, useRefreshCoins } from "@/hooks/useCoins";
import { convertUnixTimeMillisecondsToTaiTime } from "@/utils/dateTimeUtils";
import { useConnectUI, useWallet } from "@fuels/react";
import { BN } from "fuels";
import Decimal from "decimal.js";
import { useNotificationHook } from "@/hooks/Notifications";
import { useRouter } from "next/navigation";
import { IconSettings } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { TimezoneModal } from "./TimezoneModal";
import { BASE_ASSET_ID } from "@/constants/constants";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { CoinQuantityWithId } from "@/redux/coinsSlice";
import { useRef } from "react";
import { IconClock } from "@tabler/icons-react";

type FormValues = {
  token: string;
  recipient: string;
  streamSize: number;
  deposit: number;
  undercollateralized: boolean;
  cancellable: boolean;
  startDate: Date | null;
  endDate: Date | null;
  startTime: string | null;
  endTime: string | null;
};

function isDateAndTimeDefined(values: FormValues): values is Omit<
  FormValues,
  "startDate" | "endDate" | "startTime" | "endTime"
> & {
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
} {
  return (
    values.startDate !== null &&
    values.startTime !== null &&
    values.endDate !== null &&
    values.endTime !== null
  );
}

function combineDateAndTime(date: Date | string, time: string): Date {
  const dateObj = new Date(date);
  const [hours, minutes] = time.split(":");
  dateObj.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return dateObj;
}

export const CreateStreamForm = () => {
  const wallet = useWallet();
  const coins = useFetchCoins();
  const { connect, isConnecting } = useConnectUI();
  const timezone = useSelector((state: RootState) => state.timezone.timezone);

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
      streamSize: (value) =>
        value > 0 ? null : "Amount must be greater than 0",
      deposit: (value, values) => {
        return !values.undercollateralized || value > 0
          ? null
          : "Deposit must be greater than 0";
      },
      startDate: (value) => (value ? null : "Start date is required"),
      endDate: (value) => (value ? null : "End date is required"),
      startTime: (value) => (value ? null : "Start time is required"),
      endTime: (value) => (value ? null : "End time is required"),
    },
    initialValues: {
      token: BASE_ASSET_ID,
      recipient: "",
      streamSize: 1,
      deposit: 0,
      undercollateralized: false,
      cancellable: true,
      startDate: null,
      endDate: null,
      startTime: null,
      endTime: null,
    },
  });

  const [tzModalOpened, { open: openTzModal, close: closeTzModal }] =
    useDisclosure();

  const router = useRouter();

  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  const startDatePickerControl = (
    <ActionIcon
      variant="subtle"
      color="gray"
      onClick={() => startDateRef.current?.showPicker()}
    >
      <IconClock size={16} stroke={1.5} />
    </ActionIcon>
  );

  const endDatePickerControl = (
    <ActionIcon
      variant="subtle"
      color="gray"
      onClick={() => endDateRef.current?.showPicker()}
    >
      <IconClock size={16} stroke={1.5} />
    </ActionIcon>
  );

  const handleSubmit = (values: FormValues) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    if (isDateAndTimeDefined(values) && wallet.wallet?.address) {
      const streamSizeBn = numberInputToDecimalBN(values.streamSize);

      const depositBn = values.undercollateralized
        ? numberInputToDecimalBN(values.deposit)
        : streamSizeBn;

      const { startDate, startTime, endDate, endTime } = values;

      const newStartDate = combineDateAndTime(startDate, startTime);
      const mewEndDate = combineDateAndTime(endDate, endTime);

      createStream(
        values.token,
        depositBn,
        wallet.wallet.address.toB256(),
        values.recipient,
        convertUnixTimeMillisecondsToTaiTime(new BN(newStartDate.getTime())),
        convertUnixTimeMillisecondsToTaiTime(new BN(mewEndDate.getTime())),
        streamSizeBn,
        {
          is_undercollateralized: values.undercollateralized,
          is_cancellable: values.cancellable,
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
            <Flex direction="column" gap={20}>
              <NumberInput
                label={
                  <CustomLabelComponent>
                    How much do you want to stream in total?
                  </CustomLabelComponent>
                }
                placeholder={"100"}
                {...form.getInputProps("streamSize")}
              />
              {form.getValues().undercollateralized && (
                <NumberInput
                  label={
                    <CustomLabelComponent>
                      How much do you to deposit initially?
                    </CustomLabelComponent>
                  }
                  placeholder={"100"}
                  {...form.getInputProps("deposit")}
                />
              )}
            </Flex>
            <TextInput
              label={
                <CustomLabelComponent>
                  Who is the recipient?
                </CustomLabelComponent>
              }
              placeholder={"0x12345.."}
              {...form.getInputProps("recipient")}
            />

            {/* Start date */}
            <DatesProvider settings={{ timezone: timezone }}>
              <Box>
                <Flex align="center" mb="sm">
                  <CustomLabelComponent
                    icon={
                      <ActionIcon
                        onClick={openTzModal}
                        variant="subtle"
                        size="sm"
                      >
                        <IconSettings size={14} />
                      </ActionIcon>
                    }
                  >
                    Start date
                  </CustomLabelComponent>
                </Flex>
                <Flex direction="row">
                  <Box flex={1} pr={10}>
                    <DatePickerInput
                      clearable
                      valueFormat="MMMM DD, YYYY"
                      placeholder="Select start date"
                      style={{ width: "100%" }}
                      {...form.getInputProps("startDate")}
                    />
                  </Box>

                  <Box>
                    <TimeInput
                      ref={startDateRef}
                      rightSection={startDatePickerControl}
                      {...form.getInputProps("startTime")}
                    />
                  </Box>
                </Flex>
              </Box>
            </DatesProvider>

            {/* End date */}
            <DatesProvider settings={{ timezone: timezone }}>
              <Box>
                <Flex align="center" mb="sm">
                  <CustomLabelComponent
                    icon={
                      <ActionIcon
                        onClick={openTzModal}
                        variant="subtle"
                        size="sm"
                      >
                        <IconSettings size={14} />
                      </ActionIcon>
                    }
                  >
                    End date
                  </CustomLabelComponent>
                </Flex>
                <Flex direction="row">
                  <Box flex={1} pr={10}>
                    <DatePickerInput
                      clearable
                      valueFormat="MMMM DD, YYYY"
                      placeholder="Select end date"
                      style={{ width: "100%" }}
                      {...form.getInputProps("endDate")}
                    />
                  </Box>

                  <Box>
                    <TimeInput
                      ref={endDateRef}
                      rightSection={endDatePickerControl}
                      {...form.getInputProps("endTime")}
                    />
                  </Box>
                </Flex>
              </Box>
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
      </CustomCardSection>
      <TimezoneModal opened={tzModalOpened} onClose={closeTzModal} />
    </Card>
  );
};

const CustomCardSection = (
  props: CardSectionProps & React.HTMLAttributes<HTMLDivElement>,
) => {
  return <CardSection inheritPadding withBorder py="md" {...props} />;
};

const CustomLabelComponent = ({
  icon,
  children,
  ...props
}: TextProps &
  React.HTMLAttributes<HTMLDivElement> & { icon?: React.ReactNode }) => (
  <Flex align="center" mb="sm">
    <Text {...props}>{children}</Text>
    {icon}
  </Flex>
);

const numberInputToDecimalBN = (amount: number): BN => {
  // FIXME use fetched decimals const DECIMALS = 9;
  const DECIMALS = 9;

  const amount_decimals = new Decimal(10).pow(DECIMALS).mul(amount);
  return new BN(amount_decimals.toString());
};
