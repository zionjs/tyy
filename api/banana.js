import axios from "axios"
import CryptoJS from "crypto-js"

const AES_KEY = "ai-enhancer-web__aes-key"
const AES_IV  = "aienhancer-aesiv"

function encrypt(obj) {
  return CryptoJS.AES.encrypt(
    JSON.stringify(obj),
    CryptoJS.enc.Utf8.parse(AES_KEY),
    {
      iv: CryptoJS.enc.Utf8.parse(AES_IV),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }
  ).toString()
}

export default async function handler(req, res) {
  try {
    const { url, prompt } = req.query

    if (!url || !prompt) {
      return res.status(400).json({
        status: false,
        msg: "parameter url & prompt wajib diisi"
      })
    }

    // ambil gambar dari URL → base64
    const imgRes = await axios.get(url, { responseType: "arraybuffer" })
    const base64 = Buffer.from(imgRes.data).toString("base64")

    const settings = encrypt({
      prompt,
      aspect_ratio: "match_input_image",
      output_format: "png",
      max_images: 1,
      sequential_image_generation: "disabled"
    })

    const create = await axios.post(
      "https://aienhancer.ai/api/v1/r/image-enhance/create",
      {
        model: 2,
        image: `data:image/jpeg;base64,${base64}`,
        settings
      },
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
          "Content-Type": "application/json",
          Origin: "https://aienhancer.ai",
          Referer: "https://aienhancer.ai/ai-image-editor"
        }
      }
    )

    const id = create.data.data.id

    // polling result
    while (true) {
      const r = await axios.post(
        "https://aienhancer.ai/api/v1/r/image-enhance/result",
        { task_id: id },
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
            "Content-Type": "application/json",
            Origin: "https://aienhancer.ai",
            Referer: "https://aienhancer.ai/ai-image-editor"
          }
        }
      )

      if (r.data.data.status === "succeeded") {
        return res.status(200).json({
          status: true,
          id,
          input: r.data.data.input,
          output: r.data.data.output
        })
      }

      await new Promise(r => setTimeout(r, 3000))
    }

  } catch (e) {
    return res.status(500).json({
      status: false,
      msg: e.message
    })
  }
}