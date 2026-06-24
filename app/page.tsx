"use client";

import CheckTestUseCase from "@/application/usecases/check-test";
import Check from "@/domain/entities/check";
import Fetcher from "@/infrastructure/api/fetcher";
import CheckTestRepository from "@/infrastructure/repositories/check-test.repo";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Home() {

  const [check, setCheck] = useState<Check | null>(null);
  useEffect(() => {
      const checkTest = async () => {
      const useCaseCheck = new CheckTestUseCase(
      new CheckTestRepository(
        new Fetcher()
      )
    )
      const result = await useCaseCheck.check();
      console.log(result);
      setCheck(result);
    }
    checkTest();
  }, []);
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        {check && <p>{check.getMessage()}</p>}
      </main>
    </div>
  );
}
