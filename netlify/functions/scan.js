const Busboy = require("busboy");

exports.handler = async function (event) {
  try {
    const fields = await parseMultipartForm(event);
    const file = fields.file;

    if (!file) {
      return json(400, { error: "No file uploaded." });
    }

    const apiUser = process.env.SIGHTENGINE_USER;
    const apiSecret = process.env.SIGHTENGINE_SECRET;

    if (!apiUser || !apiSecret) {
      return json(200, {
        score: 72,
        label: "Demo Mode",
        message: "API keys not set yet. This is a fake demo result."
      });
    }

    const FormData = require("form-data");
    const axios = require("axios");

    const data = new FormData();
    data.append("media", file.content, file.filename);
    data.append("models", "deepfake");
    data.append("api_user", apiUser);
    data.append("api_secret", apiSecret);

    const response = await axios({
      method: "post",
      url: "https://api.sightengine.com/1.0/check.json",
      data,
      headers: data.getHeaders()
    });

    const result = response.data;
    const confidence = result?.type?.deepfake?.score ?? 0;
    const score = Math.round((1 - confidence) * 100);

    return json(200, {
      score,
      label: score > 80 ? "Likely AI" : score > 50 ? "Suspicious" : "Likely Human",
      message: "Scan complete."
    });
  } catch (err) {
    return json(500, {
      error: "Scan failed.",
      details: err.message
    });
  }
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(body)
  };
}

function parseMultipartForm(event) {
  return new Promise((resolve, reject) => {
    const fields = {};
    const busboy = Busboy({
      headers: event.headers
    });

    busboy.on("file", (fieldname, file, info) => {
      const chunks = [];
      const filename = info.filename;

      file.on("data", (data) => chunks.push(data));
      file.on("end", () => {
        fields[fieldname] = {
          filename,
          content: Buffer.concat(chunks)
        };
      });
    });

    busboy.on("error", reject);
    busboy.on("finish", () => resolve(fields));

    const body = event.isBase64Encoded
      ? Buffer.from(event.body, "base64")
      : Buffer.from(event.body);

    busboy.end(body);
  });
}
