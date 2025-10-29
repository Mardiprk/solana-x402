use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("2HkEaAhDkTbN9wpVyky8Gmh79xUxRRRiwrqkc8tTUArQ");

#[program]
pub mod solana_x402 {
    use super::*;

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        treasury_wallet: Pubkey,
        min_payment_amount: u64
    ) -> Result<()> {

        Ok(())
    }

    pub fn create_payment_request(
        ctx: Context<CreatePaymentRequest>,
        request_id: String,
        amount: u64,
        resource_identifier: String
    ) -> Result<()>{

        Ok(())
    }

    pub fn verify_payment(
        ctx: Context<VerifyPayment>,
        request_id: String
    ) -> Result<()>{

        Ok(())
    }

    pub fn check_payment_status(
        ctx: Context<CheckPaymentStatus>,
        request_id: String
    ) -> Result<()>{

        Ok(())
    }

    pub fn cancel_payment_request(
        ctx: Context<CancelPaymentRequest>,
        request_id: String
    ) -> Result<()>{

        Ok(())
    }

}

// ---- ACCOUNT VALIDATION ----

#[derive(Accounts)]
pub struct InitializeConfig<'info> {

}

#[derive(Accounts)]
#[instruction(request_id: String)]
pub struct CreatePaymentRequest<'info> {
    
}

#[derive(Accounts)]
#[instruction(request_id: String)]
pub struct VerifyPayment<'info> {
    
}

#[derive(Accounts)]
#[instruction(request_id: String)]
pub struct CheckPaymentStatus<'info> {
    
}

#[derive(Accounts)]
#[instruction(request_id: String)]
pub struct CancelPaymentRequest<'info> {
    
}

// ---- ACCOUNT STRUCTS ----

#[account]
#[derive(InitSpace)]
pub struct PaymentConfig{
    pub authority: Pubkey,
    pub treasury_wallet: Pubkey,
    pub min_payment_amount: u64,
    pub total_payment_processed: u64,
    pub bump: u8,
}

#[account]
pub struct PaymentRequest{
    pub request_id: String,
    pub requester: Pubkey,
    pub amount: u64,
    pub resource_identifier: String,
    pub is_paid: bool,
    pub paid_at: i64,
    pub payer: Pubkey,
    pub created_at: i64,
    pub bump: u8,
}

impl PaymentRequest{
    pub const LEN: usize = 8 + (4 + 64) + 32 + 8 + (4 + 128) + 1 + 8 + 32 + 8 + 1;
}

// ---- ERROR ----

#[error_code]
pub enum ErrorCode {
    #[msg("Payment amount must be greater than 0")]
    InvalidAmount,

    #[msg("Request ID is too long (max 64 characters)")]
    RequestIdTooLong,

    #[msg("Resource identifier is too long (max 128 characters)")]
    ResourceIdTooLong,

    #[msg("Payment request has already been paid")]
    AlreadyPaid,

    #[msg("Request ID does not match")]
    RequestIdMismatch,

    #[msg("Payment amount is below minimum required")]
    InsufficientPayment,

    #[msg("Only the requester can cancel this payment request")]
    UnauthorizedCancellation,
}