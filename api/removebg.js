import axios from "axios"
import FormData from "form-data"

async function getToken() {
  const { data } = await axios.get(
    "https://removal.ai/wp-admin/admin-ajax.php?action=ajax_get_webtoken&security=1cf5632768"
  )
  return data?.data?.webtoken
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      status: false,
      message: "GET only"
    })
  }

  const imageUrl = req.query.url
  if (!imageUrl) {
    return res.status(400).json({
      status: false,
      message: "parameter url wajib diisi"
    })
  }

  try {
    // ambil token
    const token = await getToken()
    if (!token) {
      return res.status(500).json({
        status: false,
        message: "gagal ambil token"
      })
    }

    // download image → buffer
    const img = await axios.get(imageUrl, {
      responseType: "arraybuffer"
    })

    // form-data
    const form = new FormData()
    form.append("image_file", Buffer.from(img.data), {
      filename: "image.png",
      contentType: img.headers["content-type"] || "image/png"
    })

    // kirim ke removal.ai
    const { data } = await axios.post(
      "https://api.removal.ai/3.0/remove",
      form,
      {
        headers: {
          ...form.getHeaders(),
          "user-agent":
            "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/142 Mobile",
          origin: "https://removal.ai",
          accept: "*/*",
          "web-token": token
        }
      }
    )

    return res.json({
      status: true,
      result: {
        output: data.url,
        low_resolution: data.low_resolution || null,
        demo: data.preview_demo || null,
        original: data.original || null,
        extra: data.extra || null
      }
    })

  } catch (e) {
    return res.status(500).json({
      status: false,
      message: e.message
    })
  }
}