import { formatCentsToCurrency } from "@bir-notebook/shared/helpers/currency";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { FilingItem } from "@/lib/api/cor";
import type { QuarterMeta } from "./quarterly-worksheet";

function peso(cents: number | undefined): string {
  return formatCentsToCurrency(cents ?? 0);
}

function toDateInput(v: string | null | undefined): string {
  if (!v) return "";
  return v.slice(0, 10);
}

export function FilingPacket({
  year,
  meta,
  filing,
  liveItems,
  withheldPesos,
  onSaved,
}: {
  year: number;
  meta: QuarterMeta;
  filing: FilingItem | undefined;
  liveItems: Record<string, number> | null;
  withheldPesos: number;
  onSaved: () => void;
}) {
  const snapshot = filing?.computed ?? liveItems;
  const [ecrRef, setEcrRef] = useState(filing?.ecrRef ?? "");
  const [paymentRef, setPaymentRef] = useState(filing?.paymentRef ?? "");
  const [paidAt, setPaidAt] = useState(toDateInput(filing?.paidAt));
  const [paidAmount, setPaidAmount] = useState(
    filing?.paidAmount != null
      ? String(filing.paidAmount / 100)
      : snapshot
        ? String((snapshot["i30"] ?? 0) / 100)
        : "",
  );
  const [saving, setSaving] = useState(false);

  // Reset local edits when switching to a different quarter filing.
  const filingKey = filing?.id ?? `none-${year}-${meta.quarter}`;
  const [seenKey, setSeenKey] = useState(filingKey);
  if (seenKey !== filingKey) {
    setSeenKey(filingKey);
    setEcrRef(filing?.ecrRef ?? "");
    setPaymentRef(filing?.paymentRef ?? "");
    setPaidAt(toDateInput(filing?.paidAt));
    setPaidAmount(
      filing?.paidAmount != null
        ? String(filing.paidAmount / 100)
        : snapshot
          ? String((snapshot["i30"] ?? 0) / 100)
          : "",
    );
  }

  async function save() {
    if (!filing) {
      toast.error("Compute and mark this quarter filed first");
      return;
    }
    setSaving(true);
    try {
      await api.tax.savePacket({
        year,
        quarter: meta.quarter,
        ecrRef,
        paymentRef,
        paidAt,
        paidAmount: paidAmount.trim() === "" ? undefined : Number(paidAmount),
      });
      onSaved();
      toast.success("Filing packet saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const hasCredits = (snapshot?.["i27"] ?? 0) > 0;
  const checks: Array<{ label: string; done: boolean }> = [
    {
      label: "eBIRForms email confirmation (ECR) saved",
      done: ecrRef.trim() !== "",
    },
    {
      label: `Payment proof saved (${peso(snapshot?.["i30"])} due)`,
      done: paidAmount.trim() !== "" && paymentRef.trim() !== "",
    },
    {
      label:
        withheldPesos > 0 || hasCredits
          ? "BIR Form 2307 withholding certificates kept"
          : "No 2307 withholding this quarter — nothing to keep",
      done: !(withheldPesos > 0 || hasCredits),
    },
    { label: "COR copy + registered books/ORs on file", done: true },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">
          Filing packet — {meta.label} {year}
        </CardTitle>
        {filing ? (
          <Badge variant={filing.status === "filed" ? "default" : "secondary"}>
            {filing.status}
          </Badge>
        ) : (
          <Badge variant="outline">not recorded</Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!snapshot ? (
          <p className="text-sm text-muted-foreground">
            No computation yet — compute the worksheet above first, then record
            the ECR and payment proof here after filing.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Item 54 tax due</p>
                <p className="font-mono">{peso(snapshot["i54"])}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Item 62 credits</p>
                <p className="font-mono">{peso(snapshot["i27"])}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Item 67 penalties</p>
                <p className="font-mono">{peso(snapshot["i67"])}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Item 30 payable</p>
                <p className="font-mono font-semibold">{peso(snapshot["i30"])}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor={`ecr-${meta.quarter}`}>
                  ECR number (BIR email confirmation)
                </FieldLabel>
                <Input
                  id={`ecr-${meta.quarter}`}
                  value={ecrRef}
                  onChange={(e) => setEcrRef(e.target.value)}
                  placeholder="e.g. 2026-XXXXXXX"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`payref-${meta.quarter}`}>
                  Payment reference (GCash / Maya / bank)
                </FieldLabel>
                <Input
                  id={`payref-${meta.quarter}`}
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. GCash ref no."
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`paidat-${meta.quarter}`}>
                  Date paid
                </FieldLabel>
                <Input
                  id={`paidat-${meta.quarter}`}
                  type="date"
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`paidamt-${meta.quarter}`}>
                  Amount paid (₱)
                </FieldLabel>
                <Input
                  id={`paidamt-${meta.quarter}`}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  inputMode="decimal"
                />
              </Field>
            </div>

            <Button size="sm" onClick={save} disabled={saving || !filing}>
              {saving ? "Saving…" : "Save packet"}
            </Button>

            <div className="space-y-1">
              <p className="text-xs font-semibold">RDO paper trail</p>
              <ul className="space-y-1 text-sm">
                {checks.map((c) => (
                  <li key={c.label} className="flex items-start gap-2">
                    <span aria-hidden>{c.done ? "✅" : "⬜"}</span>
                    <span
                      className={c.done ? "text-muted-foreground" : undefined}
                    >
                      {c.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
