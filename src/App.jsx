import { useState } from 'react';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RetailerDashboard from './pages/RetailerDashboard';
import SupplierDashboard from './pages/SupplierDashboard';
import LeafMark from './components/LeafMark';

function App() {
  const [stage, setStage] = useState('landing'); // landing | login | app
  const [role, setRole] = useState(null);
  const [identityId, setIdentityId] = useState(null);
  const [view, setView] = useState('dashboard');
  const [initialBatchId, setInitialBatchId] = useState(null);

  const handleSelectRole = (r) => {
    setRole(r);
    setStage('login');
  };

  const handleLoginComplete = (id) => {
    setIdentityId(id);
    setStage('app');
    setView(role === 'consumer' ? 'dashboard' : role);
  };

  const handleBackToLanding = () => {
    setStage('landing');
    setRole(null);
    setIdentityId(null);
  };

  const handleViewBatch = (batchId) => {
    setInitialBatchId(batchId);
    setView('dashboard');
  };

  if (stage === 'landing') {
    return <Landing onSelectRole={handleSelectRole} />;
  }

  if (stage === 'login') {
    return <Login role={role} onComplete={handleLoginComplete} onBack={handleBackToLanding} />;
  }

  const roleLabel = role === 'supplier' ? 'supplier' : role || 'guest';

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="wordmark">
          <LeafMark size={22} />
          <span>SecureHarvest</span>
        </div>
        <div className="identity-chip">
          <span className="role">{roleLabel}</span>
          <span>{identityId || 'guest'}</span>
          <button className="linklike" onClick={handleBackToLanding}>switch role</button>
        </div>
      </div>

      <nav className="nav-bar">
        <button
          className={`nav-tab mode-consumer ${view === 'dashboard' ? 'active' : ''}`}
          onClick={() => setView('dashboard')}
        >
          Consumer Dashboard
        </button>
        <button
          className={`nav-tab mode-retailer ${view === 'retailer' ? 'active' : ''}`}
          onClick={() => setView('retailer')}
        >
          Retailer Dashboard
        </button>
        <button
          className={`nav-tab mode-supplier ${view === 'supplier' ? 'active' : ''}`}
          onClick={() => setView('supplier')}
        >
          Supplier Dashboard
        </button>
      </nav>

      {view === 'dashboard' && <Dashboard initialBatchId={initialBatchId} />}
      {view === 'retailer' && <RetailerDashboard initialRetailerId={role === 'retailer' ? identityId : null} />}
      {view === 'supplier' && <SupplierDashboard initialSupplierId={role === 'supplier' ? identityId : null} onViewBatch={handleViewBatch} />}
    </div>
  );
}

export default App;