const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || apiKey !== process.env.INGEST_API_KEY) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized ingestion request'
    });
  }

  next();
};

module.exports = { apiKeyAuth };