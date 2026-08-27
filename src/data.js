export const seedRestaurants = [
  {
    id: 'r1', name: '巷口小馆', category: '本帮菜', distance: 0.8, rating: 4.8, price: 68,
    eta: 12, address: '愚园路 1088 号', color: '#D96C4A', emoji: '🥘', visits: 5,
    reasons: ['你常吃本帮菜', '步行可达'], isNew: false,
  },
  {
    id: 'r2', name: '山野炭火烧鸟', category: '日料', distance: 1.3, rating: 4.7, price: 126,
    eta: 18, address: '镇宁路 322 号', color: '#2F6457', emoji: '🍢', visits: 1,
    reasons: ['待前往', '评分很高'], isNew: false, wishlist: true,
  },
  {
    id: 'r3', name: '红油冒菜研究所', category: '川菜', distance: 0.6, rating: 4.6, price: 43,
    eta: 9, address: '江苏路 41 弄', color: '#BA392D', emoji: '🌶️', visits: 3,
    reasons: ['性价比高', '出餐很快'], isNew: false,
  },
  {
    id: 'r4', name: 'LENTO 慢慢吃', category: '西餐', distance: 1.9, rating: 4.9, price: 158,
    eta: 24, address: '武夷路 168 号', color: '#405E7B', emoji: '🍝', visits: 0,
    reasons: ['本月新店', '符合你的口味'], isNew: true,
  },
  {
    id: 'r5', name: '阿婆馄饨', category: '小吃', distance: 0.4, rating: 4.5, price: 24,
    eta: 6, address: '宣化路 73 号', color: '#D79B38', emoji: '🥟', visits: 8,
    reasons: ['就在附近', '你收藏的老店'], isNew: false,
  },
  {
    id: 'r6', name: '青苔·云南小馆', category: '云南菜', distance: 2.4, rating: 4.8, price: 92,
    eta: 29, address: '延安西路 525 号', color: '#5C7452', emoji: '🍄', visits: 0,
    reasons: ['朋友都在吃', '口味匹配 92%'], isNew: true,
  },
  {
    id: 'r7', name: '椰屿清补凉', category: '海南菜', distance: 1.5, rating: 4.6, price: 79,
    eta: 20, address: '定西路 655 号', color: '#558C82', emoji: '🥥', visits: 0,
    reasons: ['新店尝鲜', '清淡不腻'], isNew: true,
  },
  {
    id: 'r8', name: '一碗好面', category: '面馆', distance: 0.9, rating: 4.4, price: 32,
    eta: 13, address: '长宁路 456 号', color: '#A97142', emoji: '🍜', visits: 6,
    reasons: ['快速解决一餐', '人均 ¥32'], isNew: false,
  },
]

export const ratingRanges = [
  { id: 'all', label: '不限', min: 0, max: 5.01 },
  { id: 'under4', label: '4.0 以下', min: 0, max: 4 },
  { id: '4to45', label: '4.0–4.5', min: 4, max: 4.5 },
  { id: '45to48', label: '4.5–4.8', min: 4.5, max: 4.8 },
  { id: '48to5', label: '4.8–5.0', min: 4.8, max: 5.01 },
]

export const budgetRanges = [
  { id: 'all', label: '不限', min: 0, max: Infinity },
  { id: 'under50', label: '¥50 以下', min: 0, max: 50 },
  { id: '50to100', label: '¥50–100', min: 50, max: 100 },
  { id: '100to150', label: '¥100–150', min: 100, max: 150 },
  { id: 'over150', label: '¥150 以上', min: 150, max: Infinity },
]

export const defaultFilters = { distance: 3, rating: 'all', budget: 'all', category: '全部' }
export const distanceRanges = [
  { id: 'all', label: '不限' },
  { id: 1, label: '1km' },
  { id: 3, label: '3km' },
  { id: 5, label: '5km' },
  { id: 10, label: '10km' },
]
export const categories = ['全部', '本帮菜', '日料', '川菜', '西餐', '小吃', '云南菜', '海南菜', '面馆']
