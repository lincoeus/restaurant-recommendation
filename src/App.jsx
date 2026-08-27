import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft, BookmarkPlus, Check, ChevronDown, ChevronRight, CirclePlus, Compass,
  Heart, Home, LocateFixed, MapPin, Navigation, Plus, RotateCcw, Search, SlidersHorizontal,
  Sparkles, Star, Store, Trash2, Utensils, X,
} from 'lucide-react'
import { budgetRanges, categories, defaultFilters, ratingRanges, seedRestaurants } from './data'
import { discoverAmapRestaurants, hasAmapKey, searchAmapRestaurants } from './services/amap'

const STORAGE_KEY = 'fantuan-restaurants-v1'
const HISTORY_KEY = 'fantuan-history-v1'

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}

function App() {
  const [restaurants, setRestaurants] = useState(() => load(STORAGE_KEY, seedRestaurants))
  const [history, setHistory] = useState(() => load(HISTORY_KEY, []))
  const [tab, setTab] = useState('home')
  const [filters, setFilters] = useState(defaultFilters)
  const [showFilters, setShowFilters] = useState(false)
  const [showAdd, setShowAdd] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [selected, setSelected] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(restaurants)), [restaurants])
  useEffect(() => localStorage.setItem(HISTORY_KEY, JSON.stringify(history)), [history])
  useEffect(() => { if (toast) { const id = setTimeout(() => setToast(''), 2400); return () => clearTimeout(id) } }, [toast])

  const filtered = useMemo(() => {
    const rating = ratingRanges.find(range => range.id === filters.rating) || ratingRanges[0]
    const budget = budgetRanges.find(range => range.id === filters.budget) || budgetRanges[0]
    return restaurants.filter(r =>
      r.distance <= filters.distance && r.rating >= rating.min && r.rating < rating.max &&
      r.price >= budget.min && r.price < budget.max &&
      (filters.category === '全部' || r.category === filters.category)
    )
  }, [restaurants, filters])

  function scoreRestaurant(r) {
    const lastIndex = history.findIndex(h => h.id === r.id)
    const recentPenalty = lastIndex === -1 ? 0 : Math.max(0, 50 - lastIndex * 12)
    const wishBoost = r.wishlist ? 120 : 0
    const newBoost = r.isNew ? 12 : 0
    return wishBoost + r.rating * 9 - r.distance * 3 + newBoost + Math.random() * 35 - recentPenalty
  }

  function generate(list = filtered, previousMainId = null) {
    if (!list.length) { setRecommendations([]); return }
    const ranked = list
      .map(restaurant => ({ restaurant, score: scoreRestaurant(restaurant) }))
      .sort((a, b) => b.score - a.score)
    if (previousMainId && ranked.length > 1 && ranked[0].restaurant.id === previousMainId) {
      const nextMainIndex = ranked.findIndex(item => item.restaurant.id !== previousMainId)
      const [nextMain] = ranked.splice(nextMainIndex, 1)
      ranked.unshift(nextMain)
    }
    setRecommendations(ranked.slice(0, 3).map(item => item.restaurant))
  }

  useEffect(() => { generate(filtered) }, [filtered]) // 选择集或筛选变化时立即刷新推荐

  function reroll() {
    const previousMainId = recommendations[0]?.id
    generate(filtered, previousMainId)
    setToast(filtered.length > 1 ? '已更换首选，看看这次合不合胃口' : '当前条件只有这一家，试试放宽筛选')
  }

  function chooseRestaurant(restaurant) {
    setSelected(restaurant)
    setHistory(prev => [{ ...restaurant, chosenAt: Date.now() }, ...prev.filter(h => h.id !== restaurant.id)].slice(0, 20))
    if (restaurant.wishlist) {
      setRestaurants(prev => prev.map(r => r.id === restaurant.id ? { ...r, wishlist: false } : r))
    }
  }

  function navigateTo(r) {
    const query = encodeURIComponent(`${r.name} ${r.address}`)
    window.open(`https://uri.amap.com/search?keyword=${query}`, '_blank', 'noopener,noreferrer')
  }

  function saveRestaurant(data) {
    const distance = Number(data.distance) || 1
    const newRestaurant = {
      id: data.amapId ? `amap-${data.amapId}` : `r-${Date.now()}`, name: data.name, category: data.category, distance,
      rating: Number(data.rating) || 0, price: Number(data.price) || 0, eta: Math.max(5, Math.round(distance * 13)),
      address: data.address || '地址待补充', color: '#7A5C46', emoji: data.emoji || '🍽️', visits: 0,
      reasons: data.wishlist ? ['待前往', '你刚刚添加'] : ['你的私藏', '加入选择集'], isNew: false, wishlist: data.wishlist,
      tags: data.tags || [], source: data.source || 'manual', location: data.location,
    }
    setRestaurants(prev => [newRestaurant, ...prev.filter(r => r.id !== newRestaurant.id)])
    setShowAdd(null)
    setToast(data.wishlist ? '已加入待前往，下次优先推荐' : '已加入我的餐厅库')
  }

  function addExistingToWishlist(id) {
    setRestaurants(prev => prev.map(r => r.id === id ? {
      ...r,
      wishlist: true,
      reasons: ['待前往', ...(r.reasons || []).filter(reason => reason !== '待前往')].slice(0, 3),
    } : r))
    setShowAdd(null)
    setToast('已从餐厅库加入待前往')
  }

  function deleteRestaurant(restaurant) {
    if (!window.confirm(`确定要从餐厅库删除「${restaurant.name}」吗？`)) return
    setRestaurants(prev => prev.filter(r => r.id !== restaurant.id))
    setHistory(prev => prev.filter(r => r.id !== restaurant.id))
    if (selected?.id === restaurant.id) setSelected(null)
    setToast('已从餐厅库删除')
  }

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => v !== defaultFilters[k]).length

  return (
    <div className="app-shell">
      <main className="phone-frame">
        {tab === 'home' && <HomeView recommendations={recommendations} onChoose={chooseRestaurant} onReroll={reroll}
          onFilter={() => setShowFilters(true)} activeFilterCount={activeFilterCount} filters={filters} />}
        {tab === 'library' && <LibraryView restaurants={restaurants} setRestaurants={setRestaurants} onAdd={() => setShowAdd('library')} onDelete={deleteRestaurant} />}
        {tab === 'wishlist' && <WishlistView restaurants={restaurants} setRestaurants={setRestaurants} onAdd={() => setShowAdd('wishlist')} onChoose={chooseRestaurant} />}
        {tab === 'discover' && <DiscoverView restaurants={restaurants} setRestaurants={setRestaurants} filters={filters} onFilter={() => setShowFilters(true)} onChoose={chooseRestaurant} onNotify={setToast} />}

        <BottomNav tab={tab} setTab={setTab} />
        {showFilters && <FilterSheet filters={filters} setFilters={setFilters} onClose={() => setShowFilters(false)} onApply={() => setShowFilters(false)} />}
        {showAdd && <AddSheet mode={showAdd} restaurants={restaurants} onClose={() => setShowAdd(null)} onSave={saveRestaurant} onAddExisting={addExistingToWishlist} />}
        {selected && <DecisionSheet restaurant={selected} onClose={() => setSelected(null)} onNavigate={navigateTo} />}
        {toast && <div className="toast"><Check size={16} />{toast}</div>}
      </main>
      <aside className="desktop-note">
        <div className="brand-mark"><Utensils size={22} /></div>
        <p className="eyebrow">饭 团 · FANTUAN</p>
        <h1>把纠结，<br/>留在第一口之前。</h1>
        <p>基于你的收藏、距离与用餐习惯，<br/>每次认真推荐一家。</p>
        <div className="note-chips"><span>待前往优先</span><span>近期自动降权</span><span>本地运行</span></div>
      </aside>
    </div>
  )
}

