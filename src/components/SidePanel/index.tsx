// ============================================================
// SidePanel — 右侧摘要面板（评分 + 融合 + 历史）
// ============================================================

'use client';

import { useChatStore } from '@/stores/chat-store';

export function SidePanel() {
  const { status, judgeResult, fusionResult } = useChatStore();

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
        结果摘要
      </h3>

      {/* 评分区 */}
      <div className="flex-1">
        {status === 'judging' && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
            裁判评分中...
          </div>
        )}

        {status === 'fusing' && judgeResult && (
          <div>
            <ScoreTable />
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
              <span className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
              融合生成中...
            </div>
          </div>
        )}

        {status === 'complete' && judgeResult && fusionResult && (
          <div>
            <ScoreTable />
            <FusionResult />
          </div>
        )}

        {status === 'idle' && (
          <p className="text-sm text-gray-400 dark:text-gray-600">
            发送问题后，评分和融合结果将在此显示
          </p>
        )}
      </div>
    </div>
  );
}

function ScoreTable() {
  const { judgeResult } = useChatStore();
  if (!judgeResult) return null;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800">
            <th className="px-2 py-1.5 text-left">模型</th>
            <th className="px-2 py-1.5 text-center">准确</th>
            <th className="px-2 py-1.5 text-center">完整</th>
            <th className="px-2 py-1.5 text-center">可操作</th>
            <th className="px-2 py-1.5 text-center">安全</th>
            <th className="px-2 py-1.5 text-center">总分</th>
          </tr>
        </thead>
        <tbody>
          {judgeResult.scores.map((s) => (
            <tr key={s.model} className="border-t border-gray-100 dark:border-gray-800">
              <td className="px-2 py-1.5 font-medium">{s.model}</td>
              <td className="px-2 py-1.5 text-center">{s.accuracy}</td>
              <td className="px-2 py-1.5 text-center">{s.completeness}</td>
              <td className="px-2 py-1.5 text-center">{s.actionability}</td>
              <td className="px-2 py-1.5 text-center">{s.safety}</td>
              <td className="px-2 py-1.5 text-center font-bold">{s.total.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FusionResult() {
  const { fusionResult } = useChatStore();
  if (!fusionResult) return null;

  return (
    <div className="mt-4 space-y-3">
      <div>
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
          ✅ 共识
        </h4>
        <ul className="list-disc list-inside text-sm space-y-0.5">
          {fusionResult.consensus.map((c, i) => (
            <li key={i} className="text-gray-600 dark:text-gray-400">{c}</li>
          ))}
        </ul>
      </div>

      {fusionResult.divergences.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase mb-1">
            🔴 分歧
          </h4>
          {fusionResult.divergences.map((d, i) => (
            <div key={i} className="mb-2">
              <p className="text-sm font-medium">{d.topic}</p>
              {Object.entries(d.positions).map(([model, pos]) => (
                <p key={model} className="text-xs text-gray-500 ml-2">
                  <span className="font-medium">{model}</span>: {pos}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}

      <div>
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
          📝 综合答案
        </h4>
        <div className="prose prose-sm dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <pre className="whitespace-pre-wrap font-sans text-sm">{fusionResult.synthesized}</pre>
        </div>
      </div>
    </div>
  );
}
