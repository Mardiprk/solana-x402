use anchor_lang::prelude::*;

declare_id!("2HkEaAhDkTbN9wpVyky8Gmh79xUxRRRiwrqkc8tTUArQ");

#[program]
pub mod solana_x402 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
