import './style.css';
import { Game } from './game/Game';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('#app missing');

app.style.width = '100%';
app.style.height = '100%';

new Game(app);
