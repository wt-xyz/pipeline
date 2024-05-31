import { Dispatch, SetStateAction } from "react";
import { GroupWithDivider } from "components/GroupWithDivider/GroupWithDivider";
import { Button, Divider, useMantineTheme } from "@mantine/core";
import { TextLg } from "components/TextVariants";
import { createOrManageSet } from "@/app/page";

export const CreateOrManageButtonGroupWithDivider = ({
  createOrManage,
  setCreateOrManage,
  hiddenFrom,
}: {
  createOrManage: createOrManageSet;
  setCreateOrManage: Dispatch<SetStateAction<createOrManageSet>>;
  hiddenFrom?: "sm" | "md" | "lg" | "xl";
}) => {
  const theme = useMantineTheme();
  return (
    <GroupWithDivider
      hiddenFrom={hiddenFrom}
      gap={"sm"}
      style={(theme) => ({
        border: `1px solid ${theme.colors.cardBackground[0]}`,
        borderRadius: "999px",
      })}
      p={"xxs"}
      DividerComponent={
        <Divider
          color={"cardBackground"}
          h="xxl"
          my="auto"
          orientation="vertical"
        />
      }
    >
      {/* nav links here */}
      <Button
        px={"md"}
        py={"xs"}
        radius={"999px"}
        h={"32px"}
        variant={createOrManage === "create" ? "light" : "subtle"}
        color={createOrManage === "create" ? theme.primaryColor : "gray"}
        onClick={() => {
          setCreateOrManage("create");
        }}
      >
        <TextLg fw={"400"}>Create Stream</TextLg>
      </Button>
      <Button
        px={"md"}
        py={"xs"}
        radius={"999px"}
        h={"32px"}
        variant={createOrManage === "manage" ? "light" : "subtle"}
        color={createOrManage === "manage" ? theme.primaryColor : "gray"}
        onClick={() => setCreateOrManage("manage")}
      >
        <TextLg fw={"400"}>Manage Streams</TextLg>
      </Button>
    </GroupWithDivider>
  );
};
