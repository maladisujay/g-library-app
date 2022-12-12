import {
  ArcElement, BarElement, CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip,
} from 'chart.js';

ChartJS.register(ArcElement, BarElement, CategoryScale, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip);
ChartJS.defaults.font.family = "'Inter', -apple-system, 'Segoe UI', sans-serif";
ChartJS.defaults.font.size = 11;
ChartJS.defaults.animation = false;
ChartJS.defaults.color = '#6c757d';
ChartJS.defaults.plugins.legend.labels.boxWidth = 10;

export const RED = '#a6192e';
export const PALETTE = ['#a6192e', '#2f6f9f', '#1f7a6d', '#d9822b', '#6b3fa0', '#5a6470', '#b5651d', '#8a5a12', '#6d6d2f'];
