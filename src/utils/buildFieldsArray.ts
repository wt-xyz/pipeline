import { MantineColor } from "@mantine/core";
import { formatAddress } from "utils/formatUtils";
import {
  daysAwayFromTaiTimeBN,
  getDaysBetweenTaiTimes,
} from "utils/dateTimeUtils";
import { Stream } from "hooks/Streams";

export const buildFieldArray = (
  stream: Stream,
  isUserSender: boolean,
): { value: string; label: string; color: MantineColor }[] => {
  const fieldArray = [];
  if (isUserSender) {
    fieldArray.push({
      label: "To",
      value: formatAddress(stream.receiver_asset.value),
      color: "white",
    });
  } else {
    fieldArray.push({
      label: "From",
      value: formatAddress(stream.sender_asset.value),
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
      //TODO: how do we get this value?
      value: "1023",
      color: "primary",
    },
    {
      label: "Status",
      //TODO: how do we get this value?
      value: "Active",
      // TODO: color changes based on status
      color: "white",
    },
    {
      label: "Amount Withdrawn",
      //TODO: how do we get this value?
      value: "0",
      color: "yellow",
    },
    {
      label: "Total Withdrawable",
      //TODO: update with max withdrawable call
      value: "1023",
      color: "blue",
    },
    {
      label: "Rate per Second",
      value: stream.rate_per_second_e_10.div(10 ** 10).toString(),
      color: "white",
    },
    {
      label: "Full Duration",
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
        value: "1023",
        color: "green",
      },
      {
        label: "Days until insolvency",
        value: "15",
        //TODO: change color based on value
        color: "red",
      },
    );
  }
  return fieldArray;
};
