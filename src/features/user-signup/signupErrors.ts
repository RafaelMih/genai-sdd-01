export function getSignupErrorMessage(code: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "Este e-mail já está em uso.";
    case "auth/invalid-email":
      return "E-mail inválido";
    case "auth/network-request-failed":
      return "Erro de conexão. Tente novamente.";
    case "auth/too-many-requests":
      return "Muitas tentativas. Tente mais tarde.";
    case "auth/operation-not-allowed":
      return "Operação não permitida.";
    default:
      return "Erro ao criar conta.";
  }
}
