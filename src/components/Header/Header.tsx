import { Divider, Flex, Image } from "@mantine/core";
import { Spread } from "components/Spread";
import { Wallet } from "components/Wallet/Wallet";
import { GroupWithDivider } from "components/GroupWithDivider/GroupWithDivider";
import { NavLinkButton } from "../Buttons/NavLinkButton";

export const Header = () => {
  return (
    // Desktop View
    <Spread align="center" w={"100%"}>
      {/* logo here */}
      <a href="/" style={{ cursor: "pointer" }}>
        <Image h={"32px"} src={"./title_logo.svg"} alt={"Pipeline"} />
      </a>
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
        {[
          { label: "Create Stream", path: "/create" },
          { label: "Manage Streams", path: "/manage" },
        ].map((button) => (
          <NavLinkButton {...button} key={button.path} />
        ))}
        <Wallet />
      </GroupWithDivider>
    </Spread>
  );
};
