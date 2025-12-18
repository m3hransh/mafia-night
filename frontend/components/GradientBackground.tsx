
export function GradientBackground() {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 animate-gradient-shift"></div>
      <div className="absolute inset-0 bg-gradient-to-tl from-indigo-950 via-transparent to-slate-950 animate-gradient-shift-reverse"></div>
    </>
  );
}

