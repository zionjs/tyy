import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      status: false,
      message: "GET only"
    });
  }

  // ambil query (support q atau text)
  const q = req.query.q || req.query.text;

  if (!q) {
    return res.status(400).json({
      status: false,
      message: "parameter q wajib diisi"
    });
  }

  try {
    const payload = {
      message: q,
      userId: "user_0oxn0xrwu",
      image: null
    };

    const response = await axios.post(
      "https://ai-studio.anisaofc.my.id/api/chat",
      payload,
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    if (!response.data || !response.data.success) {
      return res.status(500).json({
        status: false,
        message: "Castorice AI gagal merespon"
      });
    }

    return res.json({
      status: true,
      model: "Castorice AI",
      question: q,
      answer: response.data.response
    });

  } catch (e) {
    return res.status(500).json({
      status: false,
      message: e.message
    });
  }
}