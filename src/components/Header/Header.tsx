import {
  Button,
  Divider,
  Flex,
  Group,
  Image,
  useMantineTheme,
} from "@mantine/core";
import { Spread } from "components/Spread";
import { Wallet } from "components/Wallet/Wallet";
import { Dispatch, SetStateAction } from "react";
import { createOrManageSet } from "@/app/page";
import { TextLg } from "components/TextVariants";
import { GroupWithDivider } from "components/GroupWithDivider/GroupWithDivider";

export const Header = ({
  createOrManage,
  setCreateOrManage,
}: {
  createOrManage: createOrManageSet;
  setCreateOrManage: Dispatch<SetStateAction<createOrManageSet>>;
}) => {
  const theme = useMantineTheme();

  return (
    // Desktop View
    <Spread align="center" w={"100%"}>
      {/* logo here */}
      <Image h={"32px"} src={"./title_logo.svg"} alt={"Pipeline"} />
      {/* Mobile View */}
      <Flex hiddenFrom="sm">
        <Wallet />
      </Flex>
      {/* Desktop View */}
      <GroupWithDivider
        visibleFrom={"sm"}
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
        <Wallet />
      </GroupWithDivider>
    </Spread>
  );
};
