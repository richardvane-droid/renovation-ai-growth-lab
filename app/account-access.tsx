"use client";

import { useState } from "react";

export type AccountAccessProps = {
  onBack: () => void;
};

type AccessView = "login" | "register" | "payment";

const viewCopy: Record<AccessView, { title: string; description: string }> = {
  login: {
    title: "登录",
    description: "正式上线后，用户可在这里登录门店账号。",
  },
  register: {
    title: "注册门店账号",
    description: "正式上线后，用户可在这里填写门店基本信息。",
  },
  payment: {
    title: "开通系统",
    description: "正式上线后，用户可在这里确认开通方案和支付方式。",
  },
};

export function AccountAccess({ onBack }: AccountAccessProps) {
  const [view, setView] = useState<AccessView>("login");
  const copy = viewCopy[view];

  return (
    <main className="account-access">
      <section className="account-access-panel" aria-labelledby="account-access-title">
        <header className="account-access-header">
          <span className="account-access-kicker">门店营销助手 · 账号页面样稿</span>
          <h1 id="account-access-title">{copy.title}</h1>
          <p>{copy.description}</p>
        </header>

        <div className="account-access-demo-warning" role="note">
          <b>测试期仅展示页面样式</b>
          <span>不会校验密码、创建账号、保存填写内容或发起支付。</span>
        </div>

        <nav className="account-access-tabs" aria-label="账号页面示例">
          <button
            aria-current={view === "login" ? "page" : undefined}
            className={view === "login" ? "active" : ""}
            onClick={() => setView("login")}
            type="button"
          >
            登录
          </button>
          <button
            aria-current={view === "register" ? "page" : undefined}
            className={view === "register" ? "active" : ""}
            onClick={() => setView("register")}
            type="button"
          >
            注册
          </button>
          <button
            aria-current={view === "payment" ? "page" : undefined}
            className={view === "payment" ? "active" : ""}
            onClick={() => setView("payment")}
            type="button"
          >
            付费
          </button>
        </nav>

        {view === "login" && (
          <form className="account-access-form" onSubmit={(event) => event.preventDefault()}>
            <label className="account-access-field" htmlFor="login-account">
              <span>账号</span>
              <input
                autoComplete="username"
                id="login-account"
                placeholder="请输入手机号或邮箱"
                type="text"
              />
            </label>
            <label className="account-access-field" htmlFor="login-password">
              <span>密码</span>
              <input
                autoComplete="current-password"
                id="login-password"
                placeholder="请输入密码"
                type="password"
              />
            </label>
            <button className="account-access-primary" disabled type="submit">
              测试期不提交
            </button>
          </form>
        )}

        {view === "register" && (
          <form className="account-access-form" onSubmit={(event) => event.preventDefault()}>
            <label className="account-access-field" htmlFor="register-store">
              <span>门店名称</span>
              <input
                autoComplete="organization"
                id="register-store"
                placeholder="例如：有大有小全屋定制"
              />
            </label>
            <label className="account-access-field" htmlFor="register-contact">
              <span>联系人</span>
              <input
                autoComplete="name"
                id="register-contact"
                placeholder="请输入店长或负责人姓名"
              />
            </label>
            <label className="account-access-field" htmlFor="register-phone">
              <span>手机号</span>
              <input
                autoComplete="tel"
                id="register-phone"
                inputMode="numeric"
                placeholder="请输入 11 位手机号"
                type="tel"
              />
            </label>
            <label className="account-access-field" htmlFor="register-password">
              <span>设置密码</span>
              <input
                autoComplete="new-password"
                id="register-password"
                placeholder="至少 6 位"
                type="password"
              />
            </label>
            <label className="account-access-agreement" htmlFor="register-agreed">
              <input id="register-agreed" type="checkbox" />
              <span>我已阅读并同意服务条款和隐私说明</span>
            </label>
            <button className="account-access-primary" disabled type="submit">
              测试期不创建账号
            </button>
          </form>
        )}

        {view === "payment" && (
          <section className="account-access-payment" aria-labelledby="payment-title">
            <div className="account-access-account-summary">
              <b id="payment-title">示例门店</b>
              <span>联系人：杜店长</span>
              <span>账号：138 0000 0000</span>
            </div>
            <div className="account-access-price">
              <span>开通费用</span>
              <strong>¥1,000</strong>
              <small>价格暂定，仅用于确认付费页面样式。</small>
            </div>
            <fieldset className="account-access-payment-methods">
              <legend>支付方式示例</legend>
              <label htmlFor="payment-wechat">
                <input defaultChecked id="payment-wechat" name="payment-method" type="radio" />
                <span>微信支付</span>
              </label>
              <label htmlFor="payment-alipay">
                <input id="payment-alipay" name="payment-method" type="radio" />
                <span>支付宝</span>
              </label>
            </fieldset>
            <button className="account-access-primary" disabled type="button">
              测试期不发起支付
            </button>
          </section>
        )}

        <div className="account-access-actions">
          <button className="account-access-secondary" onClick={onBack} type="button">
            返回原型
          </button>
        </div>
      </section>
    </main>
  );
}

export default AccountAccess;
