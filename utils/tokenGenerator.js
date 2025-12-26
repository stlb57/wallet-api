const crypto = require("crypto");

function generateTokens(userId, amount) {
  const tokens = [];

  for (let i = 0; i < amount; i++) {
    const tokenId = crypto.randomUUID();

    const signature = crypto
      .createHash("sha256")
      .update(tokenId + userId)
      .digest("hex");

    tokens.push({
      tokenId,
      value: 1,
      used: false,
      signature,
      createdAt: new Date().toISOString()
    });
  }

  return tokens;
}

module.exports = generateTokens;
