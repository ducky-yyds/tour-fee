import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";
class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    return this.state.error ? (
      <main className="boot">
        <h1>页面暂时遇到问题</h1>
        <p>你的已保存旅程仍保留在此浏览器。请刷新重试。</p>
        <button onClick={() => location.reload()}>重新加载</button>
        <details>
          <summary>错误详情</summary>
          {this.state.error.message}
        </details>
      </main>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
