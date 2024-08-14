import {
  Button,
  Divider,
  Flex,
  Grid,
  Modal,
  TextInput,
  useMantineTheme,
} from "@mantine/core";
import { CustomAccordionItem } from "components/CustomAccordionItem/CustomAccordionItem";
import { Spread } from "components/Spread";
import { TextMd, TextXxl } from "components/TextVariants";
import {
  formatAddress,
  formatDecimals,
  parseDecimals,
} from "utils/formatUtils";
import { IconArrowBarToDown } from "@tabler/icons-react";
import { convertTaiTimeBNToDate } from "utils/dateTimeUtils";
import { buildFieldArray } from "utils/buildFieldsArray";
import { FieldCard } from "components/FieldCard/FieldCard";
import { StreamProgressBar } from "components/StreamProgressBar/StreamProgressBar";
import classes from "./ContentComponent.module.css";
import { Stream, useRefreshStreams } from "hooks/Streams";
import {
  useWithdrawFromStream,
  useTotalVested,
  useDepositToStream,
} from "@/hooks/TokenStreamingAbi";
import { useAccount } from "@fuels/react";
import { useCallback, useState } from "react";
import { useMaxWithdrawable } from "@/hooks/TokenStreamingAbi";
import { BigNumberish, BN } from "fuels";
import { useNotificationHook } from "@/hooks/Notifications";
import { useDisclosure } from "@mantine/hooks";
import { StreamSerializable } from "@/redux/streamsSlice";

type StreamAccordionItemProps = {
  value: string;
  stream: Stream;
  isUserSender: boolean;
  streamId: string;
  isOpen?: boolean;
  toggle?: (value: string) => void;
};

type StreamAccordionItemViewProps = StreamAccordionItemProps & {
  onCancel: () => void;
  onTopUp: (value: BigNumberish) => void;
  isCancelling: boolean;
  stats: {
    maxWithdrawable: BN;
    totalVested: BN;
  };
};

type WithdrawModalProps = {
  onClick: (value: BigNumberish) => void;
  onClose: () => void;
  opened: boolean;
  max: BN;
};

type SingleInputModalProps = {
  title: string;
  buttonText: string;
  onClick: (value: BN) => void;
  opened: boolean;
  onClose: () => void;
  max: BN;
};

const SingleInputModal = ({
  title,
  buttonText,
  onClick,
  opened,
  onClose,
  max,
}: SingleInputModalProps) => {
  const [value, setValue] = useState<string>("0");

  const handleButtonClick = () => {
    onClick(parseDecimals(value));
    onClose();
  };

  return (
    <Modal title={title} opened={opened} onClose={onClose}>
      <Flex>
        <TextInput
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Enter value"
          style={{ marginRight: "20px", marginBottom: "20px" }}
        />
        <Button
          onClick={() => {
            setValue(formatDecimals(max));
          }}
        >
          Max
        </Button>
      </Flex>
      <Button onClick={handleButtonClick}>{buttonText}</Button>
    </Modal>
  );
};

const WithdrawModal = ({
  onClick,
  opened,
  onClose,
  max,
}: WithdrawModalProps) => {
  return (
    <SingleInputModal
      title="Withdraw"
      buttonText="Withdraw"
      onClick={onClick}
      opened={opened}
      onClose={onClose}
      max={max}
    />
  );
};

const TopUpModal = ({ onClick, opened, onClose, max }: WithdrawModalProps) => {
  return (
    <SingleInputModal
      title="Top Up"
      buttonText="Top Up"
      onClick={onClick}
      opened={opened}
      onClose={onClose}
      max={max}
    />
  );
};

export const StreamAccordionItem = (props: StreamAccordionItemProps) => {
  const {
    withdraw,
    loading: withdrawLoading,
    data: withdrawData,
    error: withdrawError,
  } = useWithdrawFromStream();
  const {
    deposit,
    loading: depositLoading,
    error: depositError,
    data: depositData,
  } = useDepositToStream();
  const { account } = useAccount();
  const { stream } = props;
  const maxWithdrawable = useMaxWithdrawable(stream);
  const totalVested = useTotalVested(stream);
  const { refreshStreams } = useRefreshStreams();

  const { showNotification: showWithdrawalNotification } = useNotificationHook(
    props.isUserSender ? "Cancelling Stream..." : "Withdrawing...",
    withdrawLoading,
    withdrawError,
    `${formatDecimals(withdrawData ?? 0)} ${stream.underlying_asset.bits} withdrawn!`,
  );

  const { showNotification: showTopupNotification } = useNotificationHook(
    "Topping up...",
    depositLoading,
    depositError,
    `${formatDecimals(depositData ?? 0)} ${stream.underlying_asset.bits} topped up!`,
  );

  const handleTopUp = useCallback(
    (amount: BigNumberish) => {
      if (!account) return;
      deposit(account, stream, amount);
      showTopupNotification();
      refreshStreams();
    },
    [account, props.isUserSender, stream, deposit, showTopupNotification],
  );

  const handleWithdraw = useCallback(
    (amount?: BigNumberish) => {
      if (!account) return;
      const share_asset = props.isUserSender
        ? stream.sender_asset
        : stream.receiver_asset;

      withdraw(account, stream.underlying_asset.bits, share_asset.bits, amount);

      showWithdrawalNotification();
      refreshStreams();
    },
    [account, props.isUserSender, stream, withdraw, showWithdrawalNotification],
  );

  return withdrawData && props.isUserSender ? null : (
    <StreamAccordionItemView
      {...props}
      onCancel={handleWithdraw}
      onTopUp={handleTopUp}
      isCancelling={withdrawLoading}
      stats={{
        maxWithdrawable: maxWithdrawable ?? new BN("0"),
        totalVested: totalVested ?? new BN("0"),
      }}
    />
  );
};

