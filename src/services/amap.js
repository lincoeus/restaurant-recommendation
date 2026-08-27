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

export async function searchAmapRestaurants(keyword, selectedLocation) {
  if (!AMAP_KEY) return { configured: false, pois: [] }
  const location = selectedLocation || await getBrowserLocation()
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

export async function discoverAmapRestaurants(radiusKm = 3, selectedLocation) {
  if (!AMAP_KEY) return { configured: false, pois: [] }
  const location = selectedLocation || await getBrowserLocation()
  const radius = Math.min(50000, Math.max(1000, Math.round(Number(radiusKm || 3) * 1000)))
  const params = new URLSearchParams({
    key: AMAP_KEY,
    types: '050000',
    location,
    radius: String(radius),
    sortrule: 'distance',
    show_fields: 'business',
    page_size: '25',
  })
  const response = await fetch(`https://restapi.amap.com/v5/place/around?${params}`)
  if (!response.ok) throw new Error('高德服务暂时不可用')
  const data = await response.json()
  if (data.status !== '1') throw new Error(data.info || '未能获取附近餐厅')
  return { configured: true, pois: (data.pois || []).map(normalizePoi) }
}

export async function searchAmapLocations(keyword) {
  if (!AMAP_KEY) return { configured: false, locations: [] }
  const params = new URLSearchParams({
    key: AMAP_KEY,
    keywords: keyword,
    page_size: '12',
  })
  const response = await fetch(`https://restapi.amap.com/v5/place/text?${params}`)
  if (!response.ok) throw new Error('高德地点搜索暂时不可用')
  const data = await response.json()
  if (data.status !== '1') throw new Error(data.info || '未能搜索地点')
  return {
    configured: true,
    locations: (data.pois || []).filter(poi => poi.location).map(poi => ({
      id: poi.id,
      name: poi.name,
      city: poi.cityname || poi.pname || '',
      district: poi.adname || '',
      address: [poi.adname, poi.address].flat().filter(Boolean).join(' '),
      coordinates: poi.location,
    })),
  }
}

export async function resolveBrowserLocation() {
  const coordinates = await getBrowserLocation()
  if (!AMAP_KEY) return { name: '当前位置', city: '', address: '', coordinates }
  const params = new URLSearchParams({ key: AMAP_KEY, location: coordinates, extensions: 'all', radius: '500' })
  const response = await fetch(`https://restapi.amap.com/v3/geocode/regeo?${params}`)
  if (!response.ok) throw new Error('暂时无法识别当前位置')
  const data = await response.json()
  if (data.status !== '1') throw new Error(data.info || '暂时无法识别当前位置')
  const regeocode = data.regeocode || {}
  const component = regeocode.addressComponent || {}
  const city = Array.isArray(component.city) || !component.city ? component.province || '' : component.city
  const nearestPoi = regeocode.pois?.[0]?.name
  return {
    name: nearestPoi || component.township || component.district || '当前位置',
    city,
    district: component.district || '',
    address: regeocode.formatted_address || '',
    coordinates,
  }
}
