(function () {
  const supabaseUrl = 'https://bwtfxwuvcutrltabmzxl.supabase.co'
  const publishableKey = 'sb_publishable_P1EvGKOVbz39u3bQgmbFtg_xCnw916Q'
  const cacheKey = 'openscience.siteStats.v1'
  const cacheTtlMs = 24 * 60 * 60 * 1000
  const columns = [
    'papers_summarized_count',
    'weekly_issues_published_count',
  ]

  function toCount(value) {
    const numberValue = Number(value)
    if (!Number.isFinite(numberValue) || numberValue < 0) return null
    return Math.floor(numberValue)
  }

  function normalizeStats(row) {
    if (!row || typeof row !== 'object') return null

    const stats = {}
    for (const column of columns) {
      const value = toCount(row[column])
      if (value === null) return null
      stats[column] = value
    }
    return stats
  }

  function renderStats(stats) {
    for (const column of columns) {
      const target = document.querySelector(`[data-site-stat="${column}"]`)
      if (target) target.textContent = stats[column].toLocaleString('en-US')
    }
  }

  function readCachedStats() {
    try {
      const cached = JSON.parse(window.localStorage.getItem(cacheKey) || 'null')
      if (!cached || Date.now() - Number(cached.cachedAt || 0) > cacheTtlMs) return null
      return normalizeStats(cached.stats)
    } catch (_error) {
      return null
    }
  }

  function writeCachedStats(stats) {
    try {
      window.localStorage.setItem(cacheKey, JSON.stringify({ cachedAt: Date.now(), stats }))
    } catch (_error) {
      // Static fallback values remain visible if browser storage is unavailable.
    }
  }

  async function fetchStats() {
    const endpoint = `${supabaseUrl}/rest/v1/site_stats?select=${columns.join(',')}`
    const response = await window.fetch(endpoint, {
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
        Accept: 'application/json',
      },
    })
    if (!response.ok) return null

    const rows = await response.json()
    return normalizeStats(Array.isArray(rows) ? rows[0] : null)
  }

  const cachedStats = readCachedStats()
  if (cachedStats) {
    renderStats(cachedStats)
    return
  }

  fetchStats()
    .then((stats) => {
      if (!stats) return
      renderStats(stats)
      writeCachedStats(stats)
    })
    .catch(() => {
      // Static fallback values remain visible if the public stats API is unavailable.
    })
})()
