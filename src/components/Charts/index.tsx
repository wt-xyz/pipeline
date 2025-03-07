import { Box } from "@mantine/core";
import { PieceWiseCreateStreamForm } from "../PieceWiseCreateStreamForm";
import VestingSchedule from "./vesting-schedule";

const PieceWiseDesigner = () => {
  return (
    <div>
      <VestingSchedule />
      <Box
        style={{
          marginTop: 30,
        }}
      >
        <PieceWiseCreateStreamForm />
      </Box>
    </div>
  );
};

export default PieceWiseDesigner;
