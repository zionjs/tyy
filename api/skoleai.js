import axios from "axios";

export default async function handler(req, res) {
  try {
    const { text } = req.query;

    if (!text) {
      return res.status(400).json({
        status: false,
        msg: "Parameter text wajib diisi"
      });
    }

    const payload = {
      id: "D4uBrf6hBYxJbBEI",
      messages: [
        {
          role: "system",
          content: "Hey there! What can I help you with?",
          parts: [{ type: "text", text: "Hey there! What can I help you with?" }]
        },
        {
          role: "user",
          content: text,
          parts: [{ type: "text", text }]
        }
      ],
      prompt: "chat-for-students",
      promptType: "sanity",
      locale: "en-US",
      inputs: {},
      sessionId: crypto.randomUUID(),
      model: "gpt-5-mini",
      anonymousUserId: crypto.randomUUID()
    };

    const response = await axios.post(
      "https://skoleapi-py.midgardai.io/chat/",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "text/event-stream",
          "User-Agent": "Mozilla/5.0"
        },
        responseType: "stream"
      }
    );

    let result = "";

    await new Promise((resolve, reject) => {
      response.data.on("data", chunk => {
        const textChunk = chunk.toString();
        const matches = textChunk.match(/0:"(.*?)"/g);

        if (matches) {
          for (const m of matches) {
            result += m
              .replace(/^0:"/, "")
              .replace(/"$/, "")
              .replace(/\\n/g, "\n");
          }
        }
      });

      response.data.on("end", resolve);
      response.data.on("error", reject);
    });

    return res.json({
      status: true,
      creator: "ZionJS",
      platform: "Schoolhub Ai",
      model: "gpt-5-mini",
      question: text,
      answer: result.trim()
    });

  } catch (err) {
    return res.status(500).json({
      status: false,
      msg: "Skole AI error",
      error: err.message
    });
  }
}