import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useCart } from "../context/CartContext";

export function CartPage() {
  const { cart, refreshCart, updateItem, removeItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  if (!cart) return <p>載入中...</p>;

  if (cart.items.length === 0) {
    return (
      <div>
        <h1>購物車</h1>
        <p>
          購物車是空的，<Link to="/">去逛逛商品</Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>購物車</h1>
      <table className="cart-table">
        <thead>
          <tr>
            <th>商品</th>
            <th>單價</th>
            <th>數量</th>
            <th>小計</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {cart.items.map((item) => (
            <tr key={item.id}>
              <td>
                {item.listing
                  ? `${item.listing.product.name}（${item.listing.franchise_brand_name}）`
                  : `${item.combo_listing!.combo.name}［套餐］（${item.combo_listing!.franchise_brand_name}）`}
              </td>
              <td>NT$ {item.listing ? item.listing.price : item.combo_listing!.price}</td>
              <td>
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, Number(e.target.value))}
                />
              </td>
              <td>NT$ {item.subtotal}</td>
              <td>
                <button onClick={() => removeItem(item.id)}>移除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="total">總計: NT$ {cart.total}</p>
      <button onClick={() => navigate("/checkout")}>前往結帳</button>
    </div>
  );
}
