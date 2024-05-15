import {Flex, Progress, useMantineTheme} from '@mantine/core';
import {percentageCompleteFromTimestamps} from '@/utils/dateTimeUtils';
import {formatDateToISO} from '@/utils/formatUtils';
import {Spread} from 'components/Spread';
import {TextMd, TextSm } from 'components/TextVariants';

type StreamProgressBarProps = {
    // percentage: number; 
    startDate: Date;
    endDate: Date;

}
// & CardProps; // Extend with Mantine CardProps

export const StreamProgressBar = ({ startDate, endDate }: StreamProgressBarProps) => {
    const theme = useMantineTheme();
    const percentage = percentageCompleteFromTimestamps(startDate, endDate)
    return <>
        <Flex direction="column" w="100%" gap={"sm"}>
            <Spread c={"gray.3"}>
                <TextMd>
                    {formatDateToISO(startDate)}
                </TextMd>
                <TextMd>
                    {formatDateToISO(endDate)}
                </TextMd>
            </Spread>
            <QuantizedProgress value={percentage} segments={20} />
            <Spread c={"gray.3"}>
                <TextSm>
                    0%
                </TextSm>
                <TextSm>
                    50%
                </TextSm>
                <TextSm>
                    100%
                </TextSm>
            </Spread>
        </Flex>
    </>
}


const QuantizedProgress = ({ value, segments = 10 }: { value: number, segments?: number }) => {
    const theme = useMantineTheme();
    const segmentWidth = 100 / segments;
    // split the segments values into an array of values based on the total value so that each square is filled preportionally
    const segmentsFilled = value / segmentWidth;
    console.log(segmentsFilled);
    const progressArray = Array.from({ length: segments }).map((_, index) => {
        if (index + 1 <= segmentsFilled) {
            return 100;
        } else if (index + 1 - segmentsFilled < 1) {
            return (index + 1 - segmentsFilled) * 100;
        } else return 0;
    });

    return (
        <Flex direction="row" justify={"space-between"} align={"center"} gap="xs" h="24px" wrap={"nowrap"} w="100%">
            {progressArray.map((value, index) => (
                <Progress radius={'sm'} value={value} bg="primaryBackdrop" w="90%" h="100%" />
            ))}
        </Flex>
    );

}