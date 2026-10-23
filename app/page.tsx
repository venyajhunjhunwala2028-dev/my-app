import Hero from "@/components/landing/Hero";
import MagicLensDemo from "@/components/landing/MagicLensDemo";
import { Families, Footer, LearnTechnology, ScamCheck, SeeHowItWorks } from "@/components/landing/Sections";
import TopBar from "@/components/landing/TopBar";
import TopicGrid from "@/components/landing/TopicGrid";
import WaysToAsk from "@/components/landing/WaysToAsk";

/** Marketing landing page (English, server-rendered); the interactive bits are small client components. */
export default function Landing() {
  return (
    <>
      <TopBar />
      <main className="flex w-full flex-1 flex-col overflow-x-clip">
        <Hero />
        <WaysToAsk />
        <TopicGrid />
        <MagicLensDemo />
        <SeeHowItWorks />
        <LearnTechnology />
        <ScamCheck />
        <Families />
      </main>
      <Footer />
    </>
  );
}
