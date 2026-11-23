import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Car, Plus, Wrench, AlertTriangle, Calendar, 
  IndianRupee, Trash2, Gauge, RefreshCw, Zap
} from 'lucide-react';
import VehicleModal from './VehicleModal';
import ServiceModal from './ServiceModal';

export default function Dashboard({ user, onLogout }) {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [services, setServices] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [refreshingAnalytics, setRefreshingAnalytics] = useState(false);

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
  }, [selectedVehicle]);

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
      const [svcRes, anaRes] = await Promise.all([
        api.getServices(vehicleId),
        api.getAnalytics(vehicleId)
      ]);
      setServices(svcRes.data || []);
      setAnalytics(anaRes.data || null);
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
    if (!window.confirm(`Are you sure you want to delete ${selectedVehicle.make} ${selectedVehicle.model}? All associated service logs will be removed.`)) return;
    try {
      await api.deleteVehicle(selectedVehicle.id);
      const remaining = vehicles.filter(v => v.id !== selectedVehicle.id);
      setVehicles(remaining);
      setSelectedVehicle(remaining[0] || null);
    } catch (err) {
      alert(err.message || 'Failed to delete vehicle');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold tracking-tight text-white flex items-center gap-2">
                AutoTrack <span className="text-[10px] uppercase tracking-wider bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">Go Backend</span>
              </div>
              <div className="text-xs text-slate-400">Automotive Intelligence & Service Engine</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-white">{user?.name}</div>
              <div className="text-xs text-slate-400">{user?.email}</div>
            </div>
            <button
              onClick={onLogout}
              className="text-xs px-3 py-1.5 border border-slate-700 hover:border-slate-500 rounded-lg text-slate-300 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            {vehicles.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVehicle(v)}
                className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition whitespace-nowrap ${
                  selectedVehicle?.id === v.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Car className="w-4 h-4" />
                <span>{v.year} {v.make} {v.model}</span>
                <span className="text-xs opacity-60">({v.license_plate})</span>
              </button>
            ))}

            <button
              onClick={() => setIsVehicleModalOpen(true)}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-dashed border-slate-700 hover:border-slate-500 text-slate-300 rounded-xl text-sm font-medium flex items-center gap-1.5 transition whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Add Vehicle
            </button>
          </div>

          {selectedVehicle && (
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                onClick={() => setIsServiceModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl flex items-center gap-2 transition shadow-lg shadow-emerald-600/20"
              >
                <Wrench className="w-4 h-4" /> Log Service
              </button>
              <button
                onClick={handleDeleteVehicle}
                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl border border-transparent hover:border-red-500/20 transition"
                title="Delete Vehicle"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400">Loading your vehicle garage...</div>
        ) : vehicles.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto">
            <Car className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Vehicles Registered Yet</h3>
            <p className="text-sm text-slate-400 mb-6">
              Add your first car to start recording service history and projecting maintenance intervals.
            </p>
            <button
              onClick={() => setIsVehicleModalOpen(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition shadow-lg shadow-blue-600/30"
            >
              Register Your Vehicle
            </button>
          </div>
        ) : (
          <div>
            {analytics?.alerts && analytics.alerts.length > 0 && (
              <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-amber-300 text-sm">
                    {analytics.alerts[0].title}
                  </div>
                  <div className="text-xs text-amber-200/80 mt-0.5">
                    {analytics.alerts[0].description}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase mb-2">
                  <span>Current Odometer</span>
                  <Gauge className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {selectedVehicle?.current_odometer.toLocaleString()} <span className="text-sm font-normal text-slate-400">km</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                  <span>Est. daily:</span>
                  <span className="text-slate-300 font-medium">{analytics?.estimated_daily_mileage || 35} km/day</span>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase mb-2">
                  <span>Next Service Due</span>
                  <Calendar className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {analytics?.next_service_due_mileage ? `${analytics.next_service_due_mileage.toLocaleString()} km` : 'N/A'}
                </div>
                <div className="text-[11px] text-slate-500 mt-2">
                  {analytics?.next_service_due_estimate 
                    ? `Estimated by: ${new Date(analytics.next_service_due_estimate).toLocaleDateString()}` 
                    : 'Schedule upcoming'}
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase mb-2">
                  <span>Total Spent</span>
                  <IndianRupee className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-white">
                  ₹{analytics?.total_cost_spent?.toLocaleString() || '0'}
                </div>
                <div className="text-[11px] text-slate-500 mt-2">
                  Across {analytics?.total_service_count || 0} service logs
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase mb-2">
                  <span>Redis Engine</span>
                  <Zap className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-sm font-semibold text-purple-300">
                  Sub-millisecond Cache
                </div>
                <div className="text-[10px] text-slate-500 mt-2 flex items-center justify-between">
                  <span>Precomputed in Go</span>
                  <button 
                    onClick={() => loadVehicleData(selectedVehicle.id)}
                    className="hover:text-white transition flex items-center gap-1"
                    title="Refresh cache"
                  >
                    <RefreshCw className={`w-3 h-3 ${refreshingAnalytics ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-white">Maintenance History & Work Orders</h4>
                  <p className="text-xs text-slate-400 mt-0.5">ACID transactional logs recorded via GORM & PostgreSQL</p>
                </div>
                <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full font-medium border border-slate-700">
                  {services.length} Records
                </span>
              </div>

              {services.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No service logs recorded yet for this vehicle. Click <span className="text-emerald-400 font-medium">Log Service</span> above to add one.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950/50 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-3.5 px-5">Service Type</th>
                        <th className="py-3.5 px-5">Odometer</th>
                        <th className="py-3.5 px-5">Date</th>
                        <th className="py-3.5 px-5">Cost</th>
                        <th className="py-3.5 px-5">Service Center</th>
                        <th className="py-3.5 px-5">Notes</th>
                        <th className="py-3.5 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {services.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3.5 px-5 font-medium text-white flex items-center gap-2">
                            <Wrench className="w-3.5 h-3.5 text-blue-400" />
                            {s.service_type}
                          </td>
                          <td className="py-3.5 px-5 text-slate-300">
                            {s.odometer_at_service.toLocaleString()} km
                          </td>
                          <td className="py-3.5 px-5 text-slate-300">
                            {new Date(s.service_date).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-5 font-semibold text-emerald-400">
                            ₹{s.cost.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-5 text-slate-400 text-xs">
                            {s.performed_by || '—'}
                          </td>
                          <td className="py-3.5 px-5 text-slate-400 text-xs max-w-xs truncate">
                            {s.description || '—'}
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <button
                              onClick={() => handleDeleteService(s.id)}
                              className="text-slate-500 hover:text-red-400 p-1 transition"
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
