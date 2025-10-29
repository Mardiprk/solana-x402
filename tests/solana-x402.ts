import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaX402 } from "../target/types/solana_x402";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo
} from "@solana/spl-token";
import { assert } from "chai";

describe("solana-x402", () => {
  // Configure the client
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolanaX402 as Program<SolanaX402>;

  // Test wallets
  const authority = provider.wallet;
  const payer = anchor.web3.Keypair.generate();

  let mint: anchor.web3.PublicKey;
  let treasuryTokenAccount: any;
  let payerTokenAccount: any;
  let configPda: anchor.web3.PublicKey;

  const MIN_PAYMENT = new anchor.BN(1_000_000); // 1 USDC (6 decimals)

  before(async () => {
    console.log("\n🚀 Setting up test environment...\n");

    // Airdrop SOL to payer
    const airdropSig = await provider.connection.requestAirdrop(
      payer.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig);
    console.log("✅ Airdropped SOL to payer");

    // Create token mint (simulating USDC)
    mint = await createMint(
      provider.connection,
      payer,
      authority.publicKey,
      null,
      6 // USDC decimals
    );
    console.log("✅ Created token mint:", mint.toBase58());

    // Create treasury token account
    treasuryTokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer,
      mint,
      authority.publicKey
    );
    console.log("✅ Created treasury token account");

    // Create payer token account
    payerTokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer,
      mint,
      payer.publicKey
    );

    // Mint 100 USDC to payer
    await mintTo(
      provider.connection,
      payer,
      mint,
      payerTokenAccount.address,
      authority.publicKey,
      100_000_000 // 100 USDC
    );
    console.log("✅ Minted 100 USDC to payer");
    console.log("\n📦 Setup complete!\n");
  });

  it("Initialize payment config", async () => {
    [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );

    const tx = await program.methods
      .initializeConfig(authority.publicKey, MIN_PAYMENT)
      .accounts({
        config: configPda,
        authority: authority.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log(`TX: https://solscan.io/tx/${tx}?cluster=devnet`);

    const config = await program.account.paymentConfig.fetch(configPda);
    assert.equal(config.authority.toBase58(), authority.publicKey.toBase58());
    assert.equal(config.minPaymentAmount.toString(), MIN_PAYMENT.toString());
    console.log("✅ Config initialized successfully!");
  });

  it("Create a payment request", async () => {
    const requestId = "req-001";
    const amount = new anchor.BN(5_000_000); // 5 USDC

    const [paymentRequestPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("payment_request"), Buffer.from(requestId)],
      program.programId
    );

    const tx = await program.methods
      .createPaymentRequest(requestId, amount, "/api/generate-image")
      .accounts({
        paymentRequest: paymentRequestPda,
        requester: authority.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log(`TX: https://solscan.io/tx/${tx}?cluster=devnet`);

    const paymentRequest = await program.account.paymentRequest.fetch(paymentRequestPda);
    assert.equal(paymentRequest.requestId, requestId);
    assert.equal(paymentRequest.amount.toString(), amount.toString());
    assert.equal(paymentRequest.isPaid, false);
    console.log("✅ Payment request created!");
  });

  it("Verify and process payment", async () => {
    const requestId = "req-002";
    const amount = new anchor.BN(2_000_000); // 2 USDC

    // Create payment request first
    const [paymentRequestPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("payment_request"), Buffer.from(requestId)],
      program.programId
    );

    await program.methods
      .createPaymentRequest(requestId, amount, "/api/analysis")
      .accounts({
        paymentRequest: paymentRequestPda,
        requester: authority.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Check balances before
    const treasuryBefore = await provider.connection.getTokenAccountBalance(
      treasuryTokenAccount.address
    );
    const payerBefore = await provider.connection.getTokenAccountBalance(
      payerTokenAccount.address
    );

    console.log("💰 Treasury before:", treasuryBefore.value.uiAmount, "USDC");
    console.log("💰 Payer before:", payerBefore.value.uiAmount, "USDC");

    // Process payment
    const tx = await program.methods
      .verifyPayment(requestId)
      .accounts({
        paymentRequest: paymentRequestPda,
        config: configPda,
        payer: payer.publicKey,
        payerTokenAccount: payerTokenAccount.address,
        treasuryTokenAccount: treasuryTokenAccount.address,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      })
      .signers([payer])
      .rpc();

    console.log(`TX: https://solscan.io/tx/${tx}?cluster=devnet`);

    // Check balances after
    const treasuryAfter = await provider.connection.getTokenAccountBalance(
      treasuryTokenAccount.address
    );
    const payerAfter = await provider.connection.getTokenAccountBalance(
      payerTokenAccount.address
    );

    console.log("💰 Treasury after:", treasuryAfter.value.uiAmount, "USDC");
    console.log("💰 Payer after:", payerAfter.value.uiAmount, "USDC");

    // Verify payment status
    const paymentRequest = await program.account.paymentRequest.fetch(paymentRequestPda);
    assert.equal(paymentRequest.isPaid, true);
    assert.equal(paymentRequest.payer.toBase58(), payer.publicKey.toBase58());
    console.log("✅ Payment verified and processed!");
  });

  it("Check payment status", async () => {
    const requestId = "req-002";

    const [paymentRequestPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("payment_request"), Buffer.from(requestId)],
      program.programId
    );

    const tx = await program.methods
      .checkPaymentStatus(requestId)
      .accounts({
        paymentRequest: paymentRequestPda,
      })
      .rpc();

    console.log(`TX: https://solscan.io/tx/${tx}?cluster=devnet`);
    console.log("✅ Payment status checked!");
  });

  it("Prevent double payment", async () => {
    const requestId = "req-002"; // Already paid

    const [paymentRequestPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("payment_request"), Buffer.from(requestId)],
      program.programId
    );

    try {
      await program.methods
        .verifyPayment(requestId)
        .accounts({
          paymentRequest: paymentRequestPda,
          config: configPda,
          payer: payer.publicKey,
          payerTokenAccount: payerTokenAccount.address,
          treasuryTokenAccount: treasuryTokenAccount.address,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        })
        .signers([payer])
        .rpc();

      assert.fail("Should have thrown AlreadyPaid error");
    } catch (err) {
      assert.include(err.toString(), "AlreadyPaid");
      console.log("✅ Double payment prevented!");
    }
  });

  it("Cancel unpaid payment request", async () => {
    const requestId = "req-to-cancel";
    const amount = new anchor.BN(1_000_000);

    const [paymentRequestPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("payment_request"), Buffer.from(requestId)],
      program.programId
    );

    // Create request
    await program.methods
      .createPaymentRequest(requestId, amount, "/api/test")
      .accounts({
        paymentRequest: paymentRequestPda,
        requester: authority.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Cancel it
    const tx = await program.methods
      .cancelPaymentRequest(requestId)
      .accounts({
        paymentRequest: paymentRequestPda,
        requester: authority.publicKey,
      })
      .rpc();

    console.log(`TX: https://solscan.io/tx/${tx}?cluster=devnet`);

    // Verify account is closed
    try {
      await program.account.paymentRequest.fetch(paymentRequestPda);
      assert.fail("Account should be closed");
    } catch (err) {
      console.log("✅ Payment request cancelled!");
    }
  });

  it("Reject payment below minimum", async () => {
    const requestId = "req-low-amount";
    const amount = new anchor.BN(100); // Below minimum

    const [paymentRequestPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("payment_request"), Buffer.from(requestId)],
      program.programId
    );

    await program.methods
      .createPaymentRequest(requestId, amount, "/api/test")
      .accounts({
        paymentRequest: paymentRequestPda,
        requester: authority.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    try {
      await program.methods
        .verifyPayment(requestId)
        .accounts({
          paymentRequest: paymentRequestPda,
          config: configPda,
          payer: payer.publicKey,
          payerTokenAccount: payerTokenAccount.address,
          treasuryTokenAccount: treasuryTokenAccount.address,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        })
        .signers([payer])
        .rpc();

      assert.fail("Should have thrown InsufficientPayment error");
    } catch (err) {
      assert.include(err.toString(), "InsufficientPayment");
      console.log("✅ Low payment rejected!");
    }
  });
});