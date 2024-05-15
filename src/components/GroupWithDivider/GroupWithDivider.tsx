import { Group, GroupProps } from "@mantine/core";
import React, { Children, cloneElement, isValidElement } from "react";

type GroupWithDividerProps = {
  DividerComponent: React.ReactElement;
} & GroupProps;

export const GroupWithDivider = ({
  DividerComponent,
  children,
  ...props
}: GroupWithDividerProps) => {
  return (
    <Group w={"fit-content"} {...props}>
      {Children.map(children, (child, index) => {
        if (!isValidElement(child)) {
          return null;
        }
        return (
          <>
            {index > 0 && DividerComponent}
            {cloneElement(child, { key: index })}
          </>
        );
      })}
    </Group>
  );
};
