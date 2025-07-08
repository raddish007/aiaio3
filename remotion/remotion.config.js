// Remotion Lambda configuration file
// See: https://www.remotion.dev/docs/lambda/configuration

module.exports = {
  // The entry point for your Remotion project
  entryPoint: "src/Root.tsx",
  // The ID of the composition to render (update as needed)
  compositions: [
    "NameVideo",
    "BedtimeSong",
    "LetterHunt",
    "EpisodeSegment"
  ],
  // Optional: customize region, memory, timeout, etc.
  // region: "us-east-1",
  // memorySize: 2048,
  // timeoutInSeconds: 120,
};
