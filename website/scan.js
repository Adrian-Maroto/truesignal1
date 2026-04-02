exports.handler = async () => {
  const score = 72;
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      score,
      label: score > 80 ? 'Likely AI' : score > 50 ? 'Suspicious' : 'Likely Human',
      message: 'Demo backend is running. Replace this with a real deepfake API key to scan real files.'
    })
  };
};