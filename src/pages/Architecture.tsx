import { useState } from 'react';
import {
  Folder, FolderOpen, FileCode, FileText, File, ChevronRight, ChevronDown,
  Globe, Database, Server, Box, GitBranch, BookOpen, Settings, Cloud, Cpu
} from 'lucide-react';

interface Node { name: string; type: 'd'|'f'; desc?: string; ch?: Node[]; open?: boolean; icon?: React.ReactNode; }

const fileIcon = (n: string): React.ReactNode => {
  if (/\.(ts|tsx|jsx|js)$/.test(n)) return <FileCode size={13} style={{ color:'#60A5FA' }} />;
  if (/\.py$/.test(n))               return <FileCode size={13} style={{ color:'#F59E0B' }} />;
  if (/\.(css|scss)$/.test(n))       return <FileCode size={13} style={{ color:'#C084FC' }} />;
  if (/\.(json|yaml|yml|toml)$/.test(n)) return <FileText size={13} style={{ color:'#34D399' }} />;
  if (/\.md$/.test(n))               return <BookOpen size={13} style={{ color:'#94A3B8' }} />;
  if (n === 'Dockerfile')            return <Box size={13} style={{ color:'#06B6D4' }} />;
  if (n === '.env')                  return <Settings size={13} style={{ color:'#EF4444' }} />;
  if (n === 'LICENSE')               return <File size={13} style={{ color:'#64748B' }} />;
  return <File size={13} style={{ color:'#64748B' }} />;
};

const TREE: Node[] = [{
  name:'Enterprise-API-Analytics-Platform', type:'d', open:true,
  icon:<Globe size={14} style={{ color:'#2563EB' }}/>,
  ch:[
    { name:'frontend', type:'d', open:true, icon:<Globe size={13} style={{ color:'#60A5FA' }}/>, ch:[
      { name:'public', type:'d', ch:[{ name:'index.html',type:'f' },{ name:'favicon.ico',type:'f' }]},
      { name:'src', type:'d', open:true, ch:[
        { name:'assets',    type:'d', desc:'Static images and icons' },
        { name:'components',type:'d', desc:'Reusable UI components', ch:[
          { name:'Sidebar.tsx',type:'f'},{ name:'Navbar.tsx',type:'f'},{ name:'KpiCard.tsx',type:'f'},{ name:'Badge.tsx',type:'f'},
        ]},
        { name:'pages',  type:'d', desc:'Route-level pages', ch:[
          { name:'Dashboard.tsx',type:'f'},{ name:'ApiRegistry.tsx',type:'f'},{ name:'MLPredictions.tsx',type:'f'},
        ]},
        { name:'services',type:'d', desc:'API client layer' },
        { name:'hooks',   type:'d', desc:'Custom React hooks' },
        { name:'context', type:'d', desc:'React Context providers', ch:[{ name:'ToastContext.tsx',type:'f'}]},
        { name:'routes',  type:'d', desc:'React Router config' },
        { name:'utils',   type:'d' },
        { name:'styles',  type:'d', ch:[{ name:'index.css',type:'f'}]},
        { name:'App.tsx', type:'f'}, { name:'main.tsx',type:'f'},
      ]},
      { name:'package.json',type:'f'},{ name:'Dockerfile',type:'f'},{ name:'README.md',type:'f'},
    ]},
    { name:'backend', type:'d', icon:<Server size={13} style={{ color:'#22C55E' }}/>, ch:[
      { name:'app', type:'d', open:true, ch:[
        { name:'routers',    type:'d', desc:'FastAPI route handlers' },
        { name:'services',   type:'d', desc:'Business logic layer' },
        { name:'repositories',type:'d',desc:'Database access layer' },
        { name:'models',     type:'d', desc:'SQLAlchemy ORM models' },
        { name:'schemas',    type:'d', desc:'Pydantic v2 schemas' },
        { name:'database',   type:'d', desc:'DB sessions and migrations' },
        { name:'config',     type:'d', desc:'Settings and env' },
        { name:'middleware', type:'d', desc:'Auth, CORS, rate-limit' },
        { name:'exceptions', type:'d', desc:'Custom error handlers' },
        { name:'security',   type:'d', desc:'JWT, OAuth2, RBAC' },
        { name:'utils',      type:'d' },
        { name:'main.py',    type:'f'},
      ]},
      { name:'tests', type:'d', desc:'pytest unit + integration' },
      { name:'logs',  type:'d' },{ name:'uploads',type:'d'},
      { name:'requirements.txt',type:'f'},{ name:'.env',type:'f'},
      { name:'Dockerfile',type:'f'},{ name:'README.md',type:'f'},
    ]},
    { name:'ml', type:'d', icon:<Cpu size={13} style={{ color:'#8B5CF6' }}/>, desc:'Prophet, XGBoost, Random Forest', ch:[
      { name:'models',type:'d'},{ name:'training',type:'d'},{ name:'inference',type:'d'},{ name:'notebooks',type:'d'},{ name:'requirements.txt',type:'f'},
    ]},
    { name:'database', type:'d', icon:<Database size={13} style={{ color:'#F59E0B' }}/>, desc:'SQL migrations and seeds', ch:[
      { name:'migrations',type:'d'},{ name:'seeds',type:'d'},{ name:'schema.sql',type:'f'},
    ]},
    { name:'docker', type:'d', icon:<Box size={13} style={{ color:'#06B6D4' }}/>, ch:[
      { name:'docker-compose.yml',type:'f'},{ name:'docker-compose.prod.yml',type:'f'},{ name:'nginx.conf',type:'f'},
    ]},
    { name:'kubernetes', type:'d', icon:<Cloud size={13} style={{ color:'#60A5FA' }}/>, ch:[
      { name:'deployments',type:'d'},{ name:'services',type:'d'},{ name:'ingress',type:'d'},{ name:'configmaps',type:'d'},
    ]},
    { name:'.github/workflows', type:'d', icon:<GitBranch size={13} style={{ color:'#94A3B8' }}/>, ch:[
      { name:'ci.yml',type:'f'},{ name:'cd-staging.yml',type:'f'},{ name:'cd-production.yml',type:'f'},{ name:'security-scan.yml',type:'f'},
    ]},
    { name:'docs', type:'d', icon:<BookOpen size={13} style={{ color:'#94A3B8' }}/>, ch:[
      { name:'architecture.md',type:'f'},{ name:'api-reference.md',type:'f'},{ name:'deployment.md',type:'f'},
    ]},
    { name:'README.md',type:'f'},{ name:'LICENSE',type:'f'},
  ],
}];

