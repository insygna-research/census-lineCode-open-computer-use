"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

// Style constants
const DOT_SIZE = "size-2"
const DOT_COLOR = "bg-primary/60"
const DOT_SPACING = "gap-1"

// Animation constants
const ANIMATION_DURATION = 1.2 // seconds per word

const WORDS = [
  "Consulting the Oracle…",
  "Googling like it's 1999…",
  "Summoning the AI overlords…",
  "Pretending to think really hard…",
  "Assembling witty responses…",
  "Bribing the search engine…",
  "Reading the internet's mind…",
  "Making stuff up (just kidding)…",
  "Fact-checking with my robot friends…",
  "Downloading extra intelligence…",
  "Turning coffee into answers…",
  "Running on 100% pure speculation…",
  "Polishing my crystal ball…",
  "Consulting the wisdom of cats…",
  "Loading… but with style.",
  "Hacking the mainframe (not really)…",
  "Searching for meaning in memes…",
  "Channeling my inner Einstein…",
  "Trying to sound smarter than I am…",
  "Buffering my sense of humor…",
]

export function Loader() {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % WORDS.length)
    }, ANIMATION_DURATION * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.span
      key={index}
      initial={{ opacity: 0.4 }}
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: ANIMATION_DURATION, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
      className="text-muted-foreground select-none"
    >
      {WORDS[index]}
    </motion.span>
  )
}
