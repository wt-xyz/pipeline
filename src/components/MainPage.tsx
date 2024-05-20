import { atom, useRecoilState, useRecoilValue } from "recoil";
import { Container, Flex } from "@mantine/core";
import { createOrManageSet } from "@/app/page";
import { Dispatch, ReactElement, SetStateAction } from "react";
import { CustomAccordion } from "components/CustomAccordion/CustomAccordion";
import { StreamAccordionItem } from "components/StreamItemAccordion/StreamAccordionItem";
import { TextLg, TextXxl } from "components/TextVariants";
import { Stream, useReceiverStreams, useSenderStreams } from "hooks/Streams";
import {
  SendingAndReceiving,
  sendingOrReceivingAtom,
} from "components/SendingAndRecieving/SendingAndReceiving";
import { CreateStreamForm } from "components/CreateStreamForm";
import { CreateOrManageButtonGroupWithDivider } from "components/CreateOrManageButtonGroup/CreateOrManageButtonGroupWithDivider";
import { useIsMobile } from "hooks/useIsMobile";

export const globalStreams = atom({
  key: "globalStreams",
  default: [] as Stream[],
});

export const MainPage = ({
  createOrManage,
  setCreateOrManage,
}: {
  createOrManage: createOrManageSet;
  setCreateOrManage: Dispatch<SetStateAction<createOrManageSet>>;
}) => {
  const streams = useRecoilValue(globalStreams);
  const sendingStreams = useSenderStreams();
  const receiverStreams = useReceiverStreams();
  const sendingOrReceiving = useRecoilValue(sendingOrReceivingAtom);
  const isSending = sendingOrReceiving === "sending";
  const isMobile = useIsMobile();

  return (
    <Container pt={isMobile ? 0 : "xxl"} px={0}>
      <Flex hiddenFrom={"sm"} py={"xxl"} justify={"center"} w={"100%"}>
        <CreateOrManageButtonGroupWithDivider
          hiddenFrom={"sm"}
          createOrManage={createOrManage}
          setCreateOrManage={setCreateOrManage}
        />
      </Flex>
      {createOrManage === "create" ? (
        <>
          <TextXxl fw={600} pb={"xxl"}>
            Pipeline
          </TextXxl>
          <CreateStreamForm />
        </>
      ) : (
        <>
          {streams ? (
            <>
              <Container py={"xxl"}>
                <SendingAndReceiving />
              </Container>
              <CustomAccordion py={"xxl"}>
                {
                  /* TODO: we need to reflect "no streams to show" if this map is empty for either sending or receiving streams.*/
                  (isSending ? sendingStreams : receiverStreams)?.map(
                    (stream: Stream) => {
                      return (
                        <StreamAccordionItem
                          value={stream.sender_asset.value}
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
          ) : (
            <Flex align={"center"} justify={"center"}>
              <TextLg>No Streams to Show</TextLg>
            </Flex>
          )}
        </>
      )}
    </Container>
  );
};
