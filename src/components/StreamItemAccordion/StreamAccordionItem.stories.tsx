import type { Meta, StoryObj } from "@storybook/react";
import { StreamAccordionItemView } from "./StreamAccordionItem";
import { CustomAccordion } from "../CustomAccordion/CustomAccordion";
import { useState } from "react";
import { useMantineTheme } from "@mantine/core";
import { BN } from "fuels";

import { Stream } from "hooks/Streams";

const meta = {
  title: "Components/StreamsAccordion",
  component: StreamAccordionItemView,
  argTypes: {
    isUserSender: { control: "boolean" },
  },
} satisfies Meta<typeof StreamAccordionItemView>;

export default meta;
type Story = StoryObj<typeof meta>;

const streamReal: Stream = {
  deposit: new BN("0x1ca35f0e00"),
  rate_per_second_e_10: new BN("0x2cf509b357c8b"),
  stream_size: new BN("0x1ca35f0e00"),
  vested_withdrawn_amount: new BN("0x0"),
  start_time: new BN("0x40000000663096fa"),
  stop_time: new BN("0x40000000664851fa"),
  underlying_asset: {
    value: "0x0000000000000000000000000000000000000000000000000000000000000000",
  },
  receiver_asset: {
    value: "0x7a7171a29f3f054c6475f6ce4bb42e7ecc244e586263fea409c65ee008ded27b",
  },
  sender_asset: {
    value: "0xd9516118b05dae0ed426b4fd25d1f8cb571d5a42c3b0d51f5985fd8788bbbba9",
  },
  configuration: {
    is_cancellable: true,
    is_undercollateralized: false,
  },
  streamId: "0",
};

const streamInsolvent: Stream = {
  deposit: new BN("0x1ca35f0e00"),
  rate_per_second_e_10: new BN("0x2cf509b357c8b"),
  stream_size: new BN("0x1ca35f0e00"),
  vested_withdrawn_amount: new BN("0x0"),
  start_time: new BN("0x40000000663096fa"),
  stop_time: new BN("0x40000000664851fa"),
  underlying_asset: {
    value: "0x0000000000000000000000000000000000000000000000000000000000000000",
  },
  receiver_asset: {
    value: "0x7a7171a29f3f054c6475f6ce4bb42e7ecc244e586263fea409c65ee008ded27b",
  },
  sender_asset: {
    value: "0xd9516118b05dae0ed426b4fd25d1f8cb571d5a42c3b0d51f5985fd8788bbbba9",
  },
  configuration: {
    is_cancellable: true,
    is_undercollateralized: true,
  },
  streamId: "2",
};

// Mock data for the props
const stream: Stream = {
  cancellation_time: undefined,
  configuration: undefined,
  deposit: undefined,
  rate_per_second_e_10: undefined,
  receiver_asset: { value: "0xalkjwed23o2349F3sdklja3" },
  start_time: undefined,
  stop_time: undefined,
  vested_withdrawn_amount: undefined,
  sender_asset: { value: "0xalkjwed23o2349F3sdklja3" },
  stream_size: new BN(125.4).mul(new BN(10).pow(new BN(8))),
  underlying_asset: { value: "ETH" },
};
const isUserSender = true;
const streamId = "sampleStreamId";

// Story definition
export const Default = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  return (
    <StreamAccordionItemView
      value={streamReal.sender_asset.value}
      isOpen={isOpen}
      isCancelling={isCancelling}
      onCancel={() => setIsCancelling(true)}
      stream={streamReal}
      isUserSender={isUserSender}
      streamId={streamReal.streamId}
      toggle={() => setIsOpen(!isOpen)}
    />
  );
};

export const WithCustomAccordion = () => {
  const [isCancelling1, setIsCancelling1] = useState(false);
  const [isCancelling2, setIsCancelling2] = useState(false);
  return (
    <CustomAccordion>
      <StreamAccordionItemView
        value={streamReal.sender_asset.value}
        stream={streamReal}
        isCancelling={isCancelling1}
        onCancel={() => setIsCancelling1(true)}
        isUserSender={isUserSender}
        streamId={streamReal.streamId}
      />
      <StreamAccordionItemView
        value={streamReal.receiver_asset.value}
        stream={streamReal}
        isCancelling={isCancelling2}
        onCancel={() => setIsCancelling2(true)}
        isUserSender={isUserSender}
        streamId={streamReal.streamId}
      />
    </CustomAccordion>
  );
};

export const Insolvent = () => {
  const [isOpen, setIsOpen] = useState(true);

  const [isCancelling, setIsCancelling] = useState(false);

  return (
    <StreamAccordionItemView
      value={streamInsolvent.sender_asset.value}
      isOpen={isOpen}
      stream={streamInsolvent}
      isUserSender={isUserSender}
      isCancelling={isCancelling}
      onCancel={() => setIsCancelling(true)}
      streamId={streamInsolvent.streamId}
      toggle={() => setIsOpen(!isOpen)}
    />
  );
};