function Header({ onFilter, activeFilterCount, title = '今天吃什么' }) {
  return <header className="topbar">
    <div><p className="location"><LocateFixed size={13} /> 上海 · 中山公园 <ChevronDown size={13} /></p><h2>{title}</h2></div>
    {onFilter && <button className="icon-btn" onClick={onFilter} aria-label="筛选"><SlidersHorizontal size={20}/>{activeFilterCount > 0 && <b>{activeFilterCount}</b>}</button>}
  </header>
}

function HomeView({ recommendations, onChoose, onReroll, onFilter, activeFilterCount, filters }) {
  const main = recommendations[0]
  const budgetLabel = budgetRanges.find(range => range.id === filters.budget)?.label || '不限'
  const ratingLabel = ratingRanges.find(range => range.id === filters.rating)?.label || '不限'
  return <div className="view home-view">
    <Header onFilter={onFilter} activeFilterCount={activeFilterCount} />
    <div className="filter-summary"><span>{filters.distance}km 内</span><i/><span>{ratingLabel === '不限' ? '不限评分' : `${ratingLabel}分`}</span><i/><span>{budgetLabel === '不限' ? '不限预算' : budgetLabel}</span><i/><span>{filters.category}</span></div>
    {!main ? <EmptyState icon="🍽️" title="没有符合条件的餐厅" desc="试试放宽距离或预算" action="调整筛选" onClick={onFilter} /> : <>
      <section className="hero-card" style={{ '--card-color': main.color }}>
        <div className="hero-pattern"><span>{main.emoji}</span></div>
        <div className="hero-top"><span className="recommend-badge"><Sparkles size={13}/> 今日首选</span><span className="match-score">匹配度 {main.wishlist ? 98 : 91}%</span></div>
        <div className="hero-copy">
          <p className="category">{main.category}</p>
          <h3>{main.name}</h3>
          <div className="metrics"><span><Star size={15} fill="currentColor"/> {main.rating || '暂无'}</span><span>{main.price ? `¥${main.price}/人` : '人均暂无'}</span><span><MapPin size={15}/>{main.distance}km</span></div>
          <div className="reason-row">{main.reasons.map(x => <span key={x}>{x}</span>)}</div>
        </div>
        <button className="choose-btn" onClick={() => onChoose(main)}>就吃这家 <ChevronRight size={18}/></button>
      </section>

      <div className="reroll-line"><span>不太心动？</span><button onClick={onReroll}><RotateCcw size={16}/> 换一组</button></div>
      <section className="alternatives">
        <div className="section-heading"><div><p>PLAN B</p><h3>再给你两个备选</h3></div><span>轻轻松松做决定</span></div>
        {recommendations.slice(1).map((r, index) => <RestaurantRow key={r.id} restaurant={r} index={index + 2} onClick={() => onChoose(r)} />)}
      </section>
    </>}
  </div>
}

