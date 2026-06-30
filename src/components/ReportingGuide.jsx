import { useEffect, useMemo, useState } from 'react';
import { exportCompatibilityNotes, glossaryTerms } from '../data/glossary.js';
import {
  buildGeneratedReportingExamples,
  getCommunityReportingPatterns,
  getReportingPaths,
  getReportingQuestions,
} from '../data/reporting.js';

export function ReportingGuide({ version, onSelectTable }) {
  const [scriptModal, setScriptModal] = useState(null);
  const knownTables = new Set(version.tables.map((table) => table.id));
  const reportingPaths = getReportingPaths(version.source.productKey);
  const reportingQuestions = getReportingQuestions(version.source.productKey);
  const communityPatterns = getCommunityReportingPatterns(version.source.productKey);
  const generatedExamples = useMemo(() => buildGeneratedReportingExamples(version), [version]);

  useEffect(() => {
    if (!scriptModal) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setScriptModal(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scriptModal]);

  return (
    <section className="detail-surface">
      <div className="detail-heading">
        <div>
          <h2>Reporting guide</h2>
          <p>Common read-only paths and starter SQL patterns for support-safe exploration.</p>
        </div>
      </div>
      <div className="reporting-grid">
        <section className="reporting-section reporting-section-wide">
          <div className="section-title-row">
            <h3>Common reporting questions</h3>
            <span>{reportingQuestions.length}</span>
          </div>
          <div className="reporting-question-list">
            {reportingQuestions.map((item) => (
              <article className="reporting-question" key={item.question}>
                <h4>{item.question}</h4>
                <p>{item.guidance}</p>
                <div className="path-chain">
                  {item.tables.map((tableKey) =>
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
        {communityPatterns.length > 0 ? (
          <section className="reporting-section reporting-section-wide">
            <div className="section-title-row">
              <h3>Community reviewed scripts</h3>
              <span>{communityPatterns.length}</span>
            </div>
            <div className="community-pattern-list">
              {communityPatterns.map((pattern) => (
                <article className="community-pattern-card" key={pattern.scriptPath}>
                  <div className="community-pattern-heading">
                    <div>
                      <h4>{pattern.title}</h4>
                      <p>{pattern.summary}</p>
                    </div>
                    <span>{pattern.sourceCount} sources</span>
                  </div>
                  <div className="community-pattern-tags">
                    {pattern.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <div className="example-table-links">
                    {pattern.tables.map((tableKey) =>
                      knownTables.has(tableKey) ? (
                        <button key={tableKey} type="button" onClick={() => onSelectTable(tableKey)}>
                          {tableKey}
                        </button>
                      ) : (
                        <span key={tableKey}>{tableKey}</span>
                      ),
                    )}
                  </div>
                  <div className="community-pattern-actions">
                    <button
                      type="button"
                      onClick={() =>
                        setScriptModal({
                          title: `${pattern.title} SQL`,
                          subtitle: pattern.scriptPath,
                          content: pattern.sql,
                          type: 'sql',
                        })
                      }
                    >
                      Open SQL
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setScriptModal({
                          title: `${pattern.title} review notes`,
                          subtitle: pattern.evidencePath,
                          content: pattern.evidence,
                          type: 'notes',
                        })
                      }
                    >
                      Review notes
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
        <section className="reporting-section">
          <div className="section-title-row">
            <h3>Glossary</h3>
            <span>{glossaryTerms.length}</span>
          </div>
          <div className="glossary-list">
            {glossaryTerms.map((item) => (
              <div key={item.term}>
                <strong>{item.term}</strong>
                <p>{item.definition}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="reporting-section">
          <div className="section-title-row">
            <h3>Export script compatibility</h3>
            <span>{exportCompatibilityNotes.length}</span>
          </div>
          <ul className="compatibility-list">
            {exportCompatibilityNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      </div>
      {scriptModal ? (
        <div className="script-modal-backdrop" role="presentation" onMouseDown={() => setScriptModal(null)}>
          <div
            className="script-modal"
            role="dialog"
            aria-modal="true"
            aria-label={scriptModal.title}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="script-modal-heading">
              <div>
                <h3>{scriptModal.title}</h3>
                <p>{scriptModal.subtitle}</p>
              </div>
              <button type="button" onClick={() => setScriptModal(null)} aria-label="Close script preview">
                X
              </button>
            </div>
            <div className="script-modal-warning">
              Read-only reporting aid. This script is tagged as not live tested unless the review notes state otherwise.
            </div>
            <pre className={scriptModal.type === 'sql' ? 'script-modal-content sql' : 'script-modal-content notes'}>
              {scriptModal.content}
            </pre>
          </div>
        </div>
      ) : null}
    </section>
  );
}
