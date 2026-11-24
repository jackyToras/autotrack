import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Car, Plus, Wrench, AlertTriangle, Calendar, 
  IndianRupee, Trash2, Gauge, RefreshCw, Search,
  ShieldCheck, ArrowUpRight, Flame, ChevronRight
} from 'lucide-react';
import VehicleModal from './VehicleModal';
import ServiceModal from './ServiceModal';
import TelemetryChart from './TelemetryChart';

export default function Dashboard({ user, onLogout }) {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [services, setServices] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [refreshingAnalytics, setRefreshingAnalytics] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (selectedVehicle) {
      loadVehicleData(selectedVehicle.id);
    } else {
      setServices([]);
      setAnalytics(null);
    }
  }, [selectedVehicle?.id]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await api.getVehicles();
      const list = res.data || [];
      setVehicles(list);
      if (list.length > 0 && !selectedVehicle) {
        setSelectedVehicle(list[0]);
      }
    } catch (err) {
      console.error('Failed to load vehicles', err);
    } finally {
      setLoading(false);
    }
  };

  const loadVehicleData = async (vehicleId) => {
    try {
      setRefreshingAnalytics(true);
      const [svcRes, anaRes, vRes] = await Promise.all([
        api.getServices(vehicleId),
        api.getAnalytics(vehicleId),
        api.getVehicle(vehicleId)
      ]);
      setServices(svcRes.data || []);
      setAnalytics(anaRes.data || null);
      if (vRes?.data) {
        setSelectedVehicle(vRes.data);
        setVehicles(prev => prev.map(v => v.id === vehicleId ? vRes.data : v));
      }
    } catch (err) {
      console.error('Failed to load vehicle data', err);
    } finally {
      setRefreshingAnalytics(false);
    }
  };

  const handleVehicleCreated = (newVehicle) => {
    setVehicles([newVehicle, ...vehicles]);
    setSelectedVehicle(newVehicle);
  };

  const handleServiceCreated = (newLog) => {
    setServices([newLog, ...services]);
    if (selectedVehicle) {
      loadVehicleData(selectedVehicle.id);
    }
  };

  const handleDeleteService = async (logId) => {
    if (!window.confirm('Delete this service record?')) return;
    try {
      await api.deleteService(selectedVehicle.id, logId);
      setServices(services.filter(s => s.id !== logId));
      loadVehicleData(selectedVehicle.id);
    } catch (err) {
      alert(err.message || 'Failed to delete service log');
    }
  };

  const handleDeleteVehicle = async () => {
    if (!window.confirm(`Delete ${selectedVehicle.make} ${selectedVehicle.model}? All telemetry logs will be wiped.`)) return;
    try {
      await api.deleteVehicle(selectedVehicle.id);
      const remaining = vehicles.filter(v => v.id !== selectedVehicle.id);
      setVehicles(remaining);
      setSelectedVehicle(remaining[0] || null);
    } catch (err) {
      alert(err.message || 'Failed to delete vehicle');
    }
  };

  const filteredServices = services.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.service_type?.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q) ||
      s.performed_by?.toLowerCase().includes(q)
    );
  });

  const targetMilestone = analytics?.next_service_due_mileage || (selectedVehicle?.current_odometer + 5000);
  const cycleDistance = 5000;
  const cycleDriven = cycleDistance - Math.max(0, targetMilestone - (selectedVehicle?.current_odometer || 0));
  const progressPct = Math.min(100, Math.max(0, Math.round((cycleDriven / cycleDistance) * 100)));

  const activeAlerts = (analytics?.alerts || []).filter((a) => {
    if (a.is_completed) return false;
    if (a.due_mileage && services.some((s) => s.odometer_at_service >= a.due_mileage)) return false;
    if (a.due_mileage && (selectedVehicle?.current_odometer || 0) >= a.due_mileage && (targetMilestone - (selectedVehicle?.current_odometer || 0)) > 500) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-transparent text-[#F3F4F6] selection:bg-red-600 selection:text-white">
      <header className="sticky top-0 z-50 bg-[#08090E]/80 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2.5 group cursor-pointer">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] group-hover:scale-105 transition-transform duration-300">
                  <Flame className="w-5 h-5 fill-white text-white" />
                </div>
                <div>
                  <div className="text-lg font-black tracking-wider uppercase text-white flex items-center gap-1.5">
                    AUTOTRACK
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.08] text-red-400 font-semibold border border-red-500/20">
                      GT-9
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search work orders, components, service bays..."
                  className="w-full bg-[#10121A] border border-white/[0.08] hover:border-white/[0.15] focus:border-red-500 rounded-full pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#10121A] border border-white/[0.06] text-[11px] font-mono text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>ONLINE // {user?.name || 'OPERATOR'}</span>
              </div>

              <div className="flex items-center gap-2 border-l border-white/[0.08] pl-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-white/[0.15] flex items-center justify-center text-xs font-bold text-white uppercase shadow-inner">
                  {user?.name ? user.name.slice(0, 2) : 'AU'}
                </div>
                <button
                  onClick={onLogout}
                  className="text-xs text-slate-400 hover:text-white transition px-2 py-1 rounded hover:bg-white/[0.05]"
                  title="Sign out of console"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/[0.05] py-2.5 overflow-x-auto gap-2 scrollbar-none">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mr-1 hidden sm:inline">GARAGE:</span>
              {vehicles.map((v) => {
                const isActive = selectedVehicle?.id === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVehicle(v)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 transition-all duration-200 whitespace-nowrap ${
                      isActive
                        ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]'
                        : 'bg-[#10121A] text-slate-400 hover:text-white hover:bg-[#161824] border border-white/[0.05]'
                    }`}
                  >
                    <Car className="w-3.5 h-3.5" />
                    <span>{v.year} {v.make} {v.model}</span>
                    <span className={`text-[10px] font-mono ${isActive ? 'text-red-200' : 'text-slate-500'}`}>
                      {v.license_plate}
                    </span>
                  </button>
                );
              })}

              <button
                onClick={() => setIsVehicleModalOpen(true)}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#10121A] hover:bg-white/[0.08] border border-dashed border-white/[0.15] text-slate-300 flex items-center gap-1.5 transition whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5 text-red-500" /> Add Machine
              </button>
            </div>

            {selectedVehicle && (
              <div className="flex items-center gap-2 pl-4">
                <button
                  onClick={() => setIsServiceModalOpen(true)}
                  className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] flex items-center gap-1.5 transition-all duration-200 hover:scale-105"
                >
                  <Wrench className="w-3.5 h-3.5" /> Log Service
                </button>
                <button
                  onClick={handleDeleteVehicle}
                  className="p-1.5 rounded-full text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                  title="Delete machine"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <div className="text-xs font-mono tracking-widest text-slate-500 uppercase">Synchronizing Telemetry...</div>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="bg-[#0A0B10]/85 border border-white/[0.08] rounded-3xl p-16 text-center max-w-lg mx-auto shadow-2xl relative overflow-hidden backdrop-blur-xl">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600/20 to-transparent border border-red-500/30 flex items-center justify-center mx-auto mb-5 text-red-500 shadow-[0_0_30px_rgba(220,38,38,0.2)]">
              <Car className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Garage Empty</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Initialize telemetry tracking by onboarding your primary vehicle.
            </p>
            <button
              onClick={() => setIsVehicleModalOpen(true)}
              className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider transition shadow-[0_0_20px_rgba(220,38,38,0.4)]"
            >
              Register Machine
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {activeAlerts.length > 0 && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/60 via-red-900/30 to-black border border-red-500/50 shadow-[0_0_30px_rgba(220,38,38,0.25)] flex items-start justify-between gap-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-red-600 text-white shadow-lg">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold uppercase tracking-widest text-red-400">
                      SERVICE ALERT // INTERVAL THRESHOLD EXCEEDED
                    </div>
                    <div className="text-sm font-semibold text-white mt-0.5">
                      {activeAlerts[0].title}: {activeAlerts[0].description}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsServiceModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider whitespace-nowrap transition"
                >
                  Book Service
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0B0C12]/80 backdrop-blur-md border border-white/[0.08] hover:border-red-500/50 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_-10px_rgba(220,38,38,0.25)] relative group overflow-hidden">
                <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono uppercase tracking-wider mb-2">
                  <span>Current Odometer</span>
                  <Gauge className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-3xl font-black tracking-tight text-white font-mono">
                  {selectedVehicle?.current_odometer.toLocaleString()}
                  <span className="text-sm font-normal text-slate-500 ml-1">km</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-3 flex items-center justify-between border-t border-white/[0.05] pt-2">
                  <span>Daily velocity:</span>
                  <span className="text-red-400 font-semibold">{analytics?.estimated_daily_mileage || 35} km/d</span>
                </div>
              </div>

              <div className="bg-[#0B0C12]/80 backdrop-blur-md border border-white/[0.08] hover:border-red-500/50 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_-10px_rgba(220,38,38,0.25)] relative group overflow-hidden">
                <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono uppercase tracking-wider mb-2">
                  <span>Service Horizon</span>
                  <Calendar className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-3xl font-black tracking-tight text-white font-mono">
                  {analytics?.next_service_due_mileage ? `${analytics.next_service_due_mileage.toLocaleString()}` : '5,000'}
                  <span className="text-sm font-normal text-slate-500 ml-1">km</span>
                </div>
                <div className="mt-2.5">
                  <div className="h-1.5 w-full bg-[#181A25] rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${progressPct > 90 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-amber-500'}`}
                      style={{ width: `${progressPct}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-2 flex items-center justify-between">
                  <span>Est. window:</span>
                  <span className="text-slate-300 font-medium">
                    {analytics?.next_service_due_estimate 
                      ? new Date(analytics.next_service_due_estimate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) 
                      : 'Upcoming'}
                  </span>
                </div>
              </div>

              <div className="bg-[#0B0C12]/80 backdrop-blur-md border border-white/[0.08] hover:border-red-500/50 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_-10px_rgba(220,38,38,0.25)] relative group overflow-hidden">
                <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono uppercase tracking-wider mb-2">
                  <span>Total Capital Outlay</span>
                  <IndianRupee className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-3xl font-black tracking-tight text-white font-mono">
                  ₹{analytics?.total_cost_spent?.toLocaleString() || '0'}
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-3 flex items-center justify-between border-t border-white/[0.05] pt-2">
                  <span>History audit:</span>
                  <span className="text-emerald-400 font-semibold">{analytics?.total_service_count || 0} entries</span>
                </div>
              </div>

              <div className="bg-[#0B0C12]/80 backdrop-blur-md border border-white/[0.08] hover:border-red-500/50 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_-10px_rgba(220,38,38,0.25)] relative group overflow-hidden">
                <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono uppercase tracking-wider mb-2">
                  <span>Cost Efficiency</span>
                  <ShieldCheck className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-3xl font-black tracking-tight text-white font-mono">
                  ₹{analytics?.average_cost_per_service?.toLocaleString() || '0'}
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-3 flex items-center justify-between border-t border-white/[0.05] pt-2">
                  <span>Operating health:</span>
                  <button 
                    onClick={() => loadVehicleData(selectedVehicle.id)}
                    className="hover:text-white transition flex items-center gap-1 text-slate-400"
                    title="Refresh telemetry"
                  >
                    <span>Optimal</span>
                    <RefreshCw className={`w-3 h-3 ${refreshingAnalytics ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            <TelemetryChart 
              services={services} 
              currentOdometer={selectedVehicle?.current_odometer || 0} 
            />

            <div className="bg-[#0A0B10]/80 border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
              <div className="p-5 border-b border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-mono uppercase tracking-widest text-red-500">Service Audit Logs</div>
                  <h4 className="text-base font-bold text-white mt-0.5">Historical Work Orders & Component Replacements</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-[#12141D] text-slate-400 px-3 py-1 rounded-full border border-white/[0.06]">
                    {filteredServices.length} Records Verified
                  </span>
                </div>
              </div>

              {filteredServices.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs font-mono">
                  No telemetry logs matching criteria. Click <span className="text-red-400 font-bold">Log Service</span> to record an event.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#0E1018] text-slate-400 uppercase tracking-wider text-[10px] border-b border-white/[0.06]">
                      <tr>
                        <th className="py-3 px-5">Work Order</th>
                        <th className="py-3 px-5">Odometer</th>
                        <th className="py-3 px-5">Date</th>
                        <th className="py-3 px-5">Expense</th>
                        <th className="py-3 px-5">Technician / Bay</th>
                        <th className="py-3 px-5">Diagnostic Notes</th>
                        <th className="py-3 px-5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {filteredServices.map((s) => (
                        <tr key={s.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="py-3.5 px-5 font-semibold text-white flex items-center gap-2 font-sans">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            {s.service_type}
                          </td>
                          <td className="py-3.5 px-5 text-slate-300">
                            {s.odometer_at_service.toLocaleString()} km
                          </td>
                          <td className="py-3.5 px-5 text-slate-400">
                            {new Date(s.service_date).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-5 font-bold text-emerald-400">
                            ₹{s.cost.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-5 text-slate-400 font-sans">
                            {s.performed_by || '—'}
                          </td>
                          <td className="py-3.5 px-5 text-slate-500 max-w-xs truncate font-sans">
                            {s.description || '—'}
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <button
                              onClick={() => handleDeleteService(s.id)}
                              className="text-slate-600 hover:text-red-400 p-1 transition"
                              title="Delete record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <VehicleModal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        onVehicleCreated={handleVehicleCreated}
      />

      <ServiceModal
        isOpen={isServiceModalOpen}
        vehicleId={selectedVehicle?.id}
        onClose={() => setIsServiceModalOpen(false)}
        onServiceCreated={handleServiceCreated}
      />
    </div>
  );
}
