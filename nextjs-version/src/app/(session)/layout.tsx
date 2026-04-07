import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Tutoring Session - EthioTutor",
  description: "Interactive video session with real-time whiteboard.",
};

export default function SessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Essential: This layout is completely outside (dashboard)/(tutor)
    // so it doesn't render any sidebars or top navbars.
    // We just render raw children taking full screen width/height.
    <div className="w-screen h-screen overflow-hidden bg-white text-black font-sans">
      {children}
    </div>
  );
}
