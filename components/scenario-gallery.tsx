import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { scenarios } from '@/lib/simulation';
import { LabHeader } from './lab-header';
import { SiteDiagram } from './site-diagram';

export function ScenarioGallery() {
  return (
    <>
      <LabHeader />
      <main className="gallery">
        <div className="gallery-intro">
          <span className="eyebrow">THE SIMULATION LAB</span>
          <h1>
            A small world.
            <br />
            <span>A visible chain of effects.</span>
          </h1>
          <p>
            Choose an environment. Send inputs from Workbench.
            <br />
            Watch what the agent sees—and what changes in the world.
          </p>
        </div>
        <div className="gallery-label">
          <span>Explore environments</span>
          <span>06 simulations · independent targets</span>
        </div>
        <div className="environment-gallery">
          {scenarios.map((scenario, i) => (
            <Link
              className="environment-entry"
              href={`/simulations/${scenario.id}`}
              key={scenario.id}
            >
              <div className="environment-preview">
                <span className="drawing-index">
                  0{i + 1} / {scenario.domain}
                </span>
                <SiteDiagram id={scenario.id} preview />
              </div>
              <div className="entry-copy">
                <div>
                  <h2>{scenario.shortName}</h2>
                  <p>{scenario.description}</p>
                  <span>{scenario.channel}</span>
                </div>
                <ArrowRight size={19} />
              </div>
            </Link>
          ))}
        </div>
        <footer className="gallery-footer">
          <span>Observe here. Interact through Workbench.</span>
          <span>Deterministic models · No physical devices</span>
        </footer>
      </main>
    </>
  );
}
