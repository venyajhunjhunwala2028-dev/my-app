import Hero from "@/components/landing/Hero";
import MagicLensDemo from "@/components/landing/MagicLensDemo";
import { Families, Faq, FinalCta, Footer, LearnTechnology, ScamCheck, SeeHowItWorks } from "@/components/landing/Sections";
import TopBar from "@/components/landing/TopBar";
import TopicGrid from "@/components/landing/TopicGrid";
import WaysToAsk from "@/components/landing/WaysToAsk";

/**
 * Marketing landing page (English, server-rendered); the interactive bits are small client components.
 * One job: get people to ask a first question (/app?q=…). Editorial rhythm: white, night, warm grey and blue.
 */
export default function Landing() {
  return (
    <>
      <TopBar />
      <main className="flex w-full flex-1 flex-col overflow-x-clip">
        <Hero />
        <WaysToAsk />
        <MagicLensDemo />
        <SeeHowItWorks />
        <TopicGrid />
        <LearnTechnology />
        <ScamCheck />
        <Families />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
