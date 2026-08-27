export const seedRestaurants = [
  {
    id: 'amap-B0FFJCRXOF', amapId: 'B0FFJCRXOF', name: '四平明珍小吃', category: '本帮菜',
    distance: 0.4, rating: 4.4, price: 34, eta: 6, address: '鞍山支路21号-2低层',
    location: '121.509742,31.280437', color: '#B85C38', emoji: '🍳', visits: 0,
    reasons: ['现炒小炒肉', '重口下饭'], isNew: false, source: 'amap', seedVersion: 2,
  },
  {
    id: 'amap-B0LRY4UE58', amapId: 'B0LRY4UE58', name: '阿祥嫂隆江猪脚饭（天宝路店）', category: '粤菜',
    distance: 2.1, rating: 4.4, price: 29, eta: 27, address: '天宝路69号',
    location: '121.496204,31.261349', color: '#8B5A3C', emoji: '🍖', visits: 0,
    reasons: ['推荐脚圈（四点金）', '萝卜汤解腻'], isNew: false, source: 'amap', seedVersion: 2,
  },
  {
    id: 'amap-B0IGAUO7U3', amapId: 'B0IGAUO7U3', name: '勤德兴（鞍山路店）', category: '小吃',
    distance: 1.1, rating: 4.6, price: 22, eta: 14, address: '鞍山路20号1层西北间-3',
    location: '121.513404,31.274542', color: '#C68B36', emoji: '🥟', visits: 0,
    reasons: ['无锡小笼和馄饨', '价格实惠'], isNew: false, source: 'amap', seedVersion: 2,
  },
  {
    id: 'amap-B00155QTRK', amapId: 'B00155QTRK', name: '食其家·牛丼咖喱（控江路店）', category: '日料',
    distance: 1.4, rating: 3.9, price: 29, eta: 18, address: '控江路1667号甲（近双辽路）',
    location: '121.516134,31.274214', color: '#9B493F', emoji: '🍚', visits: 0,
    reasons: ['牛肉丼', '快捷简餐'], isNew: false, source: 'amap', seedVersion: 2,
  },
  {
    id: 'amap-B0K3CRB6ST', amapId: 'B0K3CRB6ST', name: '粤雅广式烧味', category: '粤菜',
    distance: 1.4, rating: 3.6, price: 22, eta: 18, address: '国权路69号B1-11',
    location: '121.518225,31.288325', color: '#A85D42', emoji: '🍗', visits: 0,
    reasons: ['广式烧腊', '外卖性价比高'], isNew: false, source: 'amap', seedVersion: 2,
  },
  {
    id: 'seed-gugujixiaoguan-fushun', name: '谷谷鸡小馆（抚顺路店）', category: '本帮菜',
    distance: 0.7, rating: 4, price: 25, eta: 9, address: '抚顺路265号',
    location: '121.513473,31.279282', color: '#866348', emoji: '🍗', visits: 0,
    reasons: ['谷谷鸡和白斩鸡', '本帮浇头'], isNew: false, source: 'verified-web', seedVersion: 2,
  },
  {
    id: 'amap-B0FFLJIRNI', amapId: 'B0FFLJIRNI', name: '黑丰抓饭', category: '新疆菜',
    distance: 2.2, rating: 4.3, price: 40, eta: 29, address: '国济路30号-15（近政通路）',
    location: '121.515350,31.302894', color: '#8B6940', emoji: '🍖', visits: 0,
    reasons: ['推荐双排羊肉抓饭', '羊排肥香多汁'], isNew: false, source: 'amap', seedVersion: 2,
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
export const categories = ['全部', '本帮菜', '日料', '川菜', '粤菜', '新疆菜', '西餐', '小吃', '云南菜', '海南菜', '面馆']
