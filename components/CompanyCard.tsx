import { useState, useEffect } from 'react';
import api from '../lib/api';
import Documents from './Documents';
import Card from './ui/Card';
import Button from './ui/Button';

interface Company {
  id: number;
  legalName: string;
  jurisdiction: string;
  status: string;
}

export default function CompanyCard({ company, onRefresh }: { company: Company; onRefresh: () => void }) {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Array<any>>([]);

  const loadOrders = async () => {
    const { data } = await api.get('/orders');
    setOrders(data.filter((o: any) => o.companyId === company.id));
  };

  useEffect(() => {
    loadOrders();
  }, [company.id]);

  const createOrder = async () => {
    setLoading(true);
    try {
      await api.post('/orders/demo', { companyId: company.id });
      await loadOrders();
    } finally {
      setLoading(false);
    }
  };

  const payOrder = async (orderId: number) => {
    setLoading(true);
    try {
      await api.post(`/orders/${orderId}/pay`);
      await loadOrders();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <div className="flex-grow">
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-bold text-white">{company.legalName}</h2>
          <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-300">
            {company.status}
          </span>
        </div>
        <p className="text-sm text-gray-400 mt-1">{company.jurisdiction}</p>

        <div className="mt-4">
          {orders.length === 0 ? (
            <Button disabled={loading} variant="secondary" size="sm" onClick={createOrder}>
              {loading ? 'Creating…' : 'Create Demo Order'}
            </Button>
          ) : (
            orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 mt-2 bg-gray-900/50 p-2 rounded-lg">
                <span className="text-sm text-gray-300">Order #{o.id} – <span className="font-semibold">{o.state}</span></span>
                {o.state === 'PENDING' && (
                  <Button disabled={loading} variant="primary" size="sm" onClick={() => payOrder(o.id)}>
                    {loading ? 'Paying…' : 'Simulate Pay'}
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-gray-700/50 pt-4">
        <Documents companyId={company.id} />
      </div>
    </Card>
  );
}
