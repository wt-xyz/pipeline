import {
  Children,
  cloneElement,
  ReactElement,
  useCallback,
  useEffect,
  useState,
} from "react";
import { Flex, FlexProps } from "@mantine/core";
import { CustomAccordionItemProps } from "components/CustomAccordionItem/CustomAccordionItem";

type CustomAccordionProps = {
  children: ReactElement<CustomAccordionItemProps>[];
  storageKey?: string;
  defaultOpenValues?: string[];
  allOpenByDefault?: boolean;
} & Omit<FlexProps, "children">;

export const CustomAccordion = ({
  children,
  storageKey = "accordion-open-values",
  defaultOpenValues = [],
  allOpenByDefault = false,
  ...otherFlexProps
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

  const toggle = useCallback((value: string) => {
    setOpenValues((values) =>
      values.includes(value)
        ? values.filter((v) => v !== value)
        : [...values, value],
    );
  }, []);

  return (
    <Flex direction={"column"} gap={"md"} {...otherFlexProps}>
      {Children.map(children, (child) =>
        cloneElement(child, {
          isOpen: openValues.includes(child.props.value),
          toggle: () => toggle(child.props.value),
        }),
      )}
    </Flex>
  );
};
