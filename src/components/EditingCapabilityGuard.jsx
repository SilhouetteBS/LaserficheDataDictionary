import { Lock } from 'lucide-react';

export function EditingCapabilityGuard() {
  return (
    <section className="detail-surface editing-capability-guard">
      <div className="detail-heading">
        <div>
          <h2>Import locked</h2>
          <p>
            Import preview is an editing-mode capability. Enable local editing mode and accept the support warning
            before analyzing uploaded schema export files.
          </p>
        </div>
        <Lock size={24} />
      </div>
      <div className="locked-capability-note" role="note">
        <p>Use the local editing mode checkbox above to unlock Import for this browser session.</p>
      </div>
    </section>
  );
}
