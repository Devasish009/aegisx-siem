import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topnav from './Topnav';
import { getSocket } from '../../utils/socket';

export default function Layout() {
  const [alertCount, setAlertCount] = useState(0);
  const [threatLevel, setThreatLevel] = useState(38);

  useEffect(() => {
    const socket = getSocket();
    socket.on('threat_alert', (data) => {
      if (data.severity === 'CRITICAL' || data.severity === 'HIGH') {
        setAlertCount(c => c + 1);
        setThreatLevel(prev => Math.min(95, prev + (data.severity === 'CRITICAL' ? 8 : 4)));
      }
    });
    // Slowly decay threat level
    const decay = setInterval(() => {
      setThreatLevel(prev => Math.max(15, prev - 0.5));
    }, 5000);
    return () => {
      socket.off('threat_alert');
      clearInterval(decay);
    };
  }, []);

  return (
    <div className="flex min-h-screen">
      <div className="scan-line" />
      <div className="hex-bg" />
      <Sidebar alertCount={alertCount} threatLevel={threatLevel} />
      <div className="ml-[220px] flex-1 flex flex-col min-h-screen relative z-10">
        <Topnav alertCount={alertCount} />
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
