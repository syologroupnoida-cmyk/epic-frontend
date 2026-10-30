// Dummy endpoint for inspecting Contact Us submissions; no storage or email delivery.
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, message: 'Use POST to submit an enquiry.' });
  }
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ success: false, message: 'Send your enquiry as a JSON object.' });
  }
  const required = ['fullName', 'email', 'mobileNumber', 'weddingCity', 'servicesRequired', 'message'];
  const fields = [...required, 'weddingDate'];
  const data = Object.fromEntries(fields.map((field) => [field, typeof req.body[field] === 'string' ? req.body[field].trim() : '']));
  if (required.some((field) => !data[field])) {
    return res.status(400).json({ success: false, message: 'Please complete all required fields.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
  }
  return res.status(200).json({ success: true, dummy: true, message: 'Test enquiry submitted successfully. No email has been sent.', data });
}

export const config = { api: { bodyParser: { sizeLimit: '16kb' } } };
