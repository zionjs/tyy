import axios from "axios"

const api = {
  xterm: {
    url: "https://api.termai.cc",
    key: "aliceezuberg"
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      status: false,
      message: "GET only"
    })
  }

  // 🔐 API KEY CHECK
  const accessKey = req.query.key
  if (accessKey !== "zionjs") {
    return res.status(403).json({
      status: false,
      message: "API key tidak valid"
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
    // ambil gambar → buffer
    const img = await axios.get(imageUrl, {
      responseType: "arraybuffer"
    })

    const response = await axios.post(
      `${api.xterm.url}/api/img2video/luma?key=${api.xterm.key}`,
      img.data,
      {
        headers: {
          "Content-Type": "application/octet-stream"
        },
        responseType: "stream"
      }
    )

    response.data.on("data", chunk => {
      try {
        const str = chunk.toString()
        const match = str.match(/data: (.+)/)
        if (!match) return

        const data = JSON.parse(match[1])

        // progress (di-skip)
        if (["pending","processing","queueing","generating"].includes(data.status)) {
          return
        }

        // ✅ sukses
        if (data.status === "completed") {
          response.data.destroy()

          if (!data.video?.url) {
            return res.status(500).json({
              status: false,
              message: "Video URL tidak ditemukan"
            })
          }

          return res.json({
            status: true,
            video_url: data.video.url
          })
        }

        // ❌ gagal
        if (["failed","error"].includes(data.status)) {
          response.data.destroy()
          return res.status(500).json({
            status: false,
            message: data.msg || "Luma gagal"
          })
        }

      } catch (e) {
        response.data.destroy()
        return res.status(500).json({
          status: false,
          message: e.message
        })
      }
    })

    response.data.on("error", err => {
      return res.status(500).json({
        status: false,
        message: err.message
      })
    })

  } catch (e) {
    return res.status(500).json({
      status: false,
      message: e.message
    })
  }
}