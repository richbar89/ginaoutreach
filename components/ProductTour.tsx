"use client";

import { useState, useEffect } from "react";
import Joyride, { CallBackProps, STATUS, EVENTS, Step } from "react-joyride";

const TOUR_KEY = "collabi_tour_done";

const STEPS: Step[] = [
  {
    target: "body",
    placement: "center",
    disableBeacon: true,
    content: (
      <div className="text-center py-2">
        <div className="text-4xl mb-3">👋</div>
        <h3 className="font-serif text-xl font-bold text-navy-900 mb-2">Welcome to Collabi!</h3>
        <p className="text-sm text-navy-500 leading-relaxed">
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
        <p className="font-bold text-navy-900 mb-1">Dashboard</p>
        <p className="text-sm text-navy-500 leading-relaxed">
          Your home base. See an overview of your outreach activity, brand monitor, and recent emails at a glance.
        </p>
      </div>
    ),
  },
  {
    target: "#tour-contacts",
    placement: "right",
    disableBeacon: true,
    content: (
      <div>
        <p className="font-bold text-navy-900 mb-1">Contacts</p>
        <p className="text-sm text-navy-500 leading-relaxed">
          Add the brand contacts you want to reach out to. Import from a spreadsheet or add them one by one.
        </p>
      </div>
    ),
  },
  {
    target: "#tour-campaigns",
    placement: "right",
    disableBeacon: true,
    content: (
      <div>
        <p className="font-bold text-navy-900 mb-1">Campaigns</p>
        <p className="text-sm text-navy-500 leading-relaxed">
          Create outreach campaigns and send personalised emails to multiple brands at once — directly from your own Gmail.
        </p>
      </div>
    ),
  },
  {
    target: "#tour-inbox",
    placement: "right",
    disableBeacon: true,
    content: (
      <div>
        <p className="font-bold text-navy-900 mb-1">Inbox</p>
        <p className="text-sm text-navy-500 leading-relaxed">
          When brands reply to your outreach, their messages appear here. You can read and reply without leaving Collabi.
        </p>
      </div>
    ),
  },
  {
    target: "#tour-pipeline",
    placement: "right",
    disableBeacon: true,
    content: (
      <div>
        <p className="font-bold text-navy-900 mb-1">Pipeline</p>
        <p className="text-sm text-navy-500 leading-relaxed">
          Track every deal as it moves from pitched → replied → negotiating → closed. Never lose track of a brand conversation.
        </p>
      </div>
    ),
  },
  {
    target: "#tour-media-kit",
    placement: "right",
    disableBeacon: true,
    content: (
      <div>
        <p className="font-bold text-navy-900 mb-1">Media Kit</p>
        <p className="text-sm text-navy-500 leading-relaxed">
          Build and share a professional media kit with your stats, niche, and rates — the thing brands ask for before saying yes.
        </p>
      </div>
    ),
  },
  {
    target: "body",
    placement: "center",
    disableBeacon: true,
    content: (
      <div className="text-center py-2">
        <div className="text-4xl mb-3">🚀</div>
        <h3 className="font-serif text-xl font-bold text-navy-900 mb-2">You&apos;re ready to go!</h3>
        <p className="text-sm text-navy-500 leading-relaxed">
          Start by adding some contacts, then create your first campaign. Good luck — go land some deals!
        </p>
      </div>
    ),
  },
];

const joyrideStyles = {
  options: {
    primaryColor: "#D4795C",
    zIndex: 10000,
    arrowColor: "#ffffff",
    backgroundColor: "#ffffff",
    overlayColor: "rgba(15, 15, 25, 0.55)",
    spotlightShadow: "0 0 0 9999px rgba(15, 15, 25, 0.55)",
    width: 320,
  },
  tooltip: {
    borderRadius: 16,
    padding: "20px 24px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.1)",
  },
  tooltipTitle: { display: "none" },
  buttonNext: {
    backgroundColor: "#D4795C",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 700,
    padding: "8px 20px",
    outline: "none",
  },
  buttonBack: {
    color: "#9CA3AF",
    fontSize: 13,
    fontWeight: 500,
    marginRight: 8,
  },
  buttonSkip: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  spotlight: {
    borderRadius: 12,
  },
};

export default function ProductTour() {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const done = localStorage.getItem(TOUR_KEY);
    if (!done) {
      // Small delay so the page is fully rendered before the tour starts
      const t = setTimeout(() => setRun(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const handleCallback = (data: CallBackProps) => {
    const { status, type, index } = data;

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      setStepIndex(index + 1);
    }

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      localStorage.setItem(TOUR_KEY, "1");
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
