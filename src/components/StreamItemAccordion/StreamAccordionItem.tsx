import { Button, Divider, Flex, useMantineTheme } from "@mantine/core";
import { CustomAccordionItem } from "components/CustomAccordionItem/CustomAccordionItem";
import { Spread } from "components/Spread";
import { TextMd, TextXxl } from "components/TextVariants";
import { formatAddress, formatDecimals } from "utils/formatUtils";
import { IconArrowBarToDown } from "@tabler/icons-react";
import { convertTaiTimeBNToDate } from "utils/dateTimeUtils";
import { buildFieldArray } from "utils/buildFieldsArray";
import { FieldCard } from "components/FieldCard/FieldCard";
import { StreamProgressBar } from "components/StreamProgressBar/StreamProgressBar";
import classes from "./ContentComponent.module.css";
import { Stream } from "hooks/Streams";
import {
  useFullWithdrawFromStream,
  useTotalVested,
} from "@/hooks/TokenStreamingAbi";
import { useAccount } from "@fuels/react";
import { useCallback } from "react";
import { useMaxWithdrawable } from "@/hooks/TokenStreamingAbi";
import { BN } from "fuels";
import { useNotificationHook } from "@/hooks/Notifications";

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
  isCancelling: boolean;
  stats: {
    maxWithdrawable: BN;
    totalVested: BN;
  };
};

export const StreamAccordionItem = (props: StreamAccordionItemProps) => {
  const { withdraw, loading, data, error } = useFullWithdrawFromStream();
  const { account } = useAccount();
  const { stream } = props;
  const maxWithdrawable = useMaxWithdrawable(stream);
  const totalVested = useTotalVested(stream);

  const { showNotification } = useNotificationHook(
    props.isUserSender ? "Cancelling Stream..." : "Withdrawing...",
    loading,
    error,
    `${formatDecimals(data ?? 0)} ${stream.underlying_asset.value} withdrawn!`,
  );

  const handleSenderWithdraw = useCallback(() => {
    if (!account) return;
    const share_asset = props.isUserSender
      ? stream.sender_asset
      : stream.receiver_asset;

    withdraw(account, stream.underlying_asset.value, share_asset.value);
    showNotification();
  }, [account, props.isUserSender, stream, withdraw, showNotification]);

  return data && props.isUserSender ? null : (
    <StreamAccordionItemView
      {...props}
      onCancel={handleSenderWithdraw}
      isCancelling={loading}
      stats={{
        maxWithdrawable: maxWithdrawable ?? new BN("0"),
        totalVested: totalVested ?? new BN("0"),
      }}
    />
  );
};

//TODO: streamId is probably in some way returnable in whatever object we get with stream, we will want to compact this into one unit when we combine the hooks.
export const StreamAccordionItemView = ({
  value,
  stream,
  isUserSender,
  streamId,
  isOpen,
  toggle,
  onCancel,
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
    <CustomAccordionItem
      label={
        <LabelComponent
          stream={stream}
          isCancelling={isCancelling}
          onCancel={onCancel}
          isUserSender={isUserSender}
        />
      }
      value={stream.sender_asset.value}
      isOpen={isOpen}
      toggle={toggle}
      style={{
        backgroundColor: theme.colors.cardBackground[0],
        borderRadius: theme.radius.xl,
      }}
    >
      <ContentComponent
        stream={stream}
        isUserSender={isUserSender}
        onCancel={onCancel}
        stats={stats}
      />
    </CustomAccordionItem>
  );
};

const TotalAmountComponent = ({ stream }: { stream: Stream }) => {
  return (
    <Flex direction={"column"}>
      <Flex gap="xs">
        {/* TODO: get decimals from our hook: useCoinInfo */}
        <TextXxl c={"white"}>{formatDecimals(stream.stream_size)}</TextXxl>
        {/* TODO: change to symbol */}
        <TextXxl c={"gray.7"}>
          {formatAddress(stream.underlying_asset.value)}
        </TextXxl>
      </Flex>
      <TextMd c={"gray.7"}>Total Amount</TextMd>
    </Flex>
  );
};

const LabelComponent = ({
  stream,
  isCancelling,
  onCancel,
  isUserSender,
}: {
  stream: Stream;
  isCancelling: boolean;
  onCancel: () => void;
  isUserSender: boolean;
}) => {
  return (
    <Spread align={"center"}>
      <TotalAmountComponent stream={stream} />
      <Flex gap={"md"} px={"md"}>
        {isUserSender && (
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
              onCancel();
            }}
          >
            Withdraw
          </Button>
        )}
        {stream.configuration.is_undercollateralized && (
          <Button
            variant="light"
            leftSection={<IconArrowBarToDown size={20} />}
          >
            Top Up
          </Button>
        )}
      </Flex>
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
