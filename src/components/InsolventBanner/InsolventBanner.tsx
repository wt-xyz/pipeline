import { Alert } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { TextLg, TextMd } from "components/TextVariants";

export const InsolventBanner = () => {
  return (
    <Alert
      color={"red"}
      styles={{
        wrapper: { alignItems: "center" },
      }}
      icon={<IconAlertTriangle size={"24px"} />}
      title={<TextLg fw={"500"}>This Stream is Insolvent!</TextLg>}
    >
      <TextMd c={"red"}>
        Your stream is insolvent because you exhausted collateral. Please
        deposit more funds so that your recipient can continue to receive funds.
      </TextMd>
    </Alert>
  );
};
