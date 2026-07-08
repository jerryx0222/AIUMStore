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
  queryParams,
}: {
  title: string;
  createLabel: string;
  endpoint: string;
  queryParams?: Record<string, string | number>;
}) {
  const [accounts, setAccounts] = useState<ManagedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ManagedAccountInput>(emptyForm);
  const [passwordReset, setPasswordReset] = useState("");
  const [selectedId, setSelectedId] = useState<number | "">("");

  async function reload() {
    const { data } = await api.get<ManagedAccount[]>(endpoint, { params: queryParams });
    setAccounts(data);
  }

  useEffect(() => {
    reload().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, JSON.stringify(queryParams)]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    await api.post(endpoint, form, { params: queryParams });
    setForm(emptyForm);
    await reload();
  }

  async function handleUpdate(id: number, changes: Partial<ManagedAccountInput>) {
    await api.patch(`${endpoint}${id}/`, changes);
    await reload();
  }

  async function handleResetPassword(id: number) {
    if (!passwordReset) return;
    await handleUpdate(id, { password: passwordReset });
    setPasswordReset("");
  }

  async function handleDelete(id: number) {
    if (!window.confirm("確定要刪除此帳號嗎?")) return;
    try {
      await api.delete(`${endpoint}${id}/`);
      setSelectedId("");
      await reload();
    } catch (error: any) {
      const data = error?.response?.data;
      const message = data?.detail ?? (Array.isArray(data) ? data[0] : data) ?? "刪除失敗，請稍後再試";
      alert(typeof message === "string" ? message : JSON.stringify(message));
    }
  }

  const selectedAccount = accounts.find((a) => a.id === selectedId);

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
          <div className="erp-group">
            <div className="actions">
              <select
                value={selectedId}
                onChange={(e) => {
                  setSelectedId(e.target.value ? Number(e.target.value) : "");
                  setPasswordReset("");
                }}
              >
                <option value="">選擇帳號</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.username}（{account.name || "未填姓名"}）
                  </option>
                ))}
              </select>
            </div>

            {selectedAccount && (
              <table className="erp-table" key={selectedAccount.id}>
                <thead>
                  <tr>
                    <th>帳號</th>
                    <th>姓名</th>
                    <th>Email</th>
                    <th>手機</th>
                    <th>電話</th>
                    <th>重設密碼</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{selectedAccount.username}</td>
                    <td>
                      <input
                        defaultValue={selectedAccount.name}
                        onBlur={(e) =>
                          e.target.value !== selectedAccount.name &&
                          handleUpdate(selectedAccount.id, { name: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <input
                        defaultValue={selectedAccount.email}
                        onBlur={(e) =>
                          e.target.value !== selectedAccount.email &&
                          handleUpdate(selectedAccount.id, { email: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <input
                        defaultValue={selectedAccount.mobile}
                        onBlur={(e) =>
                          e.target.value !== selectedAccount.mobile &&
                          handleUpdate(selectedAccount.id, { mobile: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <input
                        defaultValue={selectedAccount.phone}
                        onBlur={(e) =>
                          e.target.value !== selectedAccount.phone &&
                          handleUpdate(selectedAccount.id, { phone: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="password"
                        placeholder="新密碼"
                        value={passwordReset}
                        onChange={(e) => setPasswordReset(e.target.value)}
                      />
                      <button onClick={() => handleResetPassword(selectedAccount.id)}>重設</button>
                    </td>
                    <td>
                      <button onClick={() => handleDelete(selectedAccount.id)}>刪除</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