function RestaurantRow({ restaurant: r, index, onClick, action }) {
  function handleKeyDown(event) {
    if (onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      onClick()
    }
  }
  return <div className={`restaurant-row ${onClick ? 'clickable' : ''}`} onClick={onClick} onKeyDown={handleKeyDown} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
    <div className="row-thumb" style={{ background: r.color }}><span>{r.emoji}</span>{index && <b>0{index}</b>}</div>
    <div className="row-info"><div className="row-title"><h4>{r.name}</h4>{r.wishlist && <span className="wish-pill">想去</span>}</div>
      <p>{r.category} · {r.price ? `¥${r.price}/人` : '人均暂无'}</p><div className="row-meta"><span><Star size={12} fill="currentColor"/> {r.rating || '暂无'}</span><span><MapPin size={12}/>{r.distance}km</span><span>{r.eta}分钟</span></div>
    </div>{action || (onClick && <ChevronRight size={18} className="row-arrow"/>)}
  </div>
}

function LibraryView({ restaurants, setRestaurants, onAdd, onDelete }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('全部')
  const list = restaurants.filter(r => (category === '全部' || r.category === category) && r.name.includes(query))
  function toggleWish(id) { setRestaurants(prev => prev.map(r => r.id === id ? { ...r, wishlist: !r.wishlist } : r)) }
  return <div className="view list-view">
    <Header title="我的餐厅库" />
    <div className="library-intro"><div><strong>{restaurants.length}</strong><span>家私藏餐厅</span></div><button onClick={onAdd}><Plus size={17}/> 添加餐厅</button></div>
    <label className="search-box"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索收藏的餐厅"/></label>
    <div className="category-scroll">{categories.slice(0, 7).map(c => <button className={category === c ? 'active' : ''} onClick={() => setCategory(c)} key={c}>{c}</button>)}</div>
    <div className="restaurant-list">{list.map(r => <RestaurantRow key={r.id} restaurant={r} action={<div className="row-actions"><button className={`heart-action ${r.wishlist ? 'active' : ''}`} aria-label={r.wishlist ? '移出待前往' : '加入待前往'} onClick={e => { e.stopPropagation(); toggleWish(r.id) }}><Heart size={18} fill={r.wishlist ? 'currentColor' : 'none'}/></button><button className="delete-action" aria-label={`删除${r.name}`} onClick={e => { e.stopPropagation(); onDelete(r) }}><Trash2 size={17}/></button></div>} />)}</div>
  </div>
}

