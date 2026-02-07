const { createTranscript } = require("discord-html-transcripts");

async function generateTranscript(channel) {

  try {
    const attachment = await createTranscript(channel, {
      limit: -1,
      returnType: "attachment",
      filename: `transcript-${channel.name}.html`,
      saveImages: true,
      poweredBy: false
    });

    return attachment;

  } catch (error) {
    console.error("Transcript generation error:", error);
    return null;
  }
}

module.exports = {
  generateTranscript
};
