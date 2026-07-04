const getGeminiApiKey = () => process.env.GOOGLE_API_KEY;
const getGeminiModel = () => process.env.GEMINI_MODEL || "gemini-2.0-flash";
const getGeminiEmbeddingModel = () =>
  process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";
const getGeminiEmbeddingDimensions = () =>
  Number(process.env.GEMINI_EMBEDDING_DIMENSIONS || 768);

const assertGeminiConfigured = () => {
  if (!getGeminiApiKey()) {
    throw new Error("GOOGLE_API_KEY is required for Gemini features");
  }
};

const callGemini = async (endpoint, body) => {
  assertGeminiConfigured();

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": getGeminiApiKey(),
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    const message =
      data?.error?.message || "Gemini request failed unexpectedly";
    throw new Error(message);
  }

  return data;
};

const embedTexts = async (texts, taskType, titlePrefix = "Document Chunk") => {
  if (!Array.isArray(texts) || texts.length === 0) {
    return [];
  }

  const data = await callGemini(
    `https://generativelanguage.googleapis.com/v1beta/models/${getGeminiEmbeddingModel()}:batchEmbedContents`,
    {
      requests: texts.map((text, index) => ({
        model: `models/${getGeminiEmbeddingModel()}`,
        content: {
          parts: [{ text }],
        },
        embedContentConfig: {
          taskType,
          title: `${titlePrefix} ${index + 1}`,
          outputDimensionality: getGeminiEmbeddingDimensions(),
        },
      })),
    },
  );

  const targetDimensions = getGeminiEmbeddingDimensions();

  return (data.embeddings || []).map((item) => {
    const values = item.values || [];

    if (values.length < targetDimensions) {
      throw new Error(
        `Embedding dimension ${values.length} is smaller than requested dimension ${targetDimensions}`,
      );
    }

    return values.slice(0, targetDimensions);
  });
};

const generateAnswer = async ({ question, contextChunks }) => {
  const contextText = contextChunks
    .map(
      (chunk, index) =>
        `Source ${index + 1} (${chunk.fileName}): ${chunk.content}`,
    )
    .join("\n\n");

  const data = await callGemini(
    `https://generativelanguage.googleapis.com/v1beta/models/${getGeminiModel()}:generateContent`,
    {
      systemInstruction: {
        parts: [
          {
            text:
              "You are a document question-answering assistant. Answer only from the provided context. If the answer is not in the context, say that clearly.",
          },
        ],
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Question: ${question}\n\nContext:\n${contextText}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
      },
    },
  );

  return (
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim() || "I could not generate an answer from the retrieved context."
  );
};

module.exports = {
  assertGeminiConfigured,
  embedTexts,
  generateAnswer,
};
