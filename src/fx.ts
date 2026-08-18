export type FxMessage =
  | { kind: 'burst'; x: number; y: number; color: string; count: number; power: number }
  | { kind: 'float'; x: number; y: number; text: string; color: string; size?: number }
  | { kind: 'shake'; power: number }
  | { kind: 'confetti' };

type Handler = (m: FxMessage) => void;

const handlers = new Set<Handler>();

export const fxBus = {
  emit(m: FxMessage) {
    handlers.forEach((h) => h(m));
  },
  on(h: Handler) {
    handlers.add(h);
    return () => {
      handlers.delete(h);
    };
  },
};
