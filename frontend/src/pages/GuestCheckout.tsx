import { FormEvent, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { api } from "../api/client";
import type { Order } from "../types";

interface GuestCheckoutState {
  variantId: number;
  variantName: string;
  price: string;
}

export function GuestCheckoutPage() {
  const location = useLocation();
  const state = location.state as GuestCheckoutState | null;

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  if (!state) {
    return (
      <div>
        <h1>到店取貨預訂</h1>
        <p>
          請先到<Link to="/">商品列表</Link>選擇要預訂的商品。
        </p>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const { data } = await api.post<Order>("/orders/guest-checkout/", {
        guest_name: guestName,
        guest_phone: guestPhone,
        items: [{ variant_id: state!.variantId, quantity }],
      });
      setOrder(data);
    } catch {
      setError("建立預訂失敗，請確認資料是否正確");
    }
  }

  if (order) {
    return (
      <div>
        <h1>預訂成功</h1>
        <p>訂單編號: #{order.id}</p>
        <p>總金額: NT$ {order.total_amount}（請於到店時以現金/行動支付付款）</p>
        <p>取貨方式: 到店取貨</p>
        <p>付款狀態: 待到店付款</p>
        <Link to="/">回到商品列表</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <h1>到店取貨預訂（免登入）</h1>
      {error && <p className="error">{error}</p>}
      <p>
        商品: {state.variantName}（NT$ {state.price}）
      </p>
      <label>
        數量
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />
      </label>
      <label>
        姓名
        <input value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
      </label>
      <label>
        聯絡電話
        <input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} required />
      </label>
      <button type="submit">送出預訂</button>
    </form>
  );
}
