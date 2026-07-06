import React, { useState } from 'react';
import Layout from './components/Layout';
import DashboardView from './components/DashboardView';
import InputFormView from './components/InputFormView';

function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');

  const renderActiveView = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'input':
        return <InputFormView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <Layout currentTab={currentTab} setCurrentTab={setCurrentTab}>
      {renderActiveView()}
    </Layout>
  );
}

export default App;
