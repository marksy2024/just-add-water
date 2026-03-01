import sharp from 'sharp'

interface GpsCoordinates {
  lat: number
  lng: number
}

/**
 * Extract GPS coordinates from an image buffer via EXIF metadata.
 * Returns null if no GPS data is found.
 */
export async function extractGpsFromBuffer(buffer: Buffer): Promise<GpsCoordinates | null> {
  try {
    const metadata = await sharp(buffer).metadata()
    const exif = metadata.exif

    if (!exif) return null

    // Parse EXIF IFD to find GPS data
    // Sharp provides raw EXIF buffer — parse GPS IFD manually
    const gps = parseGpsFromExif(exif)
    return gps
  } catch {
    return null
  }
}

/**
 * Parse GPS data from raw EXIF buffer.
 * EXIF GPS tags: 0x0001 (LatRef), 0x0002 (Lat), 0x0003 (LngRef), 0x0004 (Lng)
 */
function parseGpsFromExif(exifBuffer: Buffer): GpsCoordinates | null {
  try {
    // Convert EXIF buffer to string and look for GPS patterns
    // This is a simplified approach — look for GPS coordinate patterns in the EXIF data
    const hex = exifBuffer.toString('hex')

    // Find GPS IFD pointer from Exif IFD
    // Standard EXIF structure: Byte order + 0x002A + IFD0 offset
    const isLittleEndian = exifBuffer[0] === 0x49 // 'II'

    function readUint16(offset: number): number {
      if (isLittleEndian) {
        return exifBuffer[offset] | (exifBuffer[offset + 1] << 8)
      }
      return (exifBuffer[offset] << 8) | exifBuffer[offset + 1]
    }

    function readUint32(offset: number): number {
      if (isLittleEndian) {
        return exifBuffer[offset] | (exifBuffer[offset + 1] << 8) |
          (exifBuffer[offset + 2] << 16) | (exifBuffer[offset + 3] << 24)
      }
      return (exifBuffer[offset] << 24) | (exifBuffer[offset + 1] << 16) |
        (exifBuffer[offset + 2] << 8) | exifBuffer[offset + 3]
    }

    function readRational(offset: number): number {
      const num = readUint32(offset)
      const den = readUint32(offset + 4)
      return den === 0 ? 0 : num / den
    }

    // Skip to IFD0 (offset at bytes 4-7)
    const ifd0Offset = readUint32(4)

    // Scan IFD0 entries for GPS IFD pointer (tag 0x8825)
    const ifd0Count = readUint16(ifd0Offset)
    let gpsIfdOffset = 0

    for (let i = 0; i < ifd0Count; i++) {
      const entryOffset = ifd0Offset + 2 + (i * 12)
      const tag = readUint16(entryOffset)

      if (tag === 0x8825) { // GPS IFD pointer
        gpsIfdOffset = readUint32(entryOffset + 8)
        break
      }
    }

    if (gpsIfdOffset === 0) return null

    // Parse GPS IFD
    const gpsCount = readUint16(gpsIfdOffset)
    let latRef = ''
    let lngRef = ''
    let latDMS: number[] = []
    let lngDMS: number[] = []

    for (let i = 0; i < gpsCount; i++) {
      const entryOffset = gpsIfdOffset + 2 + (i * 12)
      if (entryOffset + 12 > exifBuffer.length) break

      const tag = readUint16(entryOffset)
      const count = readUint32(entryOffset + 4)
      const valueOffset = readUint32(entryOffset + 8)

      switch (tag) {
        case 0x0001: // GPSLatitudeRef
          latRef = String.fromCharCode(exifBuffer[entryOffset + 8])
          break
        case 0x0002: // GPSLatitude (3 rationals)
          if (valueOffset + 24 <= exifBuffer.length) {
            latDMS = [
              readRational(valueOffset),
              readRational(valueOffset + 8),
              readRational(valueOffset + 16),
            ]
          }
          break
        case 0x0003: // GPSLongitudeRef
          lngRef = String.fromCharCode(exifBuffer[entryOffset + 8])
          break
        case 0x0004: // GPSLongitude (3 rationals)
          if (valueOffset + 24 <= exifBuffer.length) {
            lngDMS = [
              readRational(valueOffset),
              readRational(valueOffset + 8),
              readRational(valueOffset + 16),
            ]
          }
          break
      }
    }

    if (latDMS.length !== 3 || lngDMS.length !== 3) return null

    let lat = dmsToDecimal(latDMS[0], latDMS[1], latDMS[2])
    let lng = dmsToDecimal(lngDMS[0], lngDMS[1], lngDMS[2])

    if (latRef === 'S') lat = -lat
    if (lngRef === 'W') lng = -lng

    // Validate coordinates
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
    if (lat === 0 && lng === 0) return null

    return { lat: Math.round(lat * 1000000) / 1000000, lng: Math.round(lng * 1000000) / 1000000 }
  } catch {
    return null
  }
}

/**
 * Convert degrees, minutes, seconds to decimal degrees
 */
function dmsToDecimal(degrees: number, minutes: number, seconds: number): number {
  return degrees + minutes / 60 + seconds / 3600
}
