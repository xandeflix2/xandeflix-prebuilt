import './index.css';
import { waitForAppIntro } from './bootstrap/app-intro-gate';

// Authentication, device presentation, React and catalog bootstrap retain their original entry.
void waitForAppIntro().then(() => import('./main.tsx'));
