import { Button, Group, Text } from "@mantine/core";
import classes from "./SendingAndReceiving.module.scss";
import { useFetchStreams } from "hooks/Streams";
import { useDispatch, useSelector } from "react-redux";
import { setSendingOrReceiving } from "@/redux/slice";
import { RootState } from "@/redux/store";

export type sendingOrReceivingSet = "sending" | "receiving";

export const SendingAndReceiving = () => {
  useFetchStreams();
  const dispatch = useDispatch();
  const isSending = useSelector(
    (state: RootState) => state.pipeline.sendingOrReceiving,
  );

  return (
    <Group gap={"xxl"}>
      <Button
        className={classes.SendingOrReceivingButton}
        c={isSending ? "white" : "gray"}
        variant={"transparent"}
        onClick={() => dispatch(setSendingOrReceiving("sending"))}
        style={
          isSending
            ? {
                borderBottom: "2px solid green",
              }
            : {}
        }
      >
        <Text className={classes.TextDisplay} fw={isSending ? 600 : 400}>
          Sending
        </Text>
      </Button>
      <Button
        className={classes.SendingOrReceivingButton}
        c={!isSending ? "white" : "gray"}
        variant={"transparent"}
        onClick={() => dispatch(setSendingOrReceiving("receiving"))}
        style={
          !isSending
            ? {
                borderBottom: "2px solid green",
              }
            : {}
        }
      >
        <Text className={classes.TextDisplay} fw={!isSending ? 600 : 400}>
          Receiving
        </Text>
      </Button>
    </Group>
  );
};
