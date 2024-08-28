import { Container, Flex } from "@mantine/core";
import { ReactElement } from "react";
import { CustomAccordion } from "components/CustomAccordion/CustomAccordion";
import { StreamAccordionItem } from "components/StreamItemAccordion/StreamAccordionItem";
import { TextLg } from "components/TextVariants";
import { Stream, useReceiverStreams, useSenderStreams } from "hooks/Streams";
import { SendingAndReceiving } from "components/SendingAndRecieving/SendingAndReceiving";
import { useIsMobile } from "hooks/useIsMobile";
import { isEmpty } from "lodash";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { selectAllStreams, StreamSerializable } from "@/redux/streamsSlice";
import { BN } from "fuels";

export const ManagePage = () => {
  const streams = useSelector(selectAllStreams);
  const sendingStreams = useSenderStreams();
  const receiverStreams = useReceiverStreams();
  const sendingOrReceiving = useSelector(
    (state: RootState) => state.sendingOrReceiving.sendingOrReceiving,
  );
  const isSending = sendingOrReceiving === "sending";

  const isMobile = useIsMobile();

  // Function to convert StreamSerializable back to Stream
  const convertToStream = (stream: StreamSerializable): Stream => {
    return {
      ...stream,
      deposit: new BN(stream.deposit),
      rate_per_second_e_10: new BN(stream.rate_per_second_e_10),
      stream_size: new BN(stream.stream_size),
      vested_withdrawn_amount: new BN(stream.vested_withdrawn_amount),
      start_time: new BN(stream.start_time),
      stop_time: new BN(stream.stop_time),
    };
  };

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
                  const convertedStream = convertToStream(stream);

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
