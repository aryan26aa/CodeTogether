import axios from "axios";

const languageConfig = {
  python3: { versionIndex: "3" },
  java: { versionIndex: "3" },
  cpp: { versionIndex: "4" },
  nodejs: { versionIndex: "3" },
  c: { versionIndex: "4" },
  ruby: { versionIndex: "3" },
  go: { versionIndex: "3" },
  scala: { versionIndex: "3" },
  bash: { versionIndex: "3" },
  sql: { versionIndex: "3" },
  pascal: { versionIndex: "2" },
  csharp: { versionIndex: "3" },
  php: { versionIndex: "3" },
  swift: { versionIndex: "3" },
  rust: { versionIndex: "3" },
  r: { versionIndex: "3" },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { code, language } = req.body;

  if (!code || !language) {
    return res.status(400).json({ error: "Code and language are required" });
  }
  if (!languageConfig[language]) {
    return res.status(400).json({ error: "Unsupported programming language" });
  }

  const clientId = process.env.jDoodle_clientId;
  const clientSecret = process.env.kDoodle_clientSecret;

  if (!clientId || !clientSecret) {
    return res.json({
      output: `// Mock execution for ${language}\n\nYour code:\n${code}\n\nOutput: Hello from CodeTogether!\n\nNote: This is a mock execution. To enable real code compilation, please add your JDoodle API credentials to the .env file.`,
      memory: "0 MB",
      cpuTime: "0.001",
      compilationStatus: "success",
      isMock: true
    });
  }

  try {
    const response = await axios.post("https://api.jdoodle.com/v1/execute", {
      script: code,
      language: language,
      versionIndex: languageConfig[language].versionIndex,
      clientId: clientId,
      clientSecret: clientSecret,
    }, {
      timeout: 10000
    });
    const result = response.data;
    if (result.statusCode === 200) {
      res.json({
        output: result.output,
        memory: result.memory,
        cpuTime: result.cpuTime,
        compilationStatus: "success"
      });
    } else {
      res.json({
        output: result.output || "Compilation failed",
        error: result.error || "Unknown error occurred",
        compilationStatus: "error"
      });
    }
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      res.status(408).json({ error: "Request timeout. Please try again." });
    } else if (error.response) {
      res.status(error.response.status).json({ error: error.response.data?.error || "Compilation service error" });
    } else {
      res.status(500).json({ error: "Failed to compile code. Please check your internet connection." });
    }
  }
} 