"use client";

import { createBankAccountsAction } from "@/actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { getAccounts } from "@midday/gocardless";
import { Avatar, AvatarImage } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import { Checkbox } from "@midday/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@midday/ui/form";
import { Skeleton } from "@midday/ui/skeleton";
import { capitalCase } from "change-case";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  accounts: z.array(z.string()).refine((value) => value.some((item) => item)),
});

function RowsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-[210px]" />
          <Skeleton className="h-2.5 w-[180px]" />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-[250px]" />
          <Skeleton className="h-2.5 w-[200px]" />
        </div>
      </div>
    </div>
  );
}

export function SelectAccountModal({ countryCode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const isOpen = searchParams.get("step") === "account";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accounts: [],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const accountsWithDetails = values.accounts
      .map((id) => accounts.find((account) => account.id === id))
      .map((account) => ({
        account_id: account.id,
        name: capitalCase(account.name || account.iban),
        bic: account.bic,
        bban: account.bban,
        currency: account.currency,
        details: account.details,
        iban: account.iban,
        owner_name: capitalCase(account.ownerName),
        bank: {
          agreement_id: account.agreement_id,
          institution_id: account.institution_id,
          name: account.bank.name,
          logo_url: account.bank.logo,
        },
      }));

    await createBankAccountsAction(accountsWithDetails);

    router.push(`${pathname}?step=desktop`);
  }

  useEffect(() => {
    async function fetchData() {
      const accounts = await getAccounts({
        accountId: searchParams.get("ref"),
        countryCode,
      });

      setAccounts(accounts);
      setLoading(false);

      // Set default accounts to checked
      form.reset({ accounts: accounts.map((account) => account.id) });
    }

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={() => router.push(pathname)}>
      <DialogContent
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <div className="p-4">
          <DialogHeader className="mb-8">
            <DialogTitle>Select accounts</DialogTitle>
            <DialogDescription>
              Select the accounts you want to sync with Midday.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {loading && <RowsSkeleton />}

              {accounts.map((account) => (
                <FormField
                  key={account.id}
                  control={form.control}
                  name="accounts"
                  render={({ field }) => {
                    const formattedAmount = new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: account.balances.available.currency,
                    }).format(account.balances.available.amount);

                    return (
                      <FormItem
                        key={account.id}
                        className="flex justify-between"
                      >
                        <FormLabel className="flex items-between">
                          <Avatar className="flex h-9 w-9 items-center justify-center space-y-0 border">
                            <AvatarImage
                              src={account.bank.logo}
                              alt={account.bank.name}
                            />
                          </Avatar>
                          <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none mb-1">
                              {account.iban}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {account.bank.name} - {formattedAmount}
                            </p>
                          </div>
                        </FormLabel>

                        <div>
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(account.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, account.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== account.id,
                                      ),
                                    );
                              }}
                            />
                          </FormControl>
                        </div>
                      </FormItem>
                    );
                  }}
                />
              ))}

              <div className="pt-4">
                <Button
                  className="w-full"
                  type="submit"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
