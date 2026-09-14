import Swal, { type SweetAlertIcon, type SweetAlertResult } from "sweetalert2";

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
  }): Promise<boolean> {
    const result = await Swal.fire({
      ...baseOptions,
      icon: "question",
      title: options.title,
      text: options.text,
      showCancelButton: true,
      confirmButtonText: options.confirmText || "Confirmer",
      cancelButtonText: options.cancelText || "Annuler",
    });
    return result.isConfirmed;
  },
};
