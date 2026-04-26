import { aiChoose, chooseBestCapture } from './ai';
import type { AIWorkerRequest, AIWorkerResponse } from './types';

self.onmessage = (e: MessageEvent<AIWorkerRequest>) => {
  const { state, difficulty, timeLimit } = e.data;
  try {
    if (state.awaiting_capture) {
      const pt = chooseBestCapture(state);
      const res: AIWorkerResponse = { type: 'capture', point: pt };
      self.postMessage(res);
    } else {
      const move = aiChoose(state, difficulty, { timeLimitMs: timeLimit });
      if (!move) {
        const res: AIWorkerResponse = { type: 'error', message: 'No moves available' };
        self.postMessage(res);
        return;
      }
      const res: AIWorkerResponse = { type: 'move', move };
      self.postMessage(res);
    }
  } catch (err) {
    const res: AIWorkerResponse = { type: 'error', message: String(err) };
    self.postMessage(res);
  }
};
