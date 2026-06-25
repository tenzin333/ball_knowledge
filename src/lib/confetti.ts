// Thin wrapper around canvas-confetti for the "fun" moments.
// Client-only: imported from "use client" components.
import confetti from "canvas-confetti";

/** Small celebratory burst for a correct answer. */
export function popCorrect() {
  confetti({
    particleCount: 45,
    spread: 65,
    startVelocity: 38,
    origin: { y: 0.7 },
    colors: ["#22c55e", "#a3e635", "#ffffff", "#10b981"],
    scalar: 0.9,
  });
}

/** Big finale for finishing a quiz well. */
export function popFinale() {
  const end = Date.now() + 800;
  const fire = () => {
    confetti({
      particleCount: 60,
      spread: 90,
      startVelocity: 45,
      origin: { x: Math.random(), y: 0.6 },
      colors: ["#22c55e", "#a3e635", "#ffffff", "#10b981", "#facc15"],
    });
    if (Date.now() < end) requestAnimationFrame(fire);
  };
  fire();
}
