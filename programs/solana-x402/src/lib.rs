use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("2HkEaAhDkTbN9wpVyky8Gmh79xUxRRRiwrqkc8tTUArQ");

#[program]
pub mod solana_x402 {
    use super::*;

    // --- init the payment config
    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        treasury_wallet: Pubkey,
        min_payment_amount: u64
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;

        config.authority = ctx.accounts.authority.key();
        config.treasury_wallet = treasury_wallet;
        config.min_payment_amount = min_payment_amount;
        config.total_payment_processed = 0;
        config.bump = ctx.bumps.config;

        msg!("Payment config Initialized");
        msg!("Treasury: {}", treasury_wallet);
        msg!("Minimum Payment: {} tokens", min_payment_amount);

        Ok(())
    }

    // --- create a payment request
    pub fn create_payment_request(
        ctx: Context<CreatePaymentRequest>,
        request_id: String,
        amount: u64,
        resource_identifier: String
    ) -> Result<()>{

        require!(amount > 0, ErrorCode::InvalidAmount);
        require!(request_id.len() <= 64, ErrorCode::RequestIdTooLong);
        require!(resource_identifier.len() <= 128, ErrorCode::ResourceIdTooLong);
        
        let clock = Clock::get()?;
        let payment_request = &mut ctx.accounts.payment_request;

        payment_request.request_id = request_id.clone();
        payment_request.requester = ctx.accounts.requester.key();
        payment_request.amount = amount;
        payment_request.resource_identifier = resource_identifier.clone();
        payment_request.is_paid = false;
        payment_request.paid_at = 0;
        payment_request.payer = Pubkey::default();
        payment_request.created_at = clock.unix_timestamp;
        payment_request.bump = ctx.bumps.payment_request;

        msg!("Payment request created: {}", request_id);
        msg!("Amount: {}", amount);

        Ok(())
    }

    // --- verify and process payment
    pub fn verify_payment(
        ctx: Context<VerifyPayment>,
        request_id: String
    ) -> Result<()>{
        let payment_request = &mut ctx.accounts.payment_request;
        let config = &mut ctx.accounts.config;
        let clock = Clock::get()?;

        require!(!payment_request.is_paid, ErrorCode::AlreadyPaid);
        require!(payment_request.request_id == request_id, ErrorCode::RequestIdMismatch);
        require!(payment_request.amount >= config.min_payment_amount, ErrorCode::InsufficientPayment);

        let cpi_accounts = Transfer {
            from: ctx.accounts.payer_token_account.to_account_info(),
            to: ctx.accounts.treasury_token_account.to_account_info(),
            authority: ctx.accounts.payer.to_account_info()
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        token::transfer(cpi_ctx, payment_request.amount)?;

        payment_request.is_paid = true;
        payment_request.paid_at = clock.unix_timestamp;
        payment_request.payer = ctx.accounts.payer.key();

        msg!("Payment verified and processed");
        msg!("Request ID: {}", request_id);
        msg!("Amount: {}", payment_request.amount);

        Ok(())
    }

    // --- check if a payment is paid
    pub fn check_payment_status(
        ctx: Context<CheckPaymentStatus>,
        request_id: String
    ) -> Result<()>{
        let payment_request = &mut ctx.accounts.payment_request;

        msg!("Payment Status Check:");
        msg!("Request ID: {}", request_id);
        msg!("Is Paid: {}", payment_request.is_paid);
        msg!("Amount: {}", payment_request.amount);

        if payment_request.is_paid {
            msg!("Paid by: {}", payment_request.payer);
            msg!("paid at: {}", payment_request.paid_at);
        }

        Ok(())
    }

    // --- cancel a payment request (only by requestor, if not paid)
    pub fn cancel_payment_request(
        ctx: Context<CancelPaymentRequest>,
        request_id: String
    ) -> Result<()>{
        let payment_request = &mut ctx.accounts.payment_request;

        require!(!payment_request.is_paid, ErrorCode::AlreadyPaid);
        require!(payment_request.request_id == request_id, ErrorCode::RequestIdMismatch);
        require!(payment_request.requester == ctx.accounts.requester.key(), ErrorCode::UnauthorizedCancellation);

        msg!("Payment request cancelled: {}", payment_request.request_id);

        Ok(())
    }

    // --- close config account (for reset/redeploy scenarios)
    // This can close both valid and corrupted accounts
    pub fn close_config(
        ctx: Context<CloseConfig>
    ) -> Result<()> {
        // Transfer all lamports to authority
        let config_lamports = ctx.accounts.config.lamports();
        **ctx.accounts.authority.lamports.borrow_mut() = ctx.accounts.authority.lamports()
            .checked_add(config_lamports)
            .ok_or(anchor_lang::error::ErrorCode::ConstraintRaw)?;
        
        // Assign account to system program (this clears owner)
        ctx.accounts.config.assign(&System::id());
        
        // Resize to 0 (this closes the account)
        ctx.accounts.config.resize(0)?;
        
        msg!("Config account closed");

        Ok(())
    }

}

// ---- ACCOUNT VALIDATION ----

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = PaymentConfig::INIT_SPACE,
        seeds = [b"config2"],
        bump
    )]
    pub config: Account<'info, PaymentConfig>,

    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
#[instruction(request_id: String)]
pub struct CreatePaymentRequest<'info> {
    #[account(mut)]
    pub requester: Signer<'info>,

    #[account(
        init,
        payer = requester,
        space = PaymentRequest::LEN,
        seeds = [b"payment_request", request_id.as_bytes()],
        bump
    )]
    pub payment_request: Account<'info, PaymentRequest>,

    pub system_program: Program<'info, System>

}

#[derive(Accounts)]
#[instruction(request_id: String)]
pub struct VerifyPayment<'info> {
    #[account(
        mut,
        seeds = [b"payment_request", request_id.as_bytes()],
        bump = payment_request.bump,
    )]
    pub payment_request: Account<'info, PaymentRequest>,

    #[account(
        mut,
        seeds = [b"config2"],
        bump = config.bump,
    )]
    pub config: Account<'info, PaymentConfig>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub payer_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub treasury_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(request_id: String)]
pub struct CheckPaymentStatus<'info> {
    #[account(
        mut,
        seeds = [b"payment_request", request_id.as_bytes()],
        bump = payment_request.bump
    )]
    pub payment_request: Account<'info, PaymentRequest>,
}

#[derive(Accounts)]
#[instruction(request_id: String)]
pub struct CancelPaymentRequest<'info> {
    #[account(
        mut,
        seeds = [b"payment_request", request_id.as_bytes()],
        bump = payment_request.bump,
        close = requester
    )]
    pub payment_request: Account<'info, PaymentRequest>,

    #[account(mut)]
    pub requester: Signer<'info>
}

#[derive(Accounts)]
pub struct CloseConfig<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"config2"],
        bump
    )]
    /// CHECK: This account may be corrupted and can't be deserialized. We close it manually.
    pub config: AccountInfo<'info>,
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

impl PaymentRequest {
    pub const LEN: usize = 8usize
    .checked_add(4 + 64).unwrap()
    .checked_add(32).unwrap()
    .checked_add(8).unwrap()
    .checked_add(4 + 128).unwrap()
    .checked_add(1).unwrap()
    .checked_add(8).unwrap()
    .checked_add(32).unwrap()
    .checked_add(8).unwrap()
    .checked_add(1).unwrap();
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

    #[msg("Only the config authority can close the config account")]
    UnauthorizedClose,
}