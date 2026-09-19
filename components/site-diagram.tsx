/* oxlint-disable jsx-a11y/prefer-tag-over-role -- SVG nodes need SVG elements with accessible roles, not HTML replacements. */
import type { ReactNode } from 'react';
import type { ScenarioId, SimulationState } from '@/lib/simulation';

export const siteNames: Record<ScenarioId, string> = {
  'smart-farm': 'Greenhouse 04',
  'water-treatment': 'North waterworks',
  warehouse: 'Fulfilment floor B',
  'hospital-climate': 'East wing · comfort system',
  'smart-building': 'Ground floor · access system',
  'strategic-command': 'Command verification exercise',
};

type Props = {
  id: ScenarioId;
  status?: SimulationState['status'];
  metric?: number;
  revision?: number;
  selected?: string | null;
  onSelect?: (node: string) => void;
  preview?: boolean;
};

function Pipe({
  d,
  data = false,
  affected = false,
  arrowId,
}: {
  d: string;
  data?: boolean;
  affected?: boolean;
  arrowId?: string;
}) {
  const paths = d.split(/(?=M)/).filter(Boolean);
  return (
    <g className={data ? 'signal-connection' : 'fluid-connection'}>
      {paths.map((path, index) => (
        <path
          key={index}
          d={path}
          markerEnd={arrowId ? `url(#${arrowId})` : undefined}
          className={`${data ? 'data-wire' : 'water-pipe'} ${affected ? 'affected-path' : ''}`}
        />
      ))}
      <g
        className={`flow-particles ${data ? 'data-particles' : ''}`}
        aria-hidden="true"
      >
        {paths.map((path, index) => (
          <g key={index}>
            {[0, 1, 2].map((particle) => (
              <circle key={particle} r={data ? 3 : 4}>
                <animateMotion
                  path={path}
                  dur={affected ? '2s' : '5s'}
                  begin={`${(-particle * (affected ? 2 : 5)) / 3}s`}
                  repeatCount="indefinite"
                />
              </circle>
            ))}
          </g>
        ))}
      </g>
    </g>
  );
}

function ImpactRing({
  x,
  y,
  radius = 30,
}: {
  x: number;
  y: number;
  radius?: number;
}) {
  return (
    <g
      className="impact-rings"
      transform={`translate(${x} ${y})`}
      aria-hidden="true"
    >
      <circle r={radius} />
      <circle r={radius} />
    </g>
  );
}

function Label({
  x,
  y,
  children,
  secondary,
}: {
  x: number;
  y: number;
  children: ReactNode;
  secondary?: string;
}) {
  return (
    <g className="plan-label">
      <text x={x} y={y}>
        {children}
      </text>
      {secondary && (
        <text className="plan-secondary" x={x} y={y + 18}>
          {secondary}
        </text>
      )}
    </g>
  );
}

function Zone({
  x,
  y,
  w,
  h,
  title,
  subtitle,
  affected,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  subtitle?: string;
  affected?: boolean;
  children?: ReactNode;
}) {
  return (
    <g className={`plan-zone ${affected ? 'zone-affected' : ''}`}>
      <rect x={x} y={y} width={w} height={h} rx="5" />
      <text x={x + 17} y={y + 27} className="zone-title">
        {title}
      </text>
      {subtitle && (
        <text x={x + 17} y={y + 46} className="plan-secondary">
          {subtitle}
        </text>
      )}
      {children}
    </g>
  );
}

