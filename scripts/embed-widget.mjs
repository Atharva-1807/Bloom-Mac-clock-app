/**
 * electron-builder afterPack hook.
 * Embeds the pre-built BloomWidget.appex into Bloom.app/Contents/PlugIns/
 * so macOS registers it as a WidgetKit extension without a separate download.
 *
 * Prerequisites:
 *   1. Open BloomWidgetExtension/BloomWidgetExtension.xcodeproj in Xcode
 *   2. Product → Build (or xcodebuild -scheme BloomWidget -configuration Release)
 *   3. Run npm run dist:mas  ← this hook fires automatically
 */

import { cp, mkdir, access } from 'node:fs/promises'
import { join } from 'node:path'

const APPEX_SRC = new URL(
  '../BloomWidgetExtension/build/Release/BloomWidget.appex',
  import.meta.url
).pathname

export default async function afterPack({ appOutDir, packager }) {
  const appName = packager.appInfo.productName
  const pluginsDir = join(appOutDir, `${appName}.app`, 'Contents', 'PlugIns')

  // Skip silently if the widget hasn't been built yet (e.g. regular dmg builds)
  try {
    await access(APPEX_SRC)
  } catch {
    console.warn(
      '[embed-widget] BloomWidget.appex not found — skipping widget embedding.\n' +
      '  Build it first: open BloomWidgetExtension/BloomWidgetExtension.xcodeproj → Product → Build'
    )
    return
  }

  await mkdir(pluginsDir, { recursive: true })
  await cp(APPEX_SRC, join(pluginsDir, 'BloomWidget.appex'), { recursive: true })
  console.log('[embed-widget] BloomWidget.appex embedded into Contents/PlugIns/')
}
