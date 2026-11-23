import React, { useState } from 'react';
import { api } from '../api';
import { X } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-white mb-1">Log Maintenance / Service</h3>
        <p className="text-xs text-slate-400 mb-5">Records are stored atomically and analytics update asynchronously in Go</p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Service Type *</label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Oil & Filter Change">Oil & Filter Change</option>
              <option value="Brake Pads & Rotor Replacement">Brake Pads & Rotor Replacement</option>
              <option value="Tire Rotation & Wheel Alignment">Tire Rotation & Wheel Alignment</option>
              <option value="Battery Replacement">Battery Replacement</option>
              <option value="Major Scheduled Maintenance">Major Scheduled Maintenance</option>
              <option value="General Inspection & Fluid Flush">General Inspection & Fluid Flush</option>
              <option value="Other Repair">Other Repair</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Odometer at Service (km) *</label>
              <input
                type="number"
                required
                min="0"
                placeholder="e.g. 40000"
                value={odometerAtService}
                onChange={(e) => setOdometerAtService(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Cost (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 2500"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Service Date *</label>
              <input
                type="date"
                required
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Service Center / Mechanic</label>
              <input
                type="text"
                placeholder="e.g. Honda Authorized Service"
                value={performedBy}
                onChange={(e) => setPerformedBy(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Notes / Parts Replaced</label>
            <textarea
              rows="2"
              placeholder="e.g. Synthetic 0W-20 oil, replaced air filter and cabin filter"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Record Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
