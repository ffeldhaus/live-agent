declare module '*?inline' {
  const content: string;
  export default content;
}

declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenClient {
        requestAccessToken(): void;
      }
      interface TokenClientConfig {
        client_id: string;
        scope: string;
        callback: (response: any) => void;
      }
      function initTokenClient(config: TokenClientConfig): TokenClient;
    }
  }
}
