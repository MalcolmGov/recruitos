"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { submitInquiry } from "./actions";

export function ContactForm() {
  const [interest, setInterest] = useState<string>("hiring");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setSubmitting(true);
    const result = await submitInquiry({
      name: data.get("name"),
      email: data.get("email"),
      company: data.get("company"),
      interest,
      message: data.get("message"),
    });
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setSent(true);
    toast.success("Message received — we'll be in touch within one business day.");
  }

  if (sent) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <h3 className="text-lg font-semibold">Thank you</h3>
          <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm">
            Your message is with our team. A consultant will reply within one business day.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" required minLength={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company">Company (optional)</Label>
              <Input id="company" name="company" />
            </div>
            <div className="space-y-2">
              <Label>I&apos;m interested in</Label>
              <Select value={interest} onValueChange={setInterest}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hiring">Hiring talent</SelectItem>
                  <SelectItem value="job-seeking">Finding a job</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                  <SelectItem value="other">Something else</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              name="message"
              required
              minLength={10}
              rows={5}
              placeholder="Tell us about the role, your situation, or your question…"
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Sending…" : "Send message"}
          </Button>
          <p className="text-muted-foreground text-center text-xs">
            By submitting you consent to us processing your details to respond to your
            enquiry. See our privacy policy.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
