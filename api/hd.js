import axios from "axios";

async function imageToBase64(url) {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  const base64 = Buffer.from(res.data).toString("base64");
  return `data:image/jpeg;base64,${base64}`;
}

async function upscaler(imageUrl) {
  try {
    const img = await imageToBase64(imageUrl);

    // CREATE TASK
    const create = await axios.post(
      "https://aienhancer.ai/api/v1/r/image-enhance/create",
      {
        model: 3,
        image: img,
        settings: "kRpBbpnRCD2nL2RxnnuoMo7MBc0zHndTDkWMl9aW+Gw="
      },
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
          "Content-Type": "application/json",
          origin: "https://aienhancer.ai",
          referer: "https://aienhancer.ai/ai-image-upscaler"
        }
      }
    );

    const id = create.data.data.id;

    // GET RESULT
    const result = await axios.post(
      "https://aienhancer.ai/api/v1/r/image-enhance/result",
      { task_id: id },
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
          "Content-Type": "application/json",
          origin: "https://aienhancer.ai",
          referer: "https://aienhancer.ai/ai-image-upscaler"
        }
      }
    );

    return {
      status: true,
      id,
      input: result.data.data.input,
      output: result.data.data.output
    };
  } catch (e) {
    return {
      status: false,
      msg: e.message
    };
  }
}

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      status: false,
      msg: "parameter url wajib diisi"
    });
  }

  const result = await upscaler(url);
  res.status(200).json(result);
}