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

export const ManagePage = () => {
  const streams = useSelector((state) => state.pipeline.globalStreams);
  const sendingStreams = useSenderStreams();
  const receiverStreams = useReceiverStreams();
  const isSending = useSelector((state) => state.pipeline.sendingOrReceiving);

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
                (stream: Stream) => {
                  return (
                    <StreamAccordionItem
                      value={stream.sender_asset.bits}
                      key={stream.streamId}
                      isUserSender={isSending}
                      stream={stream}
                      streamId={stream.streamId}
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
