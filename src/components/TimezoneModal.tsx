import { Modal, Select } from "@mantine/core";
import { atom, useRecoilState } from "recoil";

export const timezoneAtom = atom<string | undefined>({
  key: "timezone",
  default: Intl.DateTimeFormat().resolvedOptions().timeZone,
});
export const TimezoneModal = ({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) => {
  const [timezone, setTimezone] = useRecoilState(timezoneAtom);
  return (
    <Modal opened={opened} onClose={onClose} title={"Change Timezone"}>
      <Modal.Body>
        <Select
          data={Intl.supportedValuesOf("timeZone")}
          value={timezone}
          onChange={(value) =>
            setTimezone(
              value ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
            )
          }
        />
      </Modal.Body>
    </Modal>
  );
};
