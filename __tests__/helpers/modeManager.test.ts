import fs from 'fs';
import path from 'path';
import { isPaperMode, setPaperMode } from '../../src/helpers/modeManager';

const PAPER_FILE = path.join(process.cwd(), '.paper');

describe('ModeManager', () => {
  beforeEach(() => {
    if (fs.existsSync(PAPER_FILE)) {
      fs.unlinkSync(PAPER_FILE);
    }
  });

  afterAll(() => {
    if (fs.existsSync(PAPER_FILE)) {
      fs.unlinkSync(PAPER_FILE);
    }
  });

  it('should return false if .paper file does not exist', () => {
    expect(isPaperMode()).toBe(false);
  });

  it('should return true if .paper file exists', () => {
    fs.writeFileSync(PAPER_FILE, '');
    expect(isPaperMode()).toBe(true);
  });

  it('should set paper mode correctly', () => {
    setPaperMode(true);
    expect(fs.existsSync(PAPER_FILE)).toBe(true);
    expect(isPaperMode()).toBe(true);

    setPaperMode(false);
    expect(fs.existsSync(PAPER_FILE)).toBe(false);
    expect(isPaperMode()).toBe(false);
  });
});
