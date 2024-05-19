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

//TODO: streamId is probably in some way returnable in whatever object we get with stream, we will want to compact this into one unit when we combine the hooks.
export const StreamAccordionItem = ({
  value,
  stream,
  isUserSender,
  streamId,
  isOpen,
  toggle,
}: {
  value: string;
  stream: Stream;
  isUserSender: boolean;
  streamId: string;
  isOpen?: boolean;
  toggle?: (value: string) => void;
}) => {
  // Assert that isOpen and toggle are not undefined when needed
  if (typeof isOpen === "undefined" || typeof toggle === "undefined") {
    throw new Error(
      "CustomAccordionItem requires isOpen and toggle props when used outside CustomAccordion",
    );
  }

  const theme = useMantineTheme();

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

  const LabelComponent = ({ stream }: { stream: Stream }) => {
    return (
      <Spread align={"center"}>
        <TotalAmountComponent stream={stream} />
        <Flex gap={"md"} px={"md"}>
          <Button visibleFrom="xs" variant="subtle" color="red">
            Cancel
          </Button>
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
  }: {
    stream: Stream;
    isUserSender: boolean;
  }) => {
    const fieldsArray = buildFieldArray(stream, isUserSender);

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
        <Button variant={"light"} hiddenFrom={"xs"} color="red" w={"100%"}>
          Cancel Stream
        </Button>
      </Flex>
    );
  };

  return (
    <CustomAccordionItem
      label={<LabelComponent stream={stream} />}
      value={stream.sender_asset.value}
      isOpen={isOpen}
      toggle={toggle}
      style={{
        backgroundColor: theme.colors.cardBackground[0],
        borderRadius: theme.radius.xl,
      }}
    >
      <ContentComponent stream={stream} isUserSender={isUserSender} />
    </CustomAccordionItem>
  );
};
