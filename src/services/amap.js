const AMAP_KEY = import.meta.env.VITE_AMAP_WEB_SERVICE_KEY
const DEFAULT_LOCATION = '121.415,31.218'

const foodTypeMap = [
  ['日本', '日料'], ['寿司', '日料'], ['川', '川菜'], ['麻辣', '川菜'], ['上海', '本帮菜'],
  ['本帮', '本帮菜'], ['云南', '云南菜'], ['海南', '海南菜'], ['面', '面馆'], ['小吃', '小吃'],
  ['西餐', '西餐'], ['意式', '西餐'],
]

function categoryFromType(type = '') {
  const match = foodTypeMap.find(([keyword]) => type.includes(keyword))
  return match?.[1] || type.split(';').at(-1) || '餐饮'
}

function normalizePoi(poi) {
  const business = poi.business || {}
  const distanceKm = poi.distance ? Math.max(0.1, Number(poi.distance) / 1000) : 1
  return {
    amapId: poi.id,
    name: poi.name,
    category: categoryFromType(poi.type),
    distance: Number(distanceKm.toFixed(1)),
    rating: Number(business.rating) || '',
    price: Number(business.cost) || '',
    address: [poi.adname, poi.address].flat().filter(Boolean).join(' '),
    location: poi.location,
    tags: String(business.tag || '').split(/[;,]/).filter(Boolean).slice(0, 4),
    businessArea: business.business_area || '',
    source: 'amap',
  }
}

export function hasAmapKey() {
  return Boolean(AMAP_KEY)
}

export function getBrowserLocation() {
  return new Promise(resolve => {
    if (!navigator.geolocation) return resolve(DEFAULT_LOCATION)
    navigator.geolocation.getCurrentPosition(
      position => resolve(`${position.coords.longitude.toFixed(6)},${position.coords.latitude.toFixed(6)}`),
      () => resolve(DEFAULT_LOCATION),
      { enableHighAccuracy: false, timeout: 3500, maximumAge: 300000 },
    )
  })
}

export async function searchAmapRestaurants(keyword) {
  if (!AMAP_KEY) return { configured: false, pois: [] }
  const location = await getBrowserLocation()
  const params = new URLSearchParams({
    key: AMAP_KEY,
    keywords: keyword,
    types: '050000',
    location,
    radius: '20000',
    sortrule: 'distance',
    show_fields: 'business',
    page_size: '12',
  })
  const response = await fetch(`https://restapi.amap.com/v5/place/around?${params}`)
  if (!response.ok) throw new Error('高德服务暂时不可用')
  const data = await response.json()
  if (data.status !== '1') throw new Error(data.info || '未能获取地点信息')
  return { configured: true, pois: (data.pois || []).map(normalizePoi) }
}
