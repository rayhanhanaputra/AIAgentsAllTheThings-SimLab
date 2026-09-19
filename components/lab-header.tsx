import Link from 'next/link';
import { ArrowUpRight, Layers2 } from 'lucide-react';

export function LabHeader() {
  return (
    <header className="lab-header">
      <Link href="/" className="brand">
        <span className="brand-symbol">
          <Layers2 size={20} />
        </span>
        <strong>
          SimLab<span>.</span>
        </strong>
        <span className="brand-parent">AIAgentsAllTheThings</span>
      </Link>
      <div className="header-right">
        <span className="local-badge">
          <i /> Local simulation lab
        </span>
        <a
          href="http://127.0.0.1:3417"
          target="_blank"
          rel="noreferrer"
          className="workbench-link"
        >
          Open Workbench <ArrowUpRight size={14} />
        </a>
      </div>
    </header>
  );
}
