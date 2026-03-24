export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-slate-50">
      <main className="flex flex-col items-center gap-8 text-center px-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#538bb0] rounded-xl flex items-center justify-center">
            <span className="text-white text-2xl font-bold">A</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-800">Aibou</h1>
        </div>
        <p className="text-xl text-slate-500 max-w-md">
          AIが同僚になるチャットツール
        </p>
        <div className="flex flex-col gap-3 mt-4">
          <div className="flex items-center gap-3 text-slate-600">
            <span className="w-8 h-8 bg-[#538bb0]/10 rounded-lg flex items-center justify-center text-[#538bb0] text-sm font-bold">AI</span>
            <span>全チャンネルにAIが常駐</span>
          </div>
          <div className="flex items-center gap-3 text-slate-600">
            <span className="w-8 h-8 bg-[#538bb0]/10 rounded-lg flex items-center justify-center text-[#538bb0] text-sm font-bold">$0</span>
            <span>ユーザー課金なし、サーバー代だけ</span>
          </div>
          <div className="flex items-center gap-3 text-slate-600">
            <span className="w-8 h-8 bg-[#538bb0]/10 rounded-lg flex items-center justify-center text-[#538bb0] text-sm font-bold">🔒</span>
            <span>セルフホストでデータは自社管理</span>
          </div>
        </div>
        <p className="text-sm text-slate-400 mt-8">Coming Soon — Phase 1 開発中</p>
      </main>
    </div>
  );
}
