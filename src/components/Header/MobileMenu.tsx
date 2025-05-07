import { Menu, Box, useMantineTheme } from "@mantine/core";
import { usePathname, useRouter } from "next/navigation";
import { TextLg } from "../TextVariants";
import { useDisclosure } from "@mantine/hooks";
import { Burger } from "@mantine/core";
import { NAVIGATION_LINKS } from "@/constants/NavigationConfig";

export const MobileMenu = () => {
  const router = useRouter();
  const theme = useMantineTheme();
  const currentRoute = usePathname();
  const [opened, { toggle }] = useDisclosure();

  return (
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <Box mt="xs" style={{ cursor: "pointer" }} hiddenFrom="sm">
          <Burger
            opened={opened}
            onClick={toggle}
            aria-label="Toggle navigation"
            size="sm"
          />
        </Box>
      </Menu.Target>

      <Menu.Dropdown hiddenFrom="sm">
        {NAVIGATION_LINKS.map(({ label, path }, index) => {
          const selected = path === currentRoute;

          return (
            <Menu.Item
              onClick={() => {
                toggle();
                router.push(path);
              }}
              key={index}
              py="sm"
              variant={selected ? "light" : "subtle"}
              color={selected ? theme.primaryColor : "gray"}
            >
              <TextLg fw={"400"}>{label}</TextLg>
            </Menu.Item>
          );
        })}
      </Menu.Dropdown>
    </Menu>
  );
};
