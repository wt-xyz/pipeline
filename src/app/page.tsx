"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@mantine/core";
import { Header } from "components/Header/Header";
import { MainPage } from "components/MainPage";
import { useFetchStreams } from "hooks/Streams";
import { useFetchCoins } from "hooks/useCoins";
import { useIsMobile } from "@/hooks/useIsMobile";

export type createOrManageSet = "create" | "manage";

export default function Home() {
  const [createOrManage, setCreateOrManage] = useState<createOrManageSet>(
    () => {
      if (typeof window !== "undefined") {
        return (
          (localStorage.getItem("createOrManage") as createOrManageSet) ||
          "create"
        );
      }
      return "create";
    },
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("createOrManage", createOrManage);
    }
  }, [createOrManage]);

  const isMobile = useIsMobile();
  useFetchStreams();
  useFetchCoins();
  console.log("Rendering Home Page");

  return (
    <AppShell
      bg={"background"}
      px={isMobile ? "lg" : "120px"}
      header={{ height: "84px" }}
    >
      <AppShell.Header
        style={{
          display: "flex",
          justifyItems: "center",
          justify: "center",
        }}
        px={"sxl"}
      >
        <Header
          createOrManage={createOrManage}
          setCreateOrManage={setCreateOrManage}
        />
      </AppShell.Header>
      <AppShell.Main>
        <MainPage
          createOrManage={createOrManage}
          setCreateOrManage={setCreateOrManage}
        />
      </AppShell.Main>
    </AppShell>
  );
}
