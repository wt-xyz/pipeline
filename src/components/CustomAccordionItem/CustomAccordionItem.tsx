import React, { ReactNode } from "react";
import {
  Box,
  Collapse,
  Divider,
  MantineSpacing,
  MantineStyleProp,
  useMantineTheme,
} from "@mantine/core";
import { IconChevronDown } from "@tabler/icons-react";

export type CustomAccordionItemProps = {
  value: string;
  label?: ReactNode;
  isOpen?: boolean;
  toggle?: (value: string) => void;
  children?: ReactNode;
  style?: MantineStyleProp;
  backgroundColor?: string;
  borderRadius?: string;
  padding?: MantineSpacing;
  accentColor?: string;
};

export const CustomAccordionItem = ({
  label,
  value,
  isOpen,
  toggle,
  children,
  style,
  backgroundColor = "gray",
  borderRadius = "xl",
  padding = "lg",
  accentColor = "white",
}: CustomAccordionItemProps) => {
  const theme = useMantineTheme();

  // Assert that isOpen and toggle are not undefined when needed
  if (typeof isOpen === "undefined" || typeof toggle === "undefined") {
    throw new Error(
      "CustomAccordionItem requires isOpen and toggle props when used outside CustomAccordion",
    );
  }

  return (
    <Box
      p={padding}
      style={{
        backgroundColor: backgroundColor,
        borderRadius: borderRadius,
        ...style,
      }}
    >
      <div
        style={{
          cursor: "pointer",
          display: "flex",
          color: "gray",
          justifyItems: "space-between",
          alignItems: "center",
          width: "100%",
        }}
        onClick={() => toggle(value)}
      >
        <span style={{ flex: 1 }}>{label}</span>
        <div
          style={{
            display: "inline-block",
            height: "40px",
            width: "40px",
            padding: theme.spacing.sm,
            border: `1px solid gray`, // Square border
            borderRadius: theme.radius.lg, // Rounded corners
          }}
        >
          <IconChevronDown
            style={{
              color: "white",
              transition: "transform 0.3s ease-in-out",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </div>
      </div>
      <Collapse in={isOpen}>
        <Box
          style={{
            backgroundColor: backgroundColor,
            borderRadius: borderRadius,
            paddingTop: theme.spacing.md,
            gap: theme.spacing.md,
          }}
        >
          <Divider color={accentColor} />
          {children}
        </Box>
      </Collapse>
    </Box>
  );
};
