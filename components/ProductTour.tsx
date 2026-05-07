"use client";

import { useState, useEffect } from "react";
import Joyride, { CallBackProps, STATUS, EVENTS, Step } from "react-joyride";
import { useDb } from "@/lib/useDb";

const TOUR_KEY = "collabi_tour_done";

const heading: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: "#FFFFFF", marginBottom: 4, letterSpacing: "-0.02em" };
const body: React.CSSProperties = { fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 };

const STEPS: Step[] = [
  {
    target: "body",
    placement: "center",
    disableBeacon: true,
    content: (
      <div style={{ textAlign: "center", padding: "8px 0" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>👋</div>
        <p style={{ ...heading, fontSize: 18, marginBottom: 8 }}>Welcome to Collabi!</p>
        <p style={body}>
          Let us give you a quick 30-second tour so you know where everything is.
        </p>
      </div>
    ),
  },
  {
    target: "#tour-dashboard",
    placement: "right",
    disableBeacon: true,
    content: (
      <div>
        <p style={heading}>Dashboard</p>
        <p style={body}>Your home base. See an overview of your outreach activity, brand monitor, and recent emails at a glance.</p>
      </div>
    ),
  },
  {
    target: "#tour-contacts",
    placement: "right",
    disableBeacon: true,
    content: (
      <div>
        <p style={heading}>Contacts</p>
        <p style={body}>Browse our database of brand contacts. Search by niche, category, or name — then pick who you want to reach out to and add them to a campaign.</p>
      </div>
    ),
  },
  {
    target: "#tour-campaigns",
    placement: "right",
    disableBeacon: true,
    content: (
      <div>
        <p style={heading}>Campaigns</p>
        <p style={body}>Create outreach campaigns and send personalised emails to multiple brands at once — directly from your own Gmail.</p>
      </div>
    ),
  },
  {
    target: "#tour-inbox",
    placement: "right",
    disableBeacon: true,
    content: (
      <div>
        <p style={heading}>Inbox</p>
        <p style={body}>When brands reply to your outreach, their messages appear here. You can read and reply without leaving Collabi.</p>
      </div>
    ),
  },
  {
    target: "#tour-pipeline",
    placement: "right",
    disableBeacon: true,
    content: (
      <div>
        <p style={heading}>Pipeline</p>
        <p style={body}>Track every deal as it moves from pitched → replied → negotiating → closed. Never lose track of a brand conversation.</p>
      </div>
    ),
  },
  {
    target: "#tour-media-kit",
    placement: "right",
    disableBeacon: true,
    content: (
      <div>
        <p style={heading}>Media Kit</p>
        <p style={body}>Build and share a professional media kit with your stats, niche, and rates — the thing brands ask for before saying yes.</p>
      </div>
    ),
  },
  {
    target: "body",
    placement: "center",
    disableBeacon: true,
    content: (
      <div style={{ textAlign: "center", padding: "8px 0" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🚀</div>
        <p style={{ ...heading, fontSize: 18, marginBottom: 8 }}>You&apos;re ready to go!</p>
        <p style={body}>
          Start by browsing the contacts database, then create your first campaign. Good luck — go land some deals!
        </p>
      </div>
    ),
  },
];

const joyrideStyles = {
  options: {
    primaryColor: "#E8622A",
    zIndex: 10000,
    arrowColor: "rgba(22, 22, 35, 0.82)",
    backgroundColor: "rgba(22, 22, 35, 0.82)",
    overlayColor: "rgba(8, 8, 16, 0.72)",
    spotlightShadow: "0 0 0 9999px rgba(8, 8, 16, 0.72)",
    width: 300,
  },
  tooltip: {
    borderRadius: 20,
    padding: "22px 24px",
    background: "rgba(22, 22, 35, 0.82)",
    backdropFilter: "blur(28px)",
    WebkitBackdropFilter: "blur(28px)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 24px 64px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)",
  },
  tooltipTitle: { display: "none" },
  tooltipFooter: {
    marginTop: 16,
  },
  buttonNext: {
    backgroundColor: "#E8622A",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    padding: "8px 18px",
    outline: "none",
    letterSpacing: "-0.01em",
  },
  buttonBack: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontWeight: 500,
    marginRight: 8,
  },
  buttonSkip: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 12,
  },
  spotlight: {
    borderRadius: 14,
  },
};

export default function ProductTour() {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const getDb = useDb();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const local = localStorage.getItem(TOUR_KEY);
    if (local) return;
    // Check Supabase in case user is on a new browser
    getDb().then(db =>
      db.from("user_settings").select("tour_done").maybeSingle()
    ).then(({ data }) => {
      if (data?.tour_done) {
        localStorage.setItem(TOUR_KEY, "1");
      } else {
        const t = setTimeout(() => setRun(true), 800);
        return () => clearTimeout(t);
      }
    }).catch(() => {
      const t = setTimeout(() => setRun(true), 800);
      return () => clearTimeout(t);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCallback = (data: CallBackProps) => {
    const { status, type, index } = data;

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      setStepIndex(index + 1);
    }

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      localStorage.setItem(TOUR_KEY, "1");
      getDb().then(db =>
        db.from("user_settings").upsert({ tour_done: true })
      ).catch(() => {});
    }
  };

  return (
    <Joyride
      steps={STEPS}
      run={run}
      stepIndex={stepIndex}
      continuous
      showSkipButton
      showProgress
      scrollToFirstStep={false}
      disableScrolling
      callback={handleCallback}
      styles={joyrideStyles}
      locale={{
        back: "Back",
        close: "Close",
        last: "Done!",
        next: "Next →",
        skip: "Skip tour",
      }}
    />
  );
}
