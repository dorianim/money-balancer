use sea_orm_migration::prelude::*;

use super::m20220912_000003_create_balance_member_table::BalanceMember;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20220912_000004_create_user_debt_table"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(UserDebt::Table)
                    .col(ColumnDef::new(UserDebt::CreditorId).string().not_null())
                    .col(ColumnDef::new(UserDebt::DebtorId).string().not_null())
                    .col(ColumnDef::new(UserDebt::Amount).float().not_null())
                    .primary_key(
                        Index::create()
                            .col(UserDebt::CreditorId)
                            .col(UserDebt::DebtorId),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(UserDebt::Table, UserDebt::CreditorId)
                            .to(BalanceMember::Table, BalanceMember::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(UserDebt::Table, UserDebt::DebtorId)
                            .to(BalanceMember::Table, BalanceMember::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(UserDebt::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
pub enum UserDebt {
    Table,
    CreditorId, // the member whoms id is alphabetically smaller, is always the creditor
    DebtorId,
    Amount,
}
