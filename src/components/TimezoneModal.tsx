import { Modal, Select } from "@mantine/core";
import { useDispatch, useSelector } from "react-redux";
import { setTimezone } from "@/redux/timezoneSlice";
import { RootState } from "@/redux/store";

export const TimezoneModal = ({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) => {
  const dispatch = useDispatch();
  const timezone = useSelector((state: RootState) => state.timezone.timezone);

  return (
    <Modal opened={opened} onClose={onClose} title={"Change Timezone"}>
      <Modal.Body>
        <Select
          data={Intl.supportedValuesOf("timeZone")}
          value={timezone}
          onChange={(value) =>
            dispatch(
              setTimezone(
                value ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
              ),
            )
          }
        />
      </Modal.Body>
    </Modal>
  );
};
