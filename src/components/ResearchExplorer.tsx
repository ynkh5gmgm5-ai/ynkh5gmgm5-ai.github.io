import { useEffect, useMemo, useState } from 'react';

interface ResearchEntry {
  href: string;
  title: string;
  summary: string;
  topic: 'market-competition' | 'product-user' | 'channel-growth';
  topicLabel: string;
  researchDate: string;
  preview: boolean;
}

interface Props {
  entries: ResearchEntry[];
}

const filters = [
  { value: 'all', label: '全部' },
  { value: 'market-competition', label: '市场与竞争' },
  { value: 'product-user', label: '产品与用户' },
  { value: 'channel-growth', label: '渠道与增长' },
] as const;

export default function ResearchExplorer({ entries }: Props) {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<(typeof filters)[number]['value']>('all');
  const [hydrated, setHydrated] = useState(false);
  const normalizedQuery = query.trim().toLocaleLowerCase('zh-CN');

  useEffect(() => setHydrated(true), []);

  const visibleEntries = useMemo(
    () => entries.filter((entry) => {
      const matchesTopic = topic === 'all' || entry.topic === topic;
      const haystack = `${entry.title} ${entry.summary} ${entry.topicLabel}`.toLocaleLowerCase('zh-CN');
      return matchesTopic && (!normalizedQuery || haystack.includes(normalizedQuery));
    }),
    [entries, normalizedQuery, topic],
  );

  return (
    <section className="research-explorer" aria-label="研究检索" data-hydrated={hydrated}>
      <div className="research-tools">
        <label className="search-field">
          <span>检索研究</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="输入产品、渠道或用户关键词"
          />
        </label>
        <div className="filter-row" role="group" aria-label="按主题筛选">
          {filters.map((filter) => (
            <button
              type="button"
              className={topic === filter.value ? 'is-active' : undefined}
              aria-pressed={topic === filter.value}
              onClick={() => setTopic(filter.value)}
              key={filter.value}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <p className="result-count" aria-live="polite">显示 {visibleEntries.length} 篇研究</p>
      {visibleEntries.length > 0 ? (
        <ol className="research-results">
          {visibleEntries.map((entry) => (
            <li key={entry.href}>
              <a href={entry.href} className="research-result-card">
                <span className="research-result-meta">
                  {entry.topicLabel} · {entry.researchDate}
                  {entry.preview ? ' · 本地预览' : ''}
                </span>
                <strong>{entry.title}</strong>
                <span>{entry.summary}</span>
                <span className="research-result-action">阅读完整研究</span>
              </a>
            </li>
          ))}
        </ol>
      ) : (
        <p className="empty-panel" role="status">没有符合当前条件的研究。</p>
      )}
    </section>
  );
}
