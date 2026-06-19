import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../api/client";
import { useCart } from "../context/CartContext";
import type { Order } from "../types";

export function CheckoutPage() {
  const { cart, refreshCart } = useCart();
  const [address, setAddress] = useState("");
  const [method, setMethod] = useState("credit_card");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const { data } = await api.post<Order>("/orders/checkout/", {
        shipping_address: address,
        payment_method: method,
      });
      setOrder(data);
      await refreshCart();
    } catch {
      setError("結帳失敗，請確認購物車內容");
    }
  }

  async function handleConfirmPayment() {
    if (!order) return;
    const { data } = await api.post<Order>(`/orders/${order.id}/payment/confirm/`, {
      transaction_id: `TEST-${Date.now()}`,
    });
    setOrder(data);
  }

  if (order) {
    return (
      <div>
        <h1>訂單已建立</h1>
        <p>訂單編號: #{order.id}</p>
        <p>總金額: NT$ {order.total_amount}</p>
        <p>付款狀態: {order.payment?.status}</p>
        {order.payment?.status === "pending" && (
          <button onClick={handleConfirmPayment}>模擬完成電子支付</button>
        )}
        {order.payment?.status === "success" && (
          <button onClick={() => navigate("/orders")}>查看我的訂單</button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <h1>結帳台</h1>
      {error && <p className="error">{error}</p>}
      <p>購物車總計: NT$ {cart?.total ?? 0}</p>
      <label>
        收件地址
        <input value={address} onChange={(e) => setAddress(e.target.value)} required />
      </label>
      <label>
        付款方式
        <select value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="credit_card">信用卡</option>
          <option value="line_pay">LINE Pay</option>
          <option value="atm">ATM 轉帳</option>
        </select>
      </label>
      <button type="submit">送出訂單</button>
    </form>
  );
}
