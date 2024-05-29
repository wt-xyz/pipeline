import { Button, Group, Text, useMantineTheme } from "@mantine/core";
import { TextXxl } from "components/TextVariants";
import { atom, useRecoilState } from "recoil";
import classes from "./SendingAndReceiving.module.scss";
import { useFetchStreams } from "hooks/Streams";

export type sendingOrReceivingSet = "sending" | "receiving";
export const sendingOrReceivingAtom = atom({
  key: "sendingOrReceiving",
  default: "sending" as sendingOrReceivingSet,
});

export const SendingAndReceiving = () => {
  useFetchStreams();
  const [sendingOrReceiving, setSendingOrReceiving] = useRecoilState(
    sendingOrReceivingAtom,
  );
  const isSending = sendingOrReceiving === "sending";

  return (
    <Group gap={"xxl"}>
      <Button
        className={classes.SendingOrReceivingButton}
        c={isSending ? "white" : "gray"}
        variant={"transparent"}
        onClick={() => setSendingOrReceiving("sending")}
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
        onClick={() => setSendingOrReceiving("receiving")}
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
