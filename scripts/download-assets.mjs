import { mkdir, writeFile, access } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fontsDir = join(__dirname, '../src/renderer/assets/fonts')

await mkdir(fontsDir, { recursive: true })

// Download Satoshi Bold font if not already present
const fontPath = join(fontsDir, 'Satoshi-Bold.woff2')
try {
  await access(fontPath)
  console.log('Satoshi-Bold.woff2 already exists, skipping.')
} catch {
  const fontCss = await (await fetch('https://api.fontshare.com/v2/css?f[]=satoshi@700&display=swap')).text()
  const match = fontCss.match(/url\('(\/\/[^']+)'/)
  if (!match) throw new Error('Could not find Satoshi font URL in Fontshare response')
  const fontBuffer = Buffer.from(await (await fetch(`https:${match[1]}`)).arrayBuffer())
  await writeFile(fontPath, fontBuffer)
  console.log('Downloaded Satoshi-Bold.woff2')
}

console.log('Done.')
