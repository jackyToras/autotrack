import React, { useState } from 'react';
import { api } from '../api';
import { X } from 'lucide-react';

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
      setError(err.message || 'Failed to create vehicle');
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

        <h3 className="text-xl font-bold text-white mb-1">Add New Vehicle</h3>
        <p className="text-xs text-slate-400 mb-5">Register a car to track maintenance & calculate service intervals</p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Make *</label>
              <input
                type="text"
                required
                placeholder="e.g. Honda, Tata"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Model *</label>
              <input
                type="text"
                required
                placeholder="e.g. City, Nexon"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Year *</label>
              <input
                type="number"
                required
                min="1970"
                max="2030"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">License Plate *</label>
              <input
                type="text"
                required
                placeholder="e.g. DL 01 AB 1234"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Current Odometer (km)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 35000"
                value={currentOdometer}
                onChange={(e) => setCurrentOdometer(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">VIN (Optional)</label>
              <input
                type="text"
                placeholder="17-character VIN"
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
              {loading ? 'Adding...' : 'Save Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
