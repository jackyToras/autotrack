import React, { useState } from 'react';
import { api } from '../api';
import { X, Wrench } from 'lucide-react';

export default function ServiceModal({ isOpen, onClose, vehicleId, onServiceCreated }) {
  const [serviceType, setServiceType] = useState('Oil & Filter Change');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [odometerAtService, setOdometerAtService] = useState('');
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [performedBy, setPerformedBy] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.createService(vehicleId, {
        service_type: serviceType,
        description,
        cost: parseFloat(cost) || 0,
        odometer_at_service: parseInt(odometerAtService, 10),
        service_date: new Date(serviceDate).toISOString(),
        performed_by: performedBy,
      });
      onServiceCreated(res.data);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record service log');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#090A10] border border-white/[0.1] rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-500 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30">
            <Wrench className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight uppercase">Log Maintenance Telemetry</h3>
        </div>
        <p className="text-xs font-mono text-slate-500 mb-6">Recorded atomically with background telemetry recalculation</p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block text-slate-400 uppercase tracking-wider mb-1.5">Service Classification *</label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full bg-[#11131C] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-red-500 transition"
            >
              <option value="Oil & Filter Change">Oil & Filter Change</option>
              <option value="Brake Pads & Rotor Replacement">Brake Pads & Rotor Replacement</option>
              <option value="Tire Rotation & Wheel Alignment">Tire Rotation & Wheel Alignment</option>
              <option value="Battery Replacement">Battery Replacement</option>
              <option value="Major Scheduled Maintenance">Major Scheduled Maintenance</option>
              <option value="General Inspection & Fluid Flush">General Inspection & Fluid Flush</option>
              <option value="Transmission & Differential Service">Transmission & Differential Service</option>
              <option value="Suspension & Steering Overhaul">Suspension & Steering Overhaul</option>
              <option value="Other Performance Service">Other Performance Service</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 uppercase tracking-wider mb-1.5">Odometer at Service (km) *</label>
              <input
                type="number"
                required
                min="0"
                placeholder="e.g. 34600"
                value={odometerAtService}
                onChange={(e) => setOdometerAtService(e.target.value)}
                className="w-full bg-[#11131C] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-red-500 transition"
              />
            </div>
            <div>
              <label className="block text-slate-400 uppercase tracking-wider mb-1.5">Expense (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 2500"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full bg-[#11131C] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-red-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 uppercase tracking-wider mb-1.5">Event Date *</label>
              <input
                type="date"
                required
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className="w-full bg-[#11131C] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-red-500 transition"
              />
            </div>
            <div>
              <label className="block text-slate-400 uppercase tracking-wider mb-1.5">Technician / Workshop</label>
              <input
                type="text"
                placeholder="e.g. Porsche Centre / City Bay"
                value={performedBy}
                onChange={(e) => setPerformedBy(e.target.value)}
                className="w-full bg-[#11131C] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-red-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 uppercase tracking-wider mb-1.5">Diagnostic & Work Notes</label>
            <textarea
              rows="2"
              placeholder="e.g. Motul 300V synthetic oil, replaced OEM oil filter and brake wear sensors"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#11131C] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-red-500 transition"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition font-sans text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-[0_0_20px_rgba(220,38,38,0.4)] disabled:opacity-50"
            >
              {loading ? 'Committing...' : 'Commit Work Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
