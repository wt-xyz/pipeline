"use client";

import { useIsMobile } from "@/hooks/useIsMobile";
import { Container } from "@mantine/core";
import Designer from "@/app/designer/designer-page";
import { TextXxl } from "@/components/TextVariants";
import DesignerPage from "@/app/designer/designer-page";

const Page = () => {
  const isMobile = useIsMobile();

  return (
    <Container pt={isMobile ? "xxl" : "sxl"} px={0}>
      <TextXxl fw={600} pb={"xxl"}>
        Pipeline
      </TextXxl>

      <DesignerPage />
    </Container>
  );
};

export default Page;
