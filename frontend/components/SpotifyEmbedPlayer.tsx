// app/components/SpotifyEmbedPlayer.tsx
import React from "react";

type Props = {
  spotifyUri: string; // e.g. "spotify:track:..." or "spotify:album:..." or "spotify:playlist:..."
  theme?: "light" | "dark";
};

export default function SpotifyEmbedPlayer({ spotifyUri }: Props) {
  // Convert spotify:type:id to https://open.spotify.com/embed/type/id
  const getEmbedUrl = (uri: string) => {
    if (!uri) return "";
    const parts = uri.split(":");
    
    // Handle spotify:user:x:playlist:y legacy format
    if (parts.includes("playlist")) {
        const id = parts[parts.length - 1];
        return `https://open.spotify.com/embed/playlist/${id}`;
    }
    
    if (parts.length < 3) return "";
    
    const type = parts[1];
    const id = parts[2];
    return `https://open.spotify.com/embed/${type}/${id}`;
  };

  const url = getEmbedUrl(spotifyUri);

  if (!url) return null;

  return (
    <iframe
      src={url}
      width="100%"
      height="380"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      className="rounded-2xl border border-white/10"
      style={{ border: 0 }}
    />
  );
}