function WishlistView({ restaurants, setRestaurants, onAdd, onChoose }) {
  const list = restaurants.filter(r => r.wishlist)
  function remove(id) { setRestaurants(prev => prev.map(r => r.id === id ? { ...r, wishlist: false } : r)) }
  return <div className="view list-view">
    <Header title="待前往清单" />
    <div className="wish-hero"><span><BookmarkPlus size={24}/></span><div><h3>想到就先记下来</h3><p>下次推荐时，我们会优先安排</p></div><button onClick={onAdd}><Plus size={18}/></button></div>
    <div className="section-heading compact"><div><p>WANT TO GO</p><h3>{list.length} 家餐厅等你打卡</h3></div></div>
    {list.length ? <div className="restaurant-list">{list.map(r => <RestaurantRow key={r.id} restaurant={r} onClick={() => onChoose(r)} action={<button className="trash-action" onClick={e => { e.stopPropagation(); remove(r.id) }}><Trash2 size={17}/></button>} />)}</div> : <EmptyState icon="📌" title="清单还是空的" desc="把突然想起的餐厅先放进来" action="添加一家" onClick={onAdd} />}
  </div>
}

const discoveryColors = ['#405E7B', '#5C7452', '#558C82', '#A97142', '#8B5E68', '#4F6D7A']
const discoveryEmojis = { '日料': '🍣', '川菜': '🌶️', '本帮菜': '🥘', '云南菜': '🍄', '海南菜': '🥥', '面馆': '🍜', '小吃': '🥟', '西餐': '🍝' }

