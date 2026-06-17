const adjectives = ["Brave", "Quiet", "Swift", "Wise", "Calm", "Bold", "Kind", "Quick", "Sharp", "Steady", "Bright", "Loyal", "Humble", "Strong", "Gentle"];
const animals = ["Camel", "Lion", "Falcon", "Eagle", "Gazelle", "Oryx", "Cheetah", "Antelope", "Hawk", "Ibex", "Jackal", "Hyena", "Crane", "Heron", "Owl"];

export function randomNickname(): string {
  const a = adjectives[Math.floor(Math.random() * adjectives.length)];
  const n = animals[Math.floor(Math.random() * animals.length)];
  const num = Math.floor(Math.random() * 90 + 10);
  return `${a}${n}${num}`;
}
