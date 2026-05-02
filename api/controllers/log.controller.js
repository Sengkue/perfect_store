import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getLogs = async (req, res, next) => {
  try {
    const logDir = path.join(__dirname, '..', 'logs');
    const files = await fs.readdir(logDir);
    
    // Filter for log files and sort by date (newest first)
    const logFiles = files
      .filter(f => f.endsWith('.log'))
      .sort((a, b) => b.localeCompare(a));

    const selectedFile = req.query.file || logFiles[0];
    
    if (!selectedFile) {
      return res.json({ success: true, files: [], content: [] });
    }

    const filePath = path.join(logDir, selectedFile);
    const content = await fs.readFile(filePath, 'utf8');
    
    // Parse JSON lines from Winston
    const lines = content
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return { message: line, level: 'unknown' };
        }
      })
      .reverse(); // Newest logs first

    res.json({
      success: true,
      files: logFiles,
      currentFile: selectedFile,
      content: lines
    });
  } catch (error) {
    next(error);
  }
};