function DiscoverView({ restaurants, setRestaurants, filters, onFilter, onChoose, onNotify }) {
  const [amapStores, setAmapStores] = useState([])
  const [sourceState, setSourceState] = useState(hasAmapKey() ? 'loading' : 'demo')
  const [sourceError, setSourceError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!hasAmapKey()) { setSourceState('demo'); return }
    let cancelled = false
    setSourceState('loading'); setSourceError('')
    discoverAmapRestaurants(filters.distance)
      .then(({ pois }) => {
        if (cancelled) return
        setAmapStores(pois.map((poi, index) => ({
          ...poi,
          id: `amap-${poi.amapId}`,
          eta: Math.max(5, Math.round(poi.distance * 13)),
          color: discoveryColors[index % discoveryColors.length],
          emoji: discoveryEmojis[poi.category] || '🍽️',
          reasons: [poi.tags?.[0] || '高德附近餐厅', poi.rating ? `评分 ${poi.rating}` : `距离 ${poi.distance}km`],
          isNew: true,
          wishlist: false,
          visits: 0,
        })))
        setSourceState('ready')
      })
      .catch(error => {
        if (cancelled) return
        setSourceError(error.message)
        setSourceState('error')
      })
    return () => { cancelled = true }
  }, [filters.distance, reloadKey])

  const newStores = useMemo(() => {
    const rating = ratingRanges.find(range => range.id === filters.rating) || ratingRanges[0]
    const budget = budgetRanges.find(range => range.id === filters.budget) || budgetRanges[0]
    const candidates = sourceState === 'ready' ? amapStores : restaurants.filter(r => r.isNew)
    return candidates.filter(r => {
      const alreadySaved = sourceState === 'ready' && restaurants.some(saved =>
        saved.id === r.id || (r.amapId && saved.id === `amap-${r.amapId}`) || saved.name === r.name
      )
      if (alreadySaved || r.distance > filters.distance) return false
      if (filters.category !== '全部' && r.category !== filters.category) return false
      if (filters.rating !== 'all' && (!r.rating || r.rating < rating.min || r.rating >= rating.max)) return false
      if (filters.budget !== 'all' && (!r.price || r.price < budget.min || r.price >= budget.max)) return false
      return true
    }).slice(0, 12)
  }, [amapStores, filters, restaurants, sourceState])

  function addToLibrary(restaurant) {
    setRestaurants(prev => {
      const existing = prev.find(r => r.id === restaurant.id || r.name === restaurant.name)
      if (existing) return prev.map(r => r.id === existing.id ? { ...r, isNew: false } : r)
      return [{ ...restaurant, isNew: false }, ...prev]
    })
    onNotify('已加入我的餐厅库')
  }

  const sourceCopy = sourceState === 'ready'
    ? ['高德附近餐厅', '已按当前距离、评分、预算和菜系筛选']
    : sourceState === 'loading'
      ? ['正在查找附近餐厅', '定位成功后将显示高德地图结果']
      : sourceState === 'error'
        ? ['高德服务暂时不可用', `${sourceError}，当前显示本地备用结果`]
        : ['当前为示例推荐', '配置高德 Web 服务 Key 后将自动推荐真实附近餐厅']

  return <div className="view discover-view">
    <Header title="发现新口味" onFilter={onFilter} activeFilterCount={0}/>
    <div className="discover-banner"><div><p><Sparkles size={13}/> 根据你的就餐习惯</p><h3>换个口味，<br/>也许会有惊喜。</h3><span>偏爱：本帮菜 · 日料 · 微辣</span></div><div className="dish-orbit"><b>🥢</b><i>🍄</i><em>🌿</em></div></div>
    <div className={`discover-source ${sourceState}`}><span><Navigation size={17}/></span><div><strong>{sourceCopy[0]}</strong><small>{sourceCopy[1]}</small></div>{sourceState === 'error' && <button onClick={() => setReloadKey(value => value + 1)}>重试</button>}</div>
    <div className="section-heading"><div><p>FRESH PICKS</p><h3>猜你会喜欢的新店</h3></div><span>{newStores.length} 家待探索</span></div>
    {sourceState === 'loading' ? <div className="discover-loading"><span/><span/><span/>正在筛选附近餐厅</div> : newStores.length ? <div className="new-store-stack">{newStores.map(r => <article className="new-store-card" key={r.id}>
      <button className="new-store-main" onClick={() => onChoose(r)}><div className="new-visual" style={{ background: r.color }}><span>{r.emoji}</span><b>NEW</b></div>
      <div className="new-info"><p>{r.category} · {r.distance}km</p><h3>{r.name}</h3><div><span><Star size={13} fill="currentColor"/> {r.rating}</span><span>¥{r.price}/人</span></div><small>{r.reasons.join(' · ')}</small></div></button>
      <button className="save-new" onClick={() => addToLibrary(r)}><CirclePlus size={17}/> 加入餐厅库</button>
    </article>)}</div> : <EmptyState icon="🧭" title="没有符合条件的新餐厅" desc="试试放宽距离、评分或预算" action="调整筛选" onClick={onFilter} />}
  </div>
}

function BottomNav({ tab, setTab }) {
  const items = [{ id: 'home', label: '推荐', Icon: Home }, { id: 'discover', label: '发现', Icon: Compass }, { id: 'library', label: '餐厅库', Icon: Store }, { id: 'wishlist', label: '待前往', Icon: Heart }]
  return <nav className="bottom-nav">{items.map(({ id, label, Icon }) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}><span><Icon size={21}/>{id === 'wishlist' && <i/>}</span><small>{label}</small></button>)}</nav>
}

