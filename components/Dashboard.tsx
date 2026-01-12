import React, { useMemo } from 'react';
import { Delivery, EPI, Collaborator } from '../types';
import { calculateStatus } from '../utils/helpers';
import { Clock, ShieldAlert, Users, HardHat } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface DashboardProps {
  deliveries: Delivery[];
  epis: EPI[];
  collaborators: Collaborator[];
}

export const Dashboard: React.FC<DashboardProps> = ({ deliveries, epis, collaborators }) => {
  const stats = useMemo(() => {
    let vencido = 0;
    let aVencer = 0;
    let ok = 0;

    deliveries.forEach(d => {
      if (d.predictedReplacementDate) {
        const status = calculateStatus(d.predictedReplacementDate);
        if (status === 'VENCIDO') vencido++;
        else if (status === 'A VENCER') aVencer++;
        else ok++;
      } else {
        ok++;
      }
    });

    const activeCollaborators = collaborators.filter(c => c.active).length;
    const totalEpis = epis.length;

    return { vencido, aVencer, ok, activeCollaborators, totalEpis };
  }, [deliveries, collaborators, epis]);

  const consumptionData = useMemo(() => {
    const counts: Record<string, number> = {};
    deliveries.forEach(d => {
      const epiName = epis.find(e => e.id === d.epiId)?.description || d.epiId;
      counts[epiName] = (counts[epiName] || 0) + d.quantity;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [deliveries, epis]);

  const statusData = [
    { name: 'Vencido', value: stats.vencido, color: '#EF4444' },
    { name: 'A Vencer', value: stats.aVencer, color: '#F59E0B' },
    { name: 'Em Dia', value: stats.ok, color: '#10B981' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Visão Geral</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Alertas de Vencimento</p>
            <p className="text-3xl font-bold text-red-600">{stats.vencido}</p>
          </div>
          <div className="bg-red-100 p-3 rounded-full">
            <ShieldAlert className="text-red-600" size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">A Vencer (15 dias)</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.aVencer}</p>
          </div>
          <div className="bg-yellow-100 p-3 rounded-full">
            <Clock className="text-yellow-600" size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Itens no Catálogo</p>
            <p className="text-3xl font-bold text-blue-600">{stats.totalEpis}</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-full">
            <HardHat className="text-blue-600" size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Colaboradores</p>
            <p className="text-3xl font-bold text-green-600">{stats.activeCollaborators}</p>
          </div>
          <div className="bg-green-100 p-3 rounded-full">
            <Users className="text-green-600" size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Top 5 EPIs Entregues</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={consumptionData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} name="Quantidade" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Status das Entregas</h3>
          <div className="h-64">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                Sem dados de entregas vigentes.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};