//TODO: streamId is probably in some way returnable in whatever object we get with stream, we will want to compact this into one unit when we combine the hooks.
export const StreamAccordionItemView = ({
  stream,
  isUserSender,
  isOpen,
  toggle,
  onCancel,
  onTopUp,
  isCancelling,
  stats,
}: StreamAccordionItemViewProps) => {
  // Assert that isOpen and toggle are not undefined when needed
  if (typeof isOpen === "undefined" || typeof toggle === "undefined") {
    throw new Error(
      "CustomAccordionItem requires isOpen and toggle props when used outside CustomAccordion",
    );
  }

  const theme = useMantineTheme();

  return (
    <>
      <CustomAccordionItem
        label={
          <LabelComponent
            stream={stream}
            isCancelling={isCancelling}
            onCancel={onCancel}
            onTopUp={onTopUp}
            isUserSender={isUserSender}
            stats={stats}
          />
        }
        value={stream.sender_asset.bits}
        isOpen={isOpen}
        toggle={toggle}
        style={{
          backgroundColor: theme.colors.cardBackground[0],
          borderRadius: theme.radius.xl,
        }}
      >
        {/*  */}
        <ContentComponent
          stream={stream}
          onCancel={onCancel}
          isUserSender={isUserSender}
          stats={stats}
        />
      </CustomAccordionItem>
    </>
  );
};

const TotalAmountComponent = ({ stream }: { stream: Stream }) => {
  return (
    <Grid dir="row" style={{ width: "100%" }}>
      <Grid.Col span={4}>
        {/* TODO: get decimals from our hook: useCoinInfo */}
        <TextXxl c={"white"}>{formatDecimals(stream.stream_size)}</TextXxl>
        <TextMd c={"gray.7"}>Total Amount</TextMd>
      </Grid.Col>

      <Grid.Col span={4}>
        <TextXxl c={"gray.7"}>
          {/* TODO: change to symbol */}
          {formatAddress(stream.underlying_asset.bits)}
        </TextXxl>
        <TextMd c={"gray.7"}>Asset Id</TextMd>
      </Grid.Col>
    </Grid>
  );
};

const LabelComponent = ({
  stream,
  isCancelling,
  onCancel,
  onTopUp,
  isUserSender,
  stats,
}: {
  stream: Stream;
  isCancelling: boolean;
  onTopUp: (value: BigNumberish) => void;
  onCancel: () => void;
  isUserSender: boolean;
  stats: { maxWithdrawable: BN; totalVested: BN };
}) => {
  const [withdrawModalOpened, { open: openWithdraw, close: closeWithdraw }] =
    useDisclosure();
  const [topUpModalOpened, { open: openTopUp, close: closeTopUp }] =
    useDisclosure();

  return (
    <Spread align={"center"}>
      <TotalAmountComponent stream={stream} />
      <Flex gap={"md"} px={"md"}>
        {isUserSender && stream.configuration.is_cancellable && (
          <Button
            visibleFrom="xs"
            variant="subtle"
            color="red"
            disabled={isCancelling}
            onClick={(event) => {
              event.stopPropagation();
              onCancel();
            }}
          >
            {isCancelling ? "Cancelling..." : "Cancel"}
          </Button>
        )}
        {!isUserSender && (
          <Button
            variant="light"
            leftSection={<IconArrowBarToDown size={20} />}
            onClick={(event) => {
              event.stopPropagation();
              openWithdraw();
            }}
          >
            Withdraw
          </Button>
        )}
        {isUserSender && stream.configuration.is_undercollateralized && (
          <Button
            variant="light"
            leftSection={<IconArrowBarToDown size={20} />}
            onClick={(event) => {
              event.stopPropagation();
              openTopUp();
            }}
          >
            Top Up
          </Button>
        )}
      </Flex>
      <WithdrawModal
        onClick={onCancel}
        opened={withdrawModalOpened}
        onClose={closeWithdraw}
        max={stats.maxWithdrawable}
      />
      <TopUpModal
        onClick={onTopUp}
        opened={topUpModalOpened}
        onClose={closeTopUp}
        max={stream.stream_size.sub(stream.deposit)}
      />
    </Spread>
  );
};

const ContentComponent = ({
  stream,
  isUserSender,
  onCancel,
  stats,
}: {
  stream: Stream;
  isUserSender: boolean;
  onCancel: () => void;
  stats: { maxWithdrawable: BN; totalVested: BN };
}) => {
  const fieldsArray = buildFieldArray(stream, isUserSender, stats);

  return (
    <Flex direction={"column"} gap={"lg"} align={"center"} justify={"center"}>
      {/* Render Cards for attribute display*/}
      <Flex gap={"md"} className={classes.FieldCardContainer}>
        {fieldsArray.map(({ label, color, value }, index) => (
          <FieldCard
            key={`${label}-${index}`}
            valueTextColor={color}
            value={value}
            label={label}
          />
        ))}
      </Flex>

      <Divider w="100%" color="darkGray.1" />
      {/* ProgressBar   */}
      <StreamProgressBar
        endDate={convertTaiTimeBNToDate(stream.stop_time)}
        startDate={convertTaiTimeBNToDate(stream.start_time)}
      />
      <Button
        variant={"light"}
        hiddenFrom={"xs"}
        color="red"
        w={"100%"}
        onClick={(event) => {
          event.stopPropagation();
          onCancel();
        }}
      >
        Cancel Stream
      </Button>
    </Flex>
  );
};
