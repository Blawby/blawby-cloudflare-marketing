import { MetadataRoute } from 'next'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-static'

// Helper function to get file modification time
function getFileMtime(filePath: string): string | null {
  try {
    const stats = fs.statSync(filePath)
    return stats.mtime.toISOString()
  } catch (error) {
    return null
  }
}

// Helper function to get all content files and their timestamps
function getAllContentFiles() {
  const contentFiles: Array<{
    type: string
    slug: string
    category: string
    mtime: string
    filePath: string
  }> = []

  // Get lessons
  try {
    const lessonsDir = path.join(process.cwd(), 'src/data/lessons')
    const lessonFiles = fs
      .readdirSync(lessonsDir)
      .filter((f) => f.endsWith('.mdx'))
    for (const file of lessonFiles) {
      const filePath = path.join(lessonsDir, file)
      const mtime = getFileMtime(filePath)
      if (mtime) {
        contentFiles.push({
          type: 'lesson',
          slug: file.replace('.mdx', ''),
          category: 'lessons',
          mtime,
          filePath,
        })
      }
    }
  } catch (error) {
    console.warn('Error reading lessons directory:', error)
  }

  // Get articles
  try {
    const articlesDir = path.join(process.cwd(), 'src/data/articles')
    const categories = fs
      .readdirSync(articlesDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)

    for (const category of categories) {
      const categoryDir = path.join(articlesDir, category)
      const articleFiles = fs
        .readdirSync(categoryDir)
        .filter((f) => f.endsWith('.mdx'))
      for (const file of articleFiles) {
        const filePath = path.join(categoryDir, file)
        const mtime = getFileMtime(filePath)
        if (mtime) {
          contentFiles.push({
            type: 'article',
            slug: file.replace('.mdx', ''),
            category,
            mtime,
            filePath,
          })
        }
      }
    }
  } catch (error) {
    console.warn('Error reading articles directory:', error)
  }

  // Get interviews
  try {
    const interviewsDir = path.join(process.cwd(), 'src/data/interviews')
    const interviewFiles = fs
      .readdirSync(interviewsDir)
      .filter((f) => f.endsWith('.vtt'))
    for (const file of interviewFiles) {
      const filePath = path.join(interviewsDir, file)
      const mtime = getFileMtime(filePath)
      if (mtime) {
        contentFiles.push({
          type: 'interview',
          slug: file.replace('.vtt', ''),
          category: 'interviews',
          mtime,
          filePath,
        })
      }
    }
  } catch (error) {
    console.warn('Error reading interviews directory:', error)
  }

  // Get legal pages
  try {
    const legalDir = path.join(process.cwd(), 'src/data/legal')
    const legalFiles = fs
      .readdirSync(legalDir)
      .filter((f) => f.endsWith('.mdx'))
    for (const file of legalFiles) {
      const filePath = path.join(legalDir, file)
      const mtime = getFileMtime(filePath)
      if (mtime) {
        contentFiles.push({
          type: 'legal',
          slug: file.replace('.mdx', ''),
          category: 'legal',
          mtime,
          filePath,
        })
      }
    }
  } catch (error) {
    console.warn('Error reading legal directory:', error)
  }

  return contentFiles
}

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = 'https://blawby.com'
  const contentFiles = getAllContentFiles()
  const urlMap = new Map<string, MetadataRoute.Sitemap[0]>()

  // Add home page
  let latestTime = new Date().toISOString()
  for (const file of contentFiles) {
    if (file.mtime && file.mtime > latestTime) {
      latestTime = file.mtime
    }
  }
  urlMap.set(siteUrl, {
    url: siteUrl,
    lastModified: latestTime,
    changeFrequency: 'daily',
    priority: 0.7,
  })

  // Add static pages
  const staticPages = [
    '/pricing',
    '/help',
    '/nonprofit-commitment',
    '/pitch-deck',
  ]
  for (const page of staticPages) {
    const pageName = page.slice(1)
    const filePath = path.join(
      process.cwd(),
      'src/app/(sidebar)',
      pageName,
      'page.tsx',
    )
    const mtime = getFileMtime(filePath)
    const url = `${siteUrl}${page}`
    urlMap.set(url, {
      url,
      lastModified: mtime || new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 0.7,
    })
  }

  // Add content pages
  for (const file of contentFiles) {
    let url: string
    if (file.type === 'lesson') {
      url = `${siteUrl}/lessons/${file.slug}`
    } else if (file.type === 'article') {
      url = `${siteUrl}/${file.category}/${file.slug}`
    } else if (file.type === 'interview') {
      url = `${siteUrl}/interviews/${file.slug}`
    } else if (file.type === 'legal') {
      url = `${siteUrl}/${file.slug}`
    } else {
      continue
    }

    // Only add if not already present or if this timestamp is newer
    const existing = urlMap.get(url)
    if (!existing || file.mtime > (existing.lastModified || '')) {
      urlMap.set(url, {
        url,
        lastModified: file.mtime,
        changeFrequency: 'daily',
        priority: 0.7,
      })
    }
  }

  // Add interviews index page
  const interviewFiles = contentFiles.filter((f) => f.type === 'interview')
  let latestInterviewTime = new Date().toISOString()
  for (const file of interviewFiles) {
    if (file.mtime && file.mtime > latestInterviewTime) {
      latestInterviewTime = file.mtime
    }
  }
  if (interviewFiles.length > 0) {
    const interviewsUrl = `${siteUrl}/interviews`
    const existing = urlMap.get(interviewsUrl)
    if (!existing || latestInterviewTime > (existing.lastModified || '')) {
      urlMap.set(interviewsUrl, {
        url: interviewsUrl,
        lastModified: latestInterviewTime,
        changeFrequency: 'daily',
        priority: 0.7,
      })
    }
  }

  return Array.from(urlMap.values())
}
