const { Pinecone } = require("@pinecone-database/pinecone");

const getPineconeApiKey = () => process.env.PINECONE_API_KEY;
const getPineconeIndexName = () => process.env.PINECONE_INDEX_NAME || "test";

const isPineconeConfigured = () => Boolean(getPineconeApiKey());

const getIndex = () => {
  if (!isPineconeConfigured()) {
    throw new Error("PINECONE_API_KEY is required for Pinecone vector search");
  }

  const client = new Pinecone({
    apiKey: getPineconeApiKey(),
  });

  return client.index(getPineconeIndexName());
};

const upsertVectors = async ({ namespace, vectors }) => {
  if (!isPineconeConfigured()) {
    return { skipped: true };
  }

  const index = getIndex();
  return index.namespace(namespace).upsert({
    records: vectors,
  });
};

const queryVectors = async ({ namespace, vector, topK = 5 }) => {
  if (!isPineconeConfigured()) {
    return { matches: [], skipped: true };
  }

  const index = getIndex();
  return index.namespace(namespace).query({
    vector,
    topK,
    includeMetadata: true,
  });
};

module.exports = {
  isPineconeConfigured,
  upsertVectors,
  queryVectors,
};
