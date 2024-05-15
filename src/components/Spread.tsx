import React from "react";
import { Flex, FlexProps } from "@mantine/core";

export const Spread = ({
  children,
  ...flexProps
}: { children: React.ReactNode } & FlexProps) => (
  <Flex justify="space-between" {...flexProps}>
    {children}
  </Flex>
);
