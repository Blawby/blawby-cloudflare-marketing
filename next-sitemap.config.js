import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to get file modification time
function getFileMtime(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.mtime.toISOString();
  } catch (error) {
    return null;
  }
}

// Helper function to get content timestamp (dateModified or datePublished)
function getContentTimestamp(content) {
  if (content.dateModified) {
    return new Date(content.dateModified).toISOString();
  }
  if (content.datePublished) {
    return new Date(content.datePublished).toISOString();
  }
  return null;
}

// Helper function to read and parse TypeScript data files
function readDataFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    // Simple parsing for the data arrays - this is a basic approach
    // We'll look for the array definitions and extract the data
    return content;
  } catch (error) {
    return null;
  }
}

// Helper function to get all content files and their timestamps
function getAllContentFiles() {
  const contentFiles = [];
  
  // Get lessons
  try {
    const lessonsDir = path.join(__dirname, 'src/data/lessons');
    const lessonFiles = fs.readdirSync(lessonsDir).filter(f => f.endsWith('.mdx'));
    for (const file of lessonFiles) {
      const filePath = path.join(lessonsDir, file);
      const mtime = getFileMtime(filePath);
      if (mtime) {
        contentFiles.push({
          type: 'lesson',
          slug: file.replace('.mdx', ''),
          category: 'lessons',
          mtime,
          filePath
        });
      }
    }
  } catch (error) {
    console.warn('Error reading lessons directory:', error.message);
  }
  
  // Get articles
  try {
    const articlesDir = path.join(__dirname, 'src/data/articles');
    const categories = fs.readdirSync(articlesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    for (const category of categories) {
      const categoryDir = path.join(articlesDir, category);
      const articleFiles = fs.readdirSync(categoryDir).filter(f => f.endsWith('.mdx'));
      for (const file of articleFiles) {
        const filePath = path.join(categoryDir, file);
        const mtime = getFileMtime(filePath);
        if (mtime) {
          contentFiles.push({
            type: 'article',
            slug: file.replace('.mdx', ''),
            category,
            mtime,
            filePath
          });
        }
      }
    }
  } catch (error) {
    console.warn('Error reading articles directory:', error.message);
  }
  
  // Get interviews
  try {
    const interviewsDir = path.join(__dirname, 'src/data/interviews');
    const interviewFiles = fs.readdirSync(interviewsDir).filter(f => f.endsWith('.vtt'));
    for (const file of interviewFiles) {
      const filePath = path.join(interviewsDir, file);
      const mtime = getFileMtime(filePath);
      if (mtime) {
        contentFiles.push({
          type: 'interview',
          slug: file.replace('.vtt', ''),
          category: 'interviews',
          mtime,
          filePath
        });
      }
    }
  } catch (error) {
    console.warn('Error reading interviews directory:', error.message);
  }
  
  // Get legal pages
  try {
    const legalDir = path.join(__dirname, 'src/data/legal');
    const legalFiles = fs.readdirSync(legalDir).filter(f => f.endsWith('.mdx'));
    for (const file of legalFiles) {
      const filePath = path.join(legalDir, file);
      const mtime = getFileMtime(filePath);
      if (mtime) {
        contentFiles.push({
          type: 'legal',
          slug: file.replace('.mdx', ''),
          category: 'legal',
          mtime,
          filePath
        });
      }
    }
  } catch (error) {
    console.warn('Error reading legal directory:', error.message);
  }
  
  return contentFiles;
}

// Generate all URLs with proper lastmod timestamps
function generateAllUrls() {
  const contentFiles = getAllContentFiles();
  const urls = [];
  
  // Add home page
  let latestTime = null;
  for (const file of contentFiles) {
    if (file.mtime && (!latestTime || file.mtime > latestTime)) {
      latestTime = file.mtime;
    }
  }
  urls.push({
    loc: 'https://blawby.com',
    lastmod: latestTime || new Date().toISOString(),
    changefreq: 'daily',
    priority: 0.7,
  });
  
  // Add static pages
  const staticPages = ['/pricing', '/help', '/nonprofit-commitment', '/pitch-deck'];
  for (const page of staticPages) {
    const pageName = page.slice(1);
    const filePath = path.join(__dirname, 'src/app/(sidebar)', pageName, 'page.tsx');
    const mtime = getFileMtime(filePath);
    urls.push({
      loc: `https://blawby.com${page}`,
      lastmod: mtime || new Date().toISOString(),
      changefreq: 'daily',
      priority: 0.7,
    });
  }
  
  // Add content pages
  for (const file of contentFiles) {
    let url;
    if (file.type === 'lesson') {
      url = `https://blawby.com/lessons/${file.slug}`;
    } else if (file.type === 'article') {
      url = `https://blawby.com/${file.category}/${file.slug}`;
    } else if (file.type === 'interview') {
      url = `https://blawby.com/interviews/${file.slug}`;
    } else if (file.type === 'legal') {
      url = `https://blawby.com/${file.slug}`;
    }
    
    if (url) {
      urls.push({
        loc: url,
        lastmod: file.mtime,
        changefreq: 'daily',
        priority: 0.7,
      });
    }
  }
  
  // Add interviews index page
  const interviewFiles = contentFiles.filter(f => f.type === 'interview');
  let latestInterviewTime = null;
  for (const file of interviewFiles) {
    if (file.mtime && (!latestInterviewTime || file.mtime > latestInterviewTime)) {
      latestInterviewTime = file.mtime;
    }
  }
  if (latestInterviewTime) {
    urls.push({
      loc: 'https://blawby.com/interviews',
      lastmod: latestInterviewTime,
      changefreq: 'daily',
      priority: 0.7,
    });
  }
  
  return urls;
}

export default {
  siteUrl: 'https://blawby.com',
  generateRobotsTxt: true,
  
  // Generate additional paths with custom lastmod
  additionalPaths: async (config) => {
    const urls = generateAllUrls();
    return urls;
  },
}; 