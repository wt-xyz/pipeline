import { Button, Divider, Flex, Image, useMantineTheme } from "@mantine/core";
import { Spread } from "components/Spread";
import { Wallet } from "components/Wallet/Wallet";
import { TextLg } from "components/TextVariants";
import { GroupWithDivider } from "components/GroupWithDivider/GroupWithDivider";
import { useRouter, usePathname } from "next/navigation";

export const Header = () => {
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

type NavLinkButtonProps = {
  label: string;
  path: string;
};

const NavLinkButton = ({ label, path }: NavLinkButtonProps) => {
  const theme = useMantineTheme();

  const router = useRouter();
  const currentRoute = usePathname();

  const selected = path === currentRoute;

  return (
    <Button
      px={"md"}
      py={"xs"}
      radius={"999px"}
      h={"32px"}
      variant={selected ? "light" : "subtle"}
      color={selected ? theme.primaryColor : "gray"}
      onClick={() => {
        router.push(path);
      }}
    >
      <TextLg fw={"400"}>{label}</TextLg>
    </Button>
  );
};
