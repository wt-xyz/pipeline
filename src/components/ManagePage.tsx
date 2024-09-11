import { Container, Flex } from "@mantine/core";
import { ReactElement } from "react";
import { CustomAccordion } from "components/CustomAccordion/CustomAccordion";
import { StreamAccordionItem } from "components/StreamItemAccordion/StreamAccordionItem";
import { TextLg } from "components/TextVariants";
import { SendingAndReceiving } from "components/SendingAndRecieving/SendingAndReceiving";
import { useIsMobile } from "hooks/useIsMobile";
import { isEmpty } from "lodash";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import {
  Stream,
  useSenderStreams,
  useReceiverStreams,
  useFetchStreams,
} from "hooks/Streams";
import { useFetchCoins } from "@/hooks/useCoins";
import { useApolloClient } from "@apollo/client";

export const ManagePage = () => {
  const streams = useSelector(
    (state: RootState) => state.pipeline.globalStreams,
  );
  const sendingStreams = useSenderStreams();
  const receiverStreams = useReceiverStreams();

  const sendingOrReceiving = useSelector(
    (state: RootState) => state.pipeline.sendingOrReceiving,
  );
  const isSending = sendingOrReceiving === "sending";
  const isMobile = useIsMobile();
  const client = useApolloClient();

  useFetchStreams(client);
  useFetchCoins();

  // console.log("streams - ", streams);
  // console.log("sendingStreams - ", sendingStreams);
  // console.log("receiverStreams - ", receiverStreams);

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
