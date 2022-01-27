import React, { useState } from "react";
import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Head from "next/head";
export default function Header() {

  return (
    <>
      <Head>
        <title>fill in</title>
        <meta name="description" content="" />
        <link rel="icon" href="/images/favicon.ico" />
      </Head>

      <div id="header" className="w-full z-10 absolute top-0 ">
        <div className="flex justify-center md:justify-end w-full p-6">
          <WalletMultiButton />
        </div>
      </div>
    </>
  );
}
