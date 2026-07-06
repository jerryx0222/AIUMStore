import { AccountManagementPanel } from "../components/AccountManagementPanel";

export function StoreOwnerManagementPage() {
  return (
    <div className="erp-page">
      <h1>門市管理</h1>
      <AccountManagementPanel
        title="店主帳號"
        createLabel="新增店主"
        endpoint="/accounts/store-owners/"
      />
    </div>
  );
}
