// routes/certificateRoutes.js
router.post('/verify-external-cert', async (req, res) => {
  const { certId, certLink } = req.body;
  try {
    // Replace this with actual verification logic (e.g., scraping, API integration)
    const isVerified = certLink.includes(certId); // Basic mock logic
    if (isVerified) {
      return res.status(200).json({ isVerified: true });
    } else {
      return res.status(400).json({ isVerified: false });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Verification failed' });
  }
});

