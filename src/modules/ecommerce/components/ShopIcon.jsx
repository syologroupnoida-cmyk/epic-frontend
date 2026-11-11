const paths = {
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />,
  cart: <><path d="M2 3h3l3 13h12l2-9H6M9 12h11" /><circle cx="9" cy="21" r="1" /><circle cx="19" cy="21" r="1" /></>,
  box: <><path d="m12 2 9 5v10l-9 5-9-5V7l9-5Z M3 7l9 5 9-5M12 12v10M7 4.8l10 5.5v5" /></>,
  user: <><circle cx="12" cy="6" r="4" /><path d="M4 22v-3a8 8 0 0 1 16 0v3Z" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  list: <><path d="M8 5h14M8 12h14M8 19h14M2 5h1M2 12h1M2 19h1" /></>,
  invites: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 5 10 8L22 5" /></>,
  gift: <><rect x="3" y="9" width="18" height="13" rx="1" /><path d="M2 9h20M12 9v13M7 9C0 5 7-3 12 9c5-12 12-4 5 0" /></>,
  flower: <><path d="M12 12C0-3 24-3 12 12c15-12 15 12 0 0 12 15-12 15 0 0-15 12-15-12 0 0Z" /><circle cx="12" cy="12" r="2" /></>,
  bride: <path d="m8 2 1 5h6l1-5M9 7l-1 5-5 10h18l-5-10-1-5" />,
  groom: <><path d="m8 2-5 3v17h6V9l3 4 3-4v13h6V5l-5-3-4 8-4-8ZM8 2l4 2 4-2M12 4v6" /></>,
  necklace: <><path d="M3 3C0 13 5 17 12 20c7-3 12-7 9-17M5 3c-2 8 2 11 7 13 5-2 9-5 7-13" /><path d="m12 16 3 4-3 3-3-3 3-4Z" /></>,
  mug: <><path d="M3 3h14v18H3ZM17 7h3a3 3 0 0 1 0 6h-3" /><path d="M6 9c0-3 4-3 4 0 0-3 4-3 4 0 0 2-4 5-4 5S6 11 6 9Z" /></>,
  truck: <><path d="M1 4h13v13H1ZM14 9h5l4 5v3h-9" /><circle cx="6" cy="19" r="3" /><circle cx="18" cy="19" r="3" /></>,
  shield: <><path d="m12 2 9 4v7c0 5-9 9-9 9S3 18 3 13V6l9-4Z" /><path d="m8 12 3 3 5-6" /></>,
  return: <><path d="m7 2-5 5 5 5M2 7h12a8 8 0 1 1-7 12" /></>,
  close: <path d="m5 5 14 14M19 5 5 19" />,
  filter: <><path d="M3 6h18M3 12h18M3 18h18" /><circle cx="8" cy="6" r="2" /><circle cx="16" cy="12" r="2" /><circle cx="10" cy="18" r="2" /></>,
};

export default function ShopIcon({ name, size = 24, ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.gift}</svg>;
}
