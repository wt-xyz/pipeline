import { Text, TextProps } from "@mantine/core";
import React from "react";

export const TextXxl = ({
  children,
  ...textProps
}: { children: React.ReactNode } & TextProps) => (
  <Text fz="xxl" ff={"monospace"} {...textProps}>
    {children}
  </Text>
);
export const TextSm = ({
  children,
  ...textProps
}: { children: React.ReactNode } & TextProps) => (
  <Text fz="sm" {...textProps}>
    {children}
  </Text>
);
export const TextMd = ({
  children,
  ...textProps
}: { children: React.ReactNode } & TextProps) => (
  <Text fz="sm" {...textProps}>
    {children}
  </Text>
);

export const TextLg = ({
  children,
  ...textProps
}: { children: React.ReactNode } & TextProps) => (
  <Text fz="lg" lh="md" {...textProps}>
    {children}
  </Text>
);
