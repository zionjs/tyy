import axios from "axios";

const styles = {
  ghibli: "L7p91uXhVyp5OOJthAyqjSqhlbM+RPZ8+h2Uq9tz6Y+4Agarugz8f4JjxjEycxEzuj/7+6Q0YY9jUvrfmqkucAl/+qryNmYNVy6ndccs12kKvEph2JWqGX7Y3E6K1TIOuuZU7DlC3+XXHt7v6H58zbZqcWX9gRl1eMwWSUMaGTXA63S/FmmHZbzAuWw0EMOiUTD61YPwrfkXMaTGbj/ANa2W+vXedrRNL69qOO2kAyinFACvCnI92dPkhiZYuUz4ziNGVWmjQyZ/1WLtfZqIpDNmdsa6fHRRti5Qh1ehMJPltGo+Cr5HMM2GijVWWBw9mJk0GK7lAYjgJ3WhU9Uf+3G6h60IkRFiP3fwNlT9WdBkyWoU1EjDwAWscxTzxP5C4eifIPbvXx7s5W53crT6bA==",
  anime: "L7p91uXhVyp5OOJthAyqjSqhlbM+RPZ8+h2Uq9tz6Y+4Agarugz8f4JjxjEycxEzuj/7+6Q0YY9jUvrfmqkucAl/+qryNmYNVy6ndccs12kKvEph2JWqGX7Y3E6K1TIOuuZU7DlC3+XXHt7v6H58zbZqcWX9gRl1eMwWSUMaGTXA63S/FmmHZbzAuWw0EMOiUTD61YPwrfkXMaTGbj/ANYrjQmJ+oEF7rgQawjLCWb+TtSokamC48KVGqY1gXzWhZz3D5YYvD3QRjYmfHTNJpMp62FnhG7bXUuABGRU0h7tOeNua+qtL/l9k8xl54FkNTrOvbeHr0CX3pagD4uAYLB77CcGNjdIXK9otrH59BVNDzUMILDOFxK6ivAuNDX19zvZfDgKMI0/rxkojyuladw==",
  manga: "L7p91uXhVyp5OOJthAyqjSqhlbM+RPZ8+h2Uq9tz6Y+4Agarugz8f4JjxjEycxEzuj/7+6Q0YY9jUvrfmqkucAl/+qryNmYNVy6ndccs12kKvEph2JWqGX7Y3E6K1TIOuuZU7DlC3+XXHt7v6H58zbZqcWX9gRl1eMwWSUMaGTXA63S/FmmHZbzAuWw0EMOiUTD61YPwrfkXMaTGbj/ANcncfLQOC0nsvWPnYab5J9WXOEbry/uxd7mq+nl8cpWYgGX8eRd9UBT2amxq0VmV/mq3TGfs2OVny5D9fJyE8uftCyOLiy3S69WoF5Q6kty1wQB0DUCmXSCxNf6XYFOo1edHJsrANqlxYQvlE7fcuqrWO+nlApVUi1w1FqBHgqvtbb8tQ+ZuOS4O5tKHrUikfQ=="
};

export default async function handler(req, res) {
  try {
    const { url, style = "anime" } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        message: "url is required"
      });
    }

    if (!styles[style]) {
      return res.status(400).json({
        status: false,
        message: "style not supported",
        available: Object.keys(styles)
      });
    }

    // download image
    const imgBuffer = await axios.get(url, {
      responseType: "arraybuffer"
    });
    const base64 = Buffer.from(imgBuffer.data).toString("base64");

    const headers = {
      "User-Agent": "Mozilla/5.0",
      "Content-Type": "application/json",
      Origin: "https://aienhancer.ai",
      Referer: "https://aienhancer.ai/photo-to-anime-converter"
    };

    // create task
    const create = await axios.post(
      "https://aienhancer.ai/api/v1/r/image-enhance/create",
      {
        model: 5,
        image: `data:image/jpeg;base64,${base64}`,
        settings: styles[style]
      },
      { headers }
    );

    const id = create.data.data.id;

    // polling
    while (true) {
      const r = await axios.post(
        "https://aienhancer.ai/api/v1/r/image-enhance/result",
        { task_id: id },
        { headers }
      );

      const data = r.data.data;
      if (data.status === "succeeded") {
        return res.json({
          status: true,
          id,
          style,
          output: data.output,
          input: data.input
        });
      }

      await new Promise(r => setTimeout(r, 3000));
    }

  } catch (e) {
    res.status(500).json({
      status: false,
      error: e.message
    });
  }
}