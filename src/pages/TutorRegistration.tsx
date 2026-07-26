import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  full_name: z.string().trim().min(2, "Please enter at least 2 characters."),
  email: z.string().trim().min(1, "Email is required.").email("Please enter a valid email."),
  phone: z.string().trim().optional(),
  languages_taught: z.string().trim().min(1, "Please tell us which languages you teach."),
  current_platforms: z.string().trim().optional(),
  experience_years: z.string().optional(),
  package_5_class_price: z.string().trim().optional(),
  package_10_class_price: z.string().trim().optional(),
  preferred_payout: z.string().min(1, "Please select a payout method."),
  payout_details: z.string().trim().min(1, "Payout account details are required."),
  availability_notes: z.string().trim().optional(),
});

type FormValues = z.infer<typeof schema>;
const steps = ["Personal info", "Teaching profile", "Payment setup"];
const fieldsByStep: (keyof FormValues)[][] = [
  ["full_name", "email", "phone"],
  ["languages_taught", "current_platforms", "experience_years"],
  ["package_5_class_price", "package_10_class_price", "preferred_payout", "payout_details", "availability_notes"],
];

const TutorRegistration = () => {
  const [initializing, setInitializing] = useState(true);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, setValue, watch, trigger, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", email: "", phone: "", languages_taught: "", current_platforms: "", experience_years: "", package_5_class_price: "", package_10_class_price: "", preferred_payout: "", payout_details: "", availability_notes: "" },
  });
  const payout = watch("preferred_payout");

  useEffect(() => {
    const frame = requestAnimationFrame(() => setInitializing(false));
    return () => cancelAnimationFrame(frame);
  }, []);

  const next = async () => {
    if (await trigger(fieldsByStep[step])) setStep((value) => Math.min(value + 1, steps.length - 1));
  };

  const onSubmit = async (values: FormValues) => {
    const { error } = await supabase.from("tutor_applications").insert({
      ...values,
      phone: values.phone || null,
      current_platforms: values.current_platforms || null,
      experience_years: values.experience_years || null,
      package_5_class_price: values.package_5_class_price || null,
      package_10_class_price: values.package_10_class_price || null,
      availability_notes: values.availability_notes || null,
    });
    if (error) {
      toast({ variant: "destructive", title: "We couldn't submit your application", description: error.message });
      return;
    }
    setSubmitted(true);
  };

  const payoutLabel = payout === "GCash" ? "GCash number" : payout?.startsWith("Bank") ? "Account number" : payout === "PayPal" ? "PayPal email" : "Payout account details";
  const FieldError = ({ name }: { name: keyof FormValues }) => errors[name] ? <p id={`${name}-error`} className="mt-1 text-sm text-rose-600" role="alert">{errors[name]?.message}</p> : null;
  const errorProps = (name: keyof FormValues) => ({ "aria-invalid": Boolean(errors[name]), "aria-describedby": errors[name] ? `${name}-error` : undefined });

  if (initializing) return <main className="min-h-screen bg-slate-950 p-4 sm:p-8"><Card className="mx-auto max-w-2xl p-8"><Skeleton className="mb-6 h-8 w-48" /><Skeleton className="mb-3 h-12 w-full" /><Skeleton className="h-64 w-full" /></Card></main>;

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-teal-900 px-4 py-8 text-slate-900 sm:py-14">
      <div aria-hidden="true" className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="relative mx-auto max-w-2xl">
        <div className="mb-6 text-center text-white"><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-cyan-300" /> Teach with us</div><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Turn your expertise into impact.</h1><p className="mt-3 text-blue-100">Join a thoughtful community connecting great tutors with motivated students.</p></div>
        <Card className="border-0 bg-white/95 shadow-2xl backdrop-blur dark:bg-slate-950/95">
          {submitted ? (
            <CardContent className="px-6 py-16 text-center sm:px-12"><div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-950"><CheckCircle2 className="h-11 w-11 text-teal-700 dark:text-teal-300" /></div><h2 className="text-3xl font-bold">Application Submitted!</h2><p className="mx-auto mt-4 max-w-lg text-base leading-7 text-muted-foreground">Thanks for applying! We're reviewing applications this week and will reach out within 2-3 business days to get you set up with your first students. 😊</p></CardContent>
          ) : <>
            <CardHeader className="pb-4"><CardTitle>Tutor application</CardTitle><CardDescription>Tell us about yourself. It only takes a few minutes.</CardDescription>
              <ol className="mt-5 grid grid-cols-3 gap-2" aria-label="Application progress">{steps.map((label, index) => <li key={label} aria-current={index === step ? "step" : undefined}><div className={`mb-2 h-1.5 rounded-full ${index <= step ? "bg-teal-600" : "bg-slate-200 dark:bg-slate-700"}`} /><span className={`hidden text-xs font-medium sm:block ${index === step ? "text-teal-700 dark:text-teal-300" : "text-muted-foreground"}`}>{index + 1}. {label}</span></li>)}</ol>
            </CardHeader>
            <CardContent><form onSubmit={handleSubmit(onSubmit)} noValidate>
              {step === 0 && <section className="space-y-5" aria-labelledby="personal-heading"><h2 id="personal-heading" className="text-lg font-semibold">Personal Info</h2>
                <div><Label htmlFor="full_name">Full name <span aria-hidden="true">*</span></Label><Input id="full_name" className="mt-2 focus-visible:ring-teal-600" autoComplete="name" {...register("full_name")} {...errorProps("full_name")} /><FieldError name="full_name" /></div>
                <div><Label htmlFor="email">Email <span aria-hidden="true">*</span></Label><Input id="email" type="email" className="mt-2 focus-visible:ring-teal-600" autoComplete="email" {...register("email")} {...errorProps("email")} /><FieldError name="email" /></div>
                <div><Label htmlFor="phone">Phone</Label><Input id="phone" type="tel" className="mt-2 focus-visible:ring-teal-600" placeholder="Include country code, e.g. +63 912 345 6789" autoComplete="tel" {...register("phone")} /></div>
              </section>}
              {step === 1 && <section className="space-y-5" aria-labelledby="teaching-heading"><h2 id="teaching-heading" className="text-lg font-semibold">Teaching Profile</h2>
                <div><Label htmlFor="languages_taught">Languages you teach <span aria-hidden="true">*</span></Label><Input id="languages_taught" className="mt-2 focus-visible:ring-teal-600" placeholder="e.g. Japanese, English, Tagalog" {...register("languages_taught")} {...errorProps("languages_taught")} /><FieldError name="languages_taught" /></div>
                <div><Label htmlFor="current_platforms">Current teaching platforms</Label><Textarea id="current_platforms" className="mt-2 focus-visible:ring-teal-600" placeholder="e.g. Superprof, italki, direct students..." {...register("current_platforms")} /></div>
                <div><Label htmlFor="experience_years">Experience</Label><Select value={watch("experience_years")} onValueChange={(value) => setValue("experience_years", value)}><SelectTrigger id="experience_years" className="mt-2 focus:ring-teal-600"><SelectValue placeholder="Select your experience" /></SelectTrigger><SelectContent>{["< 1 year", "1-3 years", "3-5 years", "5+ years"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
              </section>}
              {step === 2 && <section className="space-y-5" aria-labelledby="payment-heading"><h2 id="payment-heading" className="text-lg font-semibold">Payment Setup</h2>
                <div className="grid gap-5 sm:grid-cols-2"><div><Label htmlFor="package_5_class_price">5-class package price</Label><Input id="package_5_class_price" className="mt-2 focus-visible:ring-teal-600" placeholder="e.g. ₱2,500" {...register("package_5_class_price")} /></div><div><Label htmlFor="package_10_class_price">10-class package price</Label><Input id="package_10_class_price" className="mt-2 focus-visible:ring-teal-600" placeholder="e.g. ₱4,500" {...register("package_10_class_price")} /></div></div>
                <div><Label htmlFor="preferred_payout">Preferred payout method <span aria-hidden="true">*</span></Label><Select value={payout} onValueChange={(value) => { setValue("preferred_payout", value, { shouldValidate: true }); }}><SelectTrigger id="preferred_payout" className="mt-2 focus:ring-teal-600" {...errorProps("preferred_payout")}><SelectValue placeholder="Choose a payout method" /></SelectTrigger><SelectContent>{["GCash", "Bank Transfer (BPI)", "Bank Transfer (GoTyme)", "PayPal", "Other"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><FieldError name="preferred_payout" /></div>
                <div><Label htmlFor="payout_details">{payoutLabel} <span aria-hidden="true">*</span></Label><Input id="payout_details" className="mt-2 focus-visible:ring-teal-600" {...register("payout_details")} {...errorProps("payout_details")} /><FieldError name="payout_details" /><p className="mt-1 text-xs text-muted-foreground">Your details are used only to arrange tutor payouts.</p></div>
                <div><Label htmlFor="availability_notes">Availability notes</Label><Textarea id="availability_notes" className="mt-2 focus-visible:ring-teal-600" placeholder="e.g. Available weekdays 6PM-10PM PHT" {...register("availability_notes")} /></div>
              </section>}
              <div className="mt-8 flex items-center justify-between gap-3">{step > 0 ? <Button type="button" variant="outline" onClick={() => setStep(step - 1)}><ChevronLeft className="mr-2 h-4 w-4" /> Back</Button> : <span />}{step < steps.length - 1 ? <Button type="button" className="bg-teal-700 hover:bg-teal-800" onClick={next}>Continue <ChevronRight className="ml-2 h-4 w-4" /></Button> : <Button type="submit" className="bg-teal-700 hover:bg-teal-800" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : <><Check className="mr-2 h-4 w-4" /> Submit application</>}</Button>}</div>
            </form></CardContent>
          </>}
        </Card>
        <p className="mt-5 text-center text-xs text-blue-100/80">Your information is kept private and reviewed only by our onboarding team.</p>
      </div>
    </main>
  );
};

export default TutorRegistration;
