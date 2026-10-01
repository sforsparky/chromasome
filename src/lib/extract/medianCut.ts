export type ColorBox = { r: number; g: number; b: number; count: number }

type Box = { indices: Uint32Array; min: [number, number, number]; max: [number, number, number] }

function bounds(pixels: Uint8ClampedArray, indices: Uint32Array): Pick<Box, 'min' | 'max'> {
  const min: [number, number, number] = [255, 255, 255]
  const max: [number, number, number] = [0, 0, 0]
  for (let k = 0; k < indices.length; k++) {
    const i = indices[k] * 4
    for (let c = 0; c < 3; c++) {
      const v = pixels[i + c]
      if (v < min[c]) min[c] = v
      if (v > max[c]) max[c] = v
    }
  }
  return { min, max }
}

function makeBox(pixels: Uint8ClampedArray, indices: Uint32Array): Box {
  return { indices, ...bounds(pixels, indices) }
}

/**
 * Median-cut quantization. `pixels` is RGBA data (e.g. from ImageData.data).
 * Pixels with alpha < 128 are ignored. Returns up to `boxCount` boxes, each with
 * its mean color and pixel count, most populous first.
 */
export function quantize(pixels: Uint8ClampedArray, boxCount = 16): ColorBox[] {
  const total = pixels.length / 4
  const opaque: number[] = []
  for (let p = 0; p < total; p++) if (pixels[p * 4 + 3] >= 128) opaque.push(p)
  if (opaque.length === 0) return []

  const boxes: Box[] = [makeBox(pixels, Uint32Array.from(opaque))]

  while (boxes.length < boxCount) {
    // Split the box with the largest (widest range x count) that still has >1 pixel.
    let bestIdx = -1
    let bestScore = 0
    boxes.forEach((box, i) => {
      if (box.indices.length < 2) return
      const range = Math.max(box.max[0] - box.min[0], box.max[1] - box.min[1], box.max[2] - box.min[2])
      const score = range * box.indices.length
      if (score > bestScore) {
        bestScore = score
        bestIdx = i
      }
    })
    if (bestIdx === -1 || bestScore === 0) break

    const box = boxes[bestIdx]
    const ranges = [box.max[0] - box.min[0], box.max[1] - box.min[1], box.max[2] - box.min[2]]
    const channel = ranges.indexOf(Math.max(...ranges))
    const sorted = Array.from(box.indices).sort((a, b) => pixels[a * 4 + channel] - pixels[b * 4 + channel])
    const mid = Math.floor(sorted.length / 2)
    boxes.splice(bestIdx, 1, makeBox(pixels, Uint32Array.from(sorted.slice(0, mid))), makeBox(pixels, Uint32Array.from(sorted.slice(mid))))
  }

  return boxes
    .map((box) => {
      let r = 0
      let g = 0
      let b = 0
      for (let k = 0; k < box.indices.length; k++) {
        const i = box.indices[k] * 4
        r += pixels[i]
        g += pixels[i + 1]
        b += pixels[i + 2]
      }
      const n = box.indices.length
      return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n), count: n }
    })
    .sort((a, b) => b.count - a.count)
}
