"use client";
import LoginButton from "@/components/LoginButton";
import { SignedOut, UserButton } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";
import { User } from "lucide-react";

function HeaderProfileBtn() {
  const { isLoaded } = useAuth();

  // Don't render anything until Clerk has loaded to prevent hydration mismatch
  if (!isLoaded) {
    return null;
  }

  return (
    <>
      <UserButton>
        <UserButton.MenuItems>
          <UserButton.Link
            label="Profile"
            labelIcon={<User className="size-4" />}
            href="/profile"
          />
        </UserButton.MenuItems>
      </UserButton>

      <SignedOut>
        <LoginButton />
      </SignedOut>
    </>
  );
}
export default HeaderProfileBtn;
