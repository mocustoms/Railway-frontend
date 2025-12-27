import React from 'react';
import { UtensilsCrossed } from 'lucide-react';
import StatusBadge from '../StatusBadge';
import Card from '../Card';

interface Order {
  id: string;
  customerName: string;
  orderNumber: string;
  itemCount: number;
  tableNumber?: string;
  status: 'waiting' | 'ready' | 'completed' | 'canceled';
  totalAmount: number;
}

interface OrderListPanelProps {
  orders: Order[];
  selectedOrderId: string | null;
  onSelectOrder: (orderId: string) => void;
  onSeeAll: () => void;
}

const OrderListPanel: React.FC<OrderListPanelProps> = ({
  orders,
  selectedOrderId,
  onSelectOrder,
  onSeeAll
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'waiting':
        return { variant: 'warning' as const, label: 'Waiting' };
      case 'ready':
        return { variant: 'success' as const, label: 'Ready to Serve' };
      case 'completed':
        return { variant: 'info' as const, label: 'Completed' };
      case 'canceled':
        return { variant: 'error' as const, label: 'Canceled' };
      default:
        return { variant: 'default' as const, label: status };
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 border-r border-gray-200">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Order List</h2>
        <button
          onClick={onSeeAll}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          See All
        </button>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto p-4">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <UtensilsCrossed className="h-12 w-12 mb-2" />
            <p className="text-sm">No active orders</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              return (
                <Card
                  key={order.id}
                  onClick={() => onSelectOrder(order.id)}
                  className={`cursor-pointer transition-all ${
                    selectedOrderId === order.id
                      ? 'ring-2 ring-blue-500 bg-blue-50'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                        {order.customerName}
                      </h3>
                      <p className="text-xs text-gray-500 mb-2">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-gray-600">
                        {order.itemCount} items
                        {order.tableNumber && ` • Table ${order.tableNumber}`}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <StatusBadge
                      status={statusConfig.label}
                      variant={statusConfig.variant}
                      size="sm"
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderListPanel;

