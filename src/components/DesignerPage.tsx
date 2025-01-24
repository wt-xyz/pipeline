import { useIsMobile } from "@/hooks/useIsMobile";
import { Button, Container, Flex } from "@mantine/core";
import { TextXxl } from "./TextVariants";
import ChartThree from "./Charts";

const DesignerPage = () => {
  const isMobile = useIsMobile();

  return (
    <Container pt={isMobile ? "xxl" : "sxl"} px={0}>
      <TextXxl fw={600} pb={"xxl"}>
        Pipeline
      </TextXxl>

      <ChartThree />
    </Container>
  );
};

export default DesignerPage;
