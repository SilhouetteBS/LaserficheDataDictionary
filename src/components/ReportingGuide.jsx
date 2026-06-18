import { useMemo } from 'react';
import { buildGeneratedReportingExamples, getReportingPaths } from '../data/reporting.js';

export function ReportingGuide({ version, onSelectTable }) {
  const knownTables = new Set(version.tables.map((table) => table.id));
  const reportingPaths = getReportingPaths(version.source.productKey);
  const generatedExamples = useMemo(() => buildGeneratedReportingExamples(version), [version]);

  return (
    <section className="detail-surface">
      <div className="detail-heading">
        <div>
          <h2>Reporting guide</h2>
          <p>Common read-only paths and starter SQL patterns for support-safe exploration.</p>
        </div>
      </div>
      <div className="reporting-grid">
        <section className="reporting-section">
          <div className="section-title-row">
            <h3>Common paths</h3>
            <span>{reportingPaths.length}</span>
          </div>
          <div className="reporting-path-list">
            {reportingPaths.map((path) => (
              <article className="reporting-path" key={path.title}>
                <h4>{path.title}</h4>
                <p>{path.summary}</p>
                <div className="path-chain">
                  {path.tables.map((tableKey) =>
                    knownTables.has(tableKey) ? (
                      <button key={tableKey} type="button" onClick={() => onSelectTable(tableKey)}>
                        {tableKey}
                      </button>
                    ) : (
                      <span key={tableKey}>{tableKey}</span>
                    ),
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="reporting-section">
          <div className="section-title-row">
            <h3>Safe examples</h3>
            <span>{generatedExamples.length}</span>
          </div>
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
                <div className="example-table-links">
                  {example.tables.map((tableKey) =>
                    knownTables.has(tableKey) ? (
                      <button key={tableKey} type="button" onClick={() => onSelectTable(tableKey)}>
                        {tableKey}
                      </button>
                    ) : (
                      <span key={tableKey}>{tableKey}</span>
                    ),
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
