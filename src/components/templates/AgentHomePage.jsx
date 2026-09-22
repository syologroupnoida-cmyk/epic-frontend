import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AgentHeader from "@/common/AgentHeader";
import AgentFooter from "@/common/AgentFooter";
import agentHero from "@/images/agent/agent-hero.png";
import agentWorkflow from "@/images/agent/agent-workflow.png";
import agentVendors from "@/images/agent/agent-vendors.png";

const stats = [
  { value: 500, suffix: "+", label: "Wedding leads" },
  { value: 80, suffix: "+", label: "Vendor categories" },
  { value: 24, suffix: "h", label: "Lead response flow" },
];

const steps = [
  "Receive verified wedding inquiries",
  "Shortlist vendors and packages",
  "Schedule visits and client follow-ups",
  "Close bookings with clear planning notes",
];

const benefits = [
  "Lead dashboard for active wedding clients",
  "Vendor matching for venues, decor, catering, makeup, and photo teams",
  "Visit planning with city, date, budget, and guest count details",
  "Client-ready recommendations for premium and budget weddings",
];

const clients = [
  { name: "Royal Palace Events", image: agentHero },
  { name: "Bloom Mandap Co.", image: agentVendors },
  { name: "WedLens Studio", image: agentWorkflow },
  { name: "Rasoi Caterers", image: agentHero },
  { name: "Aura Makeup", image: agentWorkflow },
  { name: "Lakeview Venues", image: agentVendors },
  { name: "Heritage Vows", image: agentHero },
  { name: "Floral Route", image: agentVendors },
];

const testimonials = [
  {
    name: "Ananya Sharma",
    role: "Senior Wedding Agent",
    quote: "The agent flow makes it easy to move from inquiry to vendor shortlist without losing client context.",
    avatar: agentWorkflow,
  },
  {
    name: "Rohit Mehra",
    role: "Destination Specialist",
    quote: "I can compare venue ideas, coordinate calls, and keep follow-ups clear for every family.",
    avatar: agentVendors,
  },
  {
    name: "Neha Kapoor",
    role: "Venue Consultant",
    quote: "The page feels built for real wedding sales work: simple, focused, and quick to explain.",
    avatar: agentHero,
  },
  {
    name: "Karan Sethi",
    role: "Vendor Manager",
    quote: "Every conversation starts with better context, so the right vendor match happens faster.",
    avatar: agentWorkflow,
  },
  {
    name: "Priya Nair",
    role: "Client Success Agent",
    quote: "Families get a polished planning experience while agents keep follow-ups simple.",
    avatar: agentVendors,
  },
  {
    name: "Aman Gill",
    role: "Venue Specialist",
    quote: "The structure helps me explain packages and visits without jumping across notes.",
    avatar: agentHero,
  },
  {
    name: "Meera Joshi",
    role: "Decor Consultant",
    quote: "It keeps decor, budget, and vendor preferences together in one clean flow.",
    avatar: agentWorkflow,
  },
  {
    name: "Sahil Arora",
    role: "Wedding Advisor",
    quote: "The workflow is fast enough for live calls and detailed enough for premium clients.",
    avatar: agentVendors,
  },
  {
    name: "Tanya Bedi",
    role: "Lead Coordinator",
    quote: "Inquiry handling feels organized, especially when multiple families need updates.",
    avatar: agentHero,
  },
  {
    name: "Vikram Rao",
    role: "Planning Partner",
    quote: "It gives agents a clear way to move from first inquiry to confident shortlist.",
    avatar: agentWorkflow,
  },
];

const faqs = [
  {
    question: "Who can join as an Epic Wedz agent?",
    answer: "Wedding planners, venue consultants, vendor coordinators, and sales partners can use the agent workflow.",
  },
  {
    question: "Can agents access login and sign up separately?",
    answer: "Yes. The agent header links directly to the existing agent login and sign up pages.",
  },
  {
    question: "What kind of leads can agents manage?",
    answer: "Agents can manage dummy wedding inquiries for venues, decorators, caterers, makeup, photography, and destination planning.",
  },
  {
    question: "Is this ready for real API integration later?",
    answer: "The page is structured so real lead, vendor, and account APIs can be connected later without redesigning the UI.",
  },
];

