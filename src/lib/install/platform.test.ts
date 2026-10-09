import { describe, expect, it } from 'vitest'
import { iosInstallHint } from './platform'

const IPHONE_SAFARI_18 =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1'
const IPHONE_SAFARI_26 =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1'
const IPHONE_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/140.0.7339.122 Mobile/15E148 Safari/604.1'
const IPHONE_INSTAGRAM =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 400.0.0.0.0'
const IPAD_AS_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15'
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36'

describe('iosInstallHint', () => {
  it('points Safari 18 at the Share button', () => {
    expect(iosInstallHint(IPHONE_SAFARI_18, 5)).toBe('share')
  })

  it('points Safari 26 at the ••• menu', () => {
    expect(iosInstallHint(IPHONE_SAFARI_26, 5)).toBe('menu')
  })

  it('points other iOS browsers at their Share button', () => {
    expect(iosInstallHint(IPHONE_CHROME, 5)).toBe('share')
  })

  it('skips in-app browsers, which cannot add to the Home Screen', () => {
    expect(iosInstallHint(IPHONE_INSTAGRAM, 5)).toBeNull()
  })

  it('treats a touch "Mac" as an iPad, and a real Mac as nothing', () => {
    expect(iosInstallHint(IPAD_AS_MAC, 5)).toBe('menu')
    expect(iosInstallHint(IPAD_AS_MAC, 0)).toBeNull()
  })

  it('leaves Android to the browser prompt', () => {
    expect(iosInstallHint(ANDROID_CHROME, 5)).toBeNull()
  })
})
