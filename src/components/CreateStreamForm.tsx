import {
  ActionIcon,
  Button,
  Card,
  CardSection,
  CardSectionProps,
  Divider,
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
import { DatePickerInput, DatesProvider } from "@mantine/dates";
import { useCreateStream } from "@/hooks/TokenStreamingAbi";
import { useFetchCoins, useRefreshCoins } from "@/hooks/useCoins";
import { convertUnixTimeMillisecondsToTaiTime } from "@/utils/dateTimeUtils";
import { useConnectUI, useWallet } from "@fuels/react";
import { BN } from "fuels";
import Decimal from "decimal.js";
import { useNotificationHook } from "@/hooks/Notifications";
import { useRouter } from "next/navigation";
import { useRecoilValue } from "recoil";
import { IconSettings } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { timezoneAtom, TimezoneModal } from "./TimezoneModal";
import { SECONDS_PER_DAY } from "@/constants/constants";

type FormValues = {
  token: string;
  recipient: string;
  dates: [Date | undefined, Date | undefined];
  amount: number;
};

function isDatesDefined(values: FormValues): values is Omit<
  FormValues,
  "dates"
> & {
  dates: [Date, Date];
} {
  return values.dates.every((date) => date !== undefined);
}

export const CreateStreamForm = () => {
  const wallet = useWallet();
  const coins = useFetchCoins();
  const { connect, isConnecting } = useConnectUI();
  const timezone = useRecoilValue(timezoneAtom);

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
      dates: (value) =>
        value.every((date) => date !== undefined)
          ? null
          : "Start and end time are required",
      // endTime: (value) => (value ? null : "End time is required"),
      amount: (value) => (value > 0 ? null : "Amount must be greater than 0"),
    },
    initialValues: {
      token: "",
      recipient:
        "fuel15mssspz9pg2t3yf2dls4d6mvsc9jgc8mtc3na5jp6n8q840mxy3srhn4q8",
      dates: [new Date(), new Date(Date.now() + 1000 * SECONDS_PER_DAY * 7)],
      amount: 123,
    },
  });

  const [tzModalOpened, { open: openTzModal, close: closeTzModal }] =
    useDisclosure();

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
        convertUnixTimeMillisecondsToTaiTime(new BN(values.dates[0].getTime())),
        convertUnixTimeMillisecondsToTaiTime(new BN(values.dates[1].getTime())),
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
            {coins && (
              <Select
                label={
                  <CustomLabelComponent>
                    What token do you want to use?
                  </CustomLabelComponent>
                }
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
              label={
                <CustomLabelComponent>
                  How much do you want to stream in total?
                </CustomLabelComponent>
              }
              placeholder={"100"}
              {...form.getInputProps("amount")}
            />
            <TextInput
              label={
                <CustomLabelComponent>
                  Who is the recipient?
                </CustomLabelComponent>
              }
              placeholder={"0x12345.."}
              {...form.getInputProps("recipient")}
            />
            {/* TODO: add maximum and minimum dates */}
            <DatesProvider settings={{ timezone: timezone }}>
              <Flex direction="column">
                <Flex direction="column" gap={3}>
                  <DatePickerInput
                    type="range"
                    clearable
                    label={
                      <Flex align="center">
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
                          Start and End Dates
                        </CustomLabelComponent>
                      </Flex>
                    }
                    valueFormat="MMMM DD, YYYY"
                    {...form.getInputProps("dates")}
                  />
                </Flex>
              </Flex>
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