function TreeNode({ node, depth }: { node: Node; depth: number }) {
  const [open, setOpen] = useState(node.open ?? false);
  const isDir = node.type === 'd';
  const has = isDir && (node.ch?.length ?? 0) > 0;

  return (
    <div>
      <div
        onClick={() => has && setOpen(o => !o)}
        style={{
          display:'flex', alignItems:'center', gap:6, padding:'3px 6px',
          paddingLeft: depth * 16 + 6,
          borderRadius:6, cursor: has ? 'pointer' : 'default',
          transition:'background 0.1s',
        }}
        onMouseEnter={e => has && (e.currentTarget.style.background = 'rgba(37,99,235,0.08)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        {has ? (
          open ? <ChevronDown size={11} style={{ color:'var(--text-4)', flexShrink:0 }} /> : <ChevronRight size={11} style={{ color:'var(--text-4)', flexShrink:0 }} />
        ) : (
          <span style={{ width:11, flexShrink:0 }} />
        )}
        {isDir
          ? (node.icon || (open ? <FolderOpen size={13} style={{ color:'#F59E0B', flexShrink:0 }} /> : <Folder size={13} style={{ color:'#F59E0B', flexShrink:0 }} />))
          : fileIcon(node.name)
        }
        <span className="mono" style={{ fontSize:12.5, color:isDir?'var(--text-2)':'var(--text-3)', fontWeight:isDir?600:400 }}>
          {node.name}{isDir?'/':''}
        </span>
        {node.desc && <span style={{ fontSize:11, color:'var(--text-5)', marginLeft:4 }}>— {node.desc}</span>}
      </div>
      {open && node.ch?.map((child, i) => <TreeNode key={i} node={child} depth={depth+1} />)}
    </div>
  );
}

