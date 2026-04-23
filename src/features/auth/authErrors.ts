export function getAuthErrorMessage(code: string): string {
  switch (code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "E-mail ou senha incorretos.";
    case "auth/invalid-email":
      return "E-mail inválido";
    case "auth/user-disabled":
      return "Esta conta foi desativada. Entre em contato com o suporte.";
    case "auth/too-many-requests":
      return "Muitas tentativas. Tente novamente mais tarde.";
    case "auth/network-request-failed":
      return "Falha na conexão. Verifique sua internet e tente novamente.";
    default:
      return "Ocorreu um erro inesperado. Tente novamente.";
  }
}
