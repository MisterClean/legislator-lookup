export function buildProtomapsStyleUrl(style: "light" | "dark", apiKey: string): string {
  // Protomaps hosted style JSON endpoint.
  // Example: https://api.protomaps.com/styles/v5/light/en.json?key=...
  return `https://api.protomaps.com/styles/v5/${style}/en.json?key=${encodeURIComponent(apiKey)}`;
}

