"use client";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Link href="/create">Create</Link>
      <Link href="/manage">Manage</Link>
    </>
  );
}
