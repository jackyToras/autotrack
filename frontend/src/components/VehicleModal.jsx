import React, { useState } from 'react';
import { api } from '../api';
import { X, Car } from 'lucide-react';

export default function VehicleModal({ isOpen, onClose, onVehicleCreated }) {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [licensePlate, setLicensePlate] = useState('');
  const [vin, setVin] = useState('');
  const [currentOdometer, setCurrentOdometer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.createVehicle({
        make,
        model,
        year: parseInt(year, 10),
        license_plate: licensePlate,
        vin,
        current_odometer: parseInt(currentOdometer, 10) || 0,
      });
      onVehicleCreated(res.data);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to register machine');
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
            <Car className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight uppercase">Onboard Vehicle</h3>
        </div>
        <p className="text-xs font-mono text-slate-500 mb-6">Initialize telemetry tracking parameters for garage asset</p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 uppercase tracking-wider mb-1.5">Manufacturer *</label>
              <input
                type="text"
                required
                placeholder="e.g. Porsche, Honda"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className="w-full bg-[#11131C] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-red-500 transition"
              />
            </div>
            <div>
              <label className="block text-slate-400 uppercase tracking-wider mb-1.5">Model Designation *</label>
              <input
                type="text"
                required
                placeholder="e.g. 911 GT3, City"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-[#11131C] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-red-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 uppercase tracking-wider mb-1.5">Model Year *</label>
              <input
                type="number"
                required
                min="1970"
                max="2030"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-[#11131C] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-red-500 transition"
              />
            </div>
            <div>
              <label className="block text-slate-400 uppercase tracking-wider mb-1.5">Registration Plate *</label>
              <input
                type="text"
                required
                placeholder="e.g. MH 01 AB 9911"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                className="w-full bg-[#11131C] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-red-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 uppercase tracking-wider mb-1.5">Initial Odometer (km)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 15000"
                value={currentOdometer}
                onChange={(e) => setCurrentOdometer(e.target.value)}
                className="w-full bg-[#11131C] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-red-500 transition"
              />
            </div>
            <div>
              <label className="block text-slate-400 uppercase tracking-wider mb-1.5">Chassis / VIN</label>
              <input
                type="text"
                placeholder="17-Digit VIN"
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                className="w-full bg-[#11131C] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-red-500 transition"
              />
            </div>
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
              {loading ? 'Registering...' : 'Register Machine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
