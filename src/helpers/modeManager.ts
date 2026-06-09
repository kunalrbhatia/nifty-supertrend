import fs from 'fs';
import path from 'path';

const PAPER_FILE = path.join(process.cwd(), '.paper');

export const isPaperMode = (): boolean => fs.existsSync(PAPER_FILE);

export const setPaperMode = (on: boolean): void => {
  if (on) {
    fs.writeFileSync(PAPER_FILE, '');
  } else if (fs.existsSync(PAPER_FILE)) {
    fs.unlinkSync(PAPER_FILE);
  }
};