function FilterSheet({ filters, setFilters, onClose, onApply }) {
  const ratingLabel = ratingRanges.find(range => range.id === filters.rating)?.label || '不限'
  const budgetLabel = budgetRanges.find(range => range.id === filters.budget)?.label || '不限'
  return <div className="overlay" onMouseDown={onClose}><section className="sheet filter-sheet" onMouseDown={e => e.stopPropagation()}>
    <div className="sheet-handle"/><div className="sheet-title"><div><p>缩小范围，更快决定</p><h3>筛选餐厅</h3></div><button onClick={onClose}><X size={20}/></button></div>
    <FilterGroup title="距离" value={`${filters.distance}km 内`} options={[1, 3, 5, 10]} current={filters.distance} onChange={v => setFilters(f => ({ ...f, distance: v }))} format={v => `${v}km`} />
    <FilterGroup title="评分区间" value={ratingLabel} options={ratingRanges} current={filters.rating} onChange={v => setFilters(f => ({ ...f, rating: v }))} />
    <FilterGroup title="人均消费区间" value={budgetLabel} options={budgetRanges} current={filters.budget} onChange={v => setFilters(f => ({ ...f, budget: v }))} />
    <div className="filter-group"><div className="filter-label"><h4>口味</h4><span>{filters.category}</span></div><div className="category-grid">{categories.slice(0, 8).map(c => <button key={c} className={filters.category === c ? 'active' : ''} onClick={() => setFilters(f => ({ ...f, category: c }))}>{c}</button>)}</div></div>
    <div className="sheet-actions"><button className="reset" onClick={() => setFilters(defaultFilters)}>重置</button><button className="primary" onClick={onApply}>看看吃什么</button></div>
  </section></div>
}

function FilterGroup({ title, value, options, current, onChange, format }) {
  return <div className="filter-group"><div className="filter-label"><h4>{title}</h4><span>{value}</span></div><div className="segment">{options.map(option => {
    const optionValue = typeof option === 'object' ? option.id : option
    const label = typeof option === 'object' ? option.label : format(option)
    return <button key={optionValue} className={current === optionValue ? 'active' : ''} onClick={() => onChange(optionValue)}>{label}</button>
  })}</div></div>
}

