import { Flex } from "@mantine/core";
import { CustomAccordion } from "components/CustomAccordion/CustomAccordion";
import { StreamAccordionItem } from "components/StreamItemAccordion/StreamAccordionItem";
import { Stream, useStreams } from "hooks/Streams";

export const ManageStreams = () => {
  // Add hooks to grab all streams
  const streams: Stream[] | undefined = useStreams();

  return (
    <Flex>
      <CustomAccordion>
        {streams?.map((stream: Stream) => {
          return (
            <StreamAccordionItem
              value={stream.streamId}
              isUserSender={}
              key={stream.streamId}
              stream={stream}
            />
          );
        })}
      </CustomAccordion>
    </Flex>
  );
};
