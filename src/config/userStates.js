export const USER_STATES = [
  { key: 'online', label: 'ONLINE', color: '#3ac47d', icon: '🟢' },
  { key: 'away', label: 'AWAY', color: '#ffe066', icon: '🟡' },
  { key: 'busy', label: 'BUSY', color: '#e74c3c', icon: '🔴' },
  { key: 'invisible', label: 'INVISIBLE', color: '#b0b8c9', icon: '⚪' },
];

export const getStateByKey = (key) => USER_STATES.find((s) => s.key === key) || USER_STATES[3];
