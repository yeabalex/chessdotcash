import { IconExternalLink, IconUser } from "@tabler/icons-react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="navbar border-base-300 dark:border-neutral mx-1 w-auto justify-center border-b-2 md:mx-16 lg:mx-40">
      <div className="flex flex-1 items-center gap-2">
        <Link
          href="/"
          className="flex btn btn-ghost no-animation p-0 text-2xl normal-case hover:bg-transparent"
        >
          <span className="">/chessforcash.</span>
        </Link>
      </div>
      <div className="flex-none">
        <ThemeToggle />
        <label tabIndex={0} htmlFor="auth-modal" className="btn btn-ghost btn-circle avatar">
          <div className="w-10 rounded-full">
            <IconUser className="m-auto block h-full" />
          </div>
        </label>
      </div>
    </header>
  );
}
