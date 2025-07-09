// Remotion Lambda configuration file
// See: https://www.remotion.dev/docs/lambda/configuration

module.exports = {
  // The entry point for your Remotion project
  entryPoint: "src/index.ts",
  // The ID of the composition to render (update as needed)
  compositions: [
    "NameVideo",
    "BedtimeSong",
    "LetterHunt",
    "EpisodeSegment",
    "TemplateVideo",
    "SimpleTemplate",
    "UniversalTemplate",
    "HelloWorld",
    "HelloWorldWithImage",
    "Lullaby"
  ],
  // Optional: customize region, memory, timeout, etc.
  // region: "us-east-1",
  // memorySize: 2048,
  // timeoutInSeconds: 120,
};
