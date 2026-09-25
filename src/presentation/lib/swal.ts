import Swal, { type SweetAlertIcon, type SweetAlertResult } from "sweetalert2";
import { confirmAction } from "@/components/feedback/confirm-dialog";

const baseOptions = {
  confirmButtonColor: "#0A2540",
  cancelButtonColor: "#EF4444",
  buttonsStyling: true,
};

function fire(icon: SweetAlertIcon, title: string, text?: string): Promise<SweetAlertResult> {
  return Swal.fire({
    ...baseOptions,
    icon,
    title,
    text,
    confirmButtonText: "OK",
  });
}

export const appAlert = {
  success(title: string, text?: string) {
    return fire("success", title, text);
  },
  error(title: string, text?: string) {
    return fire("error", title, text);
  },
  warning(title: string, text?: string) {
    return fire("warning", title, text);
  },
  info(title: string, text?: string) {
    return fire("info", title, text);
  },
  async confirm(options: {
    title: string;
    text?: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
  }): Promise<boolean> {
    return confirmAction({
      title: options.title,
      description: options.text,
      confirmLabel: options.confirmText || "Confirmer",
      cancelLabel: options.cancelText || "Annuler",
      variant: options.danger ? "danger" : "default",
    });
  },
};
