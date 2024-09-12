import { Container, Flex } from "@mantine/core";
import { ReactElement } from "react";
import { CustomAccordion } from "components/CustomAccordion/CustomAccordion";
import { StreamAccordionItem } from "components/StreamItemAccordion/StreamAccordionItem";
import { TextLg } from "components/TextVariants";
import { useReceiverStreams, useSenderStreams } from "hooks/Streams";
import { SendingAndReceiving } from "components/SendingAndRecieving/SendingAndReceiving";
import { useIsMobile } from "hooks/useIsMobile";
import { isEmpty } from "lodash";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import {
  deserializeStream,
  selectAllStreams,
  StreamSerializable,
} from "@/redux/streamsSlice";

export const ManagePage = () => {
  const streams = useSelector(selectAllStreams);
  const sendingStreams = useSenderStreams();
  const receiverStreams = useReceiverStreams();
  const sendingOrReceiving = useSelector(
    (state: RootState) => state.sendingOrReceiving.sendingOrReceiving,
  );
  const isSending = sendingOrReceiving === "sending";

  const isMobile = useIsMobile();

  return (
    <Container pt={isMobile ? "xxl" : "sxl"} px={0}>
      {isEmpty(streams) ? (
        <Flex align={"center"} justify={"center"}>
          <TextLg>No Streams to Show</TextLg>
        </Flex>
      ) : (
        <>
          <Container py={"xxl"}>
            <SendingAndReceiving />
          </Container>
          <CustomAccordion py={"xxl"}>
            {
              (isSending ? sendingStreams : receiverStreams)?.map(
                (stream: StreamSerializable) => {
                  const convertedStream = deserializeStream(stream);

                  return (
                    <StreamAccordionItem
                      value={stream.sender_asset.bits}
                      key={stream.id}
                      isUserSender={isSending}
                      stream={convertedStream}
                      streamId={stream.id}
                    />
                  );
                },
              ) as ReactElement[]
            }
          </CustomAccordion>
        </>
      )}
    </Container>
  );
};

export default ManagePage;
