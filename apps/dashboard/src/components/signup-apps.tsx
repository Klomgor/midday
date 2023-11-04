"use client";

import { subscribeEmail } from "@/actions";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/utils";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { OnboardingStep } from "./onboarding-step";

function SubmitButton({ disabled }) {
  const router = useRouter();
  const { pending } = useFormStatus();

  const handleSkip = () => {
    router.push("/");
  };

  if (pending) {
    return (
      <div className="absolute top-1 right-0">
        <Loader2 className="absolute w-4 h-4 mr-3 text-black animate-spin top-2.5 right-2" />
      </div>
    );
  }

  return (
    <Button
      disabled={disabled}
      className="absolute right-2 z-10 top-2 h-7"
      type="submit"
    >
      Join waitlist
    </Button>
  );
}

export function SignupApps() {
  const [isSubscribed, setSubscribed] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const active = searchParams.get("step") === "apps";

  const handleSkip = () => {
    router.push("/");
  };

  return (
    <div className="py-6 px-8 max-w-[900px] flex items-between relative">
      <OnboardingStep active={active} done={false} />
      <div className={cn("flex-1 opacity-30 relative", active && "opacity-1")}>
        <div className="flex items-start space-x-2">
          <h2 className="mb-2">Sign up for apps</h2>
          <button
            disabled
            type="button"
            className="relative rounded-lg overflow-hidden p-[1px]"
            style={{
              background:
                "linear-gradient(-45deg, rgba(235,248,255,.18) 0%, #848f9c 50%, rgba(235,248,255,.18) 100%)",
            }}
          >
            <span className="flex items-center gap-4 py-1 px-2 rounded-[7px] bg-background text-xs h-full font-normal">
              Comming soon
            </span>
          </button>
        </div>
        <p className="text-sm text-[#606060]">
          We’re currently developing our iOS, Android and Mac apps. Sign up{" "}
          <br />
          below if you want to get notified for the beta release.
        </p>

        <div className="mt-8">
          <div className="w-[330px]">
            {isSubscribed ? (
              <Button onClick={handleSkip}>Explore dashboard</Button>
            ) : (
              <div className="flex items-center space-x-2">
                <form
                  action={async (formData) => {
                    await subscribeEmail(formData, "apps");
                    setSubscribed(true);
                  }}
                >
                  <fieldset className="relative">
                    <input
                      disabled={!active}
                      placeholder="Enter your email"
                      type="email"
                      name="email"
                      id="email"
                      autoComplete="email"
                      aria-label="Email address"
                      required
                      className="border bg-transparent border-[#2C2C2C] font-sm text-white outline-none py-1 px-3 w-[370px] placeholder-[#606060] rounded-lg h-11"
                    />
                    <SubmitButton disabled={!active} />
                  </fieldset>
                </form>

                <Button
                  disabled={!active}
                  variant="ghost"
                  onClick={handleSkip}
                  className="font-normal text-sm hover:bg-transparent text-[#606060]"
                >
                  Skip
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
