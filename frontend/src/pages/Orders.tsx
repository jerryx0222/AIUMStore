import { useEffect, useState } from "react";

import { api } from "../api/client";
import type { Order } from "../types";

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    api.get<Order[]>("/orders/").then(({ data }) => setOrders(data));
  }, []);

  return (
    <div>
      <h1>我的訂單</h1>
      {orders.length === 0 && <p>尚無訂單</p>}
      <ul className="order-list">
        {orders.map((order) => (
          <li key={order.id}>
            訂單 #{order.id} - {order.status} - NT$ {order.total_amount}
          </li>
        ))}
      </ul>
    </div>
  );
}
