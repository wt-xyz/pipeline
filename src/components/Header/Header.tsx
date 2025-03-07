import { Divider, Flex, Image } from "@mantine/core";
import { Spread } from "components/Spread";
import { Wallet } from "components/Wallet/Wallet";
import { GroupWithDivider } from "components/GroupWithDivider/GroupWithDivider";
import { NavLinkButton } from "../Buttons/NavLinkButton";
import { useRouter } from "next/navigation";

export const Header = () => {
  const router = useRouter();
  return (
    // Desktop View
    <Spread align="center" w={"100%"}>
      {/* logo here */}
      <Image
        h={"32px"}
        src={"./title_logo.svg"}
        alt={"Pipeline"}
        onClick={() => router.push("/")}
        style={{
          cursor: "pointer",
        }}
      />
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
          { label: "Designer", path: "/designer" },
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
