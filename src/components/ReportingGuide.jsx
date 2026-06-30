import { useEffect, useMemo, useState } from 'react';
import { exportCompatibilityNotes, glossaryTerms } from '../data/glossary.js';
import {
  buildGeneratedReportingExamples,
  getCommunityReportingPatterns,
  getReportingPaths,
  getReportingQuestions,
} from '../data/reporting.js';

const guidanceItems = [
  { key: 'questions', label: 'Common questions' },
  { key: 'paths', label: 'Common paths' },
  { key: 'generated', label: 'Generated examples' },
];

const referenceItems = [
  { key: 'glossary', label: 'Glossary' },
  { key: 'compatibility', label: 'Export compatibility' },
  { key: 'cautions', label: 'Caution notes' },
];

function getScriptKey(pattern) {
  return `script:${pattern.scriptPath}`;
}

function NavButton({ item, selectedView, onSelect, meta, stackedMeta = false }) {
  return (
    <button
      type="button"
      className={[selectedView === item.key ? 'selected' : '', stackedMeta ? 'stacked-meta' : '']
        .filter(Boolean)
        .join(' ')}
      onClick={() => onSelect(item.key)}
      title={item.label}
    >
      <span>{item.label}</span>
      {meta ? <em>{meta}</em> : null}
    </button>
  );
}

function TableLinks({ tables, knownTables, onSelectTable }) {
  return (
    <div className="example-table-links">
      {tables.map((tableKey) =>
        knownTables.has(tableKey) ? (
          <button key={tableKey} type="button" onClick={() => onSelectTable(tableKey)}>
            {tableKey}
          </button>
        ) : (
          <span key={tableKey}>{tableKey}</span>
        ),
      )}
    </div>
  );
}

function ReportingSectionHeader({ title, count }) {
  return (
    <div className="section-title-row">
      <h3>{title}</h3>
      {typeof count === 'number' ? <span>{count}</span> : null}
    </div>
  );
}

function ScriptStatusTags({ tags }) {
  return (
    <div className="community-pattern-tags">
      {tags.map((tag) => (
        <span key={tag}>{tag}</span>
      ))}
    </div>
  );
}

