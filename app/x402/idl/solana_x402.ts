/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/solana_x402.json`.
 */

export type SolanaX402 = {
  address: string;
  metadata: {
    name: string;
    version: string;
    spec: string;
    description: string;
  };
  instructions: any[];
  accounts: any[];
  errors: any[];
  types: any[];
};

export const IDL: SolanaX402 = {
  address: "2HkEaAhDkTbN9wpVyky8Gmh79xUxRRRiwrqkc8tTUArQ",
  metadata: {
    name: "solanaX402",
    version: "0.1.0",
    spec: "0.1.0",
    description: "Created with Anchor"
  },
  instructions: [
    {
      name: "cancelPaymentRequest",
      discriminator: [246, 129, 93, 79, 189, 140, 84, 7],
      accounts: [
        {
          name: "paymentRequest",
          writable: true,
          pda: {
            seeds: [
              { kind: "const", value: [112, 97, 121, 109, 101, 110, 116, 95, 114, 101, 113, 117, 101, 115, 116] },
              { kind: "arg", path: "requestId" }
            ]
          }
        },
        { name: "requester", writable: true, signer: true }
      ],
      args: [{ name: "requestId", type: "string" }]
    },
    {
      name: "checkPaymentStatus",
      discriminator: [245, 156, 156, 89, 32, 67, 155, 23],
      accounts: [
        {
          name: "paymentRequest",
          writable: true,
          pda: {
            seeds: [
              { kind: "const", value: [112, 97, 121, 109, 101, 110, 116, 95, 114, 101, 113, 117, 101, 115, 116] },
              { kind: "arg", path: "requestId" }
            ]
          }
        }
      ],
      args: [{ name: "requestId", type: "string" }]
    },
    {
      name: "createPaymentRequest",
      discriminator: [246, 150, 103, 37, 15, 36, 93, 100],
      accounts: [
        { name: "requester", writable: true, signer: true },
        {
          name: "paymentRequest",
          writable: true,
          pda: {
            seeds: [
              { kind: "const", value: [112, 97, 121, 109, 101, 110, 116, 95, 114, 101, 113, 117, 101, 115, 116] },
              { kind: "arg", path: "requestId" }
            ]
          }
        },
        { name: "systemProgram", address: "11111111111111111111111111111111" }
      ],
      args: [
        { name: "requestId", type: "string" },
        { name: "amount", type: "u64" },
        { name: "resourceIdentifier", type: "string" }
      ]
    },
    {
      name: "initializeConfig",
      discriminator: [208, 127, 21, 1, 194, 190, 196, 70],
      accounts: [
        { name: "authority", writable: true, signer: true },
        {
          name: "config",
          writable: true,
          pda: { seeds: [{ kind: "const", value: [99, 111, 110, 102, 105, 103] }] }
        },
        { name: "systemProgram", address: "11111111111111111111111111111111" }
      ],
      args: [
        { name: "treasuryWallet", type: "pubkey" },
        { name: "minPaymentAmount", type: "u64" }
      ]
    },
    {
      name: "verifyPayment",
      discriminator: [70, 155, 98, 44, 176, 110, 74, 169],
      accounts: [
        {
          name: "paymentRequest",
          writable: true,
          pda: {
            seeds: [
              { kind: "const", value: [112, 97, 121, 109, 101, 110, 116, 95, 114, 101, 113, 117, 101, 115, 116] },
              { kind: "arg", path: "requestId" }
            ]
          }
        },
        {
          name: "config",
          writable: true,
          pda: { seeds: [{ kind: "const", value: [99, 111, 110, 102, 105, 103] }] }
        },
        { name: "payer", writable: true, signer: true },
        { name: "payerTokenAccount", writable: true },
        { name: "treasuryTokenAccount", writable: true },
        { name: "tokenProgram", address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" }
      ],
      args: [{ name: "requestId", type: "string" }]
    }
  ],
  accounts: [
    {
      name: "paymentConfig",
      discriminator: [252, 166, 185, 239, 186, 79, 212, 152]
    },
    {
      name: "paymentRequest",
      discriminator: [27, 20, 202, 96, 101, 242, 124, 69]
    }
  ],
  errors: [
    { code: 6000, name: "invalidAmount", msg: "Payment amount must be greater than 0" },
    { code: 6001, name: "requestIdTooLong", msg: "Request ID is too long (max 64 characters)" },
    { code: 6002, name: "resourceIdTooLong", msg: "Resource identifier is too long (max 128 characters)" },
    { code: 6003, name: "alreadyPaid", msg: "Payment request has already been paid" },
    { code: 6004, name: "requestIdMismatch", msg: "Request ID does not match" },
    { code: 6005, name: "insufficientPayment", msg: "Payment amount is below minimum required" },
    { code: 6006, name: "unauthorizedCancellation", msg: "Only the requester can cancel this payment request" }
  ],
  types: [
    {
      name: "paymentConfig",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "pubkey" },
          { name: "treasuryWallet", type: "pubkey" },
          { name: "minPaymentAmount", type: "u64" },
          { name: "totalPaymentProcessed", type: "u64" },
          { name: "bump", type: "u8" }
        ]
      }
    },
    {
      name: "paymentRequest",
      type: {
        kind: "struct",
        fields: [
          { name: "requestId", type: "string" },
          { name: "requester", type: "pubkey" },
          { name: "amount", type: "u64" },
          { name: "resourceIdentifier", type: "string" },
          { name: "isPaid", type: "bool" },
          { name: "paidAt", type: "i64" },
          { name: "payer", type: "pubkey" },
          { name: "createdAt", type: "i64" },
          { name: "bump", type: "u8" }
        ]
      }
    }
  ]
};
