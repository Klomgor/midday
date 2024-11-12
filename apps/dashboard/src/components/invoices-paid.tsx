import { getInvoiceSummary } from "@midday/supabase/cached-queries";
import Link from "next/link";
import { InvoiceSummary } from "./invoice-summary";

export async function InvoicesPaid({
  defaultCurrency,
}: {
  defaultCurrency: string;
}) {
  const { data } = await getInvoiceSummary({ status: "paid" });

  const totalInvoiceCount = data?.at(0)?.invoice_count;

  return (
    <Link href="/invoices?statuses=paid" className="hidden sm:block">
      <InvoiceSummary
        data={data}
        totalInvoiceCount={totalInvoiceCount}
        defaultCurrency={defaultCurrency}
        title="Paid"
      />
    </Link>
  );
}