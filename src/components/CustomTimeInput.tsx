import {
  Popover,
  ActionIcon,
  Flex,
  Select,
  useMantineTheme,
} from "@mantine/core";
import { IconClock } from "@tabler/icons-react";
import { useCallback, useState } from "react";

type CustomTimePickerProps = {
  onTimeChange?: (time: string) => void;
};
const CustomTimeInput = ({ onTimeChange }: CustomTimePickerProps) => {
  const theme = useMantineTheme();

  const [time, setTime] = useState({ hour: "00", minute: "00" });

  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0"),
  );
  const minutes = Array.from({ length: 60 }, (_, i) =>
    i.toString().padStart(2, "0"),
  );

  const updateTime = useCallback(
    (newTime: { hour: string; minute: string }) => {
      setTime(newTime);
      const timeString = `${newTime.hour}:${newTime.minute}`;

      if (onTimeChange) {
        onTimeChange(timeString);
      }
    },
    [onTimeChange],
  );

  return (
    <Popover width={200} position="bottom" withArrow shadow="md">
      <Popover.Target>
        <Flex
          styles={{
            root: {
              alignItems: "center",
              border: `1px solid ${theme.colors.dark[4]}`,
              borderRadius: theme.radius.lg,
              padding: "4px",
              paddingLeft: "8px",
              color: theme.colors.dark[3],
              cursor: "pointer",
            },
          }}
        >
          {`${time.hour}:${time.minute}`}
          <ActionIcon
            variant="subtle"
            styles={{
              root: {
                color: theme.colors.dark[3],
                marginLeft: "2px",
              },
            }}
          >
            <IconClock size={16} stroke={1.5} />
          </ActionIcon>
        </Flex>
      </Popover.Target>
      <Popover.Dropdown>
        <Flex gap={"sm"}>
          <Select
            data={hours}
            value={time.hour}
            onChange={(hour) => {
              if (hour) {
                updateTime({ ...time, hour });
              }
            }}
          />
          <Select
            data={minutes}
            value={time.minute}
            onChange={(minute) => {
              if (minute) {
                updateTime({ ...time, minute });
              }
            }}
          />
        </Flex>
      </Popover.Dropdown>
    </Popover>
  );
};

export default CustomTimeInput;
