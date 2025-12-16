import { ToastActionElement, ToastProps } from './toast';

export type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

export interface UseToastResult {
  toasts: ToasterToast[];
  toast: (props: Omit<ToasterToast, 'id'>) => {
    id: string;
    dismiss: () => void;
    update: (props: ToasterToast) => void;
  };
  dismiss: (toastId?: string) => void;
}

export function useToast(): UseToastResult;
export function toast(props: Omit<ToasterToast, 'id'>): {
  id: string;
  dismiss: () => void;
  update: (props: ToasterToast) => void;
};
