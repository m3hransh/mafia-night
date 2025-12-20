export function GradientBackground() {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-950 to-slate-950 animate-gradient-shift"></div>
      <div
        className="absolute inset-0 bg-gradient-to-tl from-slate-950 via-transparent to-black animate-gradient-shift-reverse">
      </div>
    </>
  );
}
