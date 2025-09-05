/**
 * 图片压缩工具
 * 支持自动压缩图片到指定尺寸和质量
 */

/**
 * 压缩图片文件
 * @param {File} file - 原始图片文件
 * @param {Object} options - 压缩选项
 * @param {number} options.maxWidth - 最大宽度，默认800
 * @param {number} options.maxHeight - 最大高度，默认800
 * @param {number} options.quality - 压缩质量 0-1，默认0.8
 * @param {string} options.mimeType - 输出格式，默认'image/jpeg'
 * @returns {Promise<File>} 压缩后的图片文件
 */
export function compressImage(file, options = {}) {
    return new Promise((resolve, reject) => {
      const {
        maxWidth = 800,
        maxHeight = 800,
        quality = 0.8,
        mimeType = 'image/jpeg'
      } = options
  
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        reject(new Error('文件必须是图片格式'))
        return
      }
  
      // 创建图片对象
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
  
      img.onload = () => {
        try {
          // 计算压缩后的尺寸
          const { width: newWidth, height: newHeight } = calculateSize(
            img.width,
            img.height,
            maxWidth,
            maxHeight
          )
  
          // 设置canvas尺寸
          canvas.width = newWidth
          canvas.height = newHeight
  
          // 绘制压缩后的图片
          ctx.drawImage(img, 0, 0, newWidth, newHeight)
  
          // 转换为Blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // 创建新的File对象
                const compressedFile = new File(
                  [blob],
                  `compressed_${file.name}`,
                  {
                    type: mimeType,
                    lastModified: Date.now()
                  }
                )
                resolve(compressedFile)
              } else {
                reject(new Error('图片压缩失败'))
              }
            },
            mimeType,
            quality
          )
        } catch (error) {
          reject(new Error(`图片处理失败: ${error.message}`))
        }
      }
  
      img.onerror = () => {
        reject(new Error('图片加载失败'))
      }
  
      // 开始加载图片
      img.src = URL.createObjectURL(file)
    })
  }
  
  /**
   * 计算压缩后的尺寸
   * @param {number} originalWidth - 原始宽度
   * @param {number} originalHeight - 原始高度
   * @param {number} maxWidth - 最大宽度
   * @param {number} maxHeight - 最大高度
   * @returns {Object} 新的宽度和高度
   */
  function calculateSize(originalWidth, originalHeight, maxWidth, maxHeight) {
    let width = originalWidth
    let height = originalHeight
  
    // 如果图片尺寸小于最大限制，不进行缩放
    if (width <= maxWidth && height <= maxHeight) {
      return { width, height }
    }
  
    // 计算缩放比例
    const widthRatio = maxWidth / width
    const heightRatio = maxHeight / height
    const ratio = Math.min(widthRatio, heightRatio)
  
    // 计算新尺寸
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
  
    return { width, height }
  }
  
  /**
   * 将图片文件转换为Base64字符串
   * @param {File} file - 图片文件
   * @returns {Promise<string>} Base64字符串
   */
  export function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        resolve(e.target.result)
      }
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'))
      }
      
      reader.readAsDataURL(file)
    })
  }
  
  /**
   * 检查图片质量
   * @param {string} base64 - 图片的base64字符串
   * @returns {Object} 质量检测结果
   */
  export function checkImageQuality(base64) {
    // 估算文件大小（base64长度 * 0.75）
    const sizeInBytes = Math.round((base64.length * 3) / 4)
    
    // 检查图片清晰度（基于文件大小的简单判断）
    let quality = 'good'
    let message = '图片质量良好'
    
    if (sizeInBytes < 30 * 1024) { // 小于30KB
      quality = 'poor'
      message = '图片可能过于模糊，建议重新拍摄'
    } else if (sizeInBytes < 100 * 1024) { // 30KB-100KB
      quality = 'fair'
      message = '图片质量一般，建议确保光线充足'
    } else if (sizeInBytes > 2 * 1024 * 1024) { // 大于2MB
      quality = 'large'
      message = '图片文件较大，可能影响加载速度'
    }
    
    return {
      quality,
      message,
      sizeInBytes,
      sizeFormatted: formatFileSize(sizeInBytes)
    }
  }
  
  /**
   * 格式化文件大小显示
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的大小字符串
   */
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }
  
  /**
   * 创建图片缩略图
   * @param {string} base64 - 原始图片base64
   * @param {number} size - 缩略图尺寸，默认150
   * @returns {Promise<string>} 缩略图base64
   */
  export function createThumbnail(base64, size = 150) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      img.onload = () => {
        try {
          // 计算缩略图尺寸（正方形）
          canvas.width = size
          canvas.height = size
          
          // 计算裁剪区域（居中裁剪）
          const sourceSize = Math.min(img.width, img.height)
          const sourceX = (img.width - sourceSize) / 2
          const sourceY = (img.height - sourceSize) / 2
          
          // 绘制缩略图
          ctx.drawImage(
            img,
            sourceX, sourceY, sourceSize, sourceSize, // 源区域
            0, 0, size, size // 目标区域
          )
          
          resolve(canvas.toDataURL('image/jpeg', 0.8))
        } catch (error) {
          reject(new Error(`缩略图创建失败: ${error.message}`))
        }
      }
      
      img.onerror = () => {
        reject(new Error('图片加载失败'))
      }
      
      img.src = base64
    })
  }
  
  /**
   * 批量压缩图片
   * @param {FileList} files - 图片文件列表
   * @param {Object} options - 压缩选项
   * @returns {Promise<File[]>} 压缩后的图片数组
   */
  export async function compressImages(files, options = {}) {
    const results = []
    
    for (let i = 0; i < files.length; i++) {
      try {
        const compressedFile = await compressImage(files[i], options)
        results.push(compressedFile)
      } catch (error) {
        console.error(`压缩第${i + 1}张图片失败:`, error)
        // 如果压缩失败，使用原文件
        results.push(files[i])
      }
    }
    
    return results
  }