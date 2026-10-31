const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', viewBox: '0 0 24 24' };

export const ICONS = {
  search: <svg {...s}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>,
  menu: <svg {...s}><path d="M3 6h18M3 12h18M3 18h18" /></svg>,
  dots: <svg {...s}><circle cx="12" cy="5" r="1.4" fill="currentColor" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /><circle cx="12" cy="19" r="1.4" fill="currentColor" /></svg>,
  close: <svg {...s}><path d="M5 5l14 14M19 5L5 19" /></svg>,
  chevron: <svg {...s}><path d="M9 6l6 6-6 6" /></svg>,
  arrow: <svg {...s}><path d="M5 12h14M13 6l6 6-6 6" /></svg>,
  star: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.6 7.4H22l-6 4.6 2.3 7.6L12 17l-6.3 4.6L8 14 2 9.4h7.4z" /></svg>,
  instagram: <svg {...s}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>,
  chat: <svg {...s}><path d="M21 12a8 8 0 01-11.8 7L3 21l2-5.6A8 8 0 1121 12z" /></svg>,
  box: <svg {...s}><path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8" /></svg>,
  pin: <svg {...s}><path d="M12 21s-7-6.2-7-12a7 7 0 0114 0c0 5.8-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></svg>,
  phone: <svg {...s}><path d="M5 3h4l2 5-3 2a11 11 0 006 6l2-3 5 2v4a2 2 0 01-2 2A17 17 0 013 5a2 2 0 012-2" /></svg>,
  mail: <svg {...s}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>,
  truck: <svg {...s}><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>,
  user: <svg {...s}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></svg>,
  globe: <svg {...s}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" /></svg>,
  clock: <svg {...s}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  link: <svg {...s}><path d="M10 14a4 4 0 006 0l3-3a4 4 0 00-6-6l-1 1M14 10a4 4 0 00-6 0l-3 3a4 4 0 006 6l1-1" /></svg>,
};
export const ICON_NAMES = ['instagram', 'chat', 'box', 'pin', 'phone', 'mail', 'truck', 'user', 'globe', 'clock', 'link'];

export const Icon = ({ name }) => ICONS[name] || ICONS.link;
