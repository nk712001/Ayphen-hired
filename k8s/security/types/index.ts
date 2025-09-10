export interface NetworkPolicy {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace?: string;
  };
  spec: {
    podSelector: {
      matchLabels?: Record<string, string>;
    };
    policyTypes?: string[];
    ingress?: Array<{
      from?: Array<{
        namespaceSelector?: {
          matchLabels?: Record<string, string>;
        };
        podSelector?: {
          matchLabels?: Record<string, string>;
        };
      }>;
      ports?: Array<{
        port: number;
        protocol?: string;
      }>;
    }>;
    egress?: Array<{
      to?: Array<{
        namespaceSelector?: {
          matchLabels?: Record<string, string>;
        };
        podSelector?: {
          matchLabels?: Record<string, string>;
        };
      }>;
      ports?: Array<{
        port: number;
        protocol?: string;
      }>;
    }>;
  };
}
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace?: string;
  };
  spec: {
    podSelector: {
      matchLabels?: Record<string, string>;
    };
    policyTypes?: string[];
    ingress?: Array<{
      from?: Array<{
        namespaceSelector?: {
          matchLabels?: Record<string, string>;
        };
        podSelector?: {
          matchLabels?: Record<string, string>;
        };
      }>;
      ports?: Array<{
        port: number;
        protocol?: string;
      }>;
    }>;
    egress?: Array<{
      to?: Array<{
        namespaceSelector?: {
          matchLabels?: Record<string, string>;
        };
        podSelector?: {
          matchLabels?: Record<string, string>;
        };
      }>;
      ports?: Array<{
        port: number;
        protocol?: string;
      }>;
    }>;
  };
}
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace?: string;
  };
  spec: {
    podSelector: {
      matchLabels?: Record<string, string>;
    };
    policyTypes?: string[];
    ingress?: Array<{
      from?: Array<{
        namespaceSelector?: {
          matchLabels?: Record<string, string>;
        };
        podSelector?: {
          matchLabels?: Record<string, string>;
        };
      }>;
      ports?: Array<{
        port: number;
        protocol?: string;
      }>;
    }>;
    egress?: Array<{
      to?: Array<{
        namespaceSelector?: {
          matchLabels?: Record<string, string>;
        };
        podSelector?: {
          matchLabels?: Record<string, string>;
        };
      }>;
      ports?: Array<{
        port: number;
        protocol?: string;
      }>;
    }>;
  };
}
