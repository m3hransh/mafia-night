export function RoleDistributing() {
  return (
    <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-purple-500/30 text-center">
      <div className="text-white text-2xl mb-4">Distributing roles...</div>
      <div className="flex justify-center gap-2">
        <div className="animate-pulse w-3 h-3 bg-purple-500 rounded-full"></div>
        <div className="animate-pulse w-3 h-3 bg-purple-500 rounded-full" style={{ animationDelay: '0.2s' }}></div>
        <div className="animate-pulse w-3 h-3 bg-purple-500 rounded-full" style={{ animationDelay: '0.4s' }}></div>
      </div>
    </div>
  );
}
