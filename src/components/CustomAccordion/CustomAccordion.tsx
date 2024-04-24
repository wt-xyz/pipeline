import {
  Children,
  cloneElement,
  ReactElement,
  useEffect,
  useState,
} from "react";
import { Box, MantineStyleProp } from "@mantine/core";
import { CustomAccordionItemProps } from "components/CustomAccordionItem/CustomAccordionItem";

type CustomAccordionProps = {
  children: ReactElement<CustomAccordionItemProps>[];
  storageKey?: string;
  defaultOpenValues?: string[];
  allOpenByDefault?: boolean;
  style?: MantineStyleProp;
};

export const CustomAccordion = ({
  children,
  storageKey = "accordion-open-values",
  defaultOpenValues = [],
  allOpenByDefault = false,
  style,
}: CustomAccordionProps) => {
  // Initialize state with local storage or default values
  const [openValues, setOpenValues] = useState<string[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      return JSON.parse(saved);
    } else {
      return allOpenByDefault
        ? Children.map(children, (child) => child.props.value)
        : defaultOpenValues;
    }
  });

  // Effect to update local storage whenever open values change
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(openValues));
  }, [openValues, storageKey]);

  const toggle = (value: string) => {
    setOpenValues((values) =>
      values.includes(value)
        ? values.filter((v) => v !== value)
        : [...values, value],
    );
  };

  return (
    <Box style={style}>
      {Children.map(children, (child) =>
        cloneElement(child, {
          isOpen: openValues.includes(child.props.value),
          toggle: toggle,
        }),
      )}
    </Box>
  );
};
