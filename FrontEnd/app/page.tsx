import CloudParallax from '@/components/animations/CloudParallax';

import LoginTicket from '@/components/ui/LoginTicket';

export default function Home() {
  return (
    <main
      className="relative w-full h-screen overflow-hidden flex items-center justify-center"
      style={{
        background: 'linear-gradient(180deg, #1E2B47 0%, #2C3A5A 30%, #4A6080 65%, #6688B6 100%)',
      }}
    >
      {/* Stars */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {[
          [8, 12], [15, 8], [22, 18], [30, 5], [38, 14], [45, 9], [52, 20],
          [60, 6], [68, 15], [75, 10], [82, 18], [90, 7], [5, 28], [18, 35],
          [27, 40], [35, 25], [42, 38], [50, 30], [58, 42], [65, 27], [72, 36],
          [80, 22], [88, 40], [95, 30], [3, 20], [11, 42], [24, 15], [48, 8],
          [70, 44], [85, 12], [93, 38], [2, 44], [16, 22], [33, 44], [55, 18],
          [77, 42], [91, 20], [7, 38], [41, 15], [62, 40],
        ].map(([left, top], i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: (i % 3 === 0 ? 2.5 : i % 3 === 1 ? 1.5 : 2) + 'px',
              height: (i % 3 === 0 ? 2.5 : i % 3 === 1 ? 1.5 : 2) + 'px',
              left: left + '%',
              top: top + '%',
              opacity: i % 4 === 0 ? 0.7 : i % 4 === 1 ? 0.4 : i % 4 === 2 ? 0.55 : 0.3,
            }}
          />
        ))}
      </div>

      {/* Cloud parallax layers */}
      <CloudParallax />

      {/* Floating bus */}

      {/* Login ticket card */}
      <div className="relative z-20">
        <LoginTicket />
      </div>
    </main>
  );
}