function AddSheet({ mode, restaurants, onClose, onSave, onAddExisting }) {
  const configured = hasAmapKey()
  const isWishlistMode = mode === 'wishlist'
  const demoResults = seedRestaurants.slice(0, 5).map(r => ({ ...r, tags: r.reasons, source: 'demo' }))
  const [step, setStep] = useState('search')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(configured ? [] : demoResults)
  const [searchState, setSearchState] = useState('idle')
  const [searchError, setSearchError] = useState('')
  const [form, setForm] = useState({ name: '', category: '本帮菜', distance: '1.0', rating: '4.5', price: '60', address: '', emoji: '🍽️', wishlist: true, tags: [], source: 'manual' })
  const normalizedQuery = query.trim().toLowerCase()
  const libraryResults = isWishlistMode ? restaurants.filter(r => {
    if (r.wishlist) return false
    if (!normalizedQuery) return true
    return `${r.name}${r.category}${r.address}`.toLowerCase().includes(normalizedQuery)
  }) : []
  const update = (key, value) => setForm(f => ({ ...f, [key]: value }))

  function findExistingRestaurant(poi) {
    const poiName = poi.name?.trim().toLowerCase()
    const poiAddress = poi.address?.trim().toLowerCase()
    return restaurants.find(r => {
      if (poi.amapId && (r.amapId === poi.amapId || r.id === `amap-${poi.amapId}`)) return true
      if (!poiName || r.name.trim().toLowerCase() !== poiName) return false
      return !poiAddress || !r.address || r.address.trim().toLowerCase() === poiAddress
    })
  }
  const mapResults = isWishlistMode
    ? results.filter(poi => !findExistingRestaurant(poi)?.wishlist)
    : results
  async function handleSearch(event) {
    event.preventDefault()
    if (!query.trim()) return
    setSearchState('loading'); setSearchError('')
    if (!configured) {
      const matches = demoResults.filter(r => `${r.name}${r.category}${r.address}`.includes(query.trim()))
      setTimeout(() => { setResults(matches.length ? matches : demoResults.slice(0, 3)); setSearchState('done') }, 300)
      return
    }
    try {
      const response = await searchAmapRestaurants(query.trim())
      setResults(response.pois); setSearchState('done')
    } catch (error) {
      setSearchError(error.message); setSearchState('error')
    }
  }
  function choosePoi(poi) {
    const existing = findExistingRestaurant(poi)
    if (isWishlistMode && existing) {
      if (!existing.wishlist) onAddExisting(existing.id)
      return
    }
    setForm({
      name: poi.name, category: poi.category || '餐饮', distance: poi.distance || 1,
      rating: poi.rating, price: poi.price, address: poi.address || '', emoji: poi.emoji || '🍽️',
      wishlist: true, tags: poi.tags || [], source: poi.source || 'amap', amapId: poi.amapId, location: poi.location,
    })
    setStep('detail')
  }
  function manualEntry() {
    setForm({ name: query, category: '本帮菜', distance: '1.0', rating: '4.5', price: '60', address: '', emoji: '🍽️', wishlist: true, tags: [], source: 'manual' })
    setStep('detail')
  }
  return <div className="overlay" onMouseDown={onClose}><section className="sheet add-sheet" onMouseDown={e => e.stopPropagation()}>
    <div className="sheet-handle"/><div className="sheet-title"><div className="sheet-title-copy">{step === 'detail' && <button className="back-circle" onClick={() => setStep('search')}><ArrowLeft size={18}/></button>}<div><p>{step === 'search' ? (isWishlistMode ? '从餐厅库选择，或搜索新餐厅' : '由高德地图提供地点信息') : '确认收藏信息'}</p><h3>{step === 'search' ? (isWishlistMode ? '添加待前往餐厅' : '搜索餐厅') : form.name}</h3></div></div><button onClick={onClose}><X size={20}/></button></div>
    {step === 'search' ? <>
      <form className="place-search" onSubmit={handleSearch}><Search size={19}/><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="输入餐厅名，例如：烧鸟"/><button disabled={!query.trim() || searchState === 'loading'}>{searchState === 'loading' ? '搜索中' : '搜索'}</button></form>
      {isWishlistMode && <section className="library-picker">
        <div className="search-result-head"><strong><Store size={13}/>我的餐厅库</strong><span>{libraryResults.length ? '点击即加入' : (normalizedQuery ? '没有匹配的收藏' : '餐厅都在清单里了')}</span></div>
        <div className="poi-results">{libraryResults.map(r => <button className="poi-result library-result" key={r.id} onClick={() => onAddExisting(r.id)}>
          <div className="poi-pin" style={{ background: r.color }}><span>{r.emoji}</span></div><div><h4>{r.name}<b className="saved-badge">已收藏</b></h4><p>{r.category} · {r.distance}km · {r.address}</p><span>{r.rating ? <b><Star size={11} fill="currentColor"/> {r.rating}</b> : '暂无评分'}<i/>{r.price ? `¥${r.price}/人` : '暂无人均'}</span></div><Heart size={17}/>
        </button>)}</div>
      </section>}
      <div className={`map-source ${configured ? 'connected' : ''}`}><div className="amap-logo">高德</div><div><strong>{configured ? '高德地图已连接' : '高德地图体验模式'}</strong><small>{configured ? '搜索餐厅库以外的新餐厅' : '配置 Web 服务 Key 后即可搜索真实商户'}</small></div><span>{configured ? '已连接' : 'DEMO'}</span></div>
      {searchError && <div className="search-error">{searchError}，你也可以手动填写。</div>}
      <div className="search-result-head"><strong>{query ? '高德搜索结果' : '附近餐厅示例'}</strong><button onClick={manualEntry}>找不到？手动添加</button></div>
      <div className="poi-results">{mapResults.map(poi => <button className="poi-result" key={poi.amapId || poi.id} onClick={() => choosePoi(poi)}>
        <div className="poi-pin"><MapPin size={18}/></div><div><h4>{poi.name}{findExistingRestaurant(poi) && <b className="saved-badge">已收藏</b>}</h4><p>{poi.category} · {poi.distance}km · {poi.address}</p><span>{poi.rating ? <b><Star size={11} fill="currentColor"/> {poi.rating}</b> : '暂无评分'}<i/>{poi.price ? `¥${poi.price}/人` : '暂无人均'} </span></div><ChevronRight size={17}/>
      </button>)}</div>
      {searchState === 'done' && !mapResults.length && <div className="no-poi">没有找到新的餐厅，试试简称或手动添加</div>}
    </> : <>
      {form.source !== 'manual' && <div className="imported-note"><Check size={15}/><span>已带入{form.source === 'amap' ? '高德地图' : '示例'}标签信息</span>{form.tags?.slice(0, 2).map(tag => <b key={tag}>{tag}</b>)}</div>}
      <label className="form-field featured"><span>餐厅名称</span><input value={form.name} onChange={e => update('name', e.target.value)} placeholder="餐厅名称"/></label>
      <div className="form-row"><label className="form-field"><span>菜系</span><select value={form.category} onChange={e => update('category', e.target.value)}><option>{form.category}</option>{categories.slice(1).filter(c => c !== form.category).map(c => <option key={c}>{c}</option>)}</select></label><label className="form-field"><span>代表图标</span><input value={form.emoji} onChange={e => update('emoji', e.target.value)} /></label></div>
      <div className="form-row three"><label className="form-field"><span>距离 km</span><input type="number" step="0.1" value={form.distance} onChange={e => update('distance', e.target.value)}/></label><label className="form-field"><span>评分</span><input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={e => update('rating', e.target.value)} placeholder="待补充"/></label><label className="form-field"><span>人均 ¥</span><input type="number" min="0" value={form.price} onChange={e => update('price', e.target.value)} placeholder="待补充"/></label></div>
      <label className="form-field"><span>地址</span><input value={form.address} onChange={e => update('address', e.target.value)} placeholder="地址待补充"/></label>
      <button className={`want-toggle ${form.wishlist ? 'active' : ''}`} onClick={() => update('wishlist', !form.wishlist)}><span><Heart size={20} fill={form.wishlist ? 'currentColor' : 'none'}/></span><div><strong>加入「待前往」</strong><small>开启后，会在下次推荐时优先出现</small></div><i>{form.wishlist && <Check size={14}/>}</i></button>
      {(form.rating === '' || form.price === '') && <div className="field-hint">高德未提供完整消费标签，请补充评分和人均后保存。</div>}
      <button className="save-btn" disabled={!form.name.trim() || form.rating === '' || form.price === ''} onClick={() => onSave(form)}>保存到餐厅库</button>
    </>}
  </section></div>
}

