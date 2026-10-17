export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, message: "Method not allowed." });
  }

  const payload = req.body || {};

  await new Promise((resolve) => setTimeout(resolve, 650));

  return res.status(200).json({
    success: true,
    message: "KYC submitted successfully.",
    data: {
      ...payload,
      submittedAt: new Date().toISOString(),
      status: "PENDING_REVIEW",
    },
  });
}
