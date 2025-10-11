export const trendingResearchQuestions = [
  // AI & Technology
  "What are the latest breakthroughs in quantum computing and how will they impact cryptography?",
  "How is AI transforming drug discovery and what are the most promising developments?",
  "What are the ethical implications of AGI and how should we prepare for it?",
  "How are brain-computer interfaces evolving and what are their potential applications?",
  "What advances in fusion energy bring us closer to unlimited clean power?",
  
  // Climate & Environment
  "What are the most effective carbon capture technologies being developed today?",
  "How is gene editing being used to create climate-resilient crops?",
  "What role do ocean currents play in climate regulation and how are they changing?",
  "How can vertical farming revolutionize food production in urban areas?",
  "What are the latest innovations in renewable energy storage solutions?",
  
  // Health & Medicine
  "How are mRNA vaccines being adapted to treat cancer and other diseases?",
  "What breakthroughs in longevity research could extend human lifespan?",
  "How is CRISPR being used to cure genetic diseases?",
  "What are the latest developments in personalized medicine and pharmacogenomics?",
  "How are organoids revolutionizing disease research and drug testing?",
  
  // Space & Physics
  "What did the James Webb Space Telescope reveal about the early universe?",
  "How close are we to establishing a permanent human presence on Mars?",
  "What are the implications of recent UAP/UFO disclosures by governments?",
  "How might we detect and communicate with extraterrestrial intelligence?",
  "What are the latest theories about dark matter and dark energy?",
  
  // Society & Economics
  "How will automation and AI impact employment in the next decade?",
  "What are the pros and cons of universal basic income implementations?",
  "How is blockchain technology transforming financial systems beyond cryptocurrency?",
  "What are the societal implications of the metaverse and virtual worlds?",
  "How can cities be redesigned to be more sustainable and livable?",
  
  // Neuroscience & Psychology
  "What have we learned about consciousness from recent neuroscience research?",
  "How do psychedelics work therapeutically and what conditions can they treat?",
  "What causes Alzheimer's disease and how close are we to a cure?",
  "How does social media usage affect brain development in children?",
  "What are the neurological bases of creativity and can it be enhanced?",
  
  // Education & Learning
  "How can AI personalize education for individual learning styles?",
  "What are the most effective methods for teaching critical thinking skills?",
  "How is virtual reality transforming professional training and education?",
  "What skills will be most valuable in the job market of 2030?",
  "How can we redesign education systems for the 21st century?",
  
  // Future Technologies
  "What are the possibilities and limitations of nanotechnology in medicine?",
  "How might synthetic biology reshape manufacturing and materials?",
  "What are the latest developments in anti-aging and rejuvenation therapies?",
  "How could room-temperature superconductors transform technology?",
  "What are the potential applications of neuromorphic computing?",
  
  // Global Challenges
  "How can we ensure equitable access to clean water for all by 2030?",
  "What are the most promising solutions to antibiotic resistance?",
  "How can we feed 10 billion people sustainably by 2050?",
  "What strategies can reverse biodiversity loss and ecosystem collapse?",
  "How can international cooperation address climate change more effectively?",
  
  // Emerging Trends
  "What is the future of work in a post-pandemic world?",
  "How are digital twins transforming industry and urban planning?",
  "What are the implications of synthetic data for AI development?",
  "How might lab-grown meat transform the food industry?",
  "What are the latest advances in renewable materials and bioplastics?"
]

export function getRandomQuestions(count: number = 3): string[] {
  const shuffled = [...trendingResearchQuestions].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, trendingResearchQuestions.length))
}