function Device({
  x,
  y,
  label,
  kind = 'sensor',
  selected,
  onSelect,
  affected = false,
  labelY = 48,
}: {
  x: number;
  y: number;
  label: string;
  kind?: 'sensor' | 'valve' | 'agent' | 'gate' | 'pump';
  selected?: string | null;
  onSelect?: (node: string) => void;
  affected?: boolean;
  labelY?: number;
}) {
  const body = (
    <>
      <circle className="device-halo" r="28" />
      {kind === 'valve' ? (
        <>
          <path className="device-shape" d="M-15 -10 L15 10 V-10 L-15 10 Z" />
          <path d="M0 -12 V-21 M-7 -21 H7" />
        </>
      ) : kind === 'agent' ? (
        <>
          <rect
            className="device-shape"
            x="-17"
            y="-17"
            width="34"
            height="34"
            rx="7"
          />
          <path d="M-7 -4 H7 M-7 3 H3 M-7 10 H7 M-10 -21 V-17 M0 -21 V-17 M10 -21 V-17" />
        </>
      ) : kind === 'gate' ? (
        <>
          <rect
            className="device-shape"
            x="-14"
            y="-18"
            width="28"
            height="36"
            rx="2"
          />
          <path d="M-2 -9 V9 M5 0 H8" />
        </>
      ) : kind === 'pump' ? (
        <>
          <circle className="device-shape" r="17" />
          <path className="pump-rotor" d="M-7 -10 L11 0 L-7 10 Z" />
        </>
      ) : (
        <>
          <circle className="device-shape" r="12" />
          <circle r="3" />
          <path d="M-18 -9 A20 20 0 0 1 18 -9 M-22 -16 A28 28 0 0 1 22 -16" />
        </>
      )}
      <text y={labelY} className="device-name">
        {label}
      </text>
    </>
  );
  return onSelect ? (
    <g
      className={`plan-device ${selected === label ? 'is-selected' : ''} ${affected ? 'is-affected' : ''}`}
      transform={`translate(${x} ${y})`}
      role="button"
      tabIndex={0}
      aria-label={`Inspect ${label}`}
      onClick={() => onSelect(label)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(label);
        }
      }}
    >
      {body}
    </g>
  ) : (
    <g
      className={`plan-device ${affected ? 'is-affected' : ''}`}
      transform={`translate(${x} ${y})`}
    >
      {body}
    </g>
  );
}

function Reservoir({
  x,
  y,
  level,
  label,
}: {
  x: number;
  y: number;
  level: number;
  label: string;
}) {
  const height = 110 * Math.min(1, Math.max(0, level / 100));
  return (
    <g className="reservoir">
      <rect
        x={x}
        y={y}
        width="112"
        height="130"
        rx="8"
        className="tank-outline"
      />
      <rect
        x={x + 5}
        y={y + 125 - height}
        width="102"
        height={height}
        rx="4"
        className="tank-water"
      />
      <path
        className="tank-surface"
        d={`M${x + 8} ${y} q12 -5 24 0 t24 0 t24 0 t22 0`}
        style={{ transform: `translateY(${125 - height}px)` }}
      />
      <path
        d={`M${x + 18} ${y + 30} H${x + 30} M${x + 18} ${y + 58} H${x + 30} M${x + 18} ${y + 86} H${x + 30}`}
      />
      <text x={x + 58} y={y + 85} textAnchor="middle" className="tank-value">
        {level}%
      </text>
      <text x={x + 56} y={y + 156} textAnchor="middle" className="device-name">
        {label}
      </text>
    </g>
  );
}