const STACK = [
  { layer:'Frontend',  color:'#60A5FA', items:['React 19','Vite 8','TypeScript 5.7','Tailwind CSS v4','Recharts','Lucide'] },
  { layer:'Backend',   color:'#22C55E', items:['FastAPI','Python 3.12','SQLAlchemy','Pydantic v2','Celery','Redis'] },
  { layer:'Database',  color:'#F59E0B', items:['PostgreSQL 16','TimescaleDB','Redis 7','Elasticsearch 8'] },
  { layer:'ML / AI',   color:'#8B5CF6', items:['Prophet','XGBoost','scikit-learn','pandas','NumPy','MLflow'] },
  { layer:'Infrastructure', color:'#06B6D4', items:['Docker','Kubernetes','AWS EKS','Nginx','Terraform','Helm'] },
  { layer:'CI / CD',   color:'#94A3B8', items:['GitHub Actions','ArgoCD','Trivy','SonarQube','Prometheus'] },
];

const ARCH_LAYERS = [
  { layer:'Client Layer',  items:['React Web App','Mobile (PWA)'],               color:'#60A5FA' },
  { layer:'API Gateway',   items:['Nginx Ingress','Rate Limiter','Auth Middleware'],color:'#8B5CF6' },
  { layer:'Service Layer', items:['FastAPI — REST + WebSocket'],                  color:'#22C55E' },
  { layer:'Processing',    items:['Celery Workers','ML Inference','Event Stream'], color:'#F59E0B' },
  { layer:'Data Layer',    items:['PostgreSQL + TimescaleDB','Redis Cache','Elasticsearch'], color:'#EF4444' },
];

export default function Architecture() {
  return (
    <div className="page stagger">
      <div className="grid-2" style={{ alignItems:'start' }}>
        {/* File tree */}
        <div className="glass-card" style={{ padding:20 }}>
          <div className="section-title" style={{ marginBottom:2 }}>Project Structure</div>
          <div className="section-sub" style={{ marginBottom:14 }}>Click folders to expand — full monorepo layout</div>
          <div className="scroll-area" style={{ maxHeight:580 }}>
            {TREE.map((node, i) => <TreeNode key={i} node={node} depth={0} />)}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Tech stack */}
          <div className="glass-card" style={{ padding:20 }}>
            <div className="section-title" style={{ marginBottom:14 }}>Technology Stack</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {STACK.map(({ layer, color, items }) => (
                <div key={layer}>
                  <div style={{ fontSize:10, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'0.10em', marginBottom:5 }}>{layer}</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                    {items.map(item => (
                      <span key={item} style={{ fontSize:11.5, color:'var(--text-2)', background:'rgba(30,41,59,0.7)', border:'1px solid var(--border)', borderRadius:6, padding:'2px 8px' }}>{item}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Architecture diagram */}
          <div className="glass-card" style={{ padding:20 }}>
            <div className="section-title" style={{ marginBottom:14 }}>System Architecture</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {ARCH_LAYERS.map(({ layer, items, color }, i) => (
                <div key={layer}>
                  <div style={{ border:`1px solid ${color}25`, borderRadius:10, padding:'10px 14px', background:`${color}07` }}>
                    <div style={{ fontSize:10, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>{layer}</div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {items.map(item => (
                        <span key={item} style={{ fontSize:11.5, color:'var(--text-2)', background:`${color}10`, border:`1px solid ${color}20`, borderRadius:6, padding:'3px 8px' }}>{item}</span>
                      ))}
                    </div>
                  </div>
                  {i < ARCH_LAYERS.length - 1 && (
                    <div style={{ display:'flex', justifyContent:'center', height:10, alignItems:'center' }}>
                      <div style={{ width:1, height:8, background:'var(--border)' }} />
                      <div style={{ position:'relative', top:2, left:-1, width:6, height:6, borderRight:`1.5px solid var(--border)`, borderBottom:`1.5px solid var(--border)`, transform:'rotate(45deg)' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
