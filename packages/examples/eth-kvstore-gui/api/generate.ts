import { generateKey } from 'openpgp';
import type { VercelRequest, VercelResponse } from '@vercel/node';
export default async function handler(req:VercelRequest, res:VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept',
  )
  res.setHeader('Access-Control-Allow-Credentials', "true")
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  if (req.method === 'OPTIONS') {
    return res.status(200).json({
      body: 'OK',
    })
  }
  const { name, email, password } = req.body
  const data = await generateKey({
    type: 'rsa',
    rsaBits: 4096,
    userIDs: [{ name, email }],
    passphrase: password,
  })
  res.json(data)
}
