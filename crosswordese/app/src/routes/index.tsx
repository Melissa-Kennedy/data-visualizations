import { createFileRoute } from "@tanstack/react-router";
import { Crosswordese } from "@/components/Crosswordese";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Crosswordese — The 100 Most-Used NYT Crossword Answers" },
      { name: "description", content: "Explore the 100 most-used New York Times crossword answers, interlocked in one frequency-colored puzzle with historical clues." },
      { property: "og:title", content: "Crosswordese — The 100 Most-Used NYT Crossword Answers" },
      { property: "og:description", content: "An interactive crossword of the 100 most-used answers from the Will Shortz era, with real historical clues." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Crosswordese,
});
