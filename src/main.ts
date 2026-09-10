import './style.css';
import { Game } from './game/Game';

// Drop any stale service workers so Pages updates aren't sticky
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    for (const r of regs) void r.unregister();
  });
}

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('#app missing');

app.style.width = '100%';
app.style.height = '100%';

new Game(app);
