"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateTenantProfile } from "@/server/settings-actions";

const CURRENCIES = ["GBP", "ZAR", "EUR", "USD"] as const;

export function ProfileForm({
  initial,
}: {
  initial: { name: string; timezone: string; clientCurrency: string; internalCurrency: string };
}) {
  const router = useRouter();
  const [clientCurrency, setClientCurrency] = useState(initial.clientCurrency);
  const [internalCurrency, setInternalCurrency] = useState(initial.internalCurrency);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaving(true);
    const result = await updateTenantProfile({
      name: data.get("name"),
      timezone: data.get("timezone"),
      clientCurrency,
      internalCurrency,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Settings saved");
    router.refresh();
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle className="text-base">Tenant profile</CardTitle>
        <CardDescription>
          Currencies drive fee reporting: clients billed in one, internal reporting in the
          other.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tenant-name">Agency name</Label>
            <Input id="tenant-name" name="name" required defaultValue={initial.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenant-tz">Timezone (IANA)</Label>
            <Input id="tenant-tz" name="timezone" required defaultValue={initial.timezone} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Client currency</Label>
              <Select value={clientCurrency} onValueChange={setClientCurrency}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Internal currency</Label>
              <Select value={internalCurrency} onValueChange={setInternalCurrency}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
