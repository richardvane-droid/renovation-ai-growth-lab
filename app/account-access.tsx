"use client";

import { useEffect, useState, type FormEvent } from "react";

export type AccessAccount = {
  storeName: string;
  contact: string;
  account: string;
};

export type AccountAccessProps = {
  onAccessGranted: (account: AccessAccount) => void;
};

type AccessView = "login" | "register" | "payment" | "success";
type RouteView = Exclude<AccessView, "success">;
type PaymentMethod = "wechat" | "alipay";

type RegisterForm = {
  storeName: string;
  contact: string;
  phone: string;
  password: string;
  agreed: boolean;
};

type RegisterErrors = Partial<Record<keyof RegisterForm, string>>;
type StoredDemoRegistration = {
  account: AccessAccount;
  paid: boolean;
  password: string;
};

const REGISTRATION_STORAGE_KEY = "renovation-demo-registration";

const PAID_DEMO_ACCOUNT: AccessAccount = {
  storeName: "已开通演示门店",
  contact: "杜店长",
  account: "paid@demo.cn",
};

const NEW_DEMO_ACCOUNT: AccessAccount = {
  storeName: "待开通演示门店",
  contact: "新店长",
  account: "new@demo.cn",
};

function readStoredRegistration(): StoredDemoRegistration | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.sessionStorage.getItem(REGISTRATION_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as StoredDemoRegistration;
    if (!parsed.account?.account || !parsed.password) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveStoredRegistration(registration: StoredDemoRegistration) {
  window.sessionStorage.setItem(REGISTRATION_STORAGE_KEY, JSON.stringify(registration));
}

function routeFromHash(paymentReady: boolean): RouteView {
  if (typeof window === "undefined") return "login";
  const route = window.location.hash.replace("#", "");
  if (route === "register") return route;
  if (route === "payment" && paymentReady) return route;
  return "login";
}

export function AccountAccess({ onAccessGranted }: AccountAccessProps) {
  const [view, setView] = useState<AccessView>("login");
  const [loginAccount, setLoginAccount] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    storeName: "",
    contact: "",
    phone: "",
    password: "",
    agreed: false,
  });
  const [registerErrors, setRegisterErrors] = useState<RegisterErrors>({});
  const [pendingAccount, setPendingAccount] = useState<AccessAccount>(NEW_DEMO_ACCOUNT);
  const [pendingPassword, setPendingPassword] = useState("123456");
  const [paymentReady, setPaymentReady] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("wechat");
  const [paymentAgreed, setPaymentAgreed] = useState(false);

  useEffect(() => {
    function syncFromAddress() {
      setView(routeFromHash(paymentReady));
      setLoginError("");
      setRegisterErrors({});
    }

    syncFromAddress();
    window.addEventListener("hashchange", syncFromAddress);
    window.addEventListener("popstate", syncFromAddress);
    return () => {
      window.removeEventListener("hashchange", syncFromAddress);
      window.removeEventListener("popstate", syncFromAddress);
    };
  }, [paymentReady]);

  function goTo(nextView: RouteView) {
    setView(nextView);
    setLoginError("");
    setRegisterErrors({});
    window.history.pushState(null, "", `#${nextView}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const account = loginAccount.trim().toLowerCase();

    if (!account || !loginPassword) {
      setLoginError("请输入账号和密码。");
      return;
    }

    if (account === "paid@demo.cn" && loginPassword === "123456") {
      setLoginError("");
      onAccessGranted(PAID_DEMO_ACCOUNT);
      return;
    }

    const storedRegistration = readStoredRegistration();
    if (
      storedRegistration
      && account === storedRegistration.account.account.toLowerCase()
      && loginPassword === storedRegistration.password
    ) {
      setLoginError("");
      if (storedRegistration.paid) {
        onAccessGranted(storedRegistration.account);
      } else {
        setPendingAccount(storedRegistration.account);
        setPendingPassword(storedRegistration.password);
        setPaymentReady(true);
        goTo("payment");
      }
      return;
    }

    if (account === "new@demo.cn" && loginPassword === "123456") {
      setLoginError("");
      setPendingAccount(NEW_DEMO_ACCOUNT);
      setPendingPassword("123456");
      setPaymentReady(true);
      goTo("payment");
      return;
    }

    if (account === pendingAccount.account.toLowerCase() && loginPassword === pendingPassword) {
      setLoginError("");
      goTo("payment");
      return;
    }

    setLoginError("账号或密码不正确，请检查后重试。");
  }

  function updateRegisterField<Key extends keyof RegisterForm>(
    key: Key,
    value: RegisterForm[Key],
  ) {
    setRegisterForm((current) => ({ ...current, [key]: value }));
    setRegisterErrors((current) => ({ ...current, [key]: undefined }));
  }

  function submitRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: RegisterErrors = {};
    const storeName = registerForm.storeName.trim();
    const contact = registerForm.contact.trim();
    const phone = registerForm.phone.trim();

    if (!storeName) nextErrors.storeName = "请输入门店名称。";
    if (!contact) nextErrors.contact = "请输入联系人姓名。";
    if (!/^1\d{10}$/.test(phone)) nextErrors.phone = "请输入 11 位手机号。";
    if (registerForm.password.length < 6) nextErrors.password = "密码至少需要 6 位。";
    if (!registerForm.agreed) nextErrors.agreed = "请先同意服务条款和隐私说明。";

    if (Object.keys(nextErrors).length > 0) {
      setRegisterErrors(nextErrors);
      return;
    }

    setPendingAccount({ storeName, contact, account: phone });
    setPendingPassword(registerForm.password);
    saveStoredRegistration({
      account: { storeName, contact, account: phone },
      paid: false,
      password: registerForm.password,
    });
    setPaymentReady(true);
    setPaymentAgreed(false);
    goTo("payment");
  }

  function finishDemoPayment() {
    saveStoredRegistration({
      account: pendingAccount,
      paid: true,
      password: pendingPassword,
    });
    setView("success");
    window.history.replaceState(null, "", "#payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="account-access">
      <section className="account-access-panel" aria-labelledby="account-access-title">
        <header className="account-access-header">
          <span className="account-access-kicker">门店营销助手</span>
          <h1 id="account-access-title">
            {view === "login" && "登录"}
            {view === "register" && "注册门店账号"}
            {view === "payment" && "开通系统"}
            {view === "success" && "开通成功"}
          </h1>
          <p>
            {view === "login" && "登录后继续使用当前门店的营销功能。"}
            {view === "register" && "填写门店基本信息，注册后完成一次性开通。"}
            {view === "payment" && "确认账号和支付方式后完成演示开通。"}
            {view === "success" && "演示开通已经完成，现在可以进入系统。"}
          </p>
        </header>

        {(view === "login" || view === "register") && (
          <nav className="account-access-tabs" aria-label="登录或注册">
            <button
              aria-current={view === "login" ? "page" : undefined}
              className={view === "login" ? "active" : ""}
              onClick={() => goTo("login")}
              type="button"
            >
              登录
            </button>
            <button
              aria-current={view === "register" ? "page" : undefined}
              className={view === "register" ? "active" : ""}
              onClick={() => goTo("register")}
              type="button"
            >
              注册新门店
            </button>
          </nav>
        )}

        {view === "login" && (
          <form className="account-access-form" noValidate onSubmit={submitLogin}>
            <label className="account-access-field" htmlFor="login-account">
              <span>账号</span>
              <input
                aria-describedby={loginError ? "login-error" : "login-demo-hint"}
                aria-invalid={Boolean(loginError)}
                autoComplete="username"
                id="login-account"
                onChange={(event) => {
                  setLoginAccount(event.target.value);
                  setLoginError("");
                }}
                placeholder="请输入手机号或邮箱"
                type="text"
                value={loginAccount}
              />
            </label>
            <label className="account-access-field" htmlFor="login-password">
              <span>密码</span>
              <input
                aria-describedby={loginError ? "login-error" : undefined}
                aria-invalid={Boolean(loginError)}
                autoComplete="current-password"
                id="login-password"
                onChange={(event) => {
                  setLoginPassword(event.target.value);
                  setLoginError("");
                }}
                placeholder="请输入密码"
                type="password"
                value={loginPassword}
              />
            </label>
            {loginError && (
              <p className="account-access-error" id="login-error" role="alert">
                {loginError}
              </p>
            )}
            <button className="account-access-primary" type="submit">
              登录并继续
            </button>
            <div className="account-access-demo-hint" id="login-demo-hint">
              <b>演示账号</b>
              <span>已开通：paid@demo.cn / 123456</span>
              <span>待支付：new@demo.cn / 123456</span>
            </div>
          </form>
        )}

        {view === "register" && (
          <form className="account-access-form" noValidate onSubmit={submitRegister}>
            <label className="account-access-field" htmlFor="register-store">
              <span>门店名称</span>
              <input
                aria-describedby={registerErrors.storeName ? "register-store-error" : undefined}
                aria-invalid={Boolean(registerErrors.storeName)}
                autoComplete="organization"
                id="register-store"
                onChange={(event) => updateRegisterField("storeName", event.target.value)}
                placeholder="例如：有大有小全屋定制"
                value={registerForm.storeName}
              />
              {registerErrors.storeName && (
                <small className="account-access-error" id="register-store-error">
                  {registerErrors.storeName}
                </small>
              )}
            </label>
            <label className="account-access-field" htmlFor="register-contact">
              <span>联系人</span>
              <input
                aria-describedby={registerErrors.contact ? "register-contact-error" : undefined}
                aria-invalid={Boolean(registerErrors.contact)}
                autoComplete="name"
                id="register-contact"
                onChange={(event) => updateRegisterField("contact", event.target.value)}
                placeholder="请输入店长或负责人姓名"
                value={registerForm.contact}
              />
              {registerErrors.contact && (
                <small className="account-access-error" id="register-contact-error">
                  {registerErrors.contact}
                </small>
              )}
            </label>
            <label className="account-access-field" htmlFor="register-phone">
              <span>手机号</span>
              <input
                aria-describedby={registerErrors.phone ? "register-phone-error" : undefined}
                aria-invalid={Boolean(registerErrors.phone)}
                autoComplete="tel"
                id="register-phone"
                inputMode="numeric"
                onChange={(event) => updateRegisterField("phone", event.target.value)}
                placeholder="请输入 11 位手机号"
                type="tel"
                value={registerForm.phone}
              />
              {registerErrors.phone && (
                <small className="account-access-error" id="register-phone-error">
                  {registerErrors.phone}
                </small>
              )}
            </label>
            <label className="account-access-field" htmlFor="register-password">
              <span>设置密码</span>
              <input
                aria-describedby={registerErrors.password ? "register-password-error" : "register-password-hint"}
                aria-invalid={Boolean(registerErrors.password)}
                autoComplete="new-password"
                id="register-password"
                onChange={(event) => updateRegisterField("password", event.target.value)}
                placeholder="至少 6 位"
                type="password"
                value={registerForm.password}
              />
              <small id="register-password-hint">至少 6 位字符。</small>
              {registerErrors.password && (
                <small className="account-access-error" id="register-password-error">
                  {registerErrors.password}
                </small>
              )}
            </label>
            <label className="account-access-agreement" htmlFor="register-agreed">
              <input
                aria-describedby={registerErrors.agreed ? "register-agreed-error" : undefined}
                aria-invalid={Boolean(registerErrors.agreed)}
                checked={registerForm.agreed}
                id="register-agreed"
                onChange={(event) => updateRegisterField("agreed", event.target.checked)}
                type="checkbox"
              />
              <span>我已阅读并同意服务条款和隐私说明</span>
            </label>
            {registerErrors.agreed && (
              <p className="account-access-error" id="register-agreed-error" role="alert">
                {registerErrors.agreed}
              </p>
            )}
            <button className="account-access-primary" type="submit">
              注册并前往开通
            </button>
          </form>
        )}

        {view === "payment" && (
          <section className="account-access-payment" aria-labelledby="payment-title">
            <div className="account-access-account-summary">
              <b id="payment-title">{pendingAccount.storeName}</b>
              <span>联系人：{pendingAccount.contact}</span>
              <span>账号：{pendingAccount.account}</span>
            </div>
            <div className="account-access-price">
              <span>一次性开通费</span>
              <strong>¥1,000</strong>
              <small>一次支付，完成当前演示账号开通。</small>
            </div>
            <div className="account-access-demo-warning" role="note">
              <b>演示支付，不会真实扣款</b>
              <span>点击确认后只会展示支付成功页面，不会调用真实支付。</span>
            </div>
            <fieldset className="account-access-payment-methods">
              <legend>选择支付方式</legend>
              <label htmlFor="payment-wechat">
                <input
                  checked={paymentMethod === "wechat"}
                  id="payment-wechat"
                  name="payment-method"
                  onChange={() => setPaymentMethod("wechat")}
                  type="radio"
                  value="wechat"
                />
                <span>微信支付</span>
              </label>
              <label htmlFor="payment-alipay">
                <input
                  checked={paymentMethod === "alipay"}
                  id="payment-alipay"
                  name="payment-method"
                  onChange={() => setPaymentMethod("alipay")}
                  type="radio"
                  value="alipay"
                />
                <span>支付宝</span>
              </label>
            </fieldset>
            <label className="account-access-agreement" htmlFor="payment-agreed">
              <input
                checked={paymentAgreed}
                id="payment-agreed"
                onChange={(event) => setPaymentAgreed(event.target.checked)}
                type="checkbox"
              />
              <span>我确认本次演示开通金额为 ¥1,000</span>
            </label>
            <div className="account-access-actions">
              <button className="account-access-secondary" onClick={() => goTo("login")} type="button">
                返回登录
              </button>
              <button className="account-access-primary" disabled={!paymentAgreed} onClick={finishDemoPayment} type="button">
                {paymentAgreed ? "演示支付 ¥1,000" : "确认金额后继续"}
              </button>
            </div>
          </section>
        )}

        {view === "success" && (
          <section className="account-access-success" aria-live="polite">
            <div className="account-access-success-mark" aria-hidden="true">✓</div>
            <h2>演示支付成功</h2>
            <p>
              已通过{paymentMethod === "wechat" ? "微信支付" : "支付宝"}完成演示开通，没有产生真实扣款。
            </p>
            <div className="account-access-account-summary">
              <b>{pendingAccount.storeName}</b>
              <span>账号：{pendingAccount.account}</span>
            </div>
            <button
              className="account-access-primary"
              onClick={() => onAccessGranted(pendingAccount)}
              type="button"
            >
              进入系统
            </button>
          </section>
        )}
      </section>
    </main>
  );
}

export default AccountAccess;