export function SiteDiagram({
  id,
  status = 'nominal',
  metric,
  revision = 0,
  selected,
  onSelect,
  preview,
}: Props) {
  const impacted = status === 'compromised';
  const blocked = status === 'contained';
  const device = { selected, onSelect: preview ? undefined : onSelect };
  return (
    <svg
      className={`site-diagram diagram-${id} ${preview ? 'diagram-preview' : ''}`}
      viewBox="0 0 1100 510"
      aria-label={`${siteNames[id]} site schematic`}
      role={preview ? 'img' : 'group'}
      data-state={status}
    >
      <title>{`${siteNames[id]} — physical layout and connected devices`}</title>
      <defs>
        <pattern
          id={`dots-${id}`}
          width="22"
          height="22"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1" cy="1" r="0.7" fill="#d9dfda" />
        </pattern>
        <pattern
          id={`hatch-${id}`}
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" x2="0" y1="0" y2="8" stroke="#e5c5bb" strokeWidth="2" />
        </pattern>
        <marker
          id={`flow-arrow-${id}`}
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="4"
          markerHeight="4"
          orient="auto"
        >
          <path className="flow-arrowhead" d="M0 0 L8 4 L0 8 Z" />
        </marker>
        <marker
          id={`data-arrow-${id}`}
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path className="data-arrowhead" d="M0 0 L8 4 L0 8 Z" />
        </marker>
      </defs>
      <rect width="1100" height="510" fill={`url(#dots-${id})`} opacity=".7" />
      {id === 'smart-farm' && (
        <>
          <rect
            className="site-boundary"
            x="250"
            y="132"
            width="770"
            height="277"
            rx="10"
          />
          <Label
            x={270}
            y={84}
            secondary="Irrigation network · three growing zones"
          >
            GREENHOUSE 04
          </Label>
          <Reservoir
            x={44}
            y={162}
            level={impacted ? 23 : 64}
            label="Water reservoir"
          />
          <Pipe
            d="M156 230 H205 V177 H936 M360 177 V212 M615 177 V212 M870 177 V212"
            affected={impacted}
            arrowId={`flow-arrow-${id}`}
          />
          <Device
            x={205}
            y={230}
            label="Pump P-01"
            kind="pump"
            {...device}
            affected={impacted}
          />
          {[295, 550, 805].map((x, i) => (
            <g key={x}>
              <Zone
                x={x}
                y={214}
                w={178}
                h={160}
                title={`ZONE ${['A', 'B', 'C'][i]}`}
                subtitle={
                  i === 2 && impacted ? 'Excess irrigation' : 'Tomato crop bed'
                }
                affected={i === 2 && impacted}
              >
                {[0, 1, 2, 3, 4].map((row) => (
                  <g key={row} className="crop-row">
                    <rect
                      x={x + 18 + row * 30}
                      y="278"
                      width="12"
                      height="67"
                      rx="5"
                    />
                    <path d={`M${x + 24 + row * 30} 284 V340`} />
                  </g>
                ))}
                {i === 2 && impacted && (
                  <g className="flood-effect">
                    <rect
                      x={x + 8}
                      y="265"
                      width="162"
                      height="99"
                      rx="7"
                      className="flood-overlay"
                    />
                    {[0, 1, 2].map((ripple) => (
                      <ellipse
                        key={ripple}
                        className="water-ripple"
                        cx={x + 89}
                        cy={317}
                        rx={25 + ripple * 18}
                        ry={10 + ripple * 8}
                        style={{ animationDelay: `${-ripple * 0.8}s` }}
                      />
                    ))}
                    <path
                      className="spill-stream"
                      d={`M${x + 162} 346 h10 v35 q0 18 10 18`}
                    />
                    <ellipse
                      className="water-puddle"
                      cx={x + 184}
                      cy={405}
                      rx={24}
                      ry={10}
                    />
                  </g>
                )}
              </Zone>
              <Device
                x={x + 65}
                y={177}
                label={`Valve V-0${i + 1}`}
                kind="valve"
                labelY={-48}
                {...device}
                affected={i === 2 && impacted}
              />
              <Device
                x={x + 125}
                y={381}
                label={`Probe S-0${i + 1}`}
                {...device}
                affected={i === 2 && impacted}
              />
            </g>
          ))}
          <Pipe
            d="M420 381 V438 M675 381 V438 M930 381 V438 M420 438 H1048 V69 H1019"
            data
            arrowId={`data-arrow-${id}`}
          />
          <Zone
            x={707}
            y={29}
            w={240}
            h={80}
            title="CONTROL CABINET"
            subtitle={
              blocked
                ? 'Input held at policy gate'
                : 'Telemetry → agent → irrigation'
            }
          />
          <Device x={990} y={69} label="Farm agent" kind="agent" {...device} />
          {impacted && <ImpactRing x={870} y={177} />}
          <Label
            x={276}
            y={465}
            secondary="Soil reading → controller decision → valve state"
          >{`ZONE C · ${metric ?? 42}% MOISTURE`}</Label>
        </>
      )}

      {id === 'water-treatment' && (
        <>
          <Label
            x={58}
            y={60}
            secondary="Reservoir → filtration → storage → outlet"
          >
            NORTH WATERWORKS
          </Label>
          <Pipe
            d="M72 180 V136 H960 V195 M187 260 H334 M510 260 H662 M774 260 H978 V340"
            affected={impacted}
          />
          <Reservoir
            x={75}
            y={195}
            level={metric ?? 64}
            label="Raw water tank"
          />
          {impacted && (
            <g className="flood-effect">
              <path
                className="spill-stream"
                d="M80 208 H59 V338 Q59 355 100 355"
              />
              <ellipse
                className="water-puddle"
                cx={97}
                cy={356}
                rx={48}
                ry={11}
              />
              <ImpactRing x={130} y={210} radius={40} />
            </g>
          )}
          <Zone
            x={334}
            y={188}
            w={176}
            h={155}
            title="FILTRATION"
            subtitle="Filter bank F-02"
          >
            <path
              className="filter-media"
              d="M360 260 H485 M360 280 H485 M360 300 H485"
            />
          </Zone>
          <Reservoir
            x={662}
            y={195}
            level={impacted ? 86 : 55}
            label="Filtered water"
          />
          <Device
            x={255}
            y={260}
            label="Feed pump"
            kind="pump"
            {...device}
            affected={impacted}
          />
          <Device
            x={860}
            y={260}
            label="Outlet V-02"
            kind="valve"
            {...device}
            affected={impacted}
          />
          <Zone
            x={911}
            y={340}
            w={130}
            h={70}
            title="OUTLET"
            subtitle={impacted ? 'Flow held' : 'Flow balanced'}
            affected={impacted}
          />
          <Device x={130} y={374} label="Level L-01" {...device} />
          <Pipe d="M130 374 V446 H578 V94 H844 M715 376 V446 H578" data />
          <Device x={715} y={374} label="Quality Q-02" {...device} />
          <Zone
            x={840}
            y={48}
            w={200}
            h={70}
            title="PLANT CONTROL"
            subtitle="Synthetic flow coordinator"
          />
          <Device x={805} y={86} label="Plant agent" kind="agent" {...device} />
        </>
      )}

      {id === 'warehouse' && (
        <>
          <rect
            className="site-boundary"
            x={64}
            y={86}
            width={958}
            height={350}
            rx={6}
          />
          <Label
            x={80}
            y={60}
            secondary="Rack plan · robot transit · receiving dock"
          >
            FULFILMENT FLOOR B
          </Label>
          {[155, 390, 625].map((x, i) => (
            <Zone
              key={x}
              x={x}
              y={136}
              w={140}
              h={220}
              title={`RACK ${i + 1}`}
              subtitle="Storage positions"
            >
              {[0, 1, 2, 3].map((row) => (
                <rect
                  key={row}
                  className="shelf"
                  x={x + 16}
                  y={206 + row * 30}
                  width={108}
                  height={22}
                  rx={2}
                />
              ))}
            </Zone>
          ))}
          <rect
            x={812}
            y={126}
            width={180}
            height={195}
            fill={`url(#hatch-${id})`}
            stroke="#d6aaa0"
            strokeDasharray="5 5"
            rx={5}
          />
          <Label x={832} y={152} secondary="No robot access">
            RESTRICTED AISLE
          </Label>
          <path
            className="robot-route"
            d={impacted ? 'M108 391 H890 V236' : 'M108 391 H572 V111 H332 V389'}
          />
          <g
            className="robot-twin"
            style={{
              transform: impacted
                ? 'translate(890px, 245px)'
                : 'translate(572px, 285px)',
            }}
          >
            <rect x={-22} y={-28} width={44} height={56} rx={9} />
            <circle cy={-8} r={8} />
            <path d="M-12 13 H12" />
            <text y={48} textAnchor="middle">
              AMR-03
            </text>
          </g>
          {impacted && <ImpactRing x={890} y={245} radius={38} />}
          <Zone
            x={834}
            y={349}
            w={156}
            h={63}
            title="RECEIVING"
            subtitle="Package scanning"
          />
          <Device x={108} y={391} label="Dock D-01" kind="gate" {...device} />
          <Device x={815} y={392} label="QR reader" {...device} />
          <Device x={941} y={56} label="Fleet agent" kind="agent" {...device} />
          <Pipe d="M815 391 V468 H1050 V56 H966" data />
        </>
      )}

      {id === 'hospital-climate' && (
        <>
          <Label
            x={57}
            y={60}
            secondary="Four comfort zones · shared supply and return"
          >
            EAST WING FLOOR PLAN
          </Label>
          <rect
            className="site-boundary"
            x={56}
            y={136}
            width={858}
            height={300}
            rx={5}
          />
          <rect
            className="corridor"
            x={64}
            y={340}
            width={842}
            height={87}
            rx={3}
          />
          <Label x={82} y={395}>
            CENTRAL CORRIDOR
          </Label>
          {[75, 285, 495, 705].map((x, i) => (
            <Zone
              key={x}
              x={x}
              y={151}
              w={190}
              h={187}
              title={`ROOM 0${i + 1}`}
              subtitle={
                i === 3 ? `${metric ?? 22}°C · observed` : '22°C · nominal'
              }
              affected={impacted && i === 3}
            >
              <rect
                className="furniture"
                x={x + 22}
                y={224}
                width={90}
                height={74}
                rx={4}
              />
              <rect
                className="furniture"
                x={x + 32}
                y={233}
                width={27}
                height={56}
                rx={3}
              />
              <g
                className={`airflow ${impacted && i === 3 ? 'airflow-hot' : ''}`}
                aria-hidden="true"
              >
                {[0, 1, 2].map((stream) => (
                  <path
                    key={stream}
                    d={`M${x + 29 + stream * 38} 202 q-12 20 0 40 t0 40`}
                  />
                ))}
              </g>
              <Device
                x={x + 151}
                y={264}
                label={`T-0${i + 1}`}
                {...device}
                affected={impacted && i === 3}
              />
            </Zone>
          ))}
          <Pipe
            d="M994 230 V111 H170 V150 M379 111 V150 M589 111 V150 M799 111 V150"
            affected={impacted}
          />
          <Zone
            x={927}
            y={200}
            w={145}
            h={123}
            title="AIR HANDLER"
            subtitle="AHU-01"
          >
            <circle className="fan" cx={1000} cy={280} r={23} />
            <g transform="translate(1000 280)">
              <path className="fan fan-blades" d="M-18 0 H18 M0 -18 V18" />
            </g>
          </Zone>
          <Device x={996} y={374} label="HVAC agent" kind="agent" {...device} />
          <Pipe d="M857 264 H898 V466 H996 V394" data />
        </>
      )}

      {id === 'smart-building' && (
        <>
          <Label
            x={64}
            y={60}
            secondary="Visitor arrival → badge scan → access decision"
          >
            GROUND FLOOR ACCESS
          </Label>
          <rect
            className="site-boundary"
            x={65}
            y={103}
            width={900}
            height={339}
            rx={6}
          />
          <Zone
            x={80}
            y={118}
            w={310}
            h={306}
            title="PUBLIC LOBBY"
            subtitle="Visitor waiting area"
          >
            <rect
              className="furniture"
              x={105}
              y={201}
              width={95}
              height={50}
              rx={5}
            />
            <rect
              className="furniture"
              x={105}
              y={276}
              width={95}
              height={50}
              rx={5}
            />
            <rect
              className="furniture"
              x={282}
              y={206}
              width={71}
              height={143}
              rx={6}
            />
          </Zone>
          <Zone
            x={590}
            y={118}
            w={357}
            h={306}
            title="RESTRICTED WORKSPACE"
            subtitle={
              impacted ? 'Access change observed' : 'Authorized badges only'
            }
            affected={impacted}
          >
            <rect
              className="furniture"
              x={631}
              y={207}
              width={123}
              height={63}
              rx={4}
            />
            <rect
              className="furniture"
              x={785}
              y={207}
              width={123}
              height={63}
              rx={4}
            />
          </Zone>
          <path className="walk-path" d="M239 382 V290 H495 H822" />
          <path
            className={`door-leaf ${impacted ? 'door-open' : ''}`}
            d="M584 244 V308"
          />
          {impacted && (
            <g className="access-change">
              <path className="door-sweep" d="M584 308 A64 64 0 0 1 537 288" />
              <path className="access-flow" d="M495 290 H815" />
              <ImpactRing x={584} y={278} radius={38} />
            </g>
          )}
          <Device x={453} y={224} label="NFC reader" {...device} />
          <Device
            x={543}
            y={343}
            label="Door D-03"
            kind="gate"
            {...device}
            affected={impacted}
          />
          <Device
            x={1021}
            y={191}
            label="Access agent"
            kind="agent"
            {...device}
          />
          <Pipe d="M453 224 V84 H1021 V166 M1021 218 V468 H543 V366" data />
        </>
      )}

      {id === 'strategic-command' && (
        <>
          <Label
            x={62}
            y={64}
            secondary="Fictional site plan · verification and review only"
          >
            COMMAND VERIFICATION EXERCISE
          </Label>
          {[95, 320, 545].map((x, i) => (
            <Zone
              key={x}
              x={x}
              y={170}
              w={175}
              h={175}
              title={['FEED STATION', 'REVIEW ROOM', 'VERIFICATION'][i]}
              subtitle={
                [
                  'Synthetic telemetry',
                  'Independent review',
                  'Exercise policy',
                ][i]
              }
            >
              <Device
                x={x + 86}
                y={269}
                label={['Feed S-01', 'Review desk', 'Policy gate'][i]}
                kind={i === 0 ? 'sensor' : 'agent'}
                {...device}
              />
            </Zone>
          ))}
          <Pipe
            d="M182 168 V126 H824 V246 M407 169 V126 M632 168 V126"
            data
            affected={impacted}
          />
          <Zone
            x={802}
            y={196}
            w={232}
            h={176}
            title="EXERCISE INDICATOR"
            subtitle={
              impacted ? 'Gate flagged for review' : 'Verification intact'
            }
            affected={impacted}
          >
            <circle
              className={`indicator ${impacted ? 'flagged' : ''}`}
              cx={919}
              cy={302}
              r={24}
            />
            {impacted && <ImpactRing x={919} y={302} radius={33} />}
          </Zone>
          <Label
            x={96}
            y={421}
            secondary="This diagram has no physical outputs or operational command protocol."
          >{`${metric ?? 100}% · INTERLOCK INTEGRITY`}</Label>
        </>
      )}

      {!preview && (
        <g className="drawing-reference">
          <path d="M33 454 V480 H77 M52 480 V473 M77 480 V473" />
          <text x={33} y={498}>
            SCHEMATIC · NOT TO SCALE
          </text>
          <path d="M1044 451 V476 M1039 459 L1044 449 L1049 459" />
          <text x={1041} y={492}>
            N
          </text>
        </g>
      )}
      {revision > 1 && status !== 'nominal' && (
        <g key={revision} className="receipt-pulse">
          <circle cx={1080} cy={20} r={6} />
        </g>
      )}
    </svg>
  );
}
