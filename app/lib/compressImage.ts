// Client-side only — uses Canvas API
export async function compressImage(file: File, maxPx = 800, targetBytes = 300_000): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target?.result as string
      img.onload = () => {
        let { width, height } = img
        if (width > height && width > maxPx) { height = Math.round(height * maxPx / width); width = maxPx }
        else if (height > maxPx) { width = Math.round(width * maxPx / height); height = maxPx }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height)

        let quality = 0.88
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) { reject(new Error('compress failed')); return }
              if (blob.size > targetBytes && quality > 0.2) {
                quality -= 0.08
                setTimeout(tryCompress, 0)
              } else {
                resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }))
              }
            },
            'image/jpeg',
            quality,
          )
        }
        tryCompress()
      }
      img.onerror = reject
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
