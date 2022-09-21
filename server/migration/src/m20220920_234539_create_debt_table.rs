use sea_orm_migration::prelude::*;

use crate::m20220912_000001_create_user_table::User;

use super::m20220920_234028_create_transaction_table::Transaction;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Debt::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(Debt::TransactionId).string().not_null())
                    .col(ColumnDef::new(Debt::CreditorId).string().not_null())
                    .col(ColumnDef::new(Debt::DebtorId).string().not_null())
                    .col(ColumnDef::new(Debt::Amount).big_unsigned().not_null())
                    .primary_key(
                        Index::create()
                            .col(Debt::TransactionId)
                            .col(Debt::CreditorId)
                            .col(Debt::DebtorId),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(Debt::Table, Debt::TransactionId)
                            .to(Transaction::Table, Transaction::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(Debt::Table, Debt::CreditorId)
                            .to(User::Table, User::Id)
                            .on_delete(ForeignKeyAction::Restrict),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(Debt::Table, Debt::DebtorId)
                            .to(User::Table, User::Id)
                            .on_delete(ForeignKeyAction::Restrict),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Debt::Table).to_owned())
            .await
    }
}

/// Learn more at https://docs.rs/sea-query#iden
#[derive(Iden)]
enum Debt {
    Table,
    TransactionId,
    CreditorId,
    DebtorId,
    Amount,
}