function CountUpStat({ value, suffix, label }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        const start = performance.now();
        const duration = 1200;

        function tick(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.round(value * eased));
          if (progress < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.35 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="rounded border border-rose-100 bg-white p-6 text-center shadow-sm">
      <p className="font-serif text-5xl font-bold text-[#b61f4b]">
        {count}
        {suffix}
      </p>
      <p className="mt-2 text-sm font-semibold text-stone-600">{label}</p>
    </div>
  );
}

function TypedHeroTitle() {
  const title = "Manage wedding clients with confidence";
  const [visibleChars, setVisibleChars] = useState(1);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setVisibleChars((current) => (current >= title.length ? 1 : current + 1));
    }, 95);

    return () => window.clearInterval(timer);
  }, [title.length]);

  return (
    <h1
      aria-label={title}
      className="mt-5 min-h-[132px] max-w-2xl font-serif text-4xl font-bold leading-tight sm:min-h-[144px] sm:text-6xl"
    >
      <span className="agent-typing-title">
        {title.slice(0, visibleChars)}
      </span>
    </h1>
  );
}

export default function AgentHomePage() {
  const clientSlides = [...clients, ...clients];
  const testimonialSlides = [...testimonials, ...testimonials];

  return (
    <div className="min-h-screen bg-[#fff9f5] text-stone-900">
      <AgentHeader />
      <div className="agent-header-spacer" aria-hidden="true" />
      <main>
        <section id="overview" className="relative isolate overflow-hidden bg-[#421321]">
          <Image
            src={agentHero}
            alt="Wedding agent consulting couple"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#421321] via-[#421321]/85 to-[#421321]/20" />
          <div className="relative mx-auto flex min-h-[620px] max-w-7xl items-center px-4 py-20 text-white sm:px-6 lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#ffd18a]">
                Epic Wedz Agent Partner
              </p>
              <TypedHeroTitle />
              <p className="mt-5 max-w-xl text-base leading-8 text-white/82">
                A dedicated agent experience for turning wedding inquiries into
                curated vendor plans, venue visits, and smooth client follow-ups.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/agent/sign-up"
                  className="rounded-full bg-[#b61f4b] px-7 py-3 text-sm font-bold text-white hover:bg-[#981a3f]"
                >
                  Join as Agent
                </Link>
                <a
                  href="#workflow"
                  className="rounded-full border border-white/70 px-7 py-3 text-sm font-bold text-white hover:bg-white hover:text-[#421321]"
                >
                  See Workflow
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="scroll-mt-24 bg-white py-12">
          <div className="mx-auto grid max-w-5xl gap-5 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
            {stats.map((item) => (
              <CountUpStat key={item.label} {...item} />
            ))}
          </div>
        </section>

        <section id="workflow" className="scroll-mt-24 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#b61f4b]">How it works</p>
              <h2 className="mt-3 font-serif text-4xl font-bold text-stone-950">A cleaner flow for every inquiry</h2>
              <p className="mt-4 text-base leading-7 text-stone-600">
                Move each wedding lead through a simple model that keeps client
                needs, vendor fit, visits, and booking follow-ups easy to track.
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {steps.map((step, index) => (
                  <div key={step} className="rounded border border-rose-100 bg-white p-5 shadow-sm">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[#b61f4b] text-sm font-bold text-white">{index + 1}</span>
                    <p className="mt-5 font-semibold leading-6 text-stone-800">{step}</p>
                  </div>
                ))}
            </div>
          </div>
        </section>

        <section id="benefits" className="scroll-mt-24 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#b61f4b]">Agent benefits</p>
              <h2 className="mt-3 font-serif text-4xl font-bold text-stone-950">Built for wedding sales teams</h2>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {benefits.map((benefit) => (
                <div key={benefit} className="rounded border border-rose-100 bg-[#fff9f5] p-5 shadow-sm">
                  <span className="block h-1.5 w-12 rounded-full bg-[#b61f4b]" />
                  <p className="mt-5 text-sm font-semibold leading-6 text-stone-700">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="vendors" className="scroll-mt-24 py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#b61f4b]">Vendor network</p>
              <h2 className="mt-3 font-serif text-4xl font-bold text-stone-950">Coordinate trusted vendors faster</h2>
              <p className="mt-4 text-lg leading-8 text-stone-600">
                Help couples compare venues, decorators, caterers, makeup
                artists, photographers, and destination specialists with a clear
                planning conversation.
              </p>
              <div className="mt-7 grid grid-cols-2 gap-3 text-sm font-bold text-stone-700">
                {["Venues", "Decor", "Catering", "Makeup", "Photo", "Planning"].map((item) => (
                  <span key={item} className="rounded-full border border-rose-100 bg-white px-4 py-3 text-center shadow-sm">{item}</span>
                ))}
              </div>
            </div>
            <div className="relative aspect-[16/11] overflow-hidden rounded border border-rose-100 shadow-xl">
              <Image src={agentVendors} alt="Agent coordinating wedding vendors" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            </div>
          </div>
        </section>

        <section id="clients" className="scroll-mt-24 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#b61f4b]">Our trusted clients</p>
              <h2 className="mt-3 font-serif text-4xl font-bold text-stone-950">Partners who trust the agent network</h2>
            </div>
            <div className="agent-slider mt-10 overflow-hidden">
              <div className="agent-slider-track">
                {clientSlides.map((client, index) => (
                  <div key={`${client.name}-${index}`} className="agent-client-card shrink-0 rounded border border-rose-100 bg-[#fff9f5] p-4 shadow-sm">
                    <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-white shadow-sm">
                      <Image src={client.image} alt={client.name} fill sizes="80px" className="object-cover" />
                    </div>
                    <p className="font-serif text-xl font-bold text-stone-900">{client.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="testimonials" className="scroll-mt-24 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div>
              <div className="mx-auto max-w-3xl text-center">
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#b61f4b]">Testimonials</p>
                <h2 className="mt-3 font-serif text-4xl font-bold text-stone-950">Agents planning with more clarity</h2>
              </div>
              <div className="agent-slider mt-10 overflow-hidden">
                <div className="agent-slider-track agent-testimonial-track">
                  {testimonialSlides.map((item, index) => (
                    <div key={`${item.name}-${index}`} className="agent-testimonial-card shrink-0 rounded border border-rose-100 bg-white p-5 text-stone-900 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="relative h-14 w-14 overflow-hidden rounded-full">
                          <Image src={item.avatar} alt={item.name} fill sizes="56px" className="object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-stone-950">{item.name}</p>
                          <p className="mt-1 text-xs font-semibold text-[#b61f4b]">{item.role}</p>
                        </div>
                      </div>
                      <p className="mt-5 text-sm leading-6 text-stone-700">&quot;{item.quote}&quot;</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-24 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#b61f4b]">FAQ</p>
              <h2 className="mt-3 font-serif text-4xl font-bold text-stone-950">Agent questions answered</h2>
            </div>
            <div className="mt-10 grid gap-3">
              {faqs.map((item) => (
                <details key={item.question} className="group rounded border border-rose-100 bg-[#fff9f5] p-5 shadow-sm">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-stone-950">
                    {item.question}
                    <span className="header-chevron transition group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="mt-4 text-sm leading-6 text-stone-600">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="join" className="scroll-mt-24 px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 rounded bg-[#2a1119] px-6 py-12 text-white sm:px-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-white/75">Start today</p>
              <h2 className="mt-2 font-serif text-4xl font-bold">Create your agent account</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/agent/sign-up" className="rounded-full bg-white px-7 py-3 text-sm font-bold text-[#b61f4b]">Sign up</Link>
              <Link href="/agent/login" className="rounded-full border border-white px-7 py-3 text-sm font-bold text-white">Login</Link>
            </div>
          </div>
        </section>
      </main>
      <AgentFooter />
    </div>
  );
}
