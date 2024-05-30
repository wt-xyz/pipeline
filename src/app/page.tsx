"use client";
import { useFetchStreams } from "hooks/Streams";
import { useFetchCoins } from "hooks/useCoins";
import Link from "next/link";

export default function Home() {
  useFetchStreams();
  useFetchCoins();
  console.log("Rendering Home Page");

  return (
    <>
      <Link href="/create">Create</Link>
      <Link href="/manage">Manage</Link>
    </>
  );
}
