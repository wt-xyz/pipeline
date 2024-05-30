import { Container } from "@mantine/core";
import { TextXxl } from "components/TextVariants";
import { useIsMobile } from "hooks/useIsMobile";
import { CreateStreamForm } from "components/CreateStreamForm";

export const CreatePage = () => {
  const isMobile = useIsMobile();

  return (
    <Container pt={isMobile ? "xxl" : "sxl"} px={0}>
      <TextXxl fw={600} pb={"xxl"}>
        Pipeline
      </TextXxl>
      <CreateStreamForm />
    </Container>
  );
};

export default CreatePage;
