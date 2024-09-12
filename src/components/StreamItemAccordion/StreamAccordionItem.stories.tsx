import type { Meta } from "@storybook/react";
import { StreamAccordionItemView } from "./StreamAccordionItem";
import { CustomAccordion } from "../CustomAccordion/CustomAccordion";
import { useState } from "react";
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

const streamReal: Stream = {
  deposit: new BN("0x1ca35f0e00"),
  rate_per_second_e_10: new BN("0x2cf509b357c8b"),
  stream_size: new BN("0x1ca35f0e00"),
  vested_withdrawn_amount: new BN("0x0"),
  start_time: new BN("0x40000000663096fa"),
  stop_time: new BN("0x40000000664851fa"),
  underlying_asset: {
    bits: "0x0000000000000000000000000000000000000000000000000000000000000000",
  },
  receiver_asset: {
    bits: "0x7a7171a29f3f054c6475f6ce4bb42e7ecc244e586263fea409c65ee008ded27b",
  },
  sender_asset: {
    bits: "0xd9516118b05dae0ed426b4fd25d1f8cb571d5a42c3b0d51f5985fd8788bbbba9",
  },
  configuration: {
    is_cancellable: true,
    is_undercollateralized: false,
  },
  id: "0",
  cancellation_time: undefined,
};

const streamInsolvent: Stream = {
  deposit: new BN("0x1ca35f0e00"),
  rate_per_second_e_10: new BN("0x2cf509b357c8b"),
  stream_size: new BN("0x1ca35f0e00"),
  vested_withdrawn_amount: new BN("0x0"),
  start_time: new BN("0x40000000663096fa"),
  stop_time: new BN("0x40000000664851fa"),
  underlying_asset: {
    bits: "0x0000000000000000000000000000000000000000000000000000000000000000",
  },
  receiver_asset: {
    bits: "0x7a7171a29f3f054c6475f6ce4bb42e7ecc244e586263fea409c65ee008ded27b",
  },
  sender_asset: {
    bits: "0xd9516118b05dae0ed426b4fd25d1f8cb571d5a42c3b0d51f5985fd8788bbbba9",
  },
  configuration: {
    is_cancellable: true,
    is_undercollateralized: true,
  },
  id: "2",
  cancellation_time: undefined,
};

// const stream_size = new BN(125.4).mul(new BN(10).pow(new BN(8)));
// Mock data for the props
// const stream: Stream = {
//   streamId: "4",
//   cancellation_time: undefined,
//   configuration: {
//     is_cancellable: true,
//     is_undercollateralized: false,
//   },
//   deposit: stream_size,
//   rate_per_second_e_10: new BN(100000000000),
//   receiver_asset: { bits: "0xalkjwed23o2349F3sdklja3" },
//   start_time: new BN(
//     (new Date().getTime() / 1000 - SECONDS_PER_HOUR * 24 * 7).valueOf(),
//   ),
//   stop_time: new BN(
//     (new Date().getTime() / 1000 + SECONDS_PER_HOUR * 24 * 7).valueOf(),
//   ),
//   vested_withdrawn_amount: new BN(0),
//   sender_asset: { bits: "0xalkjwed23o2349F3sdklja3" },
//   stream_size,
//   underlying_asset: { bits: "ETH" },
// };
const isUserSender = true;

// Story definition
export const Default = () => {
  // const [isOpen, setIsOpen] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setIsTopUp] = useState(false);

  return (
    <StreamAccordionItemView
      value={streamReal.sender_asset.bits}
      isOpen={isOpen}
      isCancelling={isCancelling}
      onCancel={() => setIsCancelling(true)}
      stream={streamReal}
      isUserSender={isUserSender}
      streamId={streamReal.id}
      toggle={() => setIsOpen(!isOpen)}
      onTopUp={() => setIsTopUp(true)}
      stats={{
        maxWithdrawable: new BN("0x1ca35f0e00"),
        totalVested: new BN("0x0"),
      }}
    />
  );
};

export const WithCustomAccordion = () => {
  const [isCancelling1, setIsCancelling1] = useState(false);
  const [isCancelling2, setIsCancelling2] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setIsTopUp] = useState(false);

  return (
    <CustomAccordion>
      <StreamAccordionItemView
        value={streamReal.sender_asset.bits}
        stream={streamReal}
        isCancelling={isCancelling1}
        onCancel={() => setIsCancelling1(true)}
        isUserSender={isUserSender}
        streamId={streamReal.id}
        onTopUp={() => setIsTopUp(true)}
        stats={{
          maxWithdrawable: new BN("0x1ca35f0e00"),
          totalVested: new BN("0x0"),
        }}
      />
      <StreamAccordionItemView
        value={streamReal.receiver_asset.bits}
        stream={streamReal}
        isCancelling={isCancelling2}
        onCancel={() => setIsCancelling2(true)}
        isUserSender={isUserSender}
        streamId={streamReal.id}
        onTopUp={() => setIsTopUp(true)}
        stats={{
          maxWithdrawable: new BN("0x1ca35f0e00"),
          totalVested: new BN("0x0"),
        }}
      />
    </CustomAccordion>
  );
};

export const Insolvent = () => {
  const [isOpen, setIsOpen] = useState(true);

  const [isCancelling, setIsCancelling] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setIsTopUp] = useState(false);

  return (
    <StreamAccordionItemView
      value={streamInsolvent.sender_asset.bits}
      isOpen={isOpen}
      stream={streamInsolvent}
      isUserSender={isUserSender}
      isCancelling={isCancelling}
      onCancel={() => setIsCancelling(true)}
      streamId={streamInsolvent.id}
      toggle={() => setIsOpen(!isOpen)}
      onTopUp={() => setIsTopUp(true)}
      stats={{
        maxWithdrawable: new BN("0x1ca35f0e00"),
        totalVested: new BN("0x0"),
      }}
    />
  );
};
