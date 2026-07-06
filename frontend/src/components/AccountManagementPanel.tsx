import { FormEvent, useEffect, useState } from "react";

import { api } from "../api/client";
import type { ManagedAccount, ManagedAccountInput } from "../types";

const emptyForm: ManagedAccountInput = {
  username: "",
  password: "",
  name: "",
  email: "",
  mobile: "",
  phone: "",
};

export function AccountManagementPanel({
  title,
  createLabel,
  endpoint,
}: {
  title: string;
  createLabel: string;
  endpoint: string;
}) {
  const [accounts, setAccounts] = useState<ManagedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ManagedAccountInput>(emptyForm);
  const [passwordResets, setPasswordResets] = useState<Record<number, string>>({});

  async function reload() {
    const { data } = await api.get<ManagedAccount[]>(endpoint);
    setAccounts(data);
  }

  useEffect(() => {
    reload().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    await api.post(endpoint, form);
    setForm(emptyForm);
    await reload();
  }

  async function handleUpdate(id: number, changes: Partial<ManagedAccountInput>) {
    await api.patch(`${endpoint}${id}/`, changes);
    await reload();
  }

  async function handleResetPassword(id: number) {
    const password = passwordResets[id];
    if (!password) return;
    await handleUpdate(id, { password });
    setPasswordResets((prev) => ({ ...prev, [id]: "" }));
  }

  return (
    <div className="erp-panel">
      <div className="erp-panel-title">{title}</div>
      <div className="erp-panel-body">
        <form onSubmit={handleCreate} className="erp-group">
          <div className="erp-group-title">{createLabel}</div>
          <div className="actions">
            <input
              placeholder="帳號"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder="密碼(至少8碼)"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <input
              placeholder="姓名"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              placeholder="手機"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
            />
            <input
              placeholder="電話"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <button type="submit">{createLabel}</button>
          </div>
        </form>

        {loading ? (
          <p>載入中...</p>
        ) : accounts.length === 0 ? (
          <p>尚無帳號</p>
        ) : (
          <table className="erp-table">
            <thead>
              <tr>
                <th>帳號</th>
                <th>姓名</th>
                <th>Email</th>
                <th>手機</th>
                <th>電話</th>
                <th>重設密碼</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id}>
                  <td>{account.username}</td>
                  <td>
                    <input
                      defaultValue={account.name}
                      onBlur={(e) =>
                        e.target.value !== account.name &&
                        handleUpdate(account.id, { name: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      defaultValue={account.email}
                      onBlur={(e) =>
                        e.target.value !== account.email &&
                        handleUpdate(account.id, { email: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      defaultValue={account.mobile}
                      onBlur={(e) =>
                        e.target.value !== account.mobile &&
                        handleUpdate(account.id, { mobile: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      defaultValue={account.phone}
                      onBlur={(e) =>
                        e.target.value !== account.phone &&
                        handleUpdate(account.id, { phone: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="password"
                      placeholder="新密碼"
                      value={passwordResets[account.id] ?? ""}
                      onChange={(e) =>
                        setPasswordResets((prev) => ({ ...prev, [account.id]: e.target.value }))
                      }
                    />
                    <button onClick={() => handleResetPassword(account.id)}>重設</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
