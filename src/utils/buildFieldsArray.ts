import { MantineColor } from "@mantine/core";
import {
  formatAddress,
  formatDecimals,
  parseDecimalsBN,
} from "utils/formatUtils";
import {
  convertTaiTimeBNToDate,
  daysAwayFromTaiTimeBN,
  getDaysBetweenTaiTimes,
} from "utils/dateTimeUtils";
import { BN } from "fuels";
import Decimal from "decimal.js";
import { Stream } from "hooks/Streams";
import { SECONDS_PER_DAY } from "@/constants/constants";

export const buildFieldArray = (
  stream: Stream,
  isUserSender: boolean,
  stats: { maxWithdrawable: BN; totalVested: BN },
): { value: string; label: string; color: MantineColor }[] => {
  const fieldArray = [];
  if (isUserSender) {
    fieldArray.push({
      label: "To",
      value: formatAddress(stream.receiver_asset.bits),
      color: "white",
    });
  } else {
    fieldArray.push({
      label: "From",
      value: formatAddress(stream.sender_asset.bits),
      color: "white",
    });
  }
  // Fields that belong with both sender and receiver
  fieldArray.push(
    {
      label: "Days Remaining",
      value: daysAwayFromTaiTimeBN(stream.stop_time).toString(),
      color: "white",
    },
    {
      label: "Amount Vested",
      value: formatDecimals(stats.totalVested),
      color: "primary",
    },
    {
      label: "Status",
      value: getStreamStatus(stream),
      color: getStreamStatusColor(getStreamStatus(stream)),
    },
    {
      label: isUserSender ? "Withdrawn by Receiver" : "Amount Withdrawn",
      value: formatDecimals(stats.totalVested.sub(stats.maxWithdrawable)),
      color: "yellow",
    },
    {
      label: isUserSender ? "Withdrawable by Receiver" : "Total Withdrawable",
      value: formatDecimals(stats.maxWithdrawable),
      color: "blue",
    },
    {
      label: "Rate per Day",
      value: new Decimal(
        parseDecimalsBN(stream.rate_per_second_e_10)
          .mul(SECONDS_PER_DAY)
          .toString(),
      )
        .div(10 ** 10)
        .toString(),
      color: "white",
    },
    {
      label: "Full Duration (Days)",
      value: getDaysBetweenTaiTimes(
        stream.start_time,
        stream.stop_time,
      ).toString(),
      color: "white",
    },
  );
  if (stream.configuration.is_undercollateralized) {
    fieldArray.push(
      {
        label: "Collateral Deposited",
        value: parseDecimalsBN(stream.deposit).toString(),
        color: "green",
      },
      {
        label: "Days until Insolvency",
        value: daysTillInsolvency(stream).toString(),
        color:
          daysTillInsolvency(stream) < 5
            ? "red"
            : daysTillInsolvency(stream) < 10
              ? "yellow"
              : "green",
      },
    );
  }
  return fieldArray;
};

const daysTillInsolvency = (stream: Stream) =>
  stream.deposit
    .div(stream.rate_per_second_e_10.div(10 ** 10))
    .div(86400)
    .toNumber();

const getStreamStatus = (
  stream: Stream,
): "Active" | "Complete" | "Insolvent" | "Not Started" => {
  let status;
  if (convertTaiTimeBNToDate(stream.stop_time) < new Date()) {
    status = "Complete";
  } else if (convertTaiTimeBNToDate(stream.start_time) > new Date()) {
    status = "Not Started";
  } else {
    status = "Active";
  }

  return status as "Active" | "Complete" | "Insolvent" | "Not Started";
};

const getStreamStatusColor = (
  streamStatus: ReturnType<typeof getStreamStatus>,
) => {
  switch (streamStatus) {
    case "Active":
      return "green";
    case "Complete":
      return "blue";
    case "Insolvent":
      return "red";
    case "Not Started":
      return "gray";
  }
};
