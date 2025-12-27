import axios from "axios";

const api = {
  xterm: {
    url: "https://api.termai.cc",
    key: "aliceezuberg"
  }
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      status: false,
      message: "GET only"
    });
  }

  const {
    key,
    text,
    voice = "bella",
    pitch = 0,
    speed = 0.9
  } = req.query;

  // proteksi key
  if (key !== "zionjs") {
    return res.status(403).json({
      status: false,
      message: "Invalid API key"
    });
  }

  if (!text) {
    return res.status(400).json({
      status: false,
      message: "parameter text wajib diisi"
    });
  }

  try {
    const response = await axios.get(
      `${api.xterm.url}/api/text2speech/elevenlabs`,
      {
        params: {
          text,
          voice,
          pitch,
          speed,
          key: api.xterm.key
        },
        responseType: "arraybuffer"
      }
    );

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Disposition", "inline; filename=elevenlabs.mp3");

    return res.send(Buffer.from(response.data));

  } catch (err) {
    return res.status(500).json({
      status: false,
      message: err.response?.data || err.message
    });
  }
}