export function ReportingGuide({ version, onSelectTable }) {
  const [selectedView, setSelectedView] = useState('overview');
  const [scriptTab, setScriptTab] = useState('sql');
  const [scriptContent, setScriptContent] = useState({ key: '', status: 'idle', text: '' });
  const knownTables = useMemo(() => new Set(version.tables.map((table) => table.id)), [version.tables]);
  const reportingPaths = useMemo(() => getReportingPaths(version.source.productKey), [version.source.productKey]);
  const reportingQuestions = useMemo(
    () => getReportingQuestions(version.source.productKey),
    [version.source.productKey],
  );
  const communityPatterns = useMemo(
    () => getCommunityReportingPatterns(version.source.productKey),
    [version.source.productKey],
  );
  const generatedExamples = useMemo(() => buildGeneratedReportingExamples(version), [version]);
  const selectedScript = communityPatterns.find((pattern) => getScriptKey(pattern) === selectedView);

  useEffect(() => {
    setSelectedView('overview');
    setScriptTab('sql');
    setScriptContent({ key: '', status: 'idle', text: '' });
  }, [version.source.productKey, version.version]);

  useEffect(() => {
    if (!selectedScript) {
      setScriptContent({ key: '', status: 'idle', text: '' });
      return undefined;
    }

    const contentUrl = scriptTab === 'sql' ? selectedScript.scriptAssetUrl : selectedScript.evidenceAssetUrl;
    const contentKey = `${selectedScript.scriptPath}:${scriptTab}`;
    let canceled = false;
    setScriptContent({ key: contentKey, status: 'loading', text: '' });

    fetch(contentUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Unable to load ${contentUrl}`);
        }
        return response.text();
      })
      .then((text) => {
        if (!canceled) {
          setScriptContent({ key: contentKey, status: 'ready', text });
        }
      })
      .catch((error) => {
        if (!canceled) {
          setScriptContent({ key: contentKey, status: 'error', text: error.message });
        }
      });

    return () => {
      canceled = true;
    };
  }, [scriptTab, selectedScript]);

  function selectReportingView(key) {
    setSelectedView(key);
    if (key.startsWith('script:')) {
      setScriptTab('sql');
    } else {
      setScriptTab('sql');
      setScriptContent({ key: '', status: 'idle', text: '' });
    }
  }

  function renderOverview() {
    return (
      <section className="reporting-section reporting-section-full">
        <ReportingSectionHeader title="Reporting overview" />
        <div className="reporting-overview-grid">
          <article>
            <strong>{reportingQuestions.length}</strong>
            <span>Common questions</span>
            <p>Starting points for read-only reporting and troubleshooting.</p>
          </article>
          <article>
            <strong>{reportingPaths.length}</strong>
            <span>Common paths</span>
            <p>Product-specific table paths for building reporting queries.</p>
          </article>
          <article>
            <strong>{generatedExamples.length}</strong>
            <span>Generated examples</span>
            <p>Schema-driven starter SQL generated from the selected snapshot.</p>
          </article>
          <article>
            <strong>{communityPatterns.length}</strong>
            <span>Reporting scripts</span>
            <p>Read-only SQL examples sourced from community review and schema matching.</p>
          </article>
        </div>
        {communityPatterns.length > 0 ? (
          <div className="reporting-script-summary-list">
            {communityPatterns.map((pattern) => (
              <article key={pattern.scriptPath}>
                <div>
                  <h4>{pattern.title}</h4>
                  <p>{pattern.summary}</p>
                  <ScriptStatusTags tags={pattern.tags} />
                </div>
                <button type="button" onClick={() => selectReportingView(getScriptKey(pattern))}>
                  Open
                </button>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-note">No community reporting scripts are available for this product yet.</p>
        )}
      </section>
    );
  }

  function renderQuestions() {
    return (
      <section className="reporting-section reporting-section-full">
        <ReportingSectionHeader title="Common reporting questions" count={reportingQuestions.length} />
        <div className="reporting-question-list">
          {reportingQuestions.map((item) => (
            <article className="reporting-question" key={item.question}>
              <h4>{item.question}</h4>
              <p>{item.guidance}</p>
              <TableLinks tables={item.tables} knownTables={knownTables} onSelectTable={onSelectTable} />
            </article>
          ))}
        </div>
      </section>
    );
  }

  function renderPaths() {
    return (
      <section className="reporting-section reporting-section-full">
        <ReportingSectionHeader title="Common paths" count={reportingPaths.length} />
        <div className="reporting-path-list">
          {reportingPaths.map((path) => (
            <article className="reporting-path" key={path.title}>
              <h4>{path.title}</h4>
              <p>{path.summary}</p>
              <TableLinks tables={path.tables} knownTables={knownTables} onSelectTable={onSelectTable} />
            </article>
          ))}
        </div>
      </section>
    );
  }

  function renderGeneratedExamples() {
    return (
      <section className="reporting-section reporting-section-full">
        <ReportingSectionHeader title="Generated examples" count={generatedExamples.length} />
        {generatedExamples.length > 0 ? (
          <div className="query-example-list">
            {generatedExamples.map((example) => (
              <article className="query-example" key={example.title}>
                <div className="query-example-heading">
                  <h4>{example.title}</h4>
                  <span className={example.available ? 'example-status-ready' : 'example-status-review'}>
                    {example.available ? 'Generated' : 'Review path'}
                  </span>
                </div>
                {example.sql ? <pre>{example.sql}</pre> : <p>No SQL generated for this snapshot.</p>}
                <p>{example.note}</p>
                <TableLinks tables={example.tables} knownTables={knownTables} onSelectTable={onSelectTable} />
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-note">No generated examples are available for this product yet.</p>
        )}
      </section>
    );
  }

  function renderScriptDetail(pattern) {
    if (!pattern) {
      return renderOverview();
    }

    return (
      <section className="reporting-section reporting-section-full">
        <div className="reporting-script-detail-heading">
          <div>
            <h3>{pattern.title}</h3>
            <p>{pattern.summary}</p>
          </div>
          <span>{pattern.sourceCount} sources</span>
        </div>
        <ScriptStatusTags tags={pattern.tags} />
        <TableLinks tables={pattern.tables} knownTables={knownTables} onSelectTable={onSelectTable} />
        <div className="reporting-script-tabs" role="tablist" aria-label={`${pattern.title} content`}>
          {['sql', 'notes'].map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={scriptTab === tab}
              className={scriptTab === tab ? 'selected' : ''}
              onClick={() => setScriptTab(tab)}
            >
              {tab === 'sql' ? 'SQL' : 'Review notes'}
            </button>
          ))}
        </div>
        {scriptContent.status === 'ready' ? (
          <pre className={scriptTab === 'sql' ? 'reporting-script-content sql' : 'reporting-script-content notes'}>
            {scriptContent.text}
          </pre>
        ) : (
          <div className={`reporting-script-content-state ${scriptContent.status}`}>
            {scriptContent.status === 'error' ? scriptContent.text : 'Loading content...'}
          </div>
        )}
      </section>
    );
  }

  function renderGlossary() {
    return (
      <section className="reporting-section reporting-section-full">
        <ReportingSectionHeader title="Glossary" count={glossaryTerms.length} />
        <div className="glossary-list">
          {glossaryTerms.map((item) => (
            <div key={item.term}>
              <strong>{item.term}</strong>
              <p>{item.definition}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  function renderCompatibility() {
    return (
      <section className="reporting-section reporting-section-full">
        <ReportingSectionHeader title="Export script compatibility" count={exportCompatibilityNotes.length} />
        <ul className="compatibility-list">
          {exportCompatibilityNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>
    );
  }

  function renderCautions() {
    return (
      <section className="reporting-section reporting-section-full">
        <ReportingSectionHeader title="Caution notes" />
        <div className="reporting-caution-list">
          <article>
            <h4>Keep reporting objects separate</h4>
            <p>Create views, stored procedures, tables, and indexes in a separate reporting database, not inside a Laserfiche product database.</p>
          </article>
          <article>
            <h4>Do not publish write operations</h4>
            <p>Examples that update, delete, insert, merge, alter, drop, or repair Laserfiche product records should stay in the caution list only.</p>
          </article>
          <article>
            <h4>Validate before production use</h4>
            <p>Scripts tagged as not live tested are schema-matched starting points. Validate them in a test environment before depending on them.</p>
          </article>
        </div>
      </section>
    );
  }

  function renderSelectedView() {
    if (selectedView === 'overview') {
      return renderOverview();
    }
    if (selectedView === 'questions') {
      return renderQuestions();
    }
    if (selectedView === 'paths') {
      return renderPaths();
    }
    if (selectedView === 'generated') {
      return renderGeneratedExamples();
    }
    if (selectedView === 'glossary') {
      return renderGlossary();
    }
    if (selectedView === 'compatibility') {
      return renderCompatibility();
    }
    if (selectedView === 'cautions') {
      return renderCautions();
    }
    return renderScriptDetail(selectedScript);
  }

  return (
    <section className="detail-surface">
      <div className="detail-heading">
        <div>
          <h2>Reporting guide</h2>
          <p>Product-scoped read-only paths and SQL patterns for support-safe exploration.</p>
        </div>
      </div>
      <div className="reporting-workspace">
        <aside className="reporting-nav" aria-label="Reporting sections">
          <div className="reporting-nav-group">
            <NavButton item={{ key: 'overview', label: 'Overview' }} selectedView={selectedView} onSelect={selectReportingView} />
          </div>
          <div className="reporting-nav-group">
            <strong>Guidance</strong>
            {guidanceItems.map((item) => (
              <NavButton
                key={item.key}
                item={item}
                selectedView={selectedView}
                onSelect={selectReportingView}
                meta={
                  item.key === 'questions'
                    ? reportingQuestions.length
                    : item.key === 'paths'
                      ? reportingPaths.length
                      : generatedExamples.length
                }
              />
            ))}
          </div>
          <div className="reporting-nav-group">
            <strong>Scripts</strong>
            {communityPatterns.length > 0 ? (
              communityPatterns.map((pattern) => (
                <NavButton
                  key={pattern.scriptPath}
                  item={{ key: getScriptKey(pattern), label: pattern.title }}
                  selectedView={selectedView}
                  onSelect={selectReportingView}
                  meta={pattern.tags.includes('Not live tested') ? 'Not live tested' : undefined}
                  stackedMeta
                />
              ))
            ) : (
              <p>No scripts yet.</p>
            )}
          </div>
          <div className="reporting-nav-group">
            <strong>Reference</strong>
            {referenceItems.map((item) => (
              <NavButton key={item.key} item={item} selectedView={selectedView} onSelect={selectReportingView} />
            ))}
          </div>
        </aside>
        <div className="reporting-detail-pane">{renderSelectedView()}</div>
      </div>
    </section>
  );
}
