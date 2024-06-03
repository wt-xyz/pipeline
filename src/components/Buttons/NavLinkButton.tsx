import { Button, ButtonProps, useMantineTheme } from "@mantine/core";
import { usePathname, useRouter } from "next/navigation";
import { TextLg } from "../TextVariants";

type NavLinkButtonProps = {
  label: string;
  path: string;
} & ButtonProps;

export const NavLinkButton = ({
  label,
  path,
  ...others
}: NavLinkButtonProps) => {
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
      {...others}
    >
      <TextLg fw={"400"}>{label}</TextLg>
    </Button>
  );
};
