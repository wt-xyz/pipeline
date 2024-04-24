import { createTheme, colorsTuple } from "@mantine/core";

export const theme = createTheme({
  colors: {
    // https://mantine.dev/colors-generator/
    green: [
      "#e1fff4",
      "#cdfeea",
      "#9dfbd5",
      "#6bf9bf",
      "#41f7ac",
      "#28f6a0",
      "#13f598",
      "#00da83",
      "#00c373",
      "#00a861",
    ],
    gray: [
      "#f5f5f5",
      "#e7e7e7",
      "#cdcdcd",
      "#b2b2b2",
      "#9a9a9a",
      "#8b8b8b",
      "#848484",
      "#717171",
      "#656565",
      "#575757",
    ],
  },
  radius: {
    xs: "2px",
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
  },
  fontSizes: {
    xs: "10px",
    sm: "12px",
    md: "14px",
    lg: "16px",
    xl: "24px",
  },
  lineHeights: {
    xs: "1.4",
    sm: "1.45",
    md: "1.5",
    lg: "1.6",
    xl: "1.65",
  },
});
