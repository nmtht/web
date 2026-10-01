/**
 * Graph island — client-only React component.
 * For now: debug panel that proves Sanity content is reachable.
 * Next: D3-force map (no foreignObject).
 */
import { useEffect } from 'react';

type LocaleString = { en?: string; ru?: string } | string | null;

type MapContent = {
  projects?: Array<{
    _id: string;
    title?: string;
    slug?: string;
    meta?: LocaleString;
    kind?: LocaleString;
  }>;
  research?: Array<{ _id: string; title?: string }>;
  questions?: Array<{
    _id: string;
    title?: LocaleString;
    leads?: Array<{ _type?: string; _id?: string; title?: string }>;
  }>;
  tags?: Array<{ _id: string; key?: string }>;
  practiceInfo?: {
    authorName?: string;
    inviteLine?: LocaleString;
    contactEmail?: string;
  } | null;
  uiStrings?: Record<string, unknown> | null;
} | null;

function L(obj: LocaleString): string {
  if (!obj) return '—';
  if (typeof obj === 'string') return obj;
  return obj.en || obj.ru || '—';
}

export default function GraphIsland({
  content,
  fetchError,
}: {
  content?: MapContent;
  fetchError?: string | null;
}) {
  useEffect(() => {
    console.info('[GraphIsland] content from Sanity:', content);
    if (fetchError) console.error('[GraphIsland] fetch error:', fetchError);
  }, [content, fetchError]);

  const projects = content?.projects ?? [];
  const questions = content?.questions ?? [];
  const research = content?.research ?? [];
  const practice = content?.practiceInfo;

  return (
    <div
      id="graph-root"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        overflow: 'auto',
        padding: '80px 24px 48px',
        background: '#fff',
      }}
    >
      <div style={{ maxWidth: 640, margin: '0 auto', fontSize: 14, lineHeight: 1.5 }}>
        <h1 style={{ fontSize: 20, fontWeight: 500, marginBottom: 8 }}>
          Sanity → site (проверка связи)
        </h1>
        <p style={{ color: '#666', marginBottom: 24, fontSize: 13 }}>
          Временная панель. Граф появится после порта прототипа.
        </p>

        {fetchError && (
          <div
            style={{
              border: '1px solid #c00',
              background: '#fff5f5',
              padding: 16,
              marginBottom: 24,
            }}
          >
            <strong>Ошибка запроса к Sanity</strong>
            <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap', fontSize: 12 }}>{fetchError}</pre>
            <p style={{ marginTop: 8, fontSize: 12 }}>
              Проверь корневой <code>.env</code>: PUBLIC_SANITY_PROJECT_ID и DATASET.
            </p>
          </div>
        )}

        {!fetchError && !content && (
          <p style={{ color: '#666' }}>Данных нет (content = null). Проверь Project ID в .env.</p>
        )}

        {content && (
          <>
            <section style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
                Projects ({projects.length})
              </h2>
              {projects.length === 0 ? (
                <p style={{ color: '#999' }}>Пусто — создай project в Studio.</p>
              ) : (
                <ul style={{ listStyle: 'none' }}>
                  {projects.map((p) => (
                    <li
                      key={p._id}
                      style={{
                        borderTop: '1px solid #e4e2dd',
                        padding: '10px 0',
                      }}
                    >
                      <strong>{p.title || '(без title)'}</strong>
                      {p.slug && (
                        <span style={{ color: '#999', marginLeft: 8 }}>/ {p.slug}</span>
                      )}
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                        {L(p.meta)} · {L(p.kind)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
                Questions ({questions.length})
              </h2>
              {questions.length === 0 ? (
                <p style={{ color: '#999' }}>Пусто — создай question и укажи leads.</p>
              ) : (
                <ul style={{ listStyle: 'none' }}>
                  {questions.map((q) => (
                    <li
                      key={q._id}
                      style={{
                        borderTop: '1px solid #e4e2dd',
                        padding: '10px 0',
                      }}
                    >
                      <div>{L(q.title)}</div>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                        leads:{' '}
                        {q.leads?.length
                          ? q.leads.map((l) => l.title || l._id).join(', ')
                          : '(нет — проект не появится в графе)'}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
                Research ({research.length})
              </h2>
              {research.length === 0 ? (
                <p style={{ color: '#999' }}>Пока нет.</p>
              ) : (
                <ul style={{ listStyle: 'none' }}>
                  {research.map((r) => (
                    <li key={r._id} style={{ borderTop: '1px solid #e4e2dd', padding: '10px 0' }}>
                      {r.title}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
                NEXT / Practice Info
              </h2>
              {!practice ? (
                <p style={{ color: '#999' }}>Документ practiceInfo не найден.</p>
              ) : (
                <div style={{ borderTop: '1px solid #e4e2dd', paddingTop: 10 }}>
                  <div><strong>{practice.authorName || '—'}</strong></div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                    {L(practice.inviteLine)}
                  </div>
                  {practice.contactEmail && (
                    <div style={{ fontSize: 12, marginTop: 4 }}>{practice.contactEmail}</div>
                  )}
                </div>
              )}
            </section>

            <p style={{ fontSize: 12, color: '#999', marginTop: 32 }}>
              Если списки заполнены — связь Sanity → сайт работает. Дальше порт графа.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
