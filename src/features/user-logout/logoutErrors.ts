export function getLogoutErrorMessage(code: string): string {
  switch (code) {
    case "auth/network-request-failed":
      return "Erro de conexão. Tente novamente.";
    default:
      return "Erro ao sair da conta.";
  }
}