function DecisionSheet({ restaurant: r, onClose, onNavigate }) {
  return <div className="overlay decision-overlay"><section className="sheet decision-sheet">
    <button className="decision-close" onClick={onClose}><X size={20}/></button>
    <div className="celebrate"><span>✦</span><div style={{ background: r.color }}>{r.emoji}</div><span>✦</span></div>
    <p className="decision-kicker">好，就这么定了</p><h2>{r.name}</h2><p className="decision-address"><MapPin size={15}/>{r.address}</p>
    <div className="decision-facts"><span><b>{r.eta}</b>分钟<br/><small>预计路程</small></span><i/><span><b>{r.rating}</b>分<br/><small>用户评分</small></span><i/><span><b>¥{r.price}</b><br/><small>人均消费</small></span></div>
    {r.wishlist && <div className="checked-wish"><Check size={15}/> 已从待前往清单中完成</div>}
    <button className="navigate-btn" onClick={() => onNavigate(r)}><Navigation size={19} fill="currentColor"/> 导航去这里</button>
    <button className="back-btn" onClick={onClose}>再想想</button>
  </section></div>
}

function EmptyState({ icon, title, desc, action, onClick }) {
  return <div className="empty-state"><span>{icon}</span><h3>{title}</h3><p>{desc}</p><button onClick={onClick}>{action}</button></div>
}

export